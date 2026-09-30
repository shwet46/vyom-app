"""Unit tests for Business Profile builder and aggregation engine."""

from __future__ import annotations

import datetime

from vyom.models.enums import PaymentMode, TransactionSource
from vyom.models.transaction import Transaction, TransactionItem
from vyom.services.profile import ProfileBuilder


def test_profile_builder_metrics() -> None:
    # 2 customers: c1 (2 visits), c2 (1 visit) -> repeat rate = 0.5
    txns = [
        Transaction(
            merchant_id="m1",
            customer_id="c1",
            amount_paise=20000,
            items=[TransactionItem(name="Rice", qty=1.0, unit_price_paise=20000)],
            payment_mode=PaymentMode.UPI,
            paid_at=datetime.datetime(2026, 9, 28, 10, 30, tzinfo=datetime.UTC),  # Monday 10:30 AM
            source=TransactionSource.PAYTM_SIM,
        ),
        Transaction(
            merchant_id="m1",
            customer_id="c1",
            amount_paise=40000,
            items=[TransactionItem(name="Atta", qty=1.0, unit_price_paise=40000)],
            payment_mode=PaymentMode.UPI,
            paid_at=datetime.datetime(2026, 9, 29, 18, 0, tzinfo=datetime.UTC),  # Tuesday 6:00 PM
            source=TransactionSource.PAYTM_SIM,
        ),
        Transaction(
            merchant_id="m1",
            customer_id="c2",
            amount_paise=60000,
            items=[TransactionItem(name="Ghee", qty=1.0, unit_price_paise=60000)],
            payment_mode=PaymentMode.CASH,
            paid_at=datetime.datetime(2026, 9, 29, 19, 0, tzinfo=datetime.UTC),  # Tuesday 7:00 PM
            source=TransactionSource.PAYTM_SIM,
        ),
    ]

    profile = ProfileBuilder.compute_profile(
        merchant_id="m1",
        transactions=txns,
        as_of_date=datetime.date(2026, 9, 30),
    )

    # 1. Total revenue: 120000 paise across 3 txns -> avg ticket = 40000 paise (₹400)
    assert profile.avg_ticket_paise == 40000

    # 2. Repeat rate: 1 repeat customer (c1) out of 2 total = 0.50
    assert profile.repeat_rate == 0.50

    # 3. Monday 10 AM slot (weekday 0, hour 10) has 20000 paise
    assert profile.hourly_sales[0][10] == 20000

    # 4. Tuesday 18 PM slot (weekday 1, hour 18) has 40000 paise
    assert profile.hourly_sales[1][18] == 40000
