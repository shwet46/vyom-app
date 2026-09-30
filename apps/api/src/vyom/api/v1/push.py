"""Web Push API: subscription registration and VAPID public key endpoint."""

from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel

from vyom.config import get_settings
from vyom.core.deps import CurrentMerchant, DatabaseDep
from vyom.models.platform import PushSubscription, PushSubscriptionKeys

router = APIRouter(prefix="/push", tags=["Push"])


class SubscribePushRequest(BaseModel):
    endpoint: str
    keys: PushSubscriptionKeys


@router.get("/vapid-public-key")
async def get_vapid_public_key() -> dict[str, str]:
    """Return the server's VAPID public key for browser PushManager subscription."""
    settings = get_settings()
    return {"vapid_public_key": settings.vapid_public_key or "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgHKWzkjMzGw1WDnB2KPVC4L0e-c8S_5vA0n5qJ3I="}


@router.post("/subscribe")
async def subscribe_push(
    payload: SubscribePushRequest,
    merchant: CurrentMerchant,
    db: DatabaseDep,
) -> dict[str, str]:
    """Register browser push notification subscription."""
    sub = PushSubscription(
        merchant_id=merchant.id,
        endpoint=payload.endpoint,
        keys=payload.keys,
    )
    await db.push_subscriptions.update_one(
        {"merchant_id": merchant.id, "endpoint": payload.endpoint},
        {"$set": sub.to_mongo()},
        upsert=True,
    )
    return {"status": "subscribed"}


@router.delete("/subscribe")
async def unsubscribe_push(
    endpoint: str,
    merchant: CurrentMerchant,
    db: DatabaseDep,
) -> dict[str, str]:
    """Remove browser push notification subscription."""
    await db.push_subscriptions.delete_one({"merchant_id": merchant.id, "endpoint": endpoint})
    return {"status": "unsubscribed"}
