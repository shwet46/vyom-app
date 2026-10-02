import datetime
from typing import Any

from fastapi import APIRouter, Query
from pydantic import BaseModel

from vyom.clock import Clock
from vyom.core.deps import CurrentMerchant, DatabaseDep
from vyom.core.errors import NotFoundError
from vyom.models.campaign import Campaign, CampaignSchedule
from vyom.models.enums import CampaignStatus
from vyom.services.campaign_dispatch import dispatch_campaign_to_telegram

router = APIRouter(prefix="/campaigns", tags=["Campaigns"])


class BroadcastOfferPayload(BaseModel):
    title: str = "Kirana Special Offer"
    message: str
    discount_percent: float = 10.0
    campaign_type: str = "winback"


class CampaignBroadcastPayload(BaseModel):
    title: str | None = None
    offer: str | None = None
    custom_message: str | None = None
    campaign_type: str | None = None
    discount_percent: float | None = None


@router.post("/broadcast-offer")
async def broadcast_new_offer(
    payload: BroadcastOfferPayload,
    merchant: CurrentMerchant,
    db: DatabaseDep,
) -> dict[str, Any]:
    """Broadcast an immediate offer to customers via Telegram bot."""
    now_dt = Clock.now()
    camp_id = f"camp_blast_{int(now_dt.timestamp())}"

    all_custs = [c.get("_id") async for c in db.customers.find({"merchant_id": merchant.id}).limit(100)]
    if not all_custs:
        all_custs = [c.get("_id") async for c in db.customers.find({}).limit(100)]

    campaign = Campaign(
        id=camp_id,
        merchant_id=merchant.id,
        opportunity_id=f"opp_{camp_id}",
        draft_id=f"draft_{camp_id}",
        approved_snapshot={"title": payload.title, "message": payload.message, "discount": payload.discount_percent},
        approved_at=now_dt,
        approved_via="dashboard_broadcast",
        idempotency_key=f"idemp_{camp_id}",
        status=CampaignStatus.RUNNING,
        schedule=CampaignSchedule(send_at=now_dt),
        audience_customer_ids=[str(cid) for cid in all_custs],
        holdout_customer_ids=[],
        starts_at=now_dt,
        ends_at=now_dt + datetime.timedelta(days=3),
    )
    await db.campaigns.insert_one(campaign.to_mongo())

    dispatch_res = await dispatch_campaign_to_telegram(
        db=db,
        merchant_id=merchant.id,
        campaign_id=camp_id,
        custom_message=payload.message,
        discount_percent=payload.discount_percent,
        title=payload.title,
        opportunity_type=payload.campaign_type,
        offer_details=f"{payload.discount_percent:.0f}% off",
    )

    return {
        "status": "broadcast_sent",
        "campaign_id": camp_id,
        "title": payload.title,
        "telegram_sent_count": dispatch_res.get("sent_count", 0),
        "recipients": dispatch_res.get("recipients", []),
    }


@router.post("/{campaign_id}/broadcast")
async def broadcast_campaign(
    campaign_id: str,
    merchant: CurrentMerchant,
    db: DatabaseDep,
    payload: CampaignBroadcastPayload | None = None,
) -> dict[str, Any]:
    """Re-broadcast or immediately dispatch an existing campaign to Telegram customers."""
    doc = await db.campaigns.find_one({"_id": campaign_id, "merchant_id": merchant.id})
    title = None
    custom_msg = None
    offer_details = None
    discount = 10.0
    opp_type = "campaign"

    if doc:
        snap = doc.get("approved_snapshot", {})
        title = snap.get("title", {}).get("hinglish") if isinstance(snap.get("title"), dict) else snap.get("title")
        custom_msg = snap.get("custom_message") or snap.get("message")
        offer_details = snap.get("offer") or snap.get("offer_details")
        discount = snap.get("discount_percent") or snap.get("discount") or 10.0
        opp_type = snap.get("campaign_type") or snap.get("type", "campaign")

    # If payload provided, override or populate specific values
    if payload:
        if payload.title:
            title = payload.title
        if payload.custom_message:
            custom_msg = payload.custom_message
        if payload.offer:
            offer_details = payload.offer
        if payload.discount_percent is not None:
            discount = payload.discount_percent
        if payload.campaign_type:
            opp_type = payload.campaign_type

    if not title:
        title = "Kirana Store Offer"

    dispatch_res = await dispatch_campaign_to_telegram(
        db=db,
        merchant_id=merchant.id,
        campaign_id=campaign_id,
        custom_message=custom_msg,
        discount_percent=discount,
        title=title,
        opportunity_type=opp_type,
        offer_details=offer_details,
    )

    return {
        "status": "broadcast_sent",
        "campaign_id": campaign_id,
        "title": title,
        "telegram_sent_count": dispatch_res.get("sent_count", 0),
        "recipients": dispatch_res.get("recipients", []),
    }


@router.get("")
async def list_campaigns(
    merchant: CurrentMerchant,
    db: DatabaseDep,
    status: str | None = Query(None),
) -> list[Campaign]:
    """List approved campaigns and performance metrics for the current merchant."""
    query: dict[str, Any] = {"merchant_id": merchant.id}

    if status:
        query["status"] = status
    cursor = db.campaigns.find(query).sort("created_at", -1)
    return [Campaign.model_validate(c) async for c in cursor]


@router.get("/{campaign_id}")
async def get_campaign(
    campaign_id: str,
    merchant: CurrentMerchant,
    db: DatabaseDep,
) -> Campaign:
    """Retrieve a single campaign with real-time delivery and attribution metrics."""
    doc = await db.campaigns.find_one({"_id": campaign_id, "merchant_id": merchant.id})
    if not doc:
        raise NotFoundError("Campaign not found")
    return Campaign.model_validate(doc)


@router.post("/{campaign_id}/pause")
async def pause_campaign(
    campaign_id: str,
    merchant: CurrentMerchant,
    db: DatabaseDep,
) -> dict[str, str]:
    """Pause an active or scheduled campaign."""
    res = await db.campaigns.update_one(
        {"_id": campaign_id, "merchant_id": merchant.id},
        {"$set": {"status": CampaignStatus.PAUSED, "updated_at": Clock.now()}},
    )
    if res.matched_count == 0:
        raise NotFoundError("Campaign not found")
    return {"status": "paused"}


@router.post("/{campaign_id}/resume")
async def resume_campaign(
    campaign_id: str,
    merchant: CurrentMerchant,
    db: DatabaseDep,
) -> dict[str, str]:
    """Resume a paused campaign."""
    res = await db.campaigns.update_one(
        {"_id": campaign_id, "merchant_id": merchant.id},
        {"$set": {"status": CampaignStatus.RUNNING, "updated_at": Clock.now()}},
    )
    if res.matched_count == 0:
        raise NotFoundError("Campaign not found")
    return {"status": "resumed"}


@router.post("/pause-all")
async def pause_all_campaigns(
    merchant: CurrentMerchant,
    db: DatabaseDep,
) -> dict[str, Any]:
    """Emergency halt: pause all running and scheduled campaigns for the merchant."""
    res = await db.campaigns.update_many(
        {"merchant_id": merchant.id, "status": {"$in": [CampaignStatus.RUNNING, CampaignStatus.SCHEDULED]}},
        {"$set": {"status": CampaignStatus.PAUSED, "updated_at": Clock.now()}},
    )
    return {"status": "paused_all", "count": res.modified_count}


@router.get("/{campaign_id}/metrics")
async def get_campaign_metrics(
    campaign_id: str,
    merchant: CurrentMerchant,
    db: DatabaseDep,
) -> dict[str, Any]:
    """Compares Sales from the holdout group vs. Sales from the treated group over a 3-day window."""
    import datetime
    
    doc = await db.campaigns.find_one({"_id": campaign_id, "merchant_id": merchant.id})
    if not doc:
        raise NotFoundError("Campaign not found")
    
    campaign = Campaign.model_validate(doc)
    
    start_time = campaign.starts_at
    if not start_time:
        start_time = campaign.approved_at or Clock.now()
    end_time = start_time + datetime.timedelta(days=3)
    
    treated_ids = set(campaign.audience_customer_ids)
    holdout_ids = set(campaign.holdout_customer_ids)
    
    txn_cursor = db.transactions.find({
        "merchant_id": merchant.id,
        "paid_at": {"$gte": start_time, "$lt": end_time}
    })
    
    from vyom.models.transaction import Transaction
    txns = [Transaction.model_validate(t) async for t in txn_cursor]
    
    treated_sales = 0.0
    holdout_sales = 0.0
    
    for t in txns:
        if t.customer_id in treated_ids:
            treated_sales += t.amount_paise / 100.0
        elif t.customer_id in holdout_ids:
            holdout_sales += t.amount_paise / 100.0
            
    treated_per_capita = treated_sales / len(treated_ids) if treated_ids else 0
    holdout_per_capita = holdout_sales / len(holdout_ids) if holdout_ids else 0
    
    return {
        "campaign_id": campaign.id,
        "window": {
            "start": start_time.isoformat(),
            "end": end_time.isoformat()
        },
        "treated": {
            "audience_size": len(treated_ids),
            "total_sales": treated_sales,
            "per_capita_sales": treated_per_capita
        },
        "holdout": {
            "audience_size": len(holdout_ids),
            "total_sales": holdout_sales,
            "per_capita_sales": holdout_per_capita
        },
        "uplift_per_capita": treated_per_capita - holdout_per_capita,
        "estimated_total_uplift": (treated_per_capita - holdout_per_capita) * len(treated_ids)
    }

