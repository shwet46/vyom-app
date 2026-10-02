"""Growth opportunities detected by VYOM intelligence engines."""

from __future__ import annotations

import datetime
from typing import Any

from pydantic import BaseModel, Field

from vyom.models.base import MongoModel
from vyom.models.enums import (
    FestivalPhase,
    OpportunityKind,
    OpportunityStatus,
    OpportunityType,
)


class OpportunityRecommendation(BaseModel):
    headline: str | None = None
    body: str | None = None
    offer_type: str | None = None
    discount_pct: float | None = None
    target_items: list[str] = Field(default_factory=list)



class OpportunityEvidence(BaseModel):
    """Detailed facts, metrics, and reasoning behind the opportunity."""

    reason: str = ""
    churned_customers_count: int = 0
    dead_hour_slot: str | None = None
    historical_sales_paise: int = 0
    expected_uplift_pct: float = 0.0
    festival_name: str | None = None
    days_to_festival: int | None = None
    extra: dict[str, Any] = Field(default_factory=dict)


class Opportunity(MongoModel):
    """Actionable growth or advisory insight surfaced to the merchant."""

    merchant_id: str
    kind: OpportunityKind = OpportunityKind.CAMPAIGN
    type: OpportunityType
    festival_key: str | None = None
    phase: FestivalPhase | None = None
    title_key: str
    evidence: OpportunityEvidence = Field(default_factory=OpportunityEvidence)
    recommendation: OpportunityRecommendation | None = None
    audience_customer_ids: list[str] = Field(default_factory=list)
    est_return_paise: int = 0
    est_cost_paise: int = 0
    confidence: float = 0.8
    score: float = 0.8  # est_incremental_margin - est_cost - fatigue_penalty
    status: OpportunityStatus = OpportunityStatus.DETECTED
    snoozed_until: datetime.datetime | None = None
    recommended_send_at: datetime.datetime | None = None
    expires_at: datetime.datetime | None = None
    dedupe_key: str  # Unique together with merchant_id
