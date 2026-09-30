"""Opportunities API: listing, inspection, explainability, approval transaction, and manual detection."""

from __future__ import annotations

import datetime
from typing import Any

from fastapi import APIRouter, Query
from pydantic import BaseModel

from vyom.clock import Clock
from vyom.core.deps import CurrentMerchant, DatabaseDep
from vyom.core.errors import NotFoundError
from vyom.core.sse import sse_hub
from vyom.models.campaign import Campaign, CampaignSchedule
from vyom.models.enums import CampaignStatus, OpportunityStatus
from vyom.models.opportunity import Opportunity
from vyom.services.explain import OpportunityExplainer, OpportunityExplanation

router = APIRouter(prefix="/opportunities", tags=["Opportunities"])


class ApproveRequest(BaseModel):
    variant_key: str = "primary"
    via: str = "tap"  # tap | voice


@router.get("")
async def list_opportunities(
    merchant: CurrentMerchant,
    db: DatabaseDep,
    status: str | None = Query(None),
    kind: str | None = Query(None),
) -> list[Opportunity]:
    """List growth and advisory opportunities for the current merchant."""
    query: dict[str, Any] = {"merchant_id": merchant.id}
    if status:
        query["status"] = status
    if kind:
        query["kind"] = kind

    cursor = db.opportunities.find(query).sort("score", -1)
    return [Opportunity.model_validate(o) async for o in cursor]


@router.get("/{opportunity_id}")
async def get_opportunity(
    opportunity_id: str,
    merchant: CurrentMerchant,
    db: DatabaseDep,
) -> Opportunity:
    """Retrieve a single opportunity."""
    doc = await db.opportunities.find_one({"_id": opportunity_id, "merchant_id": merchant.id})
    if not doc:
        raise NotFoundError("Opportunity not found")
    return Opportunity.model_validate(doc)


@router.get("/{opportunity_id}/explain")
async def explain_opportunity(
    opportunity_id: str,
    merchant: CurrentMerchant,
    db: DatabaseDep,
    lang: str = "hinglish",
    audio: bool = False,
) -> OpportunityExplanation:
    """Return a 2-3 line plain-language explanation of why this opportunity was detected."""
    doc = await db.opportunities.find_one({"_id": opportunity_id, "merchant_id": merchant.id})
    if not doc:
        raise NotFoundError("Opportunity not found")
    opp = Opportunity.model_validate(doc)
    return OpportunityExplainer.explain(opp)


@router.post("/{opportunity_id}/approve")
async def approve_opportunity(
    opportunity_id: str,
    payload: ApproveRequest,
    merchant: CurrentMerchant,
    db: DatabaseDep,
) -> dict[str, Any]:
    """Approve an opportunity. Promotes it to an immutable scheduled Campaign with 10% holdout."""
    doc = await db.opportunities.find_one({"_id": opportunity_id, "merchant_id": merchant.id})
    if not doc:
        raise NotFoundError("Opportunity not found")
    opp = Opportunity.model_validate(doc)

    if opp.status == OpportunityStatus.APPROVED:
        return {"status": "already_approved", "message": "Opportunity was already approved"}

    # Compute 10% holdout audience
    audience = list(opp.audience_customer_ids)
    holdout_size = max(1, len(audience) // 10) if len(audience) >= 10 else 0
    holdout = audience[:holdout_size]
    treated = audience[holdout_size:]

    now_dt = Clock.now()
    send_at = opp.recommended_send_at or (now_dt + datetime.timedelta(hours=1))

    # Create immutable Campaign record
    campaign = Campaign(
        merchant_id=merchant.id,
        opportunity_id=opp.id,
        draft_id=f"draft_{opp.id}",
        festival_key=opp.festival_key,
        approved_snapshot=opp.model_dump(),
        approved_at=now_dt,
        approved_via=payload.via,
        idempotency_key=f"camp_{opp.id}_{int(now_dt.timestamp())}",
        status=CampaignStatus.SCHEDULED,
        schedule=CampaignSchedule(send_at=send_at),
        audience_customer_ids=treated,
        holdout_customer_ids=holdout,
        starts_at=send_at,
        ends_at=send_at + datetime.timedelta(days=3),
    )
    await db.campaigns.insert_one(campaign.to_mongo())

    # Mark opportunity as approved
    await db.opportunities.update_one(
        {"_id": opp.id},
        {"$set": {"status": OpportunityStatus.APPROVED, "updated_at": now_dt}},
    )

    # Broadcast via SSE
    await sse_hub.broadcast(
        merchant.id,
        "opportunity.approved",
        {"opportunity_id": opp.id, "campaign_id": campaign.id},
    )

    return {
        "status": "approved",
        "campaign_id": campaign.id,
        "scheduled_for": send_at.isoformat(),
        "treated_count": len(treated),
        "holdout_count": len(holdout),
    }


@router.post("/{opportunity_id}/reject")
async def reject_opportunity(
    opportunity_id: str,
    merchant: CurrentMerchant,
    db: DatabaseDep,
) -> dict[str, str]:
    """Reject an opportunity."""
    res = await db.opportunities.update_one(
        {"_id": opportunity_id, "merchant_id": merchant.id},
        {"$set": {"status": OpportunityStatus.REJECTED, "updated_at": Clock.now()}},
    )
    if res.matched_count == 0:
        raise NotFoundError("Opportunity not found")
    return {"status": "rejected"}


@router.post("/{opportunity_id}/snooze")
async def snooze_opportunity(
    opportunity_id: str,
    merchant: CurrentMerchant,
    db: DatabaseDep,
    days: int = 3,
) -> dict[str, str]:
    """Snooze an opportunity for N days."""
    snooze_until = Clock.now() + datetime.timedelta(days=days)
    res = await db.opportunities.update_one(
        {"_id": opportunity_id, "merchant_id": merchant.id},
        {"$set": {"status": OpportunityStatus.SNOOZED, "snoozed_until": snooze_until, "updated_at": Clock.now()}},
    )
    if res.matched_count == 0:
        raise NotFoundError("Opportunity not found")
    return {"status": "snoozed", "until": snooze_until.isoformat()}


@router.post("/{opportunity_id}/acknowledge")
async def acknowledge_opportunity(
    opportunity_id: str,
    merchant: CurrentMerchant,
    db: DatabaseDep,
) -> dict[str, str]:
    """Acknowledge an advisory opportunity."""
    res = await db.opportunities.update_one(
        {"_id": opportunity_id, "merchant_id": merchant.id},
        {"$set": {"status": OpportunityStatus.ACKNOWLEDGED, "updated_at": Clock.now()}},
    )
    if res.matched_count == 0:
        raise NotFoundError("Opportunity not found")
    return {"status": "acknowledged"}


@router.post("/detect")
async def trigger_detection(merchant: CurrentMerchant, db: DatabaseDep) -> dict[str, Any]:
    """Manually trigger detection engines to surface new growth opportunities."""
    from vyom.models.customer import Customer
    from vyom.models.festival import FestivalCalendar, FestivalPlaybook
    from vyom.models.transaction import BusinessProfile
    from vyom.services.detection.churn import ChurnDetector
    from vyom.services.detection.dead_hours import DeadHoursDetector
    from vyom.services.detection.falling_sales import FallingSalesDetector
    from vyom.services.detection.festival_opps import FestivalOpportunityGenerator
    from vyom.services.festival.context import FestivalContextEngine

    today_date = Clock.today()

    # Load context data
    custs_cursor = db.customers.find({"merchant_id": merchant.id})
    customers = [Customer.model_validate(c) async for c in custs_cursor]

    profile_doc = await db.business_profiles.find_one({"merchant_id": merchant.id})
    profile = BusinessProfile.model_validate(profile_doc) if profile_doc else BusinessProfile(merchant_id=merchant.id)

    cals_cursor = db.festival_calendar.find({"year": today_date.year})
    cals = [FestivalCalendar.model_validate(c) async for c in cals_cursor]

    pbs_cursor = db.festival_playbooks.find({})
    pbs = {pb["key"]: FestivalPlaybook.model_validate(pb) async for pb in pbs_cursor}

    fest_ctx = FestivalContextEngine.build_context(merchant, cals, pbs, today=today_date)

    new_opps: list[Opportunity] = []

    # 1. Festival opps
    fest_opps = FestivalOpportunityGenerator.generate_festival_opportunities(merchant, fest_ctx, customers, pbs, today=today_date)
    new_opps.extend(fest_opps)

    # 2. Churn opps
    churn = ChurnDetector.detect_churn_opportunities(merchant.id, customers, today=today_date)
    if churn:
        new_opps.append(churn)

    # 3. Dead hours
    dead_hr = DeadHoursDetector.detect_dead_hour_opportunity(merchant.id, profile, customers, today=today_date)
    if dead_hr:
        new_opps.append(dead_hr)

    # 4. Falling sales
    falling = FallingSalesDetector.detect_falling_sales(merchant.id, profile, today=today_date)
    if falling:
        new_opps.append(falling)

    inserted = 0
    for o in new_opps:
        res = await db.opportunities.update_one(
            {"merchant_id": merchant.id, "dedupe_key": o.dedupe_key},
            {"$setOnInsert": o.to_mongo()},
            upsert=True,
        )
        if res.upserted_id:
            inserted += 1

    return {"detected": len(new_opps), "new_saved": inserted}
