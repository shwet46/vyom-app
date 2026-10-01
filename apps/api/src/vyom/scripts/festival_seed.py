"""Seeds festival calendar and cultural playbooks for 2026 (Pune / Maharashtra verified)."""

from __future__ import annotations

import asyncio
import datetime
from typing import Any

import structlog

from vyom.config import get_settings
from vyom.db import close_mongo, init_mongo
from vyom.models.base import LocalizedText
from vyom.models.enums import (
    DateConfidence,
    FestivalRegionScope,
    PlaybookReviewStatus,
    RitualRole,
    ToneProfile,
)
from vyom.models.festival import (
    CultureNotes,
    FestivalCalendar,
    FestivalPlaybook,
    PlaybookCampaignTemplate,
    PlaybookCategory,
    PlaybookReview,
    PlaybookRitual,
)

logger = structlog.get_logger()

# ── 1. CULTURAL PLAYBOOKS ─────────────────────────────────────────────────────

PLAYBOOKS: list[FestivalPlaybook] = [
    FestivalPlaybook(
        key="ganesh_chaturthi",
        names=LocalizedText(
            en="Ganesh Chaturthi",
            hi="गणेश चतुर्थी",
            mr="गणेशोत्सव",
            hinglish="Ganesh Chaturthi",
        ),
        summary=LocalizedText(
            en="10-day elephant deity celebration with modaks, daily aarti, and immersion.",
            hi="10 दिवसीय गणेश उत्सव, मोदक, दैनिक आरती और विसर्जन के साथ।",
            mr="१० दिवसांचा लाडक्या बाप्पाचा उत्सव, मोदक, रोजची आरती आणि विसर्जन।",
            hinglish="10-day Bappa festival with modak preparation, puja and daily aarti.",
        ),
        rituals=[
            PlaybookRitual(
                key="pranpratishtha",
                text=LocalizedText(
                    en="Idol installation and welcome puja",
                    hi="मूर्ति स्थापना और स्वागत पूजा",
                    mr="मूर्ती स्थापना व प्राणप्रतिष्ठा",
                    hinglish="Murti sthapana and welcome puja",
                ),
            ),
            PlaybookRitual(
                key="modak_bhog",
                text=LocalizedText(
                    en="Offering steamed ukadiche modaks and sweets",
                    hi="मोदक का भोग और प्रसाद वितरण",
                    mr="उकडीचे मोदक नैवेद्य",
                    hinglish="Ukadiche modak bhog and prasad",
                ),
            ),
        ],
        tone_profile=ToneProfile.FESTIVE,
        lead_days=10,
        post_days=5,
        categories=[
            PlaybookCategory(
                category_key="sweet_ingredients",
                role=RitualRole.SWEET_INGREDIENT,
                uplift_prior_pct=80.0,
                start_offset_days=-5,
                end_offset_days=5,
            ),
            PlaybookCategory(
                category_key="puja_items",
                role=RitualRole.PUJA_ITEM,
                uplift_prior_pct=95.0,
                start_offset_days=-7,
                end_offset_days=2,
            ),
            PlaybookCategory(
                category_key="dairy",
                role=RitualRole.STAPLE,
                uplift_prior_pct=40.0,
                start_offset_days=-3,
                end_offset_days=10,
            ),
        ],
        excluded_categories=["non_veg", "egg", "alcohol"],
        culture_notes=CultureNotes(
            do=[
                "Greet customers with Ganpati Bappa Morya",
                "Stock jaggery, coconut and rice flour",
            ],
            dont=["No non-vegetarian promotion", "No loud aggressive haggling"],
        ),
        review=PlaybookReview(
            status=PlaybookReviewStatus.REVIEWED,
            reviewer="Cultural Heritage Committee Pune",
            reviewed_at=datetime.datetime(2026, 1, 15, tzinfo=datetime.UTC),
        ),
    ),
    FestivalPlaybook(
        key="pitru_paksha",
        names=LocalizedText(
            en="Pitru Paksha",
            hi="पितृ पक्ष",
            mr="पितृ पक्ष (श्राद्ध)",
            hinglish="Pitru Paksha",
        ),
        summary=LocalizedText(
            en="Solemn 16-day lunar period dedicated to honoring ancestors through Tarpan and Shraddha.",
            hi="पूर्वजों को तर्पण और श्राद्ध अर्पित करने की 16 दिवसीय पवित्र अवधि।",
            mr="पूर्वजांचे स्मरण आणि श्राद्ध तर्पण करण्याचा १६ दिवसांचा पवित्र काळ।",
            hinglish="16-day period to honor ancestors with pure shraddha samagri and quiet service.",
        ),
        rituals=[
            PlaybookRitual(
                key="tarpan",
                text=LocalizedText(
                    en="Water and black sesame seed offerings to ancestors",
                    hi="जल और काले तिल से तर्पण",
                    mr="काळे तीळ आणि दर्भाने तर्पण",
                    hinglish="Black til and jal tarpan",
                ),
            ),
            PlaybookRitual(
                key="shradh_kheer",
                text=LocalizedText(
                    en="Sattvic meal with rice kheer, puri, and cow feeding",
                    hi="खीर-पूरी का सात्विक भोजन और गौग्रास",
                    mr="खीर-पुरी नैवेद्य आणि काकबली",
                    hinglish="Kheer puri sattvic bhog",
                ),
            ),
        ],
        tone_profile=ToneProfile.SOLEMN,
        lead_days=3,
        post_days=1,
        categories=[
            PlaybookCategory(
                category_key="puja_items",
                role=RitualRole.PUJA_ITEM,
                uplift_prior_pct=45.0,
                start_offset_days=-2,
                end_offset_days=16,
            ),
            PlaybookCategory(
                category_key="staples",
                role=RitualRole.FASTING_FOOD,
                uplift_prior_pct=30.0,
                start_offset_days=-1,
                end_offset_days=16,
            ),
        ],
        excluded_categories=["non_veg", "egg", "alcohol", "contains_onion_garlic"],
        culture_notes=CultureNotes(
            do=[
                "Use respectful, quiet framing: 'Shraddha samagri ek jagah uplabdh'",
                "Keep black sesame (kala til), barley, honey and pure ghee readily stocked",
            ],
            dont=[
                "STRICTLY BANNED: sale/discount/dhamaka language",
                "NO party or celebration emojis (only Namaste 🙏 permitted)",
                "No onion, garlic, eggs, or meat in any messaging",
            ],
        ),
        review=PlaybookReview(
            status=PlaybookReviewStatus.REVIEWED,
            reviewer="Drik Panchang Scholars Pune",
            reviewed_at=datetime.datetime(2026, 1, 15, tzinfo=datetime.UTC),
        ),
    ),
    FestivalPlaybook(
        key="navratri",
        names=LocalizedText(
            en="Shardiya Navratri",
            hi="शारदीय नवरात्रि",
            mr="नवरात्रौत्सव",
            hinglish="Navratri",
        ),
        summary=LocalizedText(
            en="9-night festival of the divine feminine with fasting (vrat), Ghatasthapana, and Dandiya.",
            hi="माँ दुर्गा के 9 रूपों की आराधना, 9 दिनों का उपवास और घटस्थापना।",
            mr="आई दुर्गेचा नऊ दिवसांचा उत्सव, उपवास (फराळ), घटस्थापना आणि गरबा।",
            hinglish="9 days of fasting, devotion, Ghatasthapana and special faral essentials.",
        ),
        rituals=[
            PlaybookRitual(
                key="ghatasthapana",
                text=LocalizedText(
                    en="Kalash installation and barley sowing on day 1",
                    hi="कलश स्थापना और जौ बोना",
                    mr="घटस्थापना आणि धान्य पेरणी",
                    hinglish="Day 1 Ghatasthapana and kalash puja",
                ),
            ),
            PlaybookRitual(
                key="kanya_pujan",
                text=LocalizedText(
                    en="Ashtami/Navami worship of young girls with halwa chana puri",
                    hi="अष्टमी/नवमी कन्या पूजन (हलवा-चना-पूरी)",
                    mr="अष्टमी/नवमी कन्या पूजन",
                    hinglish="Ashtami/Navami Kanya pujan feast",
                ),
            ),
        ],
        tone_profile=ToneProfile.OBSERVANT,
        lead_days=14,
        post_days=3,
        categories=[
            PlaybookCategory(
                category_key="vrat_foods",
                role=RitualRole.FASTING_FOOD,
                uplift_prior_pct=150.0,
                start_offset_days=-5,
                end_offset_days=9,
            ),
            PlaybookCategory(
                category_key="puja_items",
                role=RitualRole.PUJA_ITEM,
                uplift_prior_pct=90.0,
                start_offset_days=-7,
                end_offset_days=3,
            ),
            PlaybookCategory(
                category_key="dairy",
                role=RitualRole.STAPLE,
                uplift_prior_pct=60.0,
                start_offset_days=-2,
                end_offset_days=9,
            ),
            PlaybookCategory(
                category_key="dry_fruits",
                role=RitualRole.FASTING_FOOD,
                uplift_prior_pct=75.0,
                start_offset_days=-4,
                end_offset_days=9,
            ),
        ],
        excluded_categories=["non_veg", "egg", "alcohol", "contains_onion_garlic"],
        campaign_templates=[
            PlaybookCampaignTemplate(
                kind="kit",
                offer_types_allowed=["kit", "combo", "discount"],
            ),
            PlaybookCampaignTemplate(
                kind="pre_stock",
                offer_types_allowed=["none"],
            ),
        ],
        culture_notes=CultureNotes(
            do=[
                "Highlight 100% pure Vrat / Farali certified staples (Sabudana, Sendha Namak, Singhara Atta)",
                "Suggest pre-packed Ghatasthapana Puja Kits",
            ],
            dont=[
                "Do not mix ordinary salt with Sendha Namak (rock salt)",
                "No mention of onion, garlic, or non-veg",
            ],
        ),
        review=PlaybookReview(
            status=PlaybookReviewStatus.REVIEWED,
            reviewer="Vedic Academy Maharashtra",
            reviewed_at=datetime.datetime(2026, 1, 15, tzinfo=datetime.UTC),
        ),
    ),
    FestivalPlaybook(
        key="dussehra",
        names=LocalizedText(
            en="Vijayadashami / Dussehra",
            hi="दशहरा (विजयादशमी)",
            mr="दसरा (विजयादशमी)",
            hinglish="Dussehra",
        ),
        summary=LocalizedText(
            en="Triumph of good over evil. Apta leaves exchange (gold), vehicle/tools worship, and sweets.",
            hi="बुराई पर अच्छाई की विजय। सोना (आपटा पत्ता) वितरण, वाहन/औजार पूजन और जलेबी।",
            mr="सोनं लुटण्याचा सण! आपट्याची पानं, झेंडूची फुलं, वाहन पूजा आणि श्रीखंड-जिलबी।",
            hinglish="Gold sharing with Apta leaves, marigold torans, vehicle puja and sweets.",
        ),
        rituals=[
            PlaybookRitual(
                key="ayudha_puja",
                text=LocalizedText(
                    en="Worship of vehicles, books, and work tools",
                    hi="वाहन, बहीखाता और औजार पूजन",
                    mr="शस्त्र आणि वाहन पूजा",
                    hinglish="Vehicle and tool puja",
                ),
            ),
            PlaybookRitual(
                key="gold_sharing",
                text=LocalizedText(
                    en="Exchanging Apta tree leaves representing gold",
                    hi="आपटा के पत्ते (सोना) बांटना",
                    mr="सोनं वाटणे (आपट्याची पाने)",
                    hinglish="Apta leaf gold exchange",
                ),
            ),
        ],
        tone_profile=ToneProfile.FESTIVE,
        lead_days=6,
        post_days=2,
        categories=[
            PlaybookCategory(
                category_key="puja_items",
                role=RitualRole.PUJA_ITEM,
                uplift_prior_pct=85.0,
                start_offset_days=-3,
                end_offset_days=1,
            ),
            PlaybookCategory(
                category_key="sweet_ingredients",
                role=RitualRole.SWEET_INGREDIENT,
                uplift_prior_pct=60.0,
                start_offset_days=-2,
                end_offset_days=1,
            ),
        ],
        excluded_categories=["non_veg", "egg", "alcohol"],
        culture_notes=CultureNotes(
            do=["Celebrate Vijayadashami victory and auspicious beginnings"],
            dont=["No negative tone"],
        ),
        review=PlaybookReview(
            status=PlaybookReviewStatus.REVIEWED,
            reviewer="Pune Panchang Board",
            reviewed_at=datetime.datetime(2026, 1, 15, tzinfo=datetime.UTC),
        ),
    ),
    FestivalPlaybook(
        key="diwali_cluster",
        names=LocalizedText(
            en="Diwali Festival Cluster",
            hi="दीपावली महापर्व",
            mr="दिवाळी (दीपावली)",
            hinglish="Diwali",
        ),
        summary=LocalizedText(
            en="Festival of Lights spanning Vasu Baras, Dhanteras, Naraka Chaturdashi, Lakshmi Pujan, and Bhai Dooj.",
            hi="दीपों का महापर्व: धनतेरस, लक्ष्मी पूजन, गोवर्धन पूजा और भाई दूज।",
            mr="मराठी फराळ, अभ्यंगस्नान, लक्ष्मीपूजन, पाडवा आणि भाऊबीज असा भव्य दीपोत्सव।",
            hinglish="Grand Diwali celebration: homemade Faral, Abhyanga Snan, diyas and gifting.",
        ),
        rituals=[
            PlaybookRitual(
                key="abhyanga_snan",
                text=LocalizedText(
                    en="Dawn holy bath with fragrant Ubtan and oils",
                    hi="उबटन और सुगन्धित तेल से अभ्यंग स्नान",
                    mr="पहाटेचे अभ्यंगस्नान (उटणे आणि सुगंधी तेल)",
                    hinglish="Early morning Abhyanga Snan with ubtan",
                ),
            ),
            PlaybookRitual(
                key="lakshmi_pujan",
                text=LocalizedText(
                    en="Evening worship of wealth goddess with batasha, lahya, and diyas",
                    hi="दीपावली शाम को महालक्ष्मी पूजन",
                    mr="लक्ष्मीपूजन (लाह्या-बत्ताशे, केरसुणी पूजा)",
                    hinglish="Lakshmi Pujan with lahya, batasha and diyas",
                ),
            ),
        ],
        tone_profile=ToneProfile.FESTIVE,
        lead_days=21,
        post_days=7,
        categories=[
            PlaybookCategory(
                category_key="sweet_ingredients",
                role=RitualRole.SWEET_INGREDIENT,
                uplift_prior_pct=180.0,
                start_offset_days=-15,
                end_offset_days=5,
            ),
            PlaybookCategory(
                category_key="oil_ghee",
                role=RitualRole.STAPLE,
                uplift_prior_pct=110.0,
                start_offset_days=-14,
                end_offset_days=5,
            ),
            PlaybookCategory(
                category_key="dry_fruits",
                role=RitualRole.GIFTING,
                uplift_prior_pct=140.0,
                start_offset_days=-10,
                end_offset_days=5,
            ),
            PlaybookCategory(
                category_key="decor",
                role=RitualRole.DECOR,
                uplift_prior_pct=160.0,
                start_offset_days=-12,
                end_offset_days=5,
            ),
        ],
        excluded_categories=["non_veg", "egg", "alcohol"],
        culture_notes=CultureNotes(
            do=[
                "Stock Faral ingredients 2-3 weeks in advance (besan, rava, maida, poha, oil)",
                "Encourage pre-packed dry fruit gift boxes",
            ],
            dont=["Expect immediate post-festival demand; prepare for sharp post-Diwali drop"],
        ),
        review=PlaybookReview(
            status=PlaybookReviewStatus.REVIEWED,
            reviewer="Vedic Cultural Council",
            reviewed_at=datetime.datetime(2026, 1, 15, tzinfo=datetime.UTC),
        ),
    ),
]

# ── 2. FESTIVAL CALENDAR DATES 2026 (PUNE REGION) ─────────────────────────────

CALENDAR_ENTRIES: list[FestivalCalendar] = [
    FestivalCalendar(
        key="ganesh_chaturthi",
        year=2026,
        names=LocalizedText(
            en="Ganesh Chaturthi",
            hi="गणेश चतुर्थी",
            mr="गणेशोत्सव",
            hinglish="Ganesh Chaturthi",
        ),
        start_date=datetime.date(2026, 9, 16),
        end_date=datetime.date(2026, 9, 25),
        peak_start=datetime.date(2026, 9, 16),
        peak_end=datetime.date(2026, 9, 25),
        region_scope=[FestivalRegionScope.MAHARASHTRA, FestivalRegionScope.PAN_INDIA],
        date_confidence=DateConfidence.HIGH,
        date_note="Bhadrapada Shukla Chaturthi to Anant Chaturdashi (Pune tithi verified)",
        playbook_key="ganesh_chaturthi",
    ),
    FestivalCalendar(
        key="pitru_paksha",
        year=2026,
        names=LocalizedText(
            en="Pitru Paksha",
            hi="पितृ पक्ष",
            mr="पितृ पक्ष (श्राद्ध)",
            hinglish="Pitru Paksha",
        ),
        start_date=datetime.date(2026, 9, 27),
        end_date=datetime.date(2026, 10, 10),
        peak_start=datetime.date(2026, 10, 10),  # Sarva Pitru Amavasya
        peak_end=datetime.date(2026, 10, 10),
        region_scope=[FestivalRegionScope.PAN_INDIA],
        date_confidence=DateConfidence.HIGH,
        date_note="Bhadrapada Purnima to Ashwin Amavasya",
        playbook_key="pitru_paksha",
    ),
    FestivalCalendar(
        key="navratri",
        year=2026,
        names=LocalizedText(
            en="Shardiya Navratri",
            hi="शारदीय नवरात्रि",
            mr="नवरात्रौत्सव",
            hinglish="Navratri",
        ),
        start_date=datetime.date(2026, 10, 11),
        end_date=datetime.date(2026, 10, 19),
        peak_start=datetime.date(2026, 10, 18),  # Ashtami / Navami
        peak_end=datetime.date(2026, 10, 19),
        region_scope=[FestivalRegionScope.PAN_INDIA],
        date_confidence=DateConfidence.HIGH,
        date_note="Ashwin Shukla Pratipada to Navami",
        playbook_key="navratri",
    ),
    FestivalCalendar(
        key="dussehra",
        year=2026,
        names=LocalizedText(
            en="Vijayadashami / Dussehra",
            hi="दशहरा",
            mr="दसरा",
            hinglish="Dussehra",
        ),
        start_date=datetime.date(2026, 10, 20),
        end_date=datetime.date(2026, 10, 20),
        region_scope=[FestivalRegionScope.PAN_INDIA],
        date_confidence=DateConfidence.HIGH,
        date_note="Ashwin Shukla Dashami",
        playbook_key="dussehra",
    ),
    FestivalCalendar(
        key="diwali_cluster",
        year=2026,
        names=LocalizedText(
            en="Diwali Festival Cluster",
            hi="दीपावली",
            mr="दिवाळी",
            hinglish="Diwali",
        ),
        start_date=datetime.date(2026, 11, 5),
        end_date=datetime.date(2026, 11, 10),
        peak_start=datetime.date(2026, 11, 8),  # Lakshmi Pujan
        peak_end=datetime.date(2026, 11, 9),
        region_scope=[FestivalRegionScope.PAN_INDIA],
        date_confidence=DateConfidence.HIGH,
        date_note="Dhanteras to Bhai Dooj (Lakshmi Pujan on Nov 8)",
        playbook_key="diwali_cluster",
    ),
]


async def seed_festivals(db: Any | None = None) -> None:
    """Insert or update festival playbooks and calendar records idempotently."""
    should_close = False
    if db is None:
        settings = get_settings()
        db = await init_mongo(settings)
        should_close = True

    # 1. Seed playbooks
    for pb in PLAYBOOKS:
        await db.festival_playbooks.update_one(
            {"key": pb.key},
            {"$set": pb.to_mongo()},
            upsert=True,
        )
    logger.info("seeded_festival_playbooks", count=len(PLAYBOOKS))

    # 2. Seed calendar entries
    for cal in CALENDAR_ENTRIES:
        await db.festival_calendar.update_one(
            {"key": cal.key, "year": cal.year},
            {"$set": cal.to_mongo()},
            upsert=True,
        )
    logger.info("seeded_festival_calendar", count=len(CALENDAR_ENTRIES))

    if should_close:
        await close_mongo()


if __name__ == "__main__":
    asyncio.run(seed_festivals())
