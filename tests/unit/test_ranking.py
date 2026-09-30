"""Unit tests for OpportunityRanker and prioritization scoring."""

from __future__ import annotations

import datetime

from vyom.models.enums import OpportunityKind, OpportunityType
from vyom.models.opportunity import Opportunity
from vyom.services.ranking import OpportunityRanker


def test_opportunity_ranking_timing_factor() -> None:
    today = datetime.date(2026, 9, 30)

    # Opportunity A: recommended send date is today (timing factor 1.3)
    opp_a = Opportunity(
        merchant_id="m1",
        kind=OpportunityKind.CAMPAIGN,
        type=OpportunityType.FESTIVAL_KIT,
        title_key="opp.a",
        est_return_paise=100000,
        est_cost_paise=5000,
        confidence=0.8,
        recommended_send_at=datetime.datetime(2026, 9, 30, 10, 0),
        dedupe_key="opp_a",
    )

    # Opportunity B: recommended send date is 10 days in the past (decayed factor)
    opp_b = Opportunity(
        merchant_id="m1",
        kind=OpportunityKind.CAMPAIGN,
        type=OpportunityType.FESTIVAL_KIT,
        title_key="opp.b",
        est_return_paise=100000,
        est_cost_paise=5000,
        confidence=0.8,
        recommended_send_at=datetime.datetime(2026, 9, 20, 10, 0),
        dedupe_key="opp_b",
    )

    score_a = OpportunityRanker.calculate_score(opp_a, today=today)
    score_b = OpportunityRanker.calculate_score(opp_b, today=today)

    assert score_a > score_b


def test_ranking_sort_order() -> None:
    today = datetime.date(2026, 9, 30)

    opp_high = Opportunity(
        merchant_id="m1",
        kind=OpportunityKind.CAMPAIGN,
        type=OpportunityType.FESTIVAL_KIT,
        title_key="opp.high",
        est_return_paise=500000,
        est_cost_paise=10000,
        confidence=0.9,
        dedupe_key="opp_high",
    )
    opp_low = Opportunity(
        merchant_id="m1",
        kind=OpportunityKind.CAMPAIGN,
        type=OpportunityType.DEAD_HOUR,
        title_key="opp.low",
        est_return_paise=50000,
        est_cost_paise=5000,
        confidence=0.7,
        dedupe_key="opp_low",
    )

    ranked = OpportunityRanker.rank_opportunities([opp_low, opp_high], today=today)
    assert ranked[0].dedupe_key == "opp_high"
    assert ranked[1].dedupe_key == "opp_low"
