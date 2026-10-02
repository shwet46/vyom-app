"""Unit tests for the Festival and Ritual Intelligence Engine."""

from __future__ import annotations

import datetime

import pytest

from vyom.models.base import LocalizedText
from vyom.models.catalog import ItemVelocity, MerchantCatalogItem
from vyom.models.enums import (
    FestivalPhase,
    RitualRole,
    ToneProfile,
)
from vyom.models.festival import (
    FestivalCalendar,
    FestivalPlaybook,
    PlaybookCategory,
)
from vyom.models.merchant import FestivalPrefs, Merchant, RegionProfile
from vyom.services.festival.context import FestivalContextEngine, classify_phase
from vyom.services.festival.kits import FestivalKitBuilder
from vyom.services.festival.stock_advisor import StockAdvisor
from vyom.services.festival.tone import ToneValidationError, ToneValidator
from vyom.services.festival.uplift import UpliftEstimator


@pytest.fixture
def sample_merchant() -> Merchant:
    return Merchant(
        name="Sharma Kirana Store",
        owner_name="Ramesh Sharma",
        phone_e164="+919167586024",
        shop_code="SHARMA01",
        region_profile=RegionProfile(
            state="Maharashtra",
            city="Pune",
            regional_tags=["maharashtra", "pune", "marathi_households"],
        ),
        festival_prefs=FestivalPrefs(
            enabled_festival_keys=[
                "ganesh_chaturthi",
                "pitru_paksha",
                "navratri",
                "dussehra",
                "diwali_cluster",
            ],
            disabled_festival_keys=[],
            auto_greetings=True,
        ),
    )


@pytest.fixture
def sample_calendars() -> list[FestivalCalendar]:
    return [
        FestivalCalendar(
            key="ganesh_chaturthi",
            year=2026,
            names=LocalizedText(en="Ganesh Chaturthi"),
            start_date=datetime.date(2026, 9, 16),
            end_date=datetime.date(2026, 9, 25),
            playbook_key="ganesh_chaturthi",
        ),
        FestivalCalendar(
            key="pitru_paksha",
            year=2026,
            names=LocalizedText(en="Pitru Paksha"),
            start_date=datetime.date(2026, 9, 27),
            end_date=datetime.date(2026, 10, 10),
            playbook_key="pitru_paksha",
        ),
        FestivalCalendar(
            key="navratri",
            year=2026,
            names=LocalizedText(en="Shardiya Navratri"),
            start_date=datetime.date(2026, 10, 11),
            end_date=datetime.date(2026, 10, 19),
            peak_start=datetime.date(2026, 10, 18),
            peak_end=datetime.date(2026, 10, 19),
            playbook_key="navratri",
        ),
        FestivalCalendar(
            key="dussehra",
            year=2026,
            names=LocalizedText(en="Vijayadashami / Dussehra"),
            start_date=datetime.date(2026, 10, 20),
            end_date=datetime.date(2026, 10, 20),
            playbook_key="dussehra",
        ),
        FestivalCalendar(
            key="diwali_cluster",
            year=2026,
            names=LocalizedText(en="Diwali Festival Cluster"),
            start_date=datetime.date(2026, 11, 5),
            end_date=datetime.date(2026, 11, 10),
            playbook_key="diwali_cluster",
        ),
    ]


@pytest.fixture
def sample_playbooks() -> dict[str, FestivalPlaybook]:
    return {
        "ganesh_chaturthi": FestivalPlaybook(
            key="ganesh_chaturthi",
            names=LocalizedText(en="Ganesh Chaturthi"),
            summary=LocalizedText(en="10-day celebration"),
            tone_profile=ToneProfile.FESTIVE,
            lead_days=10,
            post_days=5,
            categories=[
                PlaybookCategory(
                    category_key="sweet_ingredients",
                    role=RitualRole.SWEET_INGREDIENT,
                    uplift_prior_pct=80.0,
                ),
                PlaybookCategory(
                    category_key="puja_items", role=RitualRole.PUJA_ITEM, uplift_prior_pct=95.0
                ),
            ],
            excluded_categories=["non_veg", "egg", "alcohol"],
        ),
        "pitru_paksha": FestivalPlaybook(
            key="pitru_paksha",
            names=LocalizedText(en="Pitru Paksha"),
            summary=LocalizedText(en="Solemn ancestor period"),
            tone_profile=ToneProfile.SOLEMN,
            lead_days=3,
            post_days=1,
            categories=[
                PlaybookCategory(
                    category_key="puja_items", role=RitualRole.PUJA_ITEM, uplift_prior_pct=45.0
                ),
            ],
            excluded_categories=["non_veg", "egg", "alcohol", "contains_onion_garlic"],
        ),
        "navratri": FestivalPlaybook(
            key="navratri",
            names=LocalizedText(en="Shardiya Navratri"),
            summary=LocalizedText(en="9 days of fasting"),
            tone_profile=ToneProfile.OBSERVANT,
            lead_days=14,
            post_days=3,
            categories=[
                PlaybookCategory(
                    category_key="vrat_foods", role=RitualRole.FASTING_FOOD, uplift_prior_pct=150.0
                ),
                PlaybookCategory(
                    category_key="puja_items", role=RitualRole.PUJA_ITEM, uplift_prior_pct=90.0
                ),
            ],
            excluded_categories=["non_veg", "egg", "alcohol", "contains_onion_garlic"],
        ),
    }


def test_classify_phase_boundaries() -> None:
    start = datetime.date(2026, 10, 11)
    end = datetime.date(2026, 10, 19)
    peak_s = datetime.date(2026, 10, 18)
    peak_e = datetime.date(2026, 10, 19)

    # 1. Way before lead_days (e.g. 30 days before)
    assert (
        classify_phase(datetime.date(2026, 9, 10), start, end, lead_days=14)
        == FestivalPhase.UPCOMING
    )

    # 2. Inside prep window (10 days before start, lead_days=14)
    assert (
        classify_phase(datetime.date(2026, 10, 1), start, end, lead_days=14) == FestivalPhase.PREP
    )

    # 3. Inside active period (Day 2)
    assert (
        classify_phase(datetime.date(2026, 10, 13), start, end, peak_start=peak_s, peak_end=peak_e)
        == FestivalPhase.ACTIVE
    )

    # 4. Inside peak period (Ashtami)
    assert (
        classify_phase(datetime.date(2026, 10, 18), start, end, peak_start=peak_s, peak_end=peak_e)
        == FestivalPhase.PEAK
    )

    # 5. Right after end (Day 2 of post)
    assert (
        classify_phase(datetime.date(2026, 10, 21), start, end, post_days=3) == FestivalPhase.POST
    )

    # 6. Way past festival
    assert (
        classify_phase(datetime.date(2026, 11, 15), start, end, post_days=3) == FestivalPhase.NONE
    )


def test_festival_context_for_demo_date(
    sample_merchant: Merchant,
    sample_calendars: list[FestivalCalendar],
    sample_playbooks: dict[str, FestivalPlaybook],
) -> None:
    demo_today = datetime.date(2026, 9, 30)
    ctx = FestivalContextEngine.build_context(
        merchant=sample_merchant,
        calendars=sample_calendars,
        playbooks=sample_playbooks,
        today=demo_today,
    )

    # Verify Ganesh Chaturthi is in recent (ended 25 Sep, within 14d)
    recent_keys = [f.key for f in ctx.recent]
    assert "ganesh_chaturthi" in recent_keys
    ganesh = next(f for f in ctx.recent if f.key == "ganesh_chaturthi")
    assert ganesh.phase == FestivalPhase.POST

    # Verify Pitru Paksha is current (active window 27 Sep - 10 Oct)
    current_keys = [f.key for f in ctx.current]
    assert "pitru_paksha" in current_keys
    pitru = next(f for f in ctx.current if f.key == "pitru_paksha")
    assert pitru.phase == FestivalPhase.ACTIVE
    assert pitru.tone_profile == ToneProfile.SOLEMN

    # Verify Navratri is upcoming in prep phase (starts 11 Oct, 11 days away, lead_days=14)
    upcoming_keys = [f.key for f in ctx.upcoming]
    assert "navratri" in upcoming_keys
    navratri = next(f for f in ctx.upcoming if f.key == "navratri")
    assert navratri.phase == FestivalPhase.PREP
    assert navratri.days_to_start == 11
    assert navratri.tone_profile == ToneProfile.OBSERVANT


def test_uplift_estimation() -> None:
    # 1. Prior only when no history is available
    res_prior = UpliftEstimator.estimate_uplift(
        category_key="vrat_foods",
        prior_uplift_pct=100.0,
        history_days=0,
    )
    assert res_prior.uplift_pct == 100.0
    assert res_prior.uplift_multiplier == 2.0
    assert res_prior.weight_history == 0.0

    # 2. Blend with merchant history (180 days = full weight 1.0)
    res_blended = UpliftEstimator.estimate_uplift(
        category_key="vrat_foods",
        prior_uplift_pct=100.0,
        last_year_festival_daily_sales_paise=300000,
        baseline_daily_sales_paise=100000,  # 3x = +200% own uplift
        history_days=180,
    )
    assert res_blended.weight_history == 1.0
    assert res_blended.uplift_pct == 200.0
    assert res_blended.uplift_multiplier == 3.0


def test_stock_advisor(sample_playbooks: dict[str, FestivalPlaybook]) -> None:
    playbook = sample_playbooks["navratri"]
    item = MerchantCatalogItem(
        merchant_id="m_1",
        name=LocalizedText(en="Sabudana"),
        category_keys=["vrat_foods"],
        unit="kg",
        pack_size="1 kg",
        price_paise=9000,
        stock_qty=10.0,
        velocity=ItemVelocity(daily_units_28d=5.0),
    )

    report = StockAdvisor.generate_advice(
        playbook=playbook,
        catalog_items=[item],
        window_days=7,
        history_days=0,
    )

    assert len(report.recommendations) == 1
    rec = report.recommendations[0]
    assert rec.category_key == "vrat_foods"
    # baseline 5 units * 2.5 uplift * 7 days = 87.5 expected units
    assert rec.expected_festival_demand_units > 80.0
    assert rec.shortfall_units > 70.0


def test_festival_kit_builder(sample_playbooks: dict[str, FestivalPlaybook]) -> None:
    playbook = sample_playbooks["navratri"]
    items = [
        MerchantCatalogItem(
            id=f"item_{i}",
            merchant_id="m_1",
            name=LocalizedText(en=f"Vrat Item {i}"),
            category_keys=["vrat_foods"],
            price_paise=5000,
            in_stock=True,
            velocity=ItemVelocity(daily_units_28d=float(i + 1)),
        )
        for i in range(12)  # 12 items available
    ]

    bundle = FestivalKitBuilder.build_kit(
        playbook=playbook,
        catalog_items=items,
        discount_pct=10.0,
    )

    # Must be capped at 8 items
    assert len(bundle.items) == 8
    # Code-computed total: 8 items * 5000 = 40000 paise MRP
    assert bundle.total_mrp_paise == 40000
    # 10% discount: 4000 paise savings, bundle price 36000
    assert bundle.savings_paise == 4000
    assert bundle.bundle_price_paise == 36000


def test_tone_validator_solemn() -> None:
    # 1. Solemn profile prohibits sale words
    with pytest.raises(ToneValidationError) as exc_info:
        ToneValidator.validate(
            text="Pitru Paksha Dhamaka Mega Sale 50% discount!",
            tone_profile=ToneProfile.SOLEMN,
        )
    assert any("promotional phrase" in v for v in exc_info.value.violations)

    # 2. Solemn profile permits respectful convenience framing and 🙏 emoji
    report = ToneValidator.validate(
        text="Shraddha aur tarpan ki shuddh samagri ek jagah uplabdh hai 🙏",
        tone_profile=ToneProfile.SOLEMN,
    )
    assert report["valid"] is True


def test_tone_validator_guarantees() -> None:
    # Religious guarantees are prohibited across all profiles
    with pytest.raises(ToneValidationError):
        ToneValidator.validate(
            text="Buy this thali for 100% guaranteed punya and swarg prapti!",
            tone_profile=ToneProfile.FESTIVE,
        )
