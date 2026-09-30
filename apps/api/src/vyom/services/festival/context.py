"""Deterministic festival context engine and phase classifier."""

from __future__ import annotations

import datetime

from pydantic import BaseModel, Field

from vyom.clock import Clock
from vyom.models.base import LocalizedText
from vyom.models.enums import FestivalPhase, ToneProfile
from vyom.models.festival import FestivalCalendar, FestivalPlaybook
from vyom.models.merchant import Merchant


class ActiveFestival(BaseModel):
    """Festival state evaluated against the reference date."""

    key: str
    names: LocalizedText
    phase: FestivalPhase
    start_date: datetime.date
    end_date: datetime.date
    peak_start: datetime.date | None = None
    peak_end: datetime.date | None = None
    days_to_start: int
    days_to_end: int
    tone_profile: ToneProfile = ToneProfile.FESTIVE
    lead_days: int = 7
    post_days: int = 3
    excluded_categories: list[str] = Field(default_factory=list)
    enabled_for_merchant: bool = True
    summary: LocalizedText = Field(default_factory=LocalizedText)


class FestivalContext(BaseModel):
    """Computed festival panorama for a merchant at a specific point in time."""

    today: datetime.date
    recent: list[ActiveFestival] = Field(default_factory=list)  # Ended <= 14 days ago (post phase)
    current: list[ActiveFestival] = Field(default_factory=list)  # Today within start and end
    upcoming: list[ActiveFestival] = Field(default_factory=list)  # Starting within next 60 days


def classify_phase(
    today: datetime.date,
    start_date: datetime.date,
    end_date: datetime.date,
    peak_start: datetime.date | None = None,
    peak_end: datetime.date | None = None,
    lead_days: int = 7,
    post_days: int = 3,
) -> FestivalPhase:
    """Classify the festival phase deterministically based on date boundaries."""
    days_to_start = (start_date - today).days
    days_since_end = (today - end_date).days

    # 1. Before festival start
    if today < start_date:
        if days_to_start <= lead_days:
            return FestivalPhase.PREP
        if days_to_start <= 60:
            return FestivalPhase.UPCOMING
        return FestivalPhase.NONE

    # 2. Inside festival active window [start_date, end_date]
    if start_date <= today <= end_date:
        if peak_start and peak_end and peak_start <= today <= peak_end:
            return FestivalPhase.PEAK
        return FestivalPhase.ACTIVE

    # 3. After festival end
    if today > end_date:
        if days_since_end <= max(post_days, 14):
            return FestivalPhase.POST
        return FestivalPhase.NONE

    return FestivalPhase.NONE


class FestivalContextEngine:
    """Computes real-time and simulated festival context for merchants."""

    @staticmethod
    def build_context(
        merchant: Merchant,
        calendars: list[FestivalCalendar],
        playbooks: dict[str, FestivalPlaybook],
        today: datetime.date | None = None,
    ) -> FestivalContext:
        """Build FestivalContext from merchant profile, calendars, and playbooks."""
        current_date = today or Clock.today()
        recent: list[ActiveFestival] = []
        current: list[ActiveFestival] = []
        upcoming: list[ActiveFestival] = []

        merchant_regional_tags = set(merchant.region_profile.regional_tags)
        disabled_keys = set(merchant.festival_prefs.disabled_festival_keys)
        enabled_keys = set(merchant.festival_prefs.enabled_festival_keys)

        for cal in calendars:
            # Check relevance: merchant-enabled, regional match, or pan-india
            is_enabled = cal.key not in disabled_keys
            if cal.key in enabled_keys:
                is_enabled = True
            elif cal.region_scope:
                scopes = {s.value for s in cal.region_scope}
                if "pan_india" not in scopes and not scopes.intersection(merchant_regional_tags):
                    is_enabled = False

            playbook = playbooks.get(cal.playbook_key or cal.key)
            lead_days = playbook.lead_days if playbook else 7
            post_days = playbook.post_days if playbook else 3
            tone = playbook.tone_profile if playbook else ToneProfile.FESTIVE
            excluded = playbook.excluded_categories if playbook else []
            summary = playbook.summary if playbook else LocalizedText()

            phase = classify_phase(
                today=current_date,
                start_date=cal.start_date,
                end_date=cal.end_date,
                peak_start=cal.peak_start,
                peak_end=cal.peak_end,
                lead_days=lead_days,
                post_days=post_days,
            )

            if phase == FestivalPhase.NONE:
                continue

            active_fest = ActiveFestival(
                key=cal.key,
                names=cal.names,
                phase=phase,
                start_date=cal.start_date,
                end_date=cal.end_date,
                peak_start=cal.peak_start,
                peak_end=cal.peak_end,
                days_to_start=(cal.start_date - current_date).days,
                days_to_end=(cal.end_date - current_date).days,
                tone_profile=tone,
                lead_days=lead_days,
                post_days=post_days,
                excluded_categories=excluded,
                enabled_for_merchant=is_enabled,
                summary=summary,
            )

            if phase == FestivalPhase.POST:
                recent.append(active_fest)
            elif phase in (FestivalPhase.ACTIVE, FestivalPhase.PEAK):
                current.append(active_fest)
            elif phase in (FestivalPhase.PREP, FestivalPhase.UPCOMING):
                upcoming.append(active_fest)

        # Sort lists by chronological relevance
        recent.sort(key=lambda f: f.days_to_end, reverse=True)
        current.sort(key=lambda f: f.days_to_end)
        upcoming.sort(key=lambda f: f.days_to_start)

        return FestivalContext(
            today=current_date,
            recent=recent,
            current=current,
            upcoming=upcoming,
        )
