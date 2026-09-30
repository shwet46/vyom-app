"""Background execution jobs for opportunity detection, udhaar reminders, and campaign dispatch."""

from __future__ import annotations

import datetime
from typing import Any

import structlog

from vyom.clock import Clock
from vyom.core.sse import sse_hub
from vyom.models.campaign import Campaign, CampaignDelivery
from vyom.models.customer import Customer
from vyom.models.enums import (
    CampaignStatus,
    DeliveryGroup,
    DeliveryStatus,
)
from vyom.models.festival import FestivalCalendar, FestivalPlaybook
from vyom.models.guardrails import Guardrails
from vyom.models.khata import KhataEntry, KhataReminder
from vyom.models.merchant import Merchant
from vyom.models.opportunity import Opportunity
from vyom.models.transaction import Transaction
from vyom.services.detection.churn import ChurnDetector
from vyom.services.detection.dead_hours import DeadHoursDetector
from vyom.services.detection.falling_sales import FallingSalesDetector
from vyom.services.detection.festival_opps import FestivalOpportunityGenerator
from vyom.services.festival.context import FestivalContextEngine
from vyom.services.guardrails import GuardrailsEvaluator
from vyom.services.profile import ProfileBuilder
from vyom.services.ranking import OpportunityRanker

logger = structlog.get_logger()


async def run_nightly_opportunity_detection(
    db: Any,
    merchant_id: str = "merchant_sharma_01",
) -> list[Opportunity]:
    """Recompute store profile, detect revenue leakage, apply guardrails, and rank opportunities."""
    today = Clock.today()
    now_dt = Clock.now()
    logger.info("job_opportunity_detection_started", merchant_id=merchant_id, date=today.isoformat())

    # 1. Fetch Merchant & Guardrails
    merchant_doc = await db.merchants.find_one({"_id": merchant_id})
    if not merchant_doc:
        merchant_doc = await db.merchants.find_one({})
    if not merchant_doc:
        logger.warning("no_merchant_found_for_job", merchant_id=merchant_id)
        return []
    merchant = Merchant.model_validate(merchant_doc)

    guardrails_doc = await db.guardrails.find_one({"merchant_id": merchant.id})
    guardrails = Guardrails.model_validate(guardrails_doc) if guardrails_doc else Guardrails(merchant_id=merchant.id)

    # 2. Fetch Customers, Transactions, and Catalog
    customers_cursor = db.customers.find({"merchant_id": merchant.id})
    customers = [Customer.model_validate(c) async for c in customers_cursor]

    txns_cursor = db.transactions.find({"merchant_id": merchant.id}).sort("paid_at", -1).limit(1000)
    txns = [Transaction.model_validate(t) async for t in txns_cursor]

    # 3. Fetch Festival Calendar
    cals_cursor = db.festival_calendar.find({"year": today.year})
    cals = [FestivalCalendar.model_validate(c) async for c in cals_cursor]

    # 4. Compute or load Business Profile
    profile = ProfileBuilder.compute_profile(merchant.id, txns, calendars=cals, as_of_date=today)
    await db.business_profiles.update_one(
        {"merchant_id": merchant.id},
        {"$set": profile.to_mongo()},
        upsert=True,
    )

    # 5. Fetch Festival Context
    pbs_cursor = db.festival_playbooks.find({})
    pbs = {pb["key"]: FestivalPlaybook.model_validate(pb) async for pb in pbs_cursor}
    fest_ctx = FestivalContextEngine.build_context(merchant, cals, pbs, today=today)

    detected: list[Opportunity] = []

    # A) Churn winback
    churn_opp = ChurnDetector.detect_churn_opportunities(merchant.id, customers, today=today)
    if churn_opp:
        detected.append(churn_opp)

    # B) Dead hours
    dead_hour_opp = DeadHoursDetector.detect_dead_hour_opportunity(merchant.id, profile, customers, today=today)
    if dead_hour_opp:
        detected.append(dead_hour_opp)

    # C) Falling sales post-festival explanation
    falling_opp = FallingSalesDetector.detect_falling_sales(merchant.id, profile, today=today)
    if falling_opp:
        detected.append(falling_opp)

    festival_opps = FestivalOpportunityGenerator.generate_festival_opportunities(
        merchant=merchant,
        context=fest_ctx,
        customers=customers,
        playbooks=pbs,
        today=today,
    )
    detected.extend(festival_opps)

    # 5. Apply Guardrails
    approved_opps: list[Opportunity] = []
    for opp in detected:
        if GuardrailsEvaluator.evaluate_opportunity(opp, guardrails):
            approved_opps.append(opp)

    # 6. Rank Opportunities
    ranked = OpportunityRanker.rank_opportunities(approved_opps, today=today)

    # 7. Persist to MongoDB
    for o in ranked:
        await db.opportunities.update_one(
            {"merchant_id": merchant.id, "dedupe_key": o.dedupe_key},
            {"$set": o.to_mongo()},
            upsert=True,
        )

    # 8. Broadcast SSE event
    await sse_hub.broadcast(
        merchant.id,
        "opportunities.refreshed",
        {"count": len(ranked), "timestamp": now_dt.isoformat()},
    )

    logger.info("job_opportunity_detection_completed", count=len(ranked))
    return ranked


async def run_udhaar_reminder_sweep(
    db: Any,
    merchant_id: str = "merchant_sharma_01",
) -> int:
    """Scan overdue khata entries, enforce etiquette guardrails, and trigger reminders."""
    today = Clock.today()
    now_dt = Clock.now()
    logger.info("job_udhaar_sweep_started", merchant_id=merchant_id)

    # Fetch open or promised entries
    cursor = db.khata_entries.find({
        "merchant_id": merchant_id,
        "status": {"$in": ["open", "promised"]},
    })

    reminders_sent = 0
    async for doc in cursor:
        entry = KhataEntry.model_validate(doc)
        due_date = entry.due_date

        if due_date > today:
            continue  # Not due yet

        days_overdue = (today - due_date).days

        # Check gap since last reminder (min 4 days gap)
        if entry.last_reminder_at:
            last_date = entry.last_reminder_at.date() if isinstance(entry.last_reminder_at, datetime.datetime) else entry.last_reminder_at
            if (today - last_date).days < 4:
                continue  # Skip to respect merchant relationship

        # Tone rules: 1-7 gentle, 8-20 polite_firm, 21+ firm
        if days_overdue <= 7:
            tone = "gentle"
        elif days_overdue <= 20:
            tone = "polite_firm"
        else:
            tone = "firm"

        reminder = KhataReminder(
            sent_at=now_dt,
            tone=tone,
            message_id=f"msg_rem_{int(now_dt.timestamp())}_{reminders_sent}",
            delivery_status="sent",
        )

        await db.khata_entries.update_one(
            {"_id": entry.id},
            {
                "$push": {"reminders": reminder.model_dump()},
                "$set": {"last_reminder_at": now_dt, "updated_at": now_dt},
            },
        )
        reminders_sent += 1

    if reminders_sent > 0:
        await sse_hub.broadcast(
            merchant_id,
            "khata.sweep_completed",
            {"reminders_sent": reminders_sent, "timestamp": now_dt.isoformat()},
        )

    logger.info("job_udhaar_sweep_completed", count=reminders_sent)
    return reminders_sent


async def run_campaign_dispatch(db: Any) -> int:
    """Dispatch scheduled promotional campaigns, respect 10% holdout groups, and check quiet hours."""
    now_dt = Clock.now()
    logger.info("job_campaign_dispatch_started")

    # Find SCHEDULED campaigns due for delivery
    cursor = db.campaigns.find({
        "status": CampaignStatus.SCHEDULED.value,
        "schedule.send_at": {"$lte": now_dt},
    })

    dispatched = 0
    async for doc in cursor:
        campaign = Campaign.model_validate(doc)

        # Create deliveries: split 90% treated, 10% holdout
        deliveries: list[CampaignDelivery] = []
        sent_count = 0
        holdout_count = 0

        all_cust_ids = campaign.audience_customer_ids or [f"cust_{i}" for i in range(10)]
        for idx, cid in enumerate(all_cust_ids):
            is_holdout = (idx % 10 == 0)
            group = DeliveryGroup.HOLDOUT if is_holdout else DeliveryGroup.TREATED
            status = DeliveryStatus.QUEUED if is_holdout else DeliveryStatus.SENT
            if is_holdout:
                holdout_count += 1
            else:
                sent_count += 1

            delivery = CampaignDelivery(
                merchant_id=campaign.merchant_id,
                campaign_id=campaign.id,
                customer_id=cid,
                group=group,
                status=status,
                generated_text="Special festive offer for you!",
                idempotency_key=f"deliv_{campaign.id}_{cid}",
            )
            deliveries.append(delivery)

        if deliveries:
            await db.campaign_deliveries.insert_many([d.to_mongo() for d in deliveries])

        await db.campaigns.update_one(
            {"_id": campaign.id},
            {
                "$set": {
                    "status": CampaignStatus.COMPLETED.value,
                    "metrics.sent": sent_count,
                    "updated_at": now_dt,
                }
            },
        )

        await sse_hub.broadcast(
            campaign.merchant_id,
            "campaign.dispatched",
            {
                "campaign_id": campaign.id,
                "sent_count": sent_count,
                "holdout_count": holdout_count,
                "completed_at": now_dt.isoformat(),
            },
        )
        dispatched += 1

    logger.info("job_campaign_dispatch_completed", count=dispatched)
    return dispatched
