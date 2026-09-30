"""API v1 router aggregator."""

from __future__ import annotations

from fastapi import APIRouter

from vyom.api.v1.auth import router as auth_router
from vyom.api.v1.campaigns import router as campaigns_router
from vyom.api.v1.catalog import router as catalog_router
from vyom.api.v1.copilot import router as copilot_router
from vyom.api.v1.customers import router as customers_router
from vyom.api.v1.demo import router as demo_router
from vyom.api.v1.events import router as events_router
from vyom.api.v1.festivals import router as festivals_router
from vyom.api.v1.home import router as home_router
from vyom.api.v1.i18n import router as i18n_router
from vyom.api.v1.khata_scans import router as khata_scans_router
from vyom.api.v1.opportunities import router as opportunities_router
from vyom.api.v1.pay import router as pay_router
from vyom.api.v1.push import router as push_router
from vyom.api.v1.settings import router as settings_router
from vyom.api.v1.udhaar import router as udhaar_router
from vyom.api.v1.webhooks import router as webhooks_router

api_v1_router = APIRouter()

api_v1_router.include_router(auth_router)
api_v1_router.include_router(home_router)
api_v1_router.include_router(opportunities_router)
api_v1_router.include_router(campaigns_router)
api_v1_router.include_router(festivals_router)
api_v1_router.include_router(catalog_router)
api_v1_router.include_router(udhaar_router)
api_v1_router.include_router(customers_router)
api_v1_router.include_router(khata_scans_router)
api_v1_router.include_router(copilot_router)
api_v1_router.include_router(settings_router)
api_v1_router.include_router(i18n_router)
api_v1_router.include_router(events_router)
api_v1_router.include_router(push_router)
api_v1_router.include_router(pay_router)
api_v1_router.include_router(webhooks_router)
api_v1_router.include_router(demo_router)

__all__ = ["api_v1_router"]
