"""Merchant and auth session models."""

from __future__ import annotations

import datetime

from pydantic import BaseModel, Field

from vyom.models.base import MongoModel
from vyom.models.enums import Language, OnboardingState


class RegionProfile(BaseModel):
    """Regional and demographic attributes of the merchant's area."""

    state: str = "Maharashtra"
    city: str = "Pune"
    regional_tags: list[str] = Field(
        default_factory=lambda: ["maharashtra", "pune", "marathi_households"]
    )


class GeoPoint(BaseModel):
    """Latitude and longitude coordinates."""

    lat: float
    lng: float


class FestivalPrefs(BaseModel):
    """Merchant preference for festival participation and automated greetings."""

    enabled_festival_keys: list[str] = Field(default_factory=list)
    disabled_festival_keys: list[str] = Field(default_factory=list)
    auto_greetings: bool = True


class MerchantSettings(BaseModel):
    """Operational settings for the merchant."""

    voice_replies_default: bool = True
    max_discount_pct: float = 10.0
    preferred_campaign_times: list[str] = Field(default_factory=lambda: ["10:00", "16:00"])


class Merchant(MongoModel):
    """Merchant account and kirana store profile."""

    name: str
    owner_name: str
    phone_e164: str
    city: str = "Pune"
    state: str = "Maharashtra"
    region_profile: RegionProfile = Field(default_factory=RegionProfile)
    language: Language = Language.HINGLISH
    shop_code: str
    bot_username: str = "VyomDemoShopBot"
    address: str = "Shop No 4, Somwar Peth, Pune 411011"
    geo: GeoPoint | None = None
    timings: list[str] = Field(default_factory=lambda: ["08:00 - 22:00"])
    todays_special: str | None = None
    contact_phone: str = "+919876543210"
    festival_prefs: FestivalPrefs = Field(default_factory=FestivalPrefs)
    settings: MerchantSettings = Field(default_factory=MerchantSettings)
    onboarding_state: OnboardingState = OnboardingState.COMPLETED


class OTPSession(MongoModel):
    """Authentication OTP session with TTL."""

    phone_e164: str
    code_hash: str
    attempts: int = 0
    expires_at: datetime.datetime
