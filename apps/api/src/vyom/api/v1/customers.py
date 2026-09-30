"""Customers API: directory, bot invite link, kit preorder management, and support thread relays."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Query
from pydantic import BaseModel

from vyom.clock import Clock
from vyom.config import get_settings
from vyom.core.deps import CurrentMerchant, DatabaseDep
from vyom.core.errors import NotFoundError
from vyom.core.sse import sse_hub
from vyom.models.bot import SupportMessage, SupportThread
from vyom.models.customer import Customer
from vyom.models.enums import KitRequestStatus
from vyom.models.festival import FestivalKitRequest

router = APIRouter(prefix="/customers", tags=["Customers"])


class UpdateKitStatusRequest(BaseModel):
    status: KitRequestStatus


class SupportReplyRequest(BaseModel):
    text: str


@router.get("")
async def list_customers(
    merchant: CurrentMerchant,
    db: DatabaseDep,
    q: str | None = Query(None),
) -> list[Customer]:
    """List customer records with search by name or phone."""
    query: dict[str, Any] = {"merchant_id": merchant.id}
    if q:
        query["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"phone_e164": {"$regex": q, "$options": "i"}},
        ]
    cursor = db.customers.find(query).sort("rfm.monetary_paise", -1)
    return [Customer.model_validate(c) async for c in cursor]


@router.get("/invite")
async def get_bot_invite(merchant: CurrentMerchant) -> dict[str, str]:
    """Return the customer Telegram bot deep-link and QR URL for shop onboarding."""
    settings = get_settings()
    bot_name = merchant.bot_username or settings.bot_username or "VyomDemoShopBot"
    invite_url = f"https://t.me/{bot_name}?start=join_{merchant.shop_code}"
    return {
        "bot_username": bot_name,
        "shop_code": merchant.shop_code,
        "invite_url": invite_url,
    }


@router.get("/kit-requests")
async def list_kit_requests(
    merchant: CurrentMerchant,
    db: DatabaseDep,
    status: str | None = Query(None),
) -> list[FestivalKitRequest]:
    """List festival kit pre-orders submitted by customers."""
    query: dict[str, Any] = {"merchant_id": merchant.id}
    if status:
        query["status"] = status
    cursor = db.festival_kit_requests.find(query).sort("created_at", -1)
    return [FestivalKitRequest.model_validate(k) async for k in cursor]


@router.post("/kit-requests/{request_id}/status")
async def update_kit_status(
    request_id: str,
    payload: UpdateKitStatusRequest,
    merchant: CurrentMerchant,
    db: DatabaseDep,
) -> dict[str, str]:
    """Merchant updates kit order status (acknowledged, ready, picked_up)."""
    now_dt = Clock.now()
    res = await db.festival_kit_requests.update_one(
        {"_id": request_id, "merchant_id": merchant.id},
        {
            "$set": {
                "status": payload.status,
                "ready_at": now_dt if payload.status == KitRequestStatus.READY else None,
                "updated_at": now_dt,
            }
        },
    )
    if res.matched_count == 0:
        raise NotFoundError("Kit request not found")

    await sse_hub.broadcast(
        merchant.id,
        "kit_request.updated",
        {"request_id": request_id, "status": payload.status.value},
    )
    return {"status": "updated", "kit_status": payload.status.value}


@router.get("/support/threads")
async def list_support_threads(
    merchant: CurrentMerchant,
    db: DatabaseDep,
) -> list[SupportThread]:
    """List open customer support conversations."""
    cursor = db.support_threads.find({"merchant_id": merchant.id}).sort("last_activity_at", -1)
    return [SupportThread.model_validate(t) async for t in cursor]


@router.post("/support/threads/{thread_id}/reply")
async def reply_support_thread(
    thread_id: str,
    payload: SupportReplyRequest,
    merchant: CurrentMerchant,
    db: DatabaseDep,
) -> dict[str, str]:
    """Merchant sends reply to customer support thread."""
    doc = await db.support_threads.find_one({"_id": thread_id, "merchant_id": merchant.id})
    if not doc:
        raise NotFoundError("Support thread not found")

    now_dt = Clock.now()
    msg = SupportMessage(
        thread_id=thread_id,
        sender_type="merchant",
        text=payload.text,
        ts=now_dt,
    )
    await db.support_messages.insert_one(msg.to_mongo())
    await db.support_threads.update_one(
        {"_id": thread_id},
        {"$set": {"last_activity_at": now_dt, "updated_at": now_dt}},
    )

    return {"status": "sent"}
