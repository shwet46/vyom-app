"""Settings & Analytics API: guardrails configuration, business profile insights, memories, and audit log."""

from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel

from vyom.clock import Clock
from vyom.core.deps import CurrentMerchant, DatabaseDep
from vyom.core.errors import NotFoundError
from vyom.models.audit import AuditLog
from vyom.models.guardrails import Guardrails, QuietHours
from vyom.models.merchant import Merchant
from vyom.models.platform import Memory
from vyom.models.transaction import BusinessProfile

router = APIRouter(prefix="/settings", tags=["Settings"])


class UpdateGuardrailsRequest(BaseModel):
    weekly_budget_paise: int
    max_discount_pct: float
    max_msgs_per_customer_week: int
    quiet_hours: QuietHours
    udhaar_autonomy: bool
    udhaar_max_reminders: int
    udhaar_min_gap_days: int
    kill_switch: bool


class UpdateSettingsRequest(BaseModel):
    name: str
    contact_phone: str
    address: str
    timings: list[str]
    todays_special: str | None = None
    voice_replies_default: bool = True

class UpdateStoreDescriptionRequest(BaseModel):
    store_description: str


@router.get("/guardrails")
async def get_guardrails(merchant: CurrentMerchant, db: DatabaseDep) -> Guardrails:
    """Retrieve merchant guardrails and limits."""
    doc = await db.guardrails.find_one({"merchant_id": merchant.id})
    if not doc:
        return Guardrails(merchant_id=merchant.id)
    return Guardrails.model_validate(doc)


@router.put("/guardrails")
async def update_guardrails(
    payload: UpdateGuardrailsRequest,
    merchant: CurrentMerchant,
    db: DatabaseDep,
) -> Guardrails:
    """Update merchant spending limits, quiet hours, and safety rules."""
    now_dt = Clock.now()
    update_data = payload.model_dump()
    update_data["updated_at"] = now_dt
    update_data["merchant_id"] = merchant.id

    await db.guardrails.update_one(
        {"merchant_id": merchant.id},
        {"$set": update_data},
        upsert=True,
    )
    doc = await db.guardrails.find_one({"merchant_id": merchant.id})
    return Guardrails.model_validate(doc)


@router.get("")
async def get_settings_endpoint(merchant: CurrentMerchant) -> Merchant:
    """Get merchant store settings."""
    return merchant


@router.put("")
async def update_settings_endpoint(
    payload: UpdateSettingsRequest,
    merchant: CurrentMerchant,
    db: DatabaseDep,
) -> Merchant:
    """Update merchant store details and timings."""
    now_dt = Clock.now()
    await db.merchants.update_one(
        {"_id": merchant.id},
        {
            "$set": {
                "name": payload.name,
                "contact_phone": payload.contact_phone,
                "address": payload.address,
                "timings": payload.timings,
                "todays_special": payload.todays_special,
                "settings.voice_replies_default": payload.voice_replies_default,
                "updated_at": now_dt,
            }
        },
    )
    doc = await db.merchants.find_one({"_id": merchant.id})
    return Merchant.model_validate(doc)

@router.put("/description")
async def update_store_description_endpoint(
    payload: UpdateStoreDescriptionRequest,
    merchant: CurrentMerchant,
    db: DatabaseDep,
) -> Merchant:
    """Save the merchant's natural-language store description."""
    await db.merchants.update_one(
        {"_id": merchant.id},
        {"$set": {"store_description": payload.store_description, "updated_at": Clock.now()}},
    )
    doc = await db.merchants.find_one({"_id": merchant.id})
    return Merchant.model_validate(doc)


@router.get("/insights/profile")
async def get_insights_profile(
    merchant: CurrentMerchant,
    db: DatabaseDep,
) -> BusinessProfile:
    """Get calculated merchant sales patterns, dead hours, and trend analysis."""
    doc = await db.business_profiles.find_one({"merchant_id": merchant.id})
    if not doc:
        return BusinessProfile(merchant_id=merchant.id)
    return BusinessProfile.model_validate(doc)


@router.get("/memory")
async def list_memories(
    merchant: CurrentMerchant,
    db: DatabaseDep,
) -> list[Memory]:
    """List long-term learned preferences and commercial campaign outcomes."""
    cursor = db.memories.find({"merchant_id": merchant.id, "forgotten": False}).sort("created_at", -1)
    return [Memory.model_validate(m) async for m in cursor]


@router.delete("/memory/{memory_id}")
async def forget_memory(
    memory_id: str,
    merchant: CurrentMerchant,
    db: DatabaseDep,
) -> dict[str, str]:
    """Forget / delete a learned memory."""
    res = await db.memories.update_one(
        {"_id": memory_id, "merchant_id": merchant.id},
        {"$set": {"forgotten": True, "updated_at": Clock.now()}},
    )
    if res.matched_count == 0:
        raise NotFoundError("Memory not found")
    return {"status": "forgotten"}


@router.get("/audit")
async def get_audit_trail(
    merchant: CurrentMerchant,
    db: DatabaseDep,
) -> list[AuditLog]:
    """Retrieve immutable audit log of critical actions."""
    cursor = db.audit_log.find({"merchant_id": merchant.id}).sort("ts", -1).limit(50)
    return [AuditLog.model_validate(a) async for a in cursor]
