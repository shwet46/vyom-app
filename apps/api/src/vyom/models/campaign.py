"""Campaign drafts, approved campaigns, customer deliveries, and coupons."""

from __future__ import annotations

import datetime
from typing import Any

from pydantic import BaseModel, Field

from vyom.models.base import MongoModel
from vyom.models.enums import (
    CampaignStatus,
    CouponStatus,
    DeliveryGroup,
    DeliveryStatus,
    GuardrailStatus,
    OfferType,
    ToneProfile,
)


class OfferItem(BaseModel):
    """Item specification in an offer."""

    catalog_item_id: str
    qty: float


class OfferSpec(BaseModel):
    """Parameters of an approved or drafted offer."""

    type: OfferType = OfferType.DISCOUNT
    discount_pct: float | None = None
    items: list[OfferItem] = Field(default_factory=list)
    price_paise: int | None = None
    valid_days: int = 3


class GuardrailEvaluationResult(BaseModel):
    """Outcome of running merchant guardrails against a campaign draft."""

    status: GuardrailStatus = GuardrailStatus.PASSED
    violations: list[str] = Field(default_factory=list)
    adjustments: list[str] = Field(default_factory=list)


class CampaignDraft(MongoModel):
    """Pre-approval campaign proposal with message variants and guardrail checks."""

    merchant_id: str
    opportunity_id: str
    variant_key: str = "primary"
    offer: OfferSpec = Field(default_factory=OfferSpec)
    message_facts: dict[str, Any] = Field(default_factory=dict)
    template_messages: dict[str, str] = Field(default_factory=dict)  # lang -> message text
    est_cost_paise: int = 0
    projected_return_paise: int = 0
    tone_profile: ToneProfile = ToneProfile.FESTIVE
    guardrail_result: GuardrailEvaluationResult = Field(default_factory=GuardrailEvaluationResult)


class CampaignSchedule(BaseModel):
    """Execution timing and timezone for a campaign."""

    send_at: datetime.datetime
    tz: str = "Asia/Kolkata"


class CampaignMetrics(BaseModel):
    """Aggregate delivery, conversion, and financial metrics."""

    sent: int = 0
    delivered: int = 0
    viewed: int = 0
    claimed: int = 0
    kit_requests: int = 0
    redeemed: int = 0
    revenue_paise: int = 0
    cost_paise: int = 0
    incremental_revenue_paise: int = 0
    roi: float = 0.0


class Campaign(MongoModel):
    """Merchant-approved marketing campaign with immutable snapshot."""

    merchant_id: str
    opportunity_id: str
    draft_id: str
    festival_key: str | None = None
    approved_snapshot: dict[str, Any]  # Immutable copy of the approved draft
    approved_at: datetime.datetime
    approved_via: str = "tap"  # tap | voice
    idempotency_key: str  # Unique
    status: CampaignStatus = CampaignStatus.SCHEDULED
    schedule: CampaignSchedule
    audience_customer_ids: list[str] = Field(default_factory=list)
    holdout_customer_ids: list[str] = Field(default_factory=list)  # Exactly 10% holdout
    metrics: CampaignMetrics = Field(default_factory=CampaignMetrics)
    starts_at: datetime.datetime
    ends_at: datetime.datetime


class GenerationMeta(BaseModel):
    """Metadata regarding AI generation of delivery text."""

    model: str = "sarvam-105b"
    validated: bool = True
    fallback_used: bool = False


class CampaignDelivery(MongoModel):
    """Targeted customer message attempt within a campaign."""

    merchant_id: str
    campaign_id: str
    customer_id: str
    group: DeliveryGroup = DeliveryGroup.TREATED
    status: DeliveryStatus = DeliveryStatus.QUEUED
    telegram_message_id: int | None = None
    generated_text: str = ""
    generation_meta: GenerationMeta = Field(default_factory=GenerationMeta)
    coupon_id: str | None = None
    claimed_at: datetime.datetime | None = None
    redeemed_at: datetime.datetime | None = None
    redeemed_amount_paise: int | None = None
    idempotency_key: str  # Unique


class Coupon(MongoModel):
    """Unique discount coupon issued to a customer."""

    merchant_id: str
    campaign_id: str
    customer_id: str
    code: str  # Unique code e.g. "VYOM-NAV-9821"
    discount_spec: dict[str, Any] = Field(default_factory=dict)
    valid_till: datetime.datetime
    status: CouponStatus = CouponStatus.ISSUED
    redeemed_txn_id: str | None = None
