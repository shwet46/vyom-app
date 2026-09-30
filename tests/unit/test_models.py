"""Unit tests for MongoDB models and serialization."""

from __future__ import annotations

import datetime

from vyom.models.base import LocalizedText
from vyom.models.customer import Customer
from vyom.models.enums import Language, PaymentMode
from vyom.models.guardrails import Guardrails
from vyom.models.merchant import Merchant
from vyom.models.transaction import Transaction, TransactionItem


def test_localized_text() -> None:
    lt = LocalizedText(en="Rice", hi="चावल", mr="तांदूळ", hinglish="Chawal")
    assert lt.get_for_lang("hi") == "चावल"
    assert lt.get_for_lang("mr") == "तांदूळ"
    assert lt.get_for_lang("en") == "Rice"
    assert lt.get_for_lang("hinglish") == "Chawal"
    assert lt.get_for_lang("unknown") == "Chawal"  # fallback


def test_merchant_model() -> None:
    merchant = Merchant(
        name="Laxmi Kirana Store",
        owner_name="Ramesh Gupta",
        phone_e164="+919876543210",
        shop_code="LX01",
    )
    assert merchant.name == "Laxmi Kirana Store"
    assert merchant.id is not None
    assert len(merchant.id) == 24
    assert merchant.created_at is not None

    mongo_dict = merchant.to_mongo()
    assert "_id" in mongo_dict
    assert mongo_dict["phone_e164"] == "+919876543210"


def test_customer_model() -> None:
    customer = Customer(
        merchant_id="merchant_123",
        name="Anil Kumar",
        phone_e164="+919123456780",
        language=Language.HI,
    )
    assert customer.name == "Anil Kumar"
    assert customer.consent.marketing.granted is False
    assert customer.rfm.monetary_paise == 0


def test_transaction_model() -> None:
    item = TransactionItem(
        name="Sugar",
        qty=2.0,
        unit_price_paise=4500,
    )
    txn = Transaction(
        merchant_id="merchant_123",
        amount_paise=9000,
        items=[item],
        payment_mode=PaymentMode.UPI,
        paid_at=datetime.datetime.now(datetime.UTC),
    )
    assert txn.amount_paise == 9000
    assert len(txn.items) == 1
    assert txn.items[0].qty == 2.0


def test_guardrails_defaults() -> None:
    g = Guardrails(merchant_id="merchant_123")
    assert g.weekly_budget_paise == 50000
    assert g.max_discount_pct == 15.0
    assert g.max_msgs_per_customer_week == 2
    assert g.quiet_hours.start == "21:30"
    assert g.quiet_hours.end == "08:30"
    assert g.kill_switch is False
