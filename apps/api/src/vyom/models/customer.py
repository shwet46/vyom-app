"""Customer record model with telegram, consent, and RFM attributes."""

from __future__ import annotations

import datetime

from pydantic import BaseModel, Field

from vyom.models.base import MongoModel
from vyom.models.enums import Language


class TelegramProfile(BaseModel):
    """Telegram account details linked to a customer."""

    chat_id: int | None = None
    user_id: int | None = None
    username: str | None = None
    language_code: str | None = None
    linked_at: datetime.datetime | None = None
    blocked: bool = False


class ConsentItem(BaseModel):
    """Granular consent record."""

    granted: bool = False
    at: datetime.datetime | None = None


class CustomerConsent(BaseModel):
    """Customer consents for marketing and udhaar reminders."""

    marketing: ConsentItem = Field(default_factory=ConsentItem)
    udhaar_reminders: ConsentItem = Field(default_factory=ConsentItem)
    revoked_at: datetime.datetime | None = None


class CustomerPreferences(BaseModel):
    """Customer communication and self-declared cultural preferences."""

    voice_replies: bool = False
    festival_nudges: bool = True
    # CRITICAL: Self-declared only, never inferred from caste/religion
    observes_festivals: list[str] = Field(default_factory=list)
    dietary_notes: list[str] = Field(default_factory=list)  # e.g. ["vrat", "no_onion_garlic"]


class CustomerRFM(BaseModel):
    """Recency, Frequency, Monetary metrics for segmentation."""

    recency_days: int = 0
    frequency: int = 0
    monetary_paise: int = 0
    avg_gap_days: float = 0.0


class Customer(MongoModel):
    """Customer profile scoped to a merchant."""

    merchant_id: str
    name: str
    phone_e164: str | None = None
    telegram: TelegramProfile = Field(default_factory=TelegramProfile)
    language: Language = Language.HINGLISH
    consent: CustomerConsent = Field(default_factory=CustomerConsent)
    opted_out: bool = False
    preferences: CustomerPreferences = Field(default_factory=CustomerPreferences)
    tags: list[str] = Field(default_factory=list)
    rfm: CustomerRFM = Field(default_factory=CustomerRFM)
    last_visit_at: datetime.datetime | None = None
    link_token: str | None = None
