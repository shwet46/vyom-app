"""Campaigns API: monitoring running and scheduled campaigns, holdout performance, and execution controls."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Query

from vyom.clock import Clock
from vyom.core.deps import CurrentMerchant, DatabaseDep
from vyom.core.errors import NotFoundError
from vyom.models.campaign import Campaign
from vyom.models.enums import CampaignStatus

router = APIRouter(prefix="/campaigns", tags=["Campaigns"])


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

