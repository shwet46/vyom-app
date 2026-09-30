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
