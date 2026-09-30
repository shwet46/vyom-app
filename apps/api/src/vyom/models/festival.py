"""Festival calendar, cultural playbook, and shopping kit request models."""

from __future__ import annotations

import datetime
from typing import Any

from pydantic import BaseModel, Field

from vyom.models.base import LocalizedText, MongoModel
from vyom.models.enums import (
    DateConfidence,
    FestivalRegionScope,
    KitRequestStatus,
    PlaybookReviewStatus,
    RitualRole,
    ToneProfile,
)


class FestivalCalendar(MongoModel):
    """Annual festival dates, region applicability, and confidence."""

    key: str
    year: int
    names: LocalizedText
    start_date: datetime.date
    end_date: datetime.date
    peak_start: datetime.date | None = None
    peak_end: datetime.date | None = None
    region_scope: list[FestivalRegionScope] = Field(
        default_factory=lambda: [FestivalRegionScope.PAN_INDIA]
    )
    date_confidence: DateConfidence = DateConfidence.HIGH
    alt_dates: list[datetime.date] = Field(default_factory=list)
    date_note: str | None = None
    source_refs: list[str] = Field(default_factory=list)
    verified_at: datetime.datetime | None = None
    playbook_key: str


class PlaybookRitual(BaseModel):
    """Specific ritual associated with a festival."""

    key: str
    text: LocalizedText


class PlaybookCategory(BaseModel):
    """Product category role, expected prior uplift, and timing window offset."""

    category_key: str
    role: RitualRole
    uplift_prior_pct: float = 0.0  # e.g. 50.0 means +50% expected
    start_offset_days: int = 0  # relative to festival start (negative means prior)
    end_offset_days: int = 0


class PlaybookCampaignTemplate(BaseModel):
    """Campaign template definition within a playbook."""

    kind: str  # kit, greeting, pre_stock, post_clearance
    offer_types_allowed: list[str] = Field(default_factory=list)


class CultureNotes(BaseModel):
    """Cultural dos and don'ts for communications and offerings."""

    do: list[str] = Field(default_factory=list)
    dont: list[str] = Field(default_factory=list)


class PlaybookReview(BaseModel):
    """Curation and human review status for cultural accuracy."""

    status: PlaybookReviewStatus = PlaybookReviewStatus.DRAFT
    reviewer: str | None = None
    reviewed_at: datetime.datetime | None = None


class FestivalPlaybook(MongoModel):
    """Cultural and commercial playbook for an Indian festival."""

    key: str  # Unique
    names: LocalizedText
    summary: LocalizedText
    rituals: list[PlaybookRitual] = Field(default_factory=list)
    tone_profile: ToneProfile = ToneProfile.FESTIVE
    lead_days: int = 7  # Days before start considered "prep" phase
    post_days: int = 3  # Days after end considered "post" phase
    categories: list[PlaybookCategory] = Field(default_factory=list)
    excluded_categories: list[str] = Field(
        default_factory=list
    )  # e.g. ["non_veg", "egg", "alcohol", "contains_onion_garlic"]
    observant_dietary_rules: list[str] = Field(default_factory=list)
    campaign_templates: list[PlaybookCampaignTemplate] = Field(default_factory=list)
    culture_notes: CultureNotes = Field(default_factory=CultureNotes)
    region_variants: dict[str, dict[str, Any]] = Field(default_factory=dict)
    review: PlaybookReview = Field(default_factory=PlaybookReview)


class KitItem(BaseModel):
    """Item line in a festival kit."""

    catalog_item_id: str
    qty: float


class FestivalKitRequest(MongoModel):
    """Customer pre-order or interest in a curated festival essentials bundle."""

    merchant_id: str
    customer_id: str
    festival_key: str
    items: list[KitItem] = Field(default_factory=list)
    est_total_paise: int  # Computed in backend code, never client
    status: KitRequestStatus = KitRequestStatus.REQUESTED
    ready_at: datetime.datetime | None = None
    payment_id: str | None = None
    created_via: str = "bot"  # bot | copilot
