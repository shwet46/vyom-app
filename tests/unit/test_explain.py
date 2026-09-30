"""Unit tests for OpportunityExplainer multilingual generation."""

from __future__ import annotations

from vyom.models.enums import OpportunityKind, OpportunityType
from vyom.models.opportunity import Opportunity, OpportunityEvidence
from vyom.services.explain import OpportunityExplainer


def test_explain_winback() -> None:
    opp = Opportunity(
        merchant_id="m1",
        kind=OpportunityKind.CAMPAIGN,
        type=OpportunityType.WINBACK,
        title_key="opp.winback",
        est_return_paise=250000,
        evidence=OpportunityEvidence(churned_customers_count=5),
        dedupe_key="winback_1",
    )

    exp = OpportunityExplainer.explain(opp)
    assert "5" in exp.en
    assert "2500" in exp.en
    assert "₹2500" in exp.hinglish


def test_explain_festival_kit() -> None:
    opp = Opportunity(
        merchant_id="m1",
        kind=OpportunityKind.CAMPAIGN,
        type=OpportunityType.FESTIVAL_KIT,
        title_key="opp.fest",
        evidence=OpportunityEvidence(festival_name="Navratri", days_to_festival=11),
        dedupe_key="fest_1",
    )

    exp = OpportunityExplainer.explain(opp)
    assert "Navratri" in exp.en
    assert "11" in exp.en
    assert "Navratri" in exp.hinglish
