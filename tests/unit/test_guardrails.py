"""Unit tests for Merchant Guardrails evaluation and automatic adjustment."""

from __future__ import annotations

import datetime

from vyom.models.campaign import CampaignDraft, OfferSpec
from vyom.models.enums import GuardrailStatus, OfferType
from vyom.models.guardrails import Guardrails
from vyom.services.guardrails import GuardrailsEvaluator, is_in_quiet_hours


def test_quiet_hours_detection() -> None:
    # Quiet hours: 21:30 to 08:30 IST
    night_time = datetime.datetime(2026, 10, 1, 23, 15)  # 11:15 PM
    early_morning = datetime.datetime(2026, 10, 1, 6, 45)  # 6:45 AM
    safe_day_time = datetime.datetime(2026, 10, 1, 14, 0)  # 2:00 PM

    assert is_in_quiet_hours(night_time, "21:30", "08:30") is True
    assert is_in_quiet_hours(early_morning, "21:30", "08:30") is True
    assert is_in_quiet_hours(safe_day_time, "21:30", "08:30") is False


def test_guardrails_adjustment_discount() -> None:
    guardrails = Guardrails(
        merchant_id="m1",
        max_discount_pct=10.0,
        weekly_budget_paise=50000,
    )
    draft = CampaignDraft(
        merchant_id="m1",
        opportunity_id="opp_1",
        offer=OfferSpec(type=OfferType.DISCOUNT, discount_pct=20.0),
        est_cost_paise=1000,
    )

    res = GuardrailsEvaluator.evaluate(draft, guardrails)
    assert res.status == GuardrailStatus.ADJUSTED
    assert draft.offer.discount_pct == 10.0  # Adjusted down
    assert len(res.adjustments) == 1


def test_guardrails_budget_violation() -> None:
    guardrails = Guardrails(
        merchant_id="m1",
        weekly_budget_paise=2000,  # ₹20 remaining
    )
    draft = CampaignDraft(
        merchant_id="m1",
        opportunity_id="opp_1",
        offer=OfferSpec(type=OfferType.DISCOUNT, discount_pct=5.0),
        est_cost_paise=5000,  # ₹50 requested
    )

    res = GuardrailsEvaluator.evaluate(draft, guardrails)
    assert res.status == GuardrailStatus.VIOLATED
    assert len(res.violations) == 1


def test_guardrails_kill_switch() -> None:
    guardrails = Guardrails(
        merchant_id="m1",
        kill_switch=True,
    )
    draft = CampaignDraft(
        merchant_id="m1",
        opportunity_id="opp_1",
        offer=OfferSpec(type=OfferType.NONE),
        est_cost_paise=0,
    )

    res = GuardrailsEvaluator.evaluate(draft, guardrails)
    assert res.status == GuardrailStatus.VIOLATED
    assert "kill switch" in res.violations[0].lower()
