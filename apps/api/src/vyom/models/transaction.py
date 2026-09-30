"""Transaction and computed BusinessProfile models."""

from __future__ import annotations

import datetime
from typing import Any

from pydantic import BaseModel, Field

from vyom.models.base import MongoModel
from vyom.models.enums import PaymentMode, TransactionSource


class TransactionItem(BaseModel):
    """Line item in a sale transaction."""

    catalog_item_id: str | None = None
    name: str
    qty: float
    unit_price_paise: int
    cost_paise: int | None = None


class Transaction(MongoModel):
    """Sale transaction record (cash, UPI, or khata)."""

    merchant_id: str
    customer_id: str | None = None
    amount_paise: int
    items: list[TransactionItem] = Field(default_factory=list)
    payment_mode: PaymentMode = PaymentMode.UPI
    paid_at: datetime.datetime
    source: TransactionSource = TransactionSource.PAYTM_SIM
    coupon_code: str | None = None
    campaign_id: str | None = None
    kit_request_id: str | None = None


class DeadHourSlot(BaseModel):
    """Low-traffic recurring time slot."""

    day_of_week: int  # 0=Monday, 6=Sunday
    hour: int  # 0-23
    avg_sales_paise: int = 0


class BusinessTrend(BaseModel):
    """Moving average and comparison vs baseline."""

    ma7: float = 0.0
    baseline28: float = 0.0
    delta_pct: float = 0.0
    festival_adjusted: bool = False
    expected_post_festival: bool = False


class BusinessProfile(MongoModel):
    """Aggregated analytics and sales patterns for a merchant."""

    merchant_id: str
    hourly_sales: list[list[int]] = Field(
        default_factory=lambda: [[0] * 24 for _ in range(7)]
    )  # 7 days x 24 hours in paise
    top_items: list[dict[str, Any]] = Field(default_factory=list)
    avg_ticket_paise: int = 0
    repeat_rate: float = 0.0
    dead_hours: list[DeadHourSlot] = Field(default_factory=list)
    trend: BusinessTrend = Field(default_factory=BusinessTrend)
    category_sales: dict[str, int] = Field(default_factory=dict)
    computed_at: datetime.datetime = Field(default_factory=datetime.datetime.now)
