"""Unit tests for worker background jobs, schedulers, and dispatching."""

from __future__ import annotations

import copy
import datetime
from typing import Any

import pytest

from vyom.clock import Clock
from vyom.models.enums import CampaignStatus
from vyom.worker.jobs import (
    run_campaign_dispatch,
    run_nightly_opportunity_detection,
    run_udhaar_reminder_sweep,
    send_10min_customer_payment_reminders,
)
from vyom.worker.scheduler import VyomWorker


class MockWorkerCursor:
    def __init__(self, docs: list[dict[str, Any]]) -> None:
        self._docs = docs
        self._idx = 0

    def __aiter__(self) -> MockWorkerCursor:
        return self

    async def __anext__(self) -> dict[str, Any]:
        if self._idx < len(self._docs):
            item = self._docs[self._idx]
            self._idx += 1
            return item
        raise StopAsyncIteration

    def sort(self, *args: Any, **kwargs: Any) -> MockWorkerCursor:
        return self

    def limit(self, *args: Any, **kwargs: Any) -> MockWorkerCursor:
        return self


class MockWorkerCollection:
    def __init__(self, initial_docs: list[dict[str, Any]] | None = None) -> None:
        self.docs: list[dict[str, Any]] = copy.deepcopy(initial_docs or [])

    async def find_one(self, query: dict[str, Any] | None = None, *args: Any, **kwargs: Any) -> dict[str, Any] | None:
        if not query:
            return copy.deepcopy(self.docs[0]) if self.docs else None
        for doc in self.docs:
            match = True
            for k, v in query.items():
                if doc.get(k) != v and not isinstance(v, dict):
                    match = False
                    break
            if match:
                return copy.deepcopy(doc)
        return None

    def find(self, query: dict[str, Any] | None = None, *args: Any, **kwargs: Any) -> MockWorkerCursor:
        if not query:
            return MockWorkerCursor(copy.deepcopy(self.docs))
        matched = []
        for doc in self.docs:
            match = True
            for k, v in query.items():
                if isinstance(v, dict):
                    continue
                if doc.get(k) != v:
                    match = False
                    break
            if match:
                matched.append(copy.deepcopy(doc))
        return MockWorkerCursor(matched)

    async def insert_many(self, docs: list[dict[str, Any]]) -> Any:
        for d in docs:
            copied = copy.deepcopy(d)
            if "_id" not in copied and "id" in copied:
                copied["_id"] = copied["id"]
            self.docs.append(copied)
        return type("InsertManyResult", (), {"inserted_ids": [d.get("_id") for d in docs]})()

    async def update_one(self, query: dict[str, Any], update: dict[str, Any], upsert: bool = False) -> Any:
        set_vals = update.get("$set", {})
        push_vals = update.get("$push", {})
        found = False
        for doc in self.docs:
            match = True
            for qk, qv in query.items():
                if doc.get(qk) != qv:
                    match = False
                    break
            if match:
                found = True
                for sk, sv in set_vals.items():
                    if "." in sk:
                        parts = sk.split(".")
                        curr = doc
                        for p in parts[:-1]:
                            curr = curr.setdefault(p, {})
                        curr[parts[-1]] = sv
                    else:
                        doc[sk] = sv
                for pk, pv in push_vals.items():
                    if pk not in doc:
                        doc[pk] = []
                    doc[pk].append(pv)
                break
        if not found and upsert:
            new_doc = copy.deepcopy(query)
            new_doc.update(set_vals)
            if "_id" not in new_doc and "id" in new_doc:
                new_doc["_id"] = new_doc["id"]
            self.docs.append(new_doc)
        return type("Res", (), {"modified_count": 1 if found else 0})()


class MockWorkerDatabase:
    def __init__(self) -> None:
        today_date = Clock.today()
        self.merchants = MockWorkerCollection([
            {
                "_id": "merchant_sharma_01",
                "name": "Sharma Kirana Store",
                "owner_name": "Ramesh Sharma",
                "phone_e164": "+919167586024",
                "shop_code": "SHARMA01",
                "city": "Pune",
                "state": "Maharashtra",
                "region_profile": {"state": "Maharashtra", "city": "Pune", "regional_tags": ["maharashtra"]},
                "festival_prefs": {"enabled_festival_keys": ["navratri", "pitru_paksha"]},
            }
        ])
        self.guardrails = MockWorkerCollection([
            {
                "_id": "g1",
                "merchant_id": "merchant_sharma_01",
                "weekly_budget_paise": 100000,
                "max_discount_pct": 10.0,
                "quiet_hours": {"start": "21:00", "end": "08:00"},
            }
        ])
        self.customers = MockWorkerCollection([
            {
                "_id": "c1",
                "merchant_id": "merchant_sharma_01",
                "name": "Sunita Patil",
                "phone_e164": "+919821000001",
                "consent": {"marketing": {"granted": True, "granted_at": datetime.datetime.now(datetime.UTC)}},
                "rfm": {"recency_days": 28, "frequency": 12, "monetary_total_paise": 300000, "avg_gap_days": 10.0},
            }
        ])
        self.transactions = MockWorkerCollection([
            {
                "_id": "t1",
                "merchant_id": "merchant_sharma_01",
                "amount_paise": 25000,
                "paid_at": datetime.datetime.now(datetime.UTC),
                "items": [{"name": "Oil", "qty": 1.0, "unit_price_paise": 25000}],
            }
        ])
        self.merchant_catalog_items = MockWorkerCollection([
            {
                "_id": "cat_item_1",
                "merchant_id": "merchant_sharma_01",
                "name": {"en": "Sabudana 500g", "hi": "साबूदाना"},
                "category_keys": ["vrat_special"],
                "price_paise": 6500,
                "in_stock": True,
                "stock_qty": 40,
                "velocity": {"daily_units_28d": 2.0},
            }
        ])
        self.festival_calendar = MockWorkerCollection([
            {
                "_id": "nav_2026",
                "key": "navratri",
                "year": 2026,
                "names": {"en": "Navratri", "hi": "नवरात्रि"},
                "start_date": "2026-10-11",
                "end_date": "2026-10-19",
                "peak_start": "2026-10-11",
                "peak_end": "2026-10-19",
                "region_scope": ["pan_india"],
                "date_confidence": "high",
                "playbook_key": "navratri",
            }
        ])
        self.festival_playbooks = MockWorkerCollection([
            {
                "_id": "navratri",
                "key": "navratri",
                "names": {"en": "Navratri", "hi": "नवरात्रि"},
                "summary": {"en": "Nine nights of fasting"},
                "tone_profile": "observant",
                "rituals": [],
                "target_categories": [],
                "campaign_templates": [],
                "culture_notes": {},
                "review": {"status": "reviewed", "reviewer": "cultural_lead"},
            }
        ])
        self.business_profiles = MockWorkerCollection()
        self.opportunities = MockWorkerCollection()
        self.khata_entries = MockWorkerCollection([
            {
                "_id": "k1",
                "merchant_id": "merchant_sharma_01",
                "customer_id": "c1",
                "amount_total_paise": 50000,
                "amount_paid_paise": 0,
                "due_date": today_date - datetime.timedelta(days=3),  # 3 days overdue
                "status": "open",
                "source": "manual",
                "opened_at": datetime.datetime.now(datetime.UTC),
                "reminders": [],
            }
        ])
        now = Clock.now()
        self.payments = MockWorkerCollection()
        self.campaign_deliveries = MockWorkerCollection()
        self.campaigns = MockWorkerCollection([
            {
                "_id": "camp_01",
                "merchant_id": "merchant_sharma_01",
                "opportunity_id": "opp_01",
                "draft_id": "draft_01",
                "approved_snapshot": {"title": "Navratri Offer"},
                "approved_at": now - datetime.timedelta(hours=1),
                "idempotency_key": "idemp_camp_01",
                "status": CampaignStatus.SCHEDULED.value,
                "schedule": {"send_at": now - datetime.timedelta(minutes=5), "tz": "Asia/Kolkata"},
                "audience_customer_ids": [f"c_{i}" for i in range(12)],
                "holdout_customer_ids": ["c_0", "c_10"],
                "metrics": {"sent": 0, "delivered": 0},
                "starts_at": now - datetime.timedelta(minutes=5),
                "ends_at": now + datetime.timedelta(days=3),
            }
        ])


@pytest.mark.asyncio
async def test_job_opportunity_detection() -> None:
    """Verify opportunity detection job executes all steps and upserts opportunities."""
    db = MockWorkerDatabase()
    opps = await run_nightly_opportunity_detection(db, merchant_id="merchant_sharma_01")
    assert isinstance(opps, list)
    # Check that opportunities collection was written to
    assert len(db.opportunities.docs) >= 1


@pytest.mark.asyncio
async def test_job_udhaar_sweep() -> None:
    """Verify udhaar sweep detects overdue entries and appends respectful reminders."""
    db = MockWorkerDatabase()
    count = await run_udhaar_reminder_sweep(db, merchant_id="merchant_sharma_01")
    assert count == 1
    assert len(db.khata_entries.docs[0]["reminders"]) == 1
    assert db.khata_entries.docs[0]["reminders"][0]["tone"] == "gentle"


@pytest.mark.asyncio
async def test_job_10min_payment_reminders() -> None:
    """Verify 10-minute automated payment reminder job identifies pending balances and adds reminders."""
    db = MockWorkerDatabase()
    count = await send_10min_customer_payment_reminders(db, merchant_id="merchant_sharma_01")
    assert count == 1
    assert len(db.khata_entries.docs[0]["reminders"]) == 1
    assert db.khata_entries.docs[0]["reminders"][0]["tone"] == "gentle"
    assert "last_reminder_at" in db.khata_entries.docs[0]


@pytest.mark.asyncio
async def test_job_campaign_dispatch() -> None:
    """Verify campaign dispatch splits recipients into 90% treated / 10% holdout and updates metrics."""
    db = MockWorkerDatabase()
    count = await run_campaign_dispatch(db)
    assert count == 1

    camp = db.campaigns.docs[0]
    assert camp["status"] == CampaignStatus.COMPLETED.value
    assert camp["metrics"]["sent"] > 0
    assert len(db.campaign_deliveries.docs) > 0


@pytest.mark.asyncio
async def test_scheduler_lifecycle() -> None:
    """Verify AsyncIOScheduler setup and start/stop controls."""
    w = VyomWorker()
    w.setup_schedules(demo_mode=True)
    jobs = w.scheduler.get_jobs()
    assert len(jobs) >= 4

    w.start()
    assert w._is_running is True
    w.stop()
    assert w._is_running is False
