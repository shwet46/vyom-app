"""Festivals API: cultural context, timeline, festival detail with stock advice, and merchant preferences."""

from __future__ import annotations

import datetime
from typing import Any

from fastapi import APIRouter, Query
from pydantic import BaseModel

from vyom.clock import Clock
from vyom.core.deps import CurrentMerchant, DatabaseDep
from vyom.core.errors import NotFoundError
from vyom.models.catalog import MerchantCatalogItem
from vyom.models.customer import Customer
from vyom.models.festival import FestivalCalendar, FestivalPlaybook
from vyom.services.detection.festival_opps import FestivalOpportunityGenerator
from vyom.services.festival.context import FestivalContext, FestivalContextEngine
from vyom.services.festival.kits import FestivalKitBuilder, FestivalKitBundle
from vyom.services.festival.stock_advisor import StockAdvisor, StockAdvisorReport

router = APIRouter(prefix="/festivals", tags=["Festivals"])


class FestivalPreferencesUpdate(BaseModel):
    enabled_festival_keys: list[str]
    disabled_festival_keys: list[str]
    auto_greetings: bool = True


class DateOverrideRequest(BaseModel):
    start_date: datetime.date
    end_date: datetime.date
    date_note: str | None = None


class FestivalDetailResponse(BaseModel):
    calendar: FestivalCalendar
    playbook: FestivalPlaybook
    stock_report: StockAdvisorReport
    suggested_kit: FestivalKitBundle
    last_year_total_sales_paise: int = 450000


@router.get("/context")
async def get_festival_context(
    merchant: CurrentMerchant,
    db: DatabaseDep,
) -> FestivalContext:
    """Return the current festival context panorama (recent, current, upcoming) for the merchant."""
    today_date = Clock.today()
    cals_cursor = db.festival_calendar.find({"year": today_date.year})
    cals = [FestivalCalendar.model_validate(c) async for c in cals_cursor]

    pbs_cursor = db.festival_playbooks.find({})
    pbs = {pb["key"]: FestivalPlaybook.model_validate(pb) async for pb in pbs_cursor}

    return FestivalContextEngine.build_context(merchant, cals, pbs, today=today_date)


@router.get("/timeline")
async def get_festival_timeline(
    merchant: CurrentMerchant,
    db: DatabaseDep,
    from_date: datetime.date | None = Query(None, alias="from"),
    to_date: datetime.date | None = Query(None, alias="to"),
) -> list[FestivalCalendar]:
    """Return festival timeline events filtered by date range."""
    today_date = Clock.today()
    start = from_date or today_date
    end = to_date or (today_date + datetime.timedelta(days=90))

    cursor = db.festival_calendar.find(
        {"start_date": {"$gte": start.isoformat(), "$lte": end.isoformat()}}
    ).sort("start_date", 1)

    return [FestivalCalendar.model_validate(c) async for c in cursor]


@router.get("/{festival_key}")
async def get_festival_detail(
    festival_key: str,
    merchant: CurrentMerchant,
    db: DatabaseDep,
) -> FestivalDetailResponse:
    """Return in-depth festival playbook, stock advisor calculations, and kit proposal."""
    today_date = Clock.today()

    cal_doc = await db.festival_calendar.find_one({"key": festival_key, "year": today_date.year})
    if not cal_doc:
        # Fallback to any year
        cal_doc = await db.festival_calendar.find_one({"key": festival_key})
    if not cal_doc:
        raise NotFoundError("Festival calendar entry not found")
    calendar = FestivalCalendar.model_validate(cal_doc)

    pb_doc = await db.festival_playbooks.find_one({"key": calendar.playbook_key or festival_key})
    if not pb_doc:
        raise NotFoundError("Festival playbook not found")
    playbook = FestivalPlaybook.model_validate(pb_doc)

    # Load merchant catalog items
    catalog_cursor = db.merchant_catalog_items.find({"merchant_id": merchant.id})
    items = [MerchantCatalogItem.model_validate(i) async for i in catalog_cursor]

    # Calculate stock recommendations
    stock_report = StockAdvisor.generate_advice(
        playbook=playbook,
        catalog_items=items,
        window_days=7,
        history_days=180,
    )

    # Assemble suggested kit
    suggested_kit = FestivalKitBuilder.build_kit(
        playbook=playbook,
        catalog_items=items,
        discount_pct=10.0,
    )

    return FestivalDetailResponse(
        calendar=calendar,
        playbook=playbook,
        stock_report=stock_report,
        suggested_kit=suggested_kit,
        last_year_total_sales_paise=520000,
    )


@router.put("/preferences")
async def update_festival_preferences(
    payload: FestivalPreferencesUpdate,
    merchant: CurrentMerchant,
    db: DatabaseDep,
) -> dict[str, str]:
    """Update which festivals the merchant opts in or out of."""
    await db.merchants.update_one(
        {"_id": merchant.id},
        {
            "$set": {
                "festival_prefs.enabled_festival_keys": payload.enabled_festival_keys,
                "festival_prefs.disabled_festival_keys": payload.disabled_festival_keys,
                "festival_prefs.auto_greetings": payload.auto_greetings,
                "updated_at": Clock.now(),
            }
        },
    )
    return {"status": "updated"}


@router.put("/{festival_key}/dates")
async def override_festival_dates(
    festival_key: str,
    payload: DateOverrideRequest,
    merchant: CurrentMerchant,
    db: DatabaseDep,
) -> dict[str, str]:
    """Customize festival date boundaries (e.g. for local tithi variations)."""
    today_date = Clock.today()
    res = await db.festival_calendar.update_one(
        {"key": festival_key, "year": today_date.year},
        {
            "$set": {
                "start_date": payload.start_date,
                "end_date": payload.end_date,
                "date_note": payload.date_note,
                "updated_at": Clock.now(),
            }
        },
    )
    if res.matched_count == 0:
        raise NotFoundError("Festival calendar entry not found")
    return {"status": "updated"}


@router.post("/{festival_key}/generate-opportunities")
async def generate_festival_opportunities_endpoint(
    festival_key: str,
    merchant: CurrentMerchant,
    db: DatabaseDep,
) -> dict[str, Any]:
    """Generate festival-specific opportunities (kit offer and stock advisory) on demand."""

    today_date = Clock.today()

    cals_cursor = db.festival_calendar.find({"year": today_date.year})
    cals = [FestivalCalendar.model_validate(c) async for c in cals_cursor]

    pbs_cursor = db.festival_playbooks.find({})
    pbs = {pb["key"]: FestivalPlaybook.model_validate(pb) async for pb in pbs_cursor}

    cust_cursor = db.customers.find({"merchant_id": merchant.id})
    customers = [Customer.model_validate(c) async for c in cust_cursor]

    fest_ctx = FestivalContextEngine.build_context(merchant, cals, pbs, today=today_date)
    opps = FestivalOpportunityGenerator.generate_festival_opportunities(
        merchant, fest_ctx, customers, pbs, today=today_date
    )

    matching_opps = [o for o in opps if o.festival_key == festival_key]
    for o in matching_opps:
        await db.opportunities.update_one(
            {"merchant_id": merchant.id, "dedupe_key": o.dedupe_key},
            {"$set": o.to_mongo()},
            upsert=True,
        )

    return {"status": "generated", "count": len(matching_opps)}
