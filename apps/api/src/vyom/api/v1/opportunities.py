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
from vyom.models.enums import CampaignStatus, OpportunityKind, OpportunityStatus, OpportunityType
from vyom.models.opportunity import Opportunity, OpportunityEvidence
from vyom.services.campaign_dispatch import dispatch_campaign_to_telegram
from vyom.services.explain import OpportunityExplainer, OpportunityExplanation

router = APIRouter(prefix="/opportunities", tags=["Opportunities"])


class ApproveRequest(BaseModel):
    variant_key: str = "primary"
    via: str = "tap"  # tap | voice
    custom_message: str | None = None
    discount_percent: float | None = None
    title: str | None = None
    send_immediately: bool = True


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
    """Approve an opportunity. Promotes it to an immutable scheduled Campaign and dispatches Telegram offer."""
    doc = await db.opportunities.find_one({"_id": opportunity_id, "merchant_id": merchant.id})
    now_dt = Clock.now()

    if not doc:
        # Template or frontend opportunity ID (e.g. opp-1, opp-2, opp-3)
        mock_templates: dict[str, tuple[OpportunityType, str, int, float]] = {
            "opp-1": (
                OpportunityType.WINBACK,
                "23 purane regular customers 30 din se nahi aaye",
                690000,
                10.0,
            ),
            "opp-2": (
                OpportunityType.DEAD_HOUR,
                "Dopahar 2–4 baje dukaan shaant rehti hai (Dead hours)",
                240000,
                8.0,
            ),
            "opp-3": (
                OpportunityType.FESTIVAL_KIT,
                "Ganesh Chaturthi aa rahi hai – Modak/Pooja Combo Pack",
                850000,
                12.0,
            ),
        }
        opp_type, default_title, est_ret, default_disc = mock_templates.get(
            opportunity_id,
            (OpportunityType.WINBACK, payload.title or "Sharma Kirana Store Special Offer", 500000, payload.discount_percent or 10.0),
        )

        all_custs = [c.get("_id") async for c in db.customers.find({"merchant_id": merchant.id}).limit(100)]
        if not all_custs:
            all_custs = [c.get("_id") async for c in db.customers.find({}).limit(100)]

        new_opp = Opportunity(
            id=opportunity_id,
            merchant_id=merchant.id,
            kind=OpportunityKind.CAMPAIGN,
            type=opp_type,
            title_key="opp_title",
            dedupe_key=f"dedupe_{opportunity_id}",
            evidence=OpportunityEvidence(reason=payload.title or default_title),
            est_return_paise=est_ret,
            est_cost_paise=35000,
            recommended_send_at=now_dt,
            audience_customer_ids=[str(cid) for cid in all_custs],
            status=OpportunityStatus.DETECTED,
            created_at=now_dt,
            updated_at=now_dt,
        )
        await db.opportunities.insert_one(new_opp.to_mongo())
        opp = new_opp
    else:
        opp = Opportunity.model_validate(doc)

    if opp.status == OpportunityStatus.APPROVED:
        # Check if already has a campaign
        existing_camp = await db.campaigns.find_one({"opportunity_id": opp.id})
        if existing_camp:
            camp_id = existing_camp.get("_id")
            if payload.send_immediately:
                dispatch_res = await dispatch_campaign_to_telegram(
                    db=db,
                    merchant_id=merchant.id,
                    campaign_id=camp_id,
                    custom_message=payload.custom_message,
                    discount_percent=payload.discount_percent,
                    title=payload.title or (opp.evidence.reason if opp.evidence and opp.evidence.reason else "Special Offer"),
                    opportunity_type=opp.type.value if hasattr(opp, "type") and opp.type else "campaign",
                )
                return {
                    "status": "already_approved_dispatched",
                    "campaign_id": camp_id,
                    "telegram_sent_count": dispatch_res.get("sent_count", 0),
                    "recipients": dispatch_res.get("recipients", []),
                    "message": "Campaign offer delivered to customers via Telegram Bot",
                }
            return {"status": "already_approved", "message": "Opportunity was already approved", "campaign_id": camp_id}

    # Compute 10% holdout audience
    audience = list(opp.audience_customer_ids)
    holdout_size = max(1, len(audience) // 10) if len(audience) >= 10 else 0
    holdout = audience[:holdout_size]
    treated = audience[holdout_size:]

    send_at = opp.recommended_send_at or (now_dt + datetime.timedelta(hours=1))
    campaign_status = CampaignStatus.RUNNING if payload.send_immediately else CampaignStatus.SCHEDULED

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
        status=campaign_status,
        schedule=CampaignSchedule(send_at=send_at),
        audience_customer_ids=treated,
        holdout_customer_ids=holdout,
        starts_at=now_dt,
        ends_at=now_dt + datetime.timedelta(days=3),
    )
    await db.campaigns.insert_one(campaign.to_mongo())

    # Mark opportunity as approved
    await db.opportunities.update_one(
        {"_id": opp.id},
        {"$set": {"status": OpportunityStatus.APPROVED, "updated_at": now_dt}},
    )

    # Immediately dispatch offer to Telegram-connected customers
    dispatch_res: dict[str, Any] = {"sent_count": 0, "recipients": []}
    if payload.send_immediately:
        dispatch_res = await dispatch_campaign_to_telegram(
            db=db,
            merchant_id=merchant.id,
            campaign_id=campaign.id,
            custom_message=payload.custom_message,
            discount_percent=payload.discount_percent,
            title=payload.title or (opp.evidence.reason if opp.evidence and opp.evidence.reason else "Kirana Special Offer"),
            opportunity_type=opp.type.value if hasattr(opp, "type") and opp.type else "campaign",
        )

    # Broadcast via SSE
    await sse_hub.broadcast(
        merchant.id,
        "opportunity.approved",
        {
            "opportunity_id": opp.id,
            "campaign_id": campaign.id,
            "telegram_sent": dispatch_res.get("sent_count", 0),
        },
    )

    return {
        "status": "approved",
        "campaign_id": campaign.id,
        "scheduled_for": send_at.isoformat(),
        "treated_count": len(treated),
        "holdout_count": len(holdout),
        "telegram_sent_count": dispatch_res.get("sent_count", 0),
        "recipients": dispatch_res.get("recipients", []),
        "dispatched": payload.send_immediately,
    }



@router.post("/{opportunity_id}/reject")
@router.post("/{opportunity_id}/dismiss")
async def reject_opportunity(
    opportunity_id: str,
    merchant: CurrentMerchant,
    db: DatabaseDep,
) -> dict[str, str]:
    """Reject or dismiss an opportunity."""
    res = await db.opportunities.update_one(
        {"_id": opportunity_id, "merchant_id": merchant.id},
        {"$set": {"status": OpportunityStatus.REJECTED, "updated_at": Clock.now()}},
    )
    if res.matched_count == 0:
        raise NotFoundError("Opportunity not found")
    return {"status": "rejected"}


@router.get("/{opportunity_id}/explain")
async def explain_opportunity(
    opportunity_id: str,
    merchant: CurrentMerchant,
    db: DatabaseDep,
    lang: str = "hinglish",
) -> dict[str, Any]:
    """Provide AI explanation and soundbite script for an opportunity."""
    doc = await db.opportunities.find_one({"_id": opportunity_id, "merchant_id": merchant.id})
    if not doc:
        raise NotFoundError("Opportunity not found")
    opp = Opportunity.model_validate(doc)

    return_rs = round(opp.est_return_paise / 100)
    cost_rs = round(opp.est_cost_paise / 100)
    cust_count = len(opp.audience_customer_ids) or opp.evidence.churned_customers_count or 14

    script_map = {
        "hinglish": f"Vyom AI ne transaction analysis se dekha ki {cust_count} regular customers dukaan par nahi aa rahe. Agar offer bhejein toh ₹{return_rs:,} tak ka revenue wapas aa sakta hai.",
        "hi": f"व्योम ने देखा कि {cust_count} नियमित ग्राहक दुकान पर नहीं आए। विशेष छूट से ₹{return_rs:,} तक की बिक्री वापस मिल सकती है।",
        "mr": f"व्योमने पाहिले की {cust_count} नियमित ग्राहक आले नाहीत. सवलत दिल्यास ₹{return_rs:,} पर्यंत विक्री होऊ शकते.",
        "en": f"Vyom detected {cust_count} lapsed customers. Sending an offer can recover up to ₹{return_rs:,}.",
    }

    return {
        "opportunity_id": opp.id,
        "language": lang,
        "explanation": opp.evidence.reason or script_map.get(lang, script_map["hinglish"]),
        "audio_script": script_map.get(lang, script_map["hinglish"]),
        "potential_revenue": return_rs,
        "cost": cost_rs,
        "customer_count": cust_count,
    }


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
    from vyom.models.transaction import BusinessProfile, Transaction
    from vyom.services.detection.festival_opps import FestivalOpportunityGenerator
    from vyom.services.festival.context import FestivalContextEngine
    from vyom.services.proactive_detection import ProactiveOpportunityEngine

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

    # 2. Proactive opps (replaces old churn, dead hours, falling sales)
    txn_cursor = db.transactions.find({"merchant_id": merchant.id})
    txns = [Transaction.model_validate(t) async for t in txn_cursor]
    
    raw_txns = []
    for t in txns:
        raw_txns.append({
            "transaction_id": t.id,
            "customer_id": t.customer_id,
            "amount": t.amount_paise / 100.0,
            "timestamp": t.paid_at,
            "status": "TXN_SUCCESS",
            "payment_method": t.payment_mode
        })
        
    proactive_opps = await ProactiveOpportunityEngine.detect_opportunities(raw_txns, merchant, today=datetime.datetime.combine(today_date, datetime.time.min))
    new_opps.extend(proactive_opps)

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
