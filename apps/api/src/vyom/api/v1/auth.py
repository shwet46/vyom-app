"""Authentication API: phone OTP login, token verification, and session state."""

from __future__ import annotations

import datetime
from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel, Field

from vyom.config import get_settings
from vyom.core.deps import CurrentMerchant, DatabaseDep
from vyom.core.errors import UnauthorizedError
from vyom.core.security import create_access_token, hash_otp
from vyom.models.merchant import Merchant, OTPSession

router = APIRouter(prefix="/auth", tags=["Auth"])


class OTPRequest(BaseModel):
    phone_e164: str = Field(..., examples=["+919876543210"])


class OTPVerifyRequest(BaseModel):
    phone_e164: str = Field(..., examples=["+919876543210"])
    code: str = Field(..., examples=["123456"])


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    merchant: Merchant


@router.post("/otp/request")
async def request_otp(payload: OTPRequest, db: DatabaseDep) -> dict[str, Any]:
    """Request a login OTP. In demo mode, 123456 is always accepted."""
    settings = get_settings()
    code = "123456" if settings.demo_mode else "654321"

    code_hash = hash_otp(payload.phone_e164, code)
    expires_at = datetime.datetime.now(datetime.UTC) + datetime.timedelta(minutes=10)

    session = OTPSession(
        phone_e164=payload.phone_e164,
        code_hash=code_hash,
        expires_at=expires_at,
    )
    await db.otp_sessions.update_one(
        {"phone_e164": payload.phone_e164},
        {"$set": session.to_mongo()},
        upsert=True,
    )

    return {
        "status": "sent",
        "message": "OTP sent successfully. Use 123456 in demo mode.",
        "demo_hint": "123456" if settings.demo_mode else None,
    }


@router.post("/otp/verify")
async def verify_otp(payload: OTPVerifyRequest, db: DatabaseDep) -> AuthResponse:
    """Verify phone OTP and issue a signed JWT access token."""
    settings = get_settings()

    # In demo mode, '123456' is universal
    is_valid = False
    if settings.demo_mode and payload.code == "123456":
        is_valid = True
    else:
        expected_hash = hash_otp(payload.phone_e164, payload.code)
        session = await db.otp_sessions.find_one({"phone_e164": payload.phone_e164})
        if session and session.get("code_hash") == expected_hash:
            is_valid = True

    if not is_valid:
        raise UnauthorizedError("Invalid or expired OTP. Use 123456 in demo mode.")

    # Find or initialize merchant
    doc = await db.merchants.find_one({"phone_e164": payload.phone_e164})
    if not doc:
        # Also match default demo merchant
        doc = await db.merchants.find_one({"_id": "merchant_sharma_01"})
    if not doc:
        merchant = Merchant(
            name="Sharma Kirana Store",
            owner_name="Ramesh Sharma",
            phone_e164=payload.phone_e164,
            shop_code="SHARMA01",
        )
        await db.merchants.insert_one(merchant.to_mongo())
    else:
        merchant = Merchant.model_validate(doc)

    token = create_access_token({"sub": merchant.id, "phone": merchant.phone_e164})
    return AuthResponse(access_token=token, merchant=merchant)


@router.post("/logout")
async def logout() -> dict[str, str]:
    """Client logout."""
    return {"status": "ok", "message": "Logged out successfully"}


@router.get("/me")
async def get_me(merchant: CurrentMerchant) -> Merchant:
    """Get the currently authenticated merchant profile."""
    return merchant
