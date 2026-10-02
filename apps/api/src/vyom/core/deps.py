"""FastAPI dependencies for authentication, database access, and merchant scoping."""

from __future__ import annotations

from typing import Annotated, Any

from fastapi import Depends, Header
from pymongo.asynchronous.database import AsyncDatabase

from vyom.config import get_settings
from vyom.core.errors import UnauthorizedError
from vyom.core.security import decode_access_token
from vyom.db import get_db
from vyom.models.merchant import Merchant

AsyncDb = AsyncDatabase[dict[str, Any]]


async def get_database() -> AsyncDb:
    """Provide the async MongoDB database instance."""
    return get_db()


async def get_current_merchant(
    authorization: Annotated[str | None, Header()] = None,
    db: Annotated[AsyncDb, Depends(get_database)] = None,  # type: ignore[assignment]
) -> Merchant:
    """Authenticate the current merchant via Bearer token or fallback in demo mode."""
    settings = get_settings()

    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        try:
            payload = decode_access_token(token)
            merchant_id: str | None = payload.get("sub")
            if not merchant_id:
                raise UnauthorizedError("Invalid token payload")

            doc = await db.merchants.find_one({"_id": merchant_id})
            if not doc:
                # Also try matching shop_code
                doc = await db.merchants.find_one({"shop_code": merchant_id})
            if doc:
                return Merchant.model_validate(doc)
            raise UnauthorizedError("Merchant not found")
        except Exception:
            # Fall through if demo mode is enabled
            if not settings.demo_mode:
                raise UnauthorizedError("Could not validate credentials") from None

    # In demo mode, provide the default seeded merchant if no token is passed
    if settings.demo_mode:
        doc = await db.merchants.find_one({"_id": "merchant_sharma_01"})
        if not doc:
            doc = await db.merchants.find_one({})
        if doc:
            return Merchant.model_validate(doc)
        # Create minimal merchant on the fly if DB is fresh
        return Merchant(
            id="merchant_sharma_01",
            name="Sharma Kirana Store",
            owner_name="Ramesh Sharma",
            phone_e164="+919167586024",
            shop_code="SHARMA01",
        )

    raise UnauthorizedError("Authentication required")


CurrentMerchant = Annotated[Merchant, Depends(get_current_merchant)]
DatabaseDep = Annotated[AsyncDb, Depends(get_database)]
