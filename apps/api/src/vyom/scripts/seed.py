"""Master seed script for VYOM. Seeds store, catalog, customers, transactions, khata, and opportunities."""

from __future__ import annotations

import asyncio
import datetime
import random
from typing import Any

import structlog

from vyom.config import get_settings
from vyom.db import close_mongo, init_mongo
from vyom.models.base import LocalizedText
from vyom.models.catalog import ItemVelocity, MerchantCatalogItem, ProductCategory
from vyom.models.customer import (
    ConsentItem,
    Customer,
    CustomerConsent,
    CustomerPreferences,
    CustomerRFM,
    TelegramProfile,
)
from vyom.models.enums import (
    CatalogItemSource,
    KhataEntrySource,
    KhataStatus,
    Language,
    OnboardingState,
    PaymentMode,
    TransactionSource,
)
from vyom.models.festival import (
    FestivalCalendar,
    FestivalPlaybook,
)
from vyom.models.guardrails import Guardrails, QuietHours
from vyom.models.khata import KhataEntry, KhataReminder
from vyom.models.merchant import (
    FestivalPrefs,
    GeoPoint,
    Merchant,
    MerchantSettings,
    RegionProfile,
)
from vyom.models.opportunity import Opportunity
from vyom.models.transaction import (
    Transaction,
    TransactionItem,
)
from vyom.scripts.festival_seed import seed_festivals

logger = structlog.get_logger()

MERCHANT_ID = "merchant_sharma_01"
REF_DATE = datetime.date(2026, 9, 30)  # Standard demo date

# ── 1. GLOBAL PRODUCT CATEGORIES ──────────────────────────────────────────────

CATEGORIES = [
    ProductCategory(
        key="staples",
        names=LocalizedText(
            en="Grains & Staples", hi="अनाज और दालें", mr="धान्य आणि डाळी", hinglish="Grains & Staples"
        ),
        tags=["staple"],
    ),
    ProductCategory(
        key="vrat_foods",
        names=LocalizedText(
            en="Fasting (Vrat) Foods",
            hi="उपवास सामग्री",
            mr="उपवासाचे पदार्थ (फराळ)",
            hinglish="Vrat & Faral",
        ),
        tags=["vrat_friendly", "sattvic"],
    ),
    ProductCategory(
        key="puja_items",
        names=LocalizedText(
            en="Pooja Essentials", hi="पूजा सामग्री", mr="पूजा साहित्य", hinglish="Puja Samagri"
        ),
        tags=["puja"],
    ),
    ProductCategory(
        key="sweet_ingredients",
        names=LocalizedText(
            en="Sweets & Mithai Ingredients",
            hi="मिठाई और प्रसाद सामग्री",
            mr="गोड व नैवेद्य साहित्य",
            hinglish="Mithai Ingredients",
        ),
        tags=["sweet_ingredient"],
    ),
    ProductCategory(
        key="oil_ghee",
        names=LocalizedText(
            en="Oils & Pure Ghee", hi="तेल और शुद्ध घी", mr="तेल आणि साजूक तूप", hinglish="Oil & Ghee"
        ),
        tags=["staple", "sattvic"],
    ),
    ProductCategory(
        key="dairy",
        names=LocalizedText(
            en="Dairy & Milk Products", hi="दूध और डेयरी", mr="दूध व दुग्धजन्य पदार्थ", hinglish="Dairy"
        ),
        tags=["staple", "sattvic"],
    ),
    ProductCategory(
        key="dry_fruits",
        names=LocalizedText(
            en="Dry Fruits & Nuts", hi="सूखे मेवे", mr="सुका मेवा", hinglish="Dry Fruits"
        ),
        tags=["dry_fruit", "gifting", "vrat_friendly"],
    ),
    ProductCategory(
        key="decor",
        names=LocalizedText(
            en="Festive Decor & Diyas",
            hi="सजावट और दीये",
            mr="सजावट आणि दिवे",
            hinglish="Decor & Diyas",
        ),
        tags=["decor"],
    ),
    ProductCategory(
        key="snacks",
        names=LocalizedText(
            en="Snacks & Biscuits",
            hi="नाश्ता और नमकीन",
            mr="फरसाण व स्नॅक्स",
            hinglish="Snacks & Namkeen",
        ),
        tags=["snack"],
    ),
    ProductCategory(
        key="beverages",
        names=LocalizedText(
            en="Tea, Coffee & Beverages",
            hi="चाय, कॉफी और पेय",
            mr="चहा, कॉफी व पेये",
            hinglish="Tea & Coffee",
        ),
        tags=["beverage"],
    ),
    ProductCategory(
        key="cleaning",
        names=LocalizedText(
            en="Cleaning & Household", hi="सफाई सामग्री", mr="स्वच्छता साहित्य", hinglish="Cleaning"
        ),
        tags=["household"],
    ),
]

# ── 2. CATALOG ITEMS (60 ITEMS) ───────────────────────────────────────────────

CATALOG_ITEMS_SPEC = [
    # Vrat & Fasting
    ("Sabudana (Tapioca)", "vrat_foods", "kg", "1 kg", 9000, 7500, 45.0, 6.5, ["sabudana", "sago"]),
    (
        "Sendha Namak (Rock Salt)",
        "vrat_foods",
        "kg",
        "1 kg",
        4500,
        3200,
        60.0,
        4.2,
        ["sendha namak", "rock salt"],
    ),
    (
        "Singhara Atta (Water Chestnut)",
        "vrat_foods",
        "packet",
        "500 g",
        8500,
        6800,
        25.0,
        3.1,
        ["singhara atta"],
    ),
    (
        "Kuttu Atta (Buckwheat)",
        "vrat_foods",
        "packet",
        "500 g",
        9000,
        7200,
        20.0,
        2.8,
        ["kuttu atta"],
    ),
    (
        "Rajgira Atta (Amaranth)",
        "vrat_foods",
        "packet",
        "500 g",
        7500,
        6000,
        30.0,
        3.5,
        ["rajgira atta"],
    ),
    (
        "Makhana (Foxnuts)",
        "vrat_foods",
        "packet",
        "250 g",
        18000,
        14500,
        35.0,
        4.0,
        ["makhana", "phool makhana"],
    ),
    (
        "Raw Peanuts (Shengdana)",
        "vrat_foods",
        "kg",
        "1 kg",
        14000,
        11500,
        80.0,
        8.5,
        ["peanuts", "shengdana", "moongphali"],
    ),
    (
        "Vari / Samak Rice (Bhagar)",
        "vrat_foods",
        "kg",
        "1 kg",
        11000,
        8800,
        40.0,
        5.0,
        ["bhagar", "samak chawal", "varai"],
    ),
    # Puja Items
    (
        "Camphor Tablets (Kapur)",
        "puja_items",
        "packet",
        "1 pkt",
        3500,
        2200,
        50.0,
        5.0,
        ["kapur", "camphor"],
    ),
    (
        "Agarbatti (Incense)",
        "puja_items",
        "packet",
        "1 pkt",
        4000,
        2500,
        65.0,
        7.0,
        ["agarbatti", "incense"],
    ),
    ("Dhoop Cones", "puja_items", "packet", "1 pkt", 5000, 3200, 40.0, 3.8, ["dhoop"]),
    (
        "Cotton Wicks (Gol Vat)",
        "puja_items",
        "packet",
        "1 pkt",
        2500,
        1400,
        85.0,
        6.2,
        ["cotton wicks", "diya vat"],
    ),
    (
        "Puja Supari (Betel Nuts)",
        "puja_items",
        "packet",
        "100 g",
        6000,
        4200,
        30.0,
        2.5,
        ["supari", "puja supari"],
    ),
    ("Roli Kumkum", "puja_items", "packet", "50 g", 2000, 1000, 60.0, 4.0, ["kumkum", "roli"]),
    ("Haldi Powder (Turmeric)", "puja_items", "packet", "250 g", 5000, 3600, 45.0, 4.5, ["haldi"]),
    (
        "Akshat Puja Rice",
        "puja_items",
        "packet",
        "200 g",
        3000,
        1800,
        40.0,
        3.0,
        ["akshat", "puja rice"],
    ),
    (
        "Red Chunri (Pooja Cloth)",
        "puja_items",
        "piece",
        "1 pc",
        4000,
        2200,
        50.0,
        3.2,
        ["chunri", "mata chunri"],
    ),
    (
        "Black Sesame (Kala Til)",
        "puja_items",
        "packet",
        "200 g",
        6000,
        4200,
        30.0,
        3.0,
        ["kala til", "black sesame"],
    ),
    (
        "Barley Grains (Jau)",
        "puja_items",
        "packet",
        "500 g",
        4000,
        2600,
        35.0,
        3.2,
        ["jau", "barley"],
    ),
    (
        "Honey (Shuddh Madh)",
        "puja_items",
        "bottle",
        "250 g",
        12500,
        9500,
        25.0,
        2.2,
        ["honey", "madh"],
    ),
    # Ghee & Oils
    (
        "Pure Cow Ghee (Amul/Gowardhan)",
        "oil_ghee",
        "jar",
        "1 L",
        65000,
        56000,
        40.0,
        4.5,
        ["cow ghee", "tup"],
    ),
    ("Buffalo Ghee", "oil_ghee", "jar", "1 L", 58000, 50000, 30.0, 3.0, ["ghee", "tup"]),
    (
        "Sunflower Refined Oil (Gemini)",
        "oil_ghee",
        "pouch",
        "1 L",
        14500,
        12800,
        110.0,
        12.0,
        ["sunflower oil", "gemini oil"],
    ),
    (
        "Groundnut Oil (Singtel)",
        "oil_ghee",
        "pouch",
        "1 L",
        19000,
        16800,
        60.0,
        6.5,
        ["groundnut oil", "singtel"],
    ),
    (
        "Mustard Oil (Kachi Ghani)",
        "oil_ghee",
        "bottle",
        "1 L",
        16000,
        13800,
        40.0,
        3.8,
        ["mustard oil", "sarson tel"],
    ),
    # Sweet & Mithai Ingredients
    (
        "Besan (Chana Atta)",
        "sweet_ingredients",
        "packet",
        "1 kg",
        11000,
        9200,
        70.0,
        7.5,
        ["besan", "gram flour"],
    ),
    (
        "Rava / Sooji (Semolina)",
        "sweet_ingredients",
        "packet",
        "1 kg",
        6000,
        4800,
        65.0,
        7.0,
        ["rava", "sooji"],
    ),
    (
        "Poha (Thick Beaten Rice)",
        "sweet_ingredients",
        "packet",
        "1 kg",
        5500,
        4200,
        90.0,
        9.5,
        ["poha", "beaten rice"],
    ),
    (
        "Organic Jaggery (Gul)",
        "sweet_ingredients",
        "box",
        "1 kg",
        7000,
        5400,
        80.0,
        8.0,
        ["jaggery", "gul", "gud"],
    ),
    (
        "Refined Sugar",
        "sweet_ingredients",
        "kg",
        "1 kg",
        4500,
        3800,
        150.0,
        15.0,
        ["sugar", "shakar"],
    ),
    (
        "Maida (All Purpose Flour)",
        "sweet_ingredients",
        "packet",
        "1 kg",
        5000,
        3900,
        50.0,
        5.0,
        ["maida"],
    ),
    (
        "Dry Coconut (Khopra Vati)",
        "sweet_ingredients",
        "packet",
        "500 g",
        15000,
        12000,
        40.0,
        4.0,
        ["dry coconut", "khopra"],
    ),
    (
        "Desiccated Coconut Powder",
        "sweet_ingredients",
        "packet",
        "200 g",
        6500,
        4800,
        30.0,
        2.5,
        ["coconut powder"],
    ),
    (
        "Elaichi (Green Cardamom)",
        "sweet_ingredients",
        "packet",
        "50 g",
        16000,
        12500,
        25.0,
        2.0,
        ["elaichi", "cardamom"],
    ),
    (
        "Kesar (Pure Saffron)",
        "sweet_ingredients",
        "box",
        "1 g",
        25000,
        19500,
        15.0,
        1.0,
        ["kesar", "saffron"],
    ),
    ("Batasha Sweets", "sweet_ingredients", "packet", "250 g", 4000, 2600, 35.0, 2.2, ["batasha"]),
    (
        "Poppy Seeds (Khaskhas)",
        "sweet_ingredients",
        "packet",
        "100 g",
        18000,
        14000,
        20.0,
        1.8,
        ["khaskhas", "poppy seeds"],
    ),
    # Dry Fruits
    (
        "Almonds (Badam)",
        "dry_fruits",
        "packet",
        "250 g",
        22000,
        17500,
        35.0,
        3.2,
        ["almonds", "badam"],
    ),
    (
        "Cashews (Kaju)",
        "dry_fruits",
        "packet",
        "250 g",
        24000,
        19000,
        35.0,
        3.5,
        ["cashews", "kaju"],
    ),
    (
        "Raisins (Kishmish)",
        "dry_fruits",
        "packet",
        "250 g",
        11000,
        8200,
        40.0,
        3.8,
        ["raisins", "kishmish"],
    ),
    (
        "Pistachios (Pista)",
        "dry_fruits",
        "packet",
        "100 g",
        14000,
        11000,
        20.0,
        1.8,
        ["pista", "pistachio"],
    ),
    # Dairy
    (
        "Amul Taaza Toned Milk",
        "dairy",
        "pouch",
        "1 L",
        5600,
        5200,
        50.0,
        18.0,
        ["milk", "amul milk"],
    ),
    ("Fresh Paneer", "dairy", "packet", "200 g", 9000, 7800, 20.0, 4.5, ["paneer"]),
    ("Fresh Curd (Dahi)", "dairy", "tub", "400 g", 4000, 3300, 30.0, 6.0, ["curd", "dahi"]),
    # Staples (Rice, Atta, Dals)
    (
        "Kolam Rice (Surti)",
        "staples",
        "bag",
        "5 kg",
        32000,
        27500,
        40.0,
        4.0,
        ["kolam rice", "rice"],
    ),
    ("Basmati Rice (Rozana)", "staples", "bag", "1 kg", 12000, 9800, 35.0, 3.2, ["basmati rice"]),
    (
        "Chakki Fresh Wheat Atta",
        "staples",
        "bag",
        "5 kg",
        24000,
        20500,
        60.0,
        8.0,
        ["atta", "wheat flour", "aashirvaad"],
    ),
    (
        "Toor Dal (Pigeon Pea)",
        "staples",
        "kg",
        "1 kg",
        16500,
        14200,
        75.0,
        7.0,
        ["toor dal", "arhar dal"],
    ),
    ("Moong Dal (Yellow)", "staples", "kg", "1 kg", 13500, 11500, 50.0, 5.0, ["moong dal"]),
    ("Chana Dal", "staples", "kg", "1 kg", 9500, 8000, 60.0, 5.5, ["chana dal"]),
    ("Urad Dal (Split)", "staples", "kg", "1 kg", 14000, 12000, 40.0, 3.8, ["urad dal"]),
    (
        "Tata Salt Iodized",
        "staples",
        "packet",
        "1 kg",
        2800,
        2200,
        100.0,
        12.0,
        ["salt", "tata salt"],
    ),
    # Decor & Diyas
    (
        "Terracotta Diyas (12 Pack)",
        "decor",
        "pack",
        "1 pkt",
        6000,
        3000,
        45.0,
        2.5,
        ["diyas", "clay lamps"],
    ),
    ("Marigold Door Toran", "decor", "piece", "1 pc", 12000, 6500, 25.0, 1.5, ["toran"]),
    ("Rangoli Colours Set", "decor", "box", "1 box", 7000, 4000, 35.0, 2.0, ["rangoli"]),
    (
        "Abhyanga Snan Fragrant Ubtan",
        "decor",
        "packet",
        "100 g",
        5500,
        3200,
        30.0,
        2.0,
        ["ubtan", "snan ubtan"],
    ),
    # Beverages & Snacks
    (
        "Wagh Bakri Premium Tea",
        "beverages",
        "packet",
        "500 g",
        26000,
        22500,
        50.0,
        5.0,
        ["tea", "chai"],
    ),
    (
        "Nescafe Classic Coffee",
        "beverages",
        "jar",
        "50 g",
        13000,
        11000,
        30.0,
        2.5,
        ["coffee", "nescafe"],
    ),
    (
        "Parle-G Gold Biscuits",
        "snacks",
        "packet",
        "1 kg",
        12000,
        10200,
        60.0,
        7.0,
        ["parle g", "biscuits"],
    ),
    ("Haldiram Bhujia Sev", "snacks", "packet", "400 g", 11500, 9500, 45.0, 4.5, ["bhujia", "sev"]),
]

# ── 3. CUSTOMER NAMES (120 MARATHI / HINDI NAMES) ─────────────────────────────

CUSTOMER_NAMES = [
    "Anand Kulkarni",
    "Sunita Deshmukh",
    "Prakash Joshi",
    "Rekha Shinde",
    "Suresh Patil",
    "Pooja Pawar",
    "Nitin More",
    "Asha Gaikwad",
    "Sachin Jadhav",
    "Vandana Chavan",
    "Ganesh Bhosale",
    "Meena Kadam",
    "Rahul Sawant",
    "Swati Gokhale",
    "Pradeep Tambe",
    "Madhuri Date",
    "Ajay Jagtap",
    "Chhaya Salunkhe",
    "Milind Thorat",
    "Shilpa Sane",
    "Ramesh Gupta",
    "Sita Sharma",
    "Manoj Verma",
    "Kavita Yadav",
    "Dinesh Agarwal",
    "Anita Mishra",
    "Deepak Tiwari",
    "Geeta Pandey",
    "Rajesh Jha",
    "Shobha Tripathi",
    "Vijay Shukla",
    "Preeti Dubey",
    "Sunil Maurya",
    "Radha Chauhan",
    "Amit Saxena",
    "Poonam Bhatnagar",
    "Sanjay Srivastava",
    "Usha Rastogi",
    "Alok Bajpai",
    "Kiran Sinha",
    "Mahesh Chitnis",
    "Smita Apte",
    "Dilip Kelkar",
    "Anjali Bapat",
    "Shekhar Ranade",
    "Vidya Godbole",
    "Chetan Pendse",
    "Bhakti Phadke",
    "Kishore Patwardhan",
    "Neeta Karve",
    "Hemant Dixit",
    "Jayashree Oak",
    "Avinash Limaye",
    "Pallavi Paranjpe",
    "Tushar Agashe",
    "Manjusha Khare",
    "Sudhir Damle",
    "Archana Natu",
    "Ravindra Gadgil",
    "Sanyukta Barve",
    "Arun Kale",
    "Varsha Raut",
    "Bhagwan Wagh",
    "Rohini Shirole",
    "Shrikant Kokate",
    "Sulabha Divekar",
    "Ashok Landge",
    "Lata Tapkir",
    "Dnyaneshwar Daundkar",
    "Suman Marne",
    "Baban Walunj",
    "Shashikala Tilekar",
    "Kondiba Zende",
    "Hirabai Jagdale",
    "Popat Phadtare",
    "Rohit Malhotra",
    "Simran Kaur",
    "Harpreet Singh",
    "Jaswinder Sandhu",
    "Gurpreet Gill",
    "Manpreet Bajwa",
    "Davinder Chawla",
    "Paramjit Sodhi",
    "Balvinder Bindra",
    "Amrit Khurana",
    "Haresh Shah",
    "Bhavna Mehta",
    "Jignesh Patel",
    "Parul Doshi",
    "Nilesh Parekh",
    "Hetel Vora",
    "Pankaj Desai",
    "Kokila Sanghavi",
    "Chirag Shah",
    "Daksha Zaveri",
    "Bhavesh Gandhi",
    "Varsha Shah",
    "Ketan Trivedi",
    "Ila Kothari",
    "Hiren Parikh",
    "Vinayak Shirke",
    "Namrata Surve",
    "Santosh Khedekar",
    "Suvarna Gharge",
    "Pravin Mohite",
    "Pratibha Nalawade",
    "Dattatray Gholap",
    "Vimal Sonawane",
    "Eknath Kamble",
    "Parvati Lokhande",
    "Bapu Salve",
    "Ranjana Gaikwad",
    "Pandurang Ingle",
    "Shakuntala Shinde",
    "Uttam Kasbe",
    "Mukund Dev",
    "Charulata Somani",
    "Shridhar Rathi",
    "Alka Mundada",
    "Chandrakant Kabra",
]


async def seed_master_data(db: Any | None = None) -> None:
    should_close = False
    if db is None:
        settings = get_settings()
        db = await init_mongo(settings)
        should_close = True
    logger.info("seed_started", merchant_id=MERCHANT_ID)

    # 1. Seed Festivals first
    await seed_festivals(db)

    # 2. Seed Product Categories
    for cat in CATEGORIES:
        await db.product_categories.update_one(
            {"key": cat.key},
            {"$set": cat.to_mongo()},
            upsert=True,
        )
    logger.info("seeded_product_categories", count=len(CATEGORIES))

    # 3. Seed Merchant "Sharma Kirana Store"
    merchant = Merchant(
        id=MERCHANT_ID,
        name="Sharma Kirana Store",
        owner_name="Ramesh Sharma",
        phone_e164="+919876543210",
        city="Pune",
        state="Maharashtra",
        region_profile=RegionProfile(
            state="Maharashtra",
            city="Pune",
            regional_tags=["maharashtra", "pune", "marathi_households"],
        ),
        language=Language.HINGLISH,
        shop_code="SHARMA01",
        bot_username=settings.bot_username or "VyomDemoShopBot",
        address="Shop No 4, Somwar Peth, Pune 411011",
        geo=GeoPoint(lat=18.5204, lng=73.8567),
        timings=["08:00 - 22:00"],
        todays_special="Fresh Vrat Sabudana & Pure Gir Cow Ghee available",
        contact_phone="+919876543210",
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
        settings=MerchantSettings(voice_replies_default=True),
        onboarding_state=OnboardingState.COMPLETED,
    )
    await db.merchants.update_one(
        {"_id": merchant.id},
        {"$set": merchant.to_mongo()},
        upsert=True,
    )
    logger.info("seeded_merchant", name=merchant.name)

    # 4. Seed Guardrails
    guardrails = Guardrails(
        merchant_id=MERCHANT_ID,
        weekly_budget_paise=100000,  # ₹1,000 / week
        max_discount_pct=10.0,  # Max 10%
        max_msgs_per_customer_week=1,  # 1 msg/customer/week
        quiet_hours=QuietHours(start="21:00", end="08:00"),
        udhaar_autonomy=False,
        udhaar_max_reminders=3,
        udhaar_min_gap_days=4,
        kill_switch=False,
    )
    await db.guardrails.update_one(
        {"merchant_id": MERCHANT_ID},
        {"$set": guardrails.to_mongo()},
        upsert=True,
    )
    logger.info("seeded_guardrails")

    # 5. Seed Catalog Items (~60 items)
    catalog_items: list[MerchantCatalogItem] = []
    for idx, (name, cat_key, unit, pack, price, cost, stock, vel, aliases) in enumerate(
        CATALOG_ITEMS_SPEC
    ):
        item_id = f"item_sharma_{idx + 1:03d}"
        cat_item = MerchantCatalogItem(
            id=item_id,
            merchant_id=MERCHANT_ID,
            name=LocalizedText(en=name, hi=name, mr=name, hinglish=name),
            aliases=aliases,
            category_keys=[cat_key],
            unit=unit,
            pack_size=pack,
            price_paise=price,
            cost_paise=cost,
            stock_qty=stock,
            stock_updated_at=datetime.datetime(2026, 9, 29, 10, 0, tzinfo=datetime.UTC),
            in_stock=True,
            is_seasonal="vrat" in cat_key or "decor" in cat_key or "puja" in cat_key,
            source=CatalogItemSource.SEED,
            velocity=ItemVelocity(daily_units_28d=vel),
        )
        catalog_items.append(cat_item)
        await db.merchant_catalog_items.update_one(
            {"_id": cat_item.id},
            {"$set": cat_item.to_mongo()},
            upsert=True,
        )
    logger.info("seeded_catalog_items", count=len(catalog_items))

    # 6. Seed Customers (~120 customers)
    customers: list[Customer] = []
    random.seed(42)  # Deterministic seed

    for idx, name in enumerate(CUSTOMER_NAMES):
        cust_id = f"cust_sharma_{idx + 1:03d}"
        phone = f"+91982{idx + 100:07d}"

        # 60% of customers have linked Telegram accounts
        has_telegram = idx % 5 != 0
        chat_id = (987600000 + idx) if has_telegram else None
        user_id = chat_id

        # Consent: 80% have given marketing and udhaar consent
        has_consent = idx % 4 != 0

        # Self-declared preferences
        observes = []
        if idx % 2 == 0:
            observes.append("navratri")
        if idx % 3 == 0:
            observes.append("ganesh_chaturthi")
        if idx % 4 == 0:
            observes.append("diwali_cluster")

        dietary = ["vrat"] if (idx % 3 == 0) else []

        # Synthetic RFM
        frequency = random.randint(2, 28)
        avg_gap = round(random.uniform(4.0, 18.0), 1)
        recency = random.randint(1, int(avg_gap * 2.5))
        monetary = frequency * random.randint(15000, 65000)

        cust = Customer(
            id=cust_id,
            merchant_id=MERCHANT_ID,
            name=name,
            phone_e164=phone,
            telegram=TelegramProfile(
                chat_id=chat_id,
                user_id=user_id,
                username=f"user_{name.split()[0].lower()}_{idx}" if has_telegram else None,
                language_code="mr" if idx % 2 == 0 else "hi",
                linked_at=datetime.datetime(2026, 1, 10, tzinfo=datetime.UTC)
                if has_telegram
                else None,
                blocked=False,
            ),
            language=Language.MR if idx % 2 == 0 else Language.HINGLISH,
            consent=CustomerConsent(
                marketing=ConsentItem(
                    granted=has_consent,
                    at=datetime.datetime(2026, 1, 10, tzinfo=datetime.UTC) if has_consent else None,
                ),
                udhaar_reminders=ConsentItem(
                    granted=has_consent,
                    at=datetime.datetime(2026, 1, 10, tzinfo=datetime.UTC) if has_consent else None,
                ),
            ),
            opted_out=False,
            preferences=CustomerPreferences(
                voice_replies=(idx % 3 == 0),
                festival_nudges=True,
                observes_festivals=observes,
                dietary_notes=dietary,
            ),
            tags=["regular"] if frequency > 10 else ["occasional"],
            rfm=CustomerRFM(
                recency_days=recency,
                frequency=frequency,
                monetary_paise=monetary,
                avg_gap_days=avg_gap,
            ),
            last_visit_at=datetime.datetime.combine(
                REF_DATE - datetime.timedelta(days=recency),
                datetime.time(18, 30),
                tzinfo=datetime.UTC,
            ),
            link_token=f"TOKEN_{cust_id}",
        )
        customers.append(cust)
        await db.customers.update_one(
            {"_id": cust.id},
            {"$set": cust.to_mongo()},
            upsert=True,
        )
    logger.info("seeded_customers", count=len(customers))

    # 7. Seed Transactions (14 Months: Aug 2025 - Sep 2026)
    # Generate realistic hourly and seasonal patterns
    txns: list[Transaction] = []
    start_date = datetime.date(2025, 8, 1)
    end_date = REF_DATE
    curr_date = start_date

    # Define key festival windows for uplifts in synthetic history
    # 2025 Ganpati: 27 Aug - 6 Sep 2025
    # 2025 Navratri: 22 Sep - 1 Oct 2025
    # 2025 Diwali: 19 Oct - 24 Oct 2025
    # 2026 Ganpati: 16 Sep - 25 Sep 2026

    while curr_date <= end_date:
        is_weekend = curr_date.weekday() in (5, 6)

        # Baseline transactions per day: 15-25 on weekdays, 25-35 on weekends
        base_txn_count = random.randint(22, 32) if is_weekend else random.randint(14, 22)

        # Check festival multiplier
        multiplier = 1.0
        if datetime.date(2025, 8, 27) <= curr_date <= datetime.date(2025, 9, 6):
            multiplier = 1.8  # 2025 Ganpati
        elif datetime.date(2025, 9, 22) <= curr_date <= datetime.date(2025, 10, 1):
            multiplier = 2.1  # 2025 Navratri
        elif datetime.date(2025, 10, 19) <= curr_date <= datetime.date(2025, 10, 24):
            multiplier = 2.4  # 2025 Diwali
        elif datetime.date(2026, 9, 16) <= curr_date <= datetime.date(2026, 9, 25):
            multiplier = 1.9  # 2026 Ganpati
        elif datetime.date(2026, 9, 26) <= curr_date <= datetime.date(2026, 9, 30):
            multiplier = 0.7  # Post-Ganpati dip!

        daily_count = int(base_txn_count * multiplier)

        for _ in range(daily_count):
            # Time of day distribution:
            # 8-12: 35%, 12-14: 15%, 14-17 (Dead hours): 5%, 17-21 (Peak): 40%, 21-22: 5%
            r = random.random()
            if r < 0.35:
                hour = random.randint(8, 11)
            elif r < 0.50:
                hour = random.randint(12, 13)
            elif r < 0.55:
                hour = random.randint(14, 16)  # 2 PM - 5 PM dead zone
            elif r < 0.95:
                hour = random.randint(17, 20)  # Evening peak
            else:
                hour = 21

            minute = random.randint(0, 59)
            paid_at = datetime.datetime.combine(
                curr_date,
                datetime.time(hour, minute),
                tzinfo=datetime.UTC,
            )

            # Pick 1 to 4 items
            chosen_items = random.sample(catalog_items, k=random.randint(1, 4))
            txn_items: list[TransactionItem] = []
            total_amt = 0

            for itm in chosen_items:
                qty = 1.0 if itm.unit != "kg" else float(random.choice([1, 2, 5]))
                item_total = int(itm.price_paise * qty)
                total_amt += item_total
                txn_items.append(
                    TransactionItem(
                        catalog_item_id=itm.id,
                        name=itm.name.en,
                        qty=qty,
                        unit_price_paise=itm.price_paise,
                        cost_paise=itm.cost_paise,
                    )
                )

            # Assign to random customer or anonymous
            customer = random.choice(customers) if random.random() < 0.75 else None
            mode = random.choices(
                [PaymentMode.UPI, PaymentMode.CASH, PaymentMode.KHATA], weights=[60, 30, 10]
            )[0]

            txn = Transaction(
                merchant_id=MERCHANT_ID,
                customer_id=customer.id if customer else None,
                amount_paise=total_amt,
                items=txn_items,
                payment_mode=mode,
                paid_at=paid_at,
                source=TransactionSource.PAYTM_SIM,
            )
            txns.append(txn)

        curr_date += datetime.timedelta(days=1)

    # Bulk insert transactions in batches
    batch_size = 500
    for i in range(0, len(txns), batch_size):
        batch = [t.to_mongo() for t in txns[i : i + batch_size]]
        await db.transactions.insert_many(batch)
    logger.info("seeded_transactions", count=len(txns))

    # 8. Seed Khata Ledger (~25 entries at varied overdue stages)
    khata_entries: list[KhataEntry] = []
    khata_customers = customers[:25]

    for idx, c in enumerate(khata_customers):
        # Stagger due dates across past 40 days and next 7 days
        days_offset = (idx * 2) - 30  # e.g. -30, -28, ..., +18
        due_date = REF_DATE + datetime.timedelta(days=days_offset)
        opened_date = due_date - datetime.timedelta(days=14)

        amt = random.randint(25000, 185000)  # Rs 250 to Rs 1,850

        # Status distribution
        if days_offset < -20:
            status = KhataStatus.OPEN
            reminders = [
                KhataReminder(
                    sent_at=datetime.datetime.combine(
                        due_date + datetime.timedelta(days=3),
                        datetime.time(11, 0),
                        tzinfo=datetime.UTC,
                    ),
                    tone="gentle",
                    delivery_status="delivered",
                ),
                KhataReminder(
                    sent_at=datetime.datetime.combine(
                        due_date + datetime.timedelta(days=10),
                        datetime.time(16, 0),
                        tzinfo=datetime.UTC,
                    ),
                    tone="firm",
                    delivery_status="delivered",
                ),
            ]
        elif days_offset < -7:
            status = KhataStatus.PROMISED if idx % 2 == 0 else KhataStatus.OPEN
            reminders = [
                KhataReminder(
                    sent_at=datetime.datetime.combine(
                        due_date + datetime.timedelta(days=2),
                        datetime.time(11, 30),
                        tzinfo=datetime.UTC,
                    ),
                    tone="gentle",
                    delivery_status="delivered",
                )
            ]
        elif days_offset < 0:
            status = KhataStatus.OPEN
            reminders = []
        else:
            status = KhataStatus.OPEN  # Future due date
            reminders = []

        entry = KhataEntry(
            merchant_id=MERCHANT_ID,
            customer_id=c.id,
            amount_total_paise=amt,
            amount_paid_paise=0 if status != KhataStatus.PROMISED else 50000,
            opened_at=datetime.datetime.combine(
                opened_date, datetime.time(18, 0), tzinfo=datetime.UTC
            ),
            due_date=due_date,
            status=status,
            promise_date=REF_DATE + datetime.timedelta(days=3)
            if status == KhataStatus.PROMISED
            else None,
            reminders=reminders,
            source=KhataEntrySource.MANUAL,
            last_reminder_at=reminders[-1].sent_at if reminders else None,
        )
        khata_entries.append(entry)
        await db.khata_entries.update_one(
            {"_id": entry.id},
            {"$set": entry.to_mongo()},
            upsert=True,
        )
    logger.info("seeded_khata_entries", count=len(khata_entries))

    # 9. Compute & Seed Initial Business Profile
    from vyom.services.profile import ProfileBuilder

    calendars_cursor = await db.festival_calendar.find({"year": 2026}).to_list(100)
    cals = [FestivalCalendar.model_validate(c) for c in calendars_cursor]

    profile = ProfileBuilder.compute_profile(
        merchant_id=MERCHANT_ID,
        transactions=txns,
        calendars=cals,
        as_of_date=REF_DATE,
    )
    await db.business_profiles.update_one(
        {"merchant_id": MERCHANT_ID},
        {"$set": profile.to_mongo()},
        upsert=True,
    )
    logger.info("computed_and_seeded_business_profile", dead_hours=len(profile.dead_hours))

    # 10. Generate & Seed Pre-detected Opportunities for 30 Sep 2026
    from vyom.services.detection.churn import ChurnDetector
    from vyom.services.detection.dead_hours import DeadHoursDetector
    from vyom.services.detection.falling_sales import FallingSalesDetector
    from vyom.services.detection.festival_opps import FestivalOpportunityGenerator
    from vyom.services.festival.context import FestivalContextEngine

    playbooks_cursor = await db.festival_playbooks.find({}).to_list(100)
    pbs = {pb["key"]: FestivalPlaybook.model_validate(pb) for pb in playbooks_cursor}

    fest_ctx = FestivalContextEngine.build_context(
        merchant=merchant,
        calendars=cals,
        playbooks=pbs,
        today=REF_DATE,
    )

    opps: list[Opportunity] = []

    # A) Festival opportunities (Navratri Kit, Pitru Paksha Advisory, Ganpati Clearance)
    fest_opps = FestivalOpportunityGenerator.generate_festival_opportunities(
        merchant=merchant,
        context=fest_ctx,
        customers=customers,
        playbooks=pbs,
        today=REF_DATE,
    )
    opps.extend(fest_opps)

    # B) Churn winback opportunity
    churn_opp = ChurnDetector.detect_churn_opportunities(
        merchant_id=MERCHANT_ID,
        customers=customers,
        today=REF_DATE,
    )
    if churn_opp:
        opps.append(churn_opp)

    # C) Dead hours opportunity
    dead_hour_opp = DeadHoursDetector.detect_dead_hour_opportunity(
        merchant_id=MERCHANT_ID,
        profile=profile,
        customers=customers,
        today=REF_DATE,
    )
    if dead_hour_opp:
        opps.append(dead_hour_opp)

    # D) Falling sales post-festival explanation
    falling_sales_opp = FallingSalesDetector.detect_falling_sales(
        merchant_id=MERCHANT_ID,
        profile=profile,
        today=REF_DATE,
    )
    if falling_sales_opp:
        opps.append(falling_sales_opp)

    for o in opps:
        await db.opportunities.update_one(
            {"merchant_id": MERCHANT_ID, "dedupe_key": o.dedupe_key},
            {"$set": o.to_mongo()},
            upsert=True,
        )
    logger.info("seeded_opportunities", count=len(opps))

    if should_close:
        await close_mongo()
    logger.info("seed_completed_successfully")


if __name__ == "__main__":
    asyncio.run(seed_master_data())
