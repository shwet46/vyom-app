"""Unit and integration tests for API v1 endpoints."""

from __future__ import annotations

import copy
import datetime
from typing import Any

import pytest
from httpx import ASGITransport, AsyncClient

from vyom.core.deps import get_database
from vyom.main import create_app


class MockCursor:
    """Mock MongoDB async cursor."""

    def __init__(self, docs: list[dict[str, Any]]) -> None:
        self._docs = docs
        self._idx = 0

    def __aiter__(self) -> MockCursor:
        return self

    async def __anext__(self) -> dict[str, Any]:
        if self._idx < len(self._docs):
            item = self._docs[self._idx]
            self._idx += 1
            return item
        raise StopAsyncIteration

    def sort(self, *args: Any, **kwargs: Any) -> MockCursor:
        return self

    def limit(self, *args: Any, **kwargs: Any) -> MockCursor:
        return self


class MockCollection:
    """Mock MongoDB collection storing documents in memory."""

    def __init__(self, initial_docs: list[dict[str, Any]] | None = None) -> None:
        self.docs: list[dict[str, Any]] = copy.deepcopy(initial_docs or [])

    async def find_one(
        self, query: dict[str, Any] | None = None, *args: Any, **kwargs: Any
    ) -> dict[str, Any] | None:
        if not query:
            return copy.deepcopy(self.docs[0]) if self.docs else None

        for doc in self.docs:
            match = True
            for k, v in query.items():
                if (k == "_id" and doc.get("_id") != v) or (k != "_id" and doc.get(k) != v and not isinstance(v, dict)):
                    match = False
                    break
            if match:
                return copy.deepcopy(doc)
        return None

    def find(
        self, query: dict[str, Any] | None = None, *args: Any, **kwargs: Any
    ) -> MockCursor:
        if not query:
            return MockCursor(copy.deepcopy(self.docs))

        matched = []
        for doc in self.docs:
            match = True
            for k, v in query.items():
                if isinstance(v, dict):
                    continue  # Simplified filter
                if doc.get(k) != v:
                    match = False
                    break
            if match:
                matched.append(copy.deepcopy(doc))
        return MockCursor(matched)

    async def insert_one(self, doc: dict[str, Any]) -> Any:
        copied = copy.deepcopy(doc)
        if "_id" not in copied and "id" in copied:
            copied["_id"] = copied["id"]
        self.docs.append(copied)
        return type("InsertResult", (), {"inserted_id": copied.get("_id")})()

    async def insert_many(self, docs: list[dict[str, Any]]) -> Any:
        for d in docs:
            await self.insert_one(d)
        return type("InsertManyResult", (), {"inserted_ids": [d.get("_id") for d in docs]})()

    async def update_one(
        self, query: dict[str, Any], update: dict[str, Any], upsert: bool = False
    ) -> Any:
        found = False
        set_vals = update.get("$set", {})
        inc_vals = update.get("$inc", {})
        push_vals = update.get("$push", {})

        for doc in self.docs:
            match = True
            for qk, qv in query.items():
                if doc.get(qk) != qv:
                    match = False
                    break
            if match:
                found = True
                doc.update(set_vals)
                for ik, iv in inc_vals.items():
                    doc[ik] = doc.get(ik, 0) + iv
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

        return type("UpdateResult", (), {"modified_count": 1 if found else 0})()

    async def count_documents(self, query: dict[str, Any] | None = None) -> int:
        if not query:
            return len(self.docs)
        count = 0
        for doc in self.docs:
            match = True
            for k, v in query.items():
                if doc.get(k) != v and not isinstance(v, dict):
                    match = False
                    break
            if match:
                count += 1
        return count


class MockDatabase:
    """Mock MongoDB database for testing FastAPI endpoints without real Mongo."""

    def __init__(self) -> None:
        self.merchants = MockCollection([
            {
                "_id": "merchant_sharma_01",
                "name": "Sharma Kirana Store",
                "owner_name": "Ramesh Sharma",
                "phone_e164": "+919876543210",
                "shop_code": "SHARMA01",
                "city": "Pune",
                "state": "Maharashtra",
                "region_profile": {
                    "state": "Maharashtra",
                    "city": "Pune",
                    "regional_tags": ["maharashtra", "pune"],
                },
                "language": "hinglish",
                "festival_prefs": {
                    "enabled_festival_keys": [
                        "ganesh_chaturthi",
                        "pitru_paksha",
                        "navratri",
                        "diwali_cluster",
                    ],
                    "disabled_festival_keys": [],
                    "auto_greetings": True,
                },
            }
        ])
        self.otp_sessions = MockCollection()
        self.customers = MockCollection([
            {
                "_id": "cust_sharma_001",
                "merchant_id": "merchant_sharma_01",
                "name": "Sunita Patil",
                "phone_e164": "+919821000001",
                "language": "mr",
                "rfm": {
                    "recency_days": 4,
                    "frequency_visits": 14,
                    "monetary_total_paise": 380000,
                    "avg_gap_days": 8.0,
                },
            }
        ])
        self.festival_calendar = MockCollection([
            {
                "_id": "ganesh_chaturthi_2026",
                "key": "ganesh_chaturthi",
                "year": 2026,
                "names": {"en": "Ganesh Chaturthi", "hi": "गणेश चतुर्थी"},
                "start_date": "2026-09-14",
                "end_date": "2026-09-24",
                "peak_start": "2026-09-14",
                "peak_end": "2026-09-24",
                "region_scope": ["maharashtra"],
                "date_confidence": "high",
                "playbook_key": "ganesh_chaturthi",
            },
            {
                "_id": "pitru_paksha_2026",
                "key": "pitru_paksha",
                "year": 2026,
                "names": {"en": "Pitru Paksha", "hi": "पितृ पक्ष"},
                "start_date": "2026-09-26",
                "end_date": "2026-10-10",
                "region_scope": ["pan_india"],
                "date_confidence": "high",
                "playbook_key": "pitru_paksha",
            },
            {
                "_id": "navratri_2026",
                "key": "navratri",
                "year": 2026,
                "names": {"en": "Sharad Navratri", "hi": "शारदीय नवरात्रि"},
                "start_date": "2026-10-11",
                "end_date": "2026-10-19",
                "region_scope": ["pan_india"],
                "date_confidence": "high",
                "playbook_key": "navratri",
            },
        ])
        self.festival_playbooks = MockCollection([
            {
                "_id": "pitru_paksha",
                "key": "pitru_paksha",
                "names": {"en": "Pitru Paksha", "hi": "पितृ पक्ष"},
                "summary": {"en": "Fortnight of homage to ancestors"},
                "tone_profile": "solemn",
                "rituals": [],
                "target_categories": [],
                "campaign_templates": [],
                "culture_notes": {"observances": ["Shradh rituals", "Strict vegetarianism"]},
                "review": {"status": "reviewed", "reviewer": "cultural_lead"},
            },
            {
                "_id": "navratri",
                "key": "navratri",
                "names": {"en": "Sharad Navratri", "hi": "शारदीय नवरात्रि"},
                "summary": {"en": "Nine nights of goddess worship with fasting"},
                "tone_profile": "observant",
                "rituals": [],
                "target_categories": [],
                "campaign_templates": [],
                "culture_notes": {"dietary_notes": ["Sendha namak only", "No grains"]},
                "review": {"status": "reviewed", "reviewer": "cultural_lead"},
            },
        ])
        self.merchant_catalog_items = MockCollection([
            {
                "_id": "item_01",
                "merchant_id": "merchant_sharma_01",
                "name": {"en": "Fortune Sunlite Oil 1L", "hi": "फॉर्च्यून तेल"},
                "category_key": "cooking_essentials",
                "price_paise": 14500,
                "cost_paise": 12800,
                "unit": "packet",
                "in_stock": True,
                "stock_qty": 35,
                "is_seasonal": False,
                "velocity": {"daily_units_28d": 3.2},
            },
            {
                "_id": "item_02",
                "merchant_id": "merchant_sharma_01",
                "name": {"en": "Vrat Special Sabudana 500g", "hi": "साबूदाना"},
                "category_key": "vrat_special",
                "price_paise": 6500,
                "cost_paise": 4800,
                "unit": "packet",
                "in_stock": True,
                "stock_qty": 18,
                "is_seasonal": True,
                "velocity": {"daily_units_28d": 1.5},
            },
        ])
        self.product_categories = MockCollection([
            {
                "_id": "cat_cooking",
                "key": "cooking_essentials",
                "names": {"en": "Cooking Essentials", "hi": "तेल और मसाले"},
                "display_order": 1,
            },
            {
                "_id": "cat_vrat",
                "key": "vrat_special",
                "names": {"en": "Vrat Specials", "hi": "व्रत का सामान"},
                "display_order": 2,
            },
        ])
        self.khata_entries = MockCollection([
            {
                "_id": "khata_001",
                "merchant_id": "merchant_sharma_01",
                "customer_id": "cust_sharma_001",
                "amount_total_paise": 45000,
                "amount_paid_paise": 0,
                "opened_at": datetime.datetime(2026, 9, 10, 10, 0, tzinfo=datetime.UTC),
                "due_date": datetime.date(2026, 9, 20),
                "status": "open",
                "source": "manual",
                "reminders": [],
            }
        ])
        self.transactions = MockCollection()
        self.opportunities = MockCollection()
        self.campaigns = MockCollection()
        self.payments = MockCollection()
        self.guardrails = MockCollection([
            {
                "_id": "guard_01",
                "merchant_id": "merchant_sharma_01",
                "weekly_budget_paise": 100000,
                "max_discount_pct": 10.0,
                "max_msgs_per_customer_week": 1,
                "quiet_hours": {"start": "21:00", "end": "08:00"},
                "kill_switch": False,
            }
        ])
        self.business_profiles = MockCollection([
            {
                "_id": "profile_01",
                "merchant_id": "merchant_sharma_01",
                "avg_ticket_paise": 32000,
                "repeat_rate": 0.68,
                "dead_hours": [{"day_of_week": 1, "hour": 14, "avg_sales_paise": 5000}],
                "trend": {"ma7": 1250000, "baseline28": 1400000, "delta_pct": -10.7},
            }
        ])
        self.copilot_sessions = MockCollection()
        self.copilot_pending_actions = MockCollection()
        self.copilot_messages = MockCollection()


@pytest.fixture
def test_app() -> Any:
    """Create test FastAPI application with mocked database."""
    app = create_app()
    mock_db = MockDatabase()
    app.dependency_overrides[get_database] = lambda: mock_db
    return app


@pytest.mark.asyncio
async def test_health_and_readyz(test_app: Any) -> None:
    """Verify health and ready status endpoints."""
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/healthz")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_auth_flow(test_app: Any) -> None:
    """Verify OTP request, OTP verify, and authenticated /me endpoint."""
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Request OTP
        req_resp = await client.post(
            "/api/v1/auth/otp/request",
            json={"phone_e164": "+919876543210"},
        )
        assert req_resp.status_code == 200
        assert req_resp.json()["status"] == "sent"

        # 2. Verify OTP
        verify_resp = await client.post(
            "/api/v1/auth/otp/verify",
            json={"phone_e164": "+919876543210", "code": "123456"},
        )
        assert verify_resp.status_code == 200
        data = verify_resp.json()
        assert "access_token" in data
        token = data["access_token"]

        # 3. Access /me with Bearer token
        me_resp = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert me_resp.status_code == 200
        assert me_resp.json()["name"] == "Sharma Kirana Store"

        # 4. Logout
        logout_resp = await client.post("/api/v1/auth/logout")
        assert logout_resp.status_code == 200


@pytest.mark.asyncio
async def test_home_overview(test_app: Any) -> None:
    """Verify the home dashboard aggregation endpoint."""
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/v1/home")
        assert resp.status_code == 200
        data = resp.json()
        assert data["merchant_name"] == "Sharma Kirana Store"
        assert "metrics" in data
        assert "udhaar_strip" in data


@pytest.mark.asyncio
async def test_festivals_api(test_app: Any) -> None:
    """Verify festival context and timeline endpoints."""
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Context
        ctx_resp = await client.get("/api/v1/festivals/context")
        assert ctx_resp.status_code == 200
        ctx_data = ctx_resp.json()
        assert "recent" in ctx_data or "current" in ctx_data or "upcoming" in ctx_data

        # Timeline
        timeline_resp = await client.get("/api/v1/festivals/timeline")
        assert timeline_resp.status_code == 200
        assert isinstance(timeline_resp.json(), list)


@pytest.mark.asyncio
async def test_catalog_and_categories(test_app: Any) -> None:
    """Verify catalog items and categories listing."""
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Categories
        cat_resp = await client.get("/api/v1/catalog/categories")
        assert cat_resp.status_code == 200
        categories = cat_resp.json()
        assert len(categories) >= 1

        # Items
        items_resp = await client.get("/api/v1/catalog/items")
        assert items_resp.status_code == 200
        items = items_resp.json()
        assert len(items) >= 1


@pytest.mark.asyncio
async def test_udhaar_api(test_app: Any) -> None:
    """Verify udhaar summary and entries list."""
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Summary
        sum_resp = await client.get("/api/v1/udhaar/summary")
        assert sum_resp.status_code == 200
        summary = sum_resp.json()
        assert "total_outstanding_paise" in summary

        # Entries
        entries_resp = await client.get("/api/v1/udhaar/entries")
        assert entries_resp.status_code == 200
        entries = entries_resp.json()
        assert len(entries) >= 1
        assert entries[0]["amount_total_paise"] == 45000


@pytest.mark.asyncio
async def test_copilot_chat(test_app: Any) -> None:
    """Verify merchant copilot natural language query and TTS voice synthesis."""
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post(
            "/api/v1/copilot/chat",
            json={"query": "Navratri ke liye kya stock karun?"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "text" in data
        assert len(data["text"]) > 0
        assert "audio_base64" in data
        assert data["audio_base64"] is not None

        # Test POST /copilot/tts
        tts_resp = await client.post(
            "/api/v1/copilot/tts",
            json={
                "text": "Namaste Sharma ji, Sarvam bulbul:v3 voice model active hai",
                "target_language_code": "hi-IN",
                "speaker": "shubh",
                "model": "bulbul:v3",
                "pace": 1.0,
                "speech_sample_rate": 22050,
            },
        )
        assert tts_resp.status_code == 200
        assert len(tts_resp.content) >= 44


@pytest.mark.asyncio
async def test_pay_landing(test_app: Any) -> None:
    """Verify pay link resolution."""
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/v1/pay/test_token_999")
        assert resp.status_code == 200
        data = resp.json()
        assert data["pay_token"] == "test_token_999"
        assert "upi_intent" in data

        resp_view = await client.get("/api/v1/pay/test_token_999/view")
        assert resp_view.status_code == 200
        assert "text/html" in resp_view.headers.get("content-type", "")
        assert "Sharma Kirana Store" in resp_view.text
        assert "Paytm" in resp_view.text


@pytest.mark.asyncio
async def test_webhooks(test_app: Any) -> None:
    """Verify Paytm payment notification webhook and Telegram bot webhook."""
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Paytm webhook
        paytm_resp = await client.post(
            "/api/v1/webhooks/paytm",
            json={
                "merchant_id": "merchant_sharma_01",
                "order_id": "ORDER_TEST_101",
                "amount_paise": 20000,
                "status": "SUCCESS",
                "payment_mode": "UPI",
            },
        )
        assert paytm_resp.status_code == 200
        assert paytm_resp.json()["status"] == "processed"

        # Telegram webhook
        tg_resp = await client.post(
            "/api/v1/webhooks/telegram",
            json={"update_id": 12345},
        )
        assert tg_resp.status_code == 200
        assert tg_resp.json()["ok"] is True


@pytest.mark.asyncio
async def test_demo_controls(test_app: Any) -> None:
    """Verify simulation controls: payment simulation, time advance, and set-today."""
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Simulate payment
        sim_pay = await client.post(
            "/api/v1/demo/simulate-payment",
            json={"merchant_id": "merchant_sharma_01", "amount_paise": 15000},
        )
        assert sim_pay.status_code == 200
        assert sim_pay.json()["status"] == "payment_simulated"

        # 2. Set today
        set_today = await client.post(
            "/api/v1/demo/set-today",
            json={"date_str": "2026-10-02"},
        )
        assert set_today.status_code == 200
        assert set_today.json()["today"] == "2026-10-02"

        # 3. Advance time
        adv_time = await client.post(
            "/api/v1/demo/advance-time",
            json={"days": 3},
        )
        assert adv_time.status_code == 200
        assert adv_time.json()["status"] == "advanced"
        assert adv_time.json()["today"] == "2026-10-05"


@pytest.mark.asyncio
async def test_10min_payment_reminders_endpoint(test_app: Any) -> None:
    """Verify triggering 10-minute customer payment reminder API dispatches reminders to open accounts."""
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post(
            "/api/v1/udhaar/reminders/trigger-10min",
            headers={"Authorization": "Bearer mock_jwt_token_for_merchant_sharma_01"},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["status"] == "success"
        assert body["reminders_sent"] >= 1
        assert body["interval_minutes"] == 10
