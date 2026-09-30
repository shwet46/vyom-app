"""Unit tests for the growth and advisory detection modules."""

from __future__ import annotations

from vyom.models.customer import ConsentItem, Customer, CustomerConsent, CustomerRFM
from vyom.models.enums import OpportunityKind, OpportunityType
from vyom.models.transaction import BusinessProfile, BusinessTrend, DeadHourSlot
from vyom.services.detection.churn import ChurnDetector
from vyom.services.detection.dead_hours import DeadHoursDetector
from vyom.services.detection.falling_sales import FallingSalesDetector


def test_churn_detector_2x_gap_rule() -> None:
    # Customer A: avg gap 6 days, last visit 5 days ago -> NOT churned
    cust_a = Customer(
        id="c1",
        merchant_id="m1",
        name="Anand",
        consent=CustomerConsent(marketing=ConsentItem(granted=True)),
        rfm=CustomerRFM(recency_days=5, frequency=5, avg_gap_days=6.0),
    )
    # Customer B: avg gap 6 days, last visit 15 days ago (> 2x gap 12) -> CHURNED
    cust_b = Customer(
        id="c2",
        merchant_id="m1",
        name="Sunita",
        consent=CustomerConsent(marketing=ConsentItem(granted=True)),
        rfm=CustomerRFM(recency_days=15, frequency=4, avg_gap_days=6.0),
    )

    opp = ChurnDetector.detect_churn_opportunities(
        merchant_id="m1",
        customers=[cust_a, cust_b],
    )

    assert opp is not None
    assert opp.type == OpportunityType.WINBACK
    assert opp.kind == OpportunityKind.CAMPAIGN
    assert opp.audience_customer_ids == ["c2"]
    assert opp.evidence.churned_customers_count == 1


def test_dead_hours_detector() -> None:
    profile = BusinessProfile(
        merchant_id="m1",
        dead_hours=[DeadHourSlot(day_of_week=1, hour=15, avg_sales_paise=12000)],
    )
    customer = Customer(
        id="c1",
        merchant_id="m1",
        name="Anand",
        consent=CustomerConsent(marketing=ConsentItem(granted=True)),
    )

    opp = DeadHoursDetector.detect_dead_hour_opportunity(
        merchant_id="m1",
        profile=profile,
        customers=[customer],
    )

    assert opp is not None
    assert opp.type == OpportunityType.DEAD_HOUR
    assert "15:00 - 16:00" in (opp.evidence.dead_hour_slot or "")


def test_falling_sales_festival_aware() -> None:
    # 1. Normal post-festival dip (delta_pct < -15%, expected_post_festival = True)
    post_fest_profile = BusinessProfile(
        merchant_id="m1",
        trend=BusinessTrend(
            ma7=25000.0,
            baseline28=35000.0,
            delta_pct=-28.5,
            festival_adjusted=True,
            expected_post_festival=True,
        ),
    )

    opp_dip = FallingSalesDetector.detect_falling_sales(
        merchant_id="m1",
        profile=post_fest_profile,
    )

    assert opp_dip is not None
    assert opp_dip.kind == OpportunityKind.ADVISORY
    assert "post_festival" in opp_dip.title_key
    assert opp_dip.confidence == 0.65  # lower alarm confidence

    # 2. Steady sales (delta_pct = -5%) -> No alarm
    steady_profile = BusinessProfile(
        merchant_id="m1",
        trend=BusinessTrend(ma7=33000.0, baseline28=35000.0, delta_pct=-5.7),
    )
    assert FallingSalesDetector.detect_falling_sales("m1", steady_profile) is None
