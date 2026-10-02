"""
VYOM synthetic data generator
==============================
Generates data shaped like real Paytm merchant payment data (S2S webhook /
Transaction Status API field names), plus khata, customer, calendar and
peer-benchmark tables needed for the VYOM hackathon demo.

Paytm's real S2S webhook / status API returns key-value pairs like:
  ORDERID, MID, TXNID, TXNAMOUNT, PAYMENTMODE, CURRENCY, TXNDATE,
  STATUS, RESPCODE, RESPMSG, GATEWAYNAME, BANKTXNID, BANKNAME, CHECKSUMHASH
(source: Paytm Payments docs — payment-status / webhook-integration pages)

IMPORTANT: This is SYNTHETIC data. Field *names* mirror Paytm's real schema
so your pipeline can later point at real webhook data unchanged. Field
*values* (MID, TXNID, CHECKSUMHASH, etc.) are fake and must never be treated
as real Paytm credentials or used against real endpoints.

Usage:
    python3 generate_vyom_data.py

Outputs (in ./output/):
    transactions.json / transactions.csv   -- Paytm-shaped payment events
    customers.json                         -- derived customer profiles
    khata.json                             -- handwritten-ledger style dues
    calendar.json                          -- festivals & local events
    peer_benchmark.json                    -- nearby-store weekly trend
    merchant.json                          -- the merchant profile
    story.json                             -- planted-story summary (for QA/demo notes)
"""

import json
import csv
import random
import hashlib
import os
from datetime import datetime, timedelta, date, time as dtime

# ----------------------------------------------------------------------
# CONFIG — tune these for your demo story
# ----------------------------------------------------------------------

SEED = 42
random.seed(SEED)

OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "output")
os.makedirs(OUT_DIR, exist_ok=True)

# Anchor "today" for the demo. Set this to whatever day you'll actually be
# demoing on — all "N days ago / N days from now" story beats are relative
# to this date. Change freely; everything downstream recalculates.
REFERENCE_DATE = date(2026, 10, 6)

HISTORY_DAYS = 180  # ~6 months of transaction history before REFERENCE_DATE
START_DATE = REFERENCE_DATE - timedelta(days=HISTORY_DAYS)

MID = "VYOMDEMO0001234567"  # fake merchant ID, Paytm-style format
MERCHANT_ID_INTERNAL = "MID_RAMESH_PUNE01"
MERCHANT_NAME = "Ramesh Kirana Store"
MERCHANT_PINCODE = "411030"
MERCHANT_CITY = "Pune"
MERCHANT_LAT, MERCHANT_LNG = 18.5308, 73.8475  # Kothrud, Pune (approx, for demo only)

# Story knobs
N_CHURNED = 14           # planted lapsed regulars
N_REGULARS = 60
N_OCCASIONAL = 120
N_ONE_TIMERS = 140

DEAD_HOUR_WINDOW = (15, 17)       # 3pm-5pm
DEAD_HOUR_WEEKDAYS = [1, 2, 3]    # Tue=1, Wed=2, Thu=3 (Mon=0 ... Sun=6)
DEAD_HOUR_SUPPRESSION = 0.15      # multiply normal volume by this in the window

DIP_LAST_N_DAYS = 7
DIP_MAGNITUDE = 0.15              # ~15% down vs same-weekday baseline

FESTIVAL_NAME = "Navratri"
FESTIVAL_START = REFERENCE_DATE + timedelta(days=5)
FESTIVAL_END = FESTIVAL_START + timedelta(days=9)
FESTIVAL_LEAD_DAYS = 7
FESTIVAL_CATEGORY_LIFT = {"sweets": 1.4, "dry_fruits": 1.3, "puja_items": 1.8}
LAST_YEAR_FESTIVAL_LIFT = 1.35    # used to backdate "last year's festival spike" evidence

# NOTE: Real Paytm payment data (webhook / status API) has NO basket/item
# contents — only amount, mode, status, timestamps, and a hashed payer
# handle. Item-level data in this generator therefore appears ONLY on khata
# entries (khata.json -> itemsNoted), simulating what a photographed
# handwritten ledger might note next to a due amount. Transactions never
# carry item data, to avoid implying Paytm's payment API exposes it.

CUSTOMER_LANGUAGES = ["hi", "mr", "hi-en"]  # Hindi, Marathi, Hinglish/code-mixed
LANG_WEIGHTS = [0.45, 0.35, 0.20]

ITEM_CATALOG = [
    ("atta_5kg", "Aata 5kg", 220, "grocery"),
    ("rice_5kg", "Chawal 5kg", 260, "grocery"),
    ("oil_1l", "Tel 1L", 140, "grocery"),
    ("dal_1kg", "Dal 1kg", 110, "grocery"),
    ("sugar_1kg", "Chini 1kg", 45, "grocery"),
    ("milk_1l", "Doodh 1L", 32, "dairy"),
    ("biscuit_pack", "Biscuit Pack", 30, "snacks"),
    ("soap_bar", "Sabun", 35, "personal_care"),
    ("mithai_500g", "Mithai 500g", 250, "sweets"),
    ("dryfruit_250g", "Dry Fruits 250g", 300, "dry_fruits"),
    ("agarbatti", "Agarbatti/Puja Samagri", 60, "puja_items"),
    ("maida_1kg", "Maida 1kg", 48, "grocery"),
    ("tea_250g", "Chai Patti 250g", 90, "grocery"),
]

PAYMENT_MODES = ["UPI", "UPI", "UPI", "UPI", "PPI", "CC", "DC"]  # weighted toward UPI
GATEWAY_BY_MODE = {
    "UPI": "UPI", "PPI": "WALLET", "CC": "HDFC", "DC": "ICICI",
}

FIRST_NAMES = [
    "Sharma", "Jadhav", "Kulkarni", "Deshmukh", "Patil", "Shinde", "Pawar",
    "More", "Gaikwad", "Chavan", "Bhosale", "Mane", "Joshi", "Kale",
    "Rane", "Sawant", "Naik", "Pandit", "Kadam", "Ghadge", "Salunkhe",
    "Wagh", "Thakur", "Yadav", "Verma", "Gupta", "Mishra", "Rathi",
    "Agrawal", "Iyer",
]
HONORIFICS_HI = ["जी"]
HONORIFICS_MR = ["काका", "ताई", "दादा"]


# ----------------------------------------------------------------------
# HELPERS
# ----------------------------------------------------------------------

def fake_mid_suffix():
    return "".join(random.choices("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ", k=6))


def fake_txn_id(dt: datetime, idx: int) -> str:
    """Mimics Paytm's real TXNID shape: <17-digit timestamp-ish><random>"""
    stamp = dt.strftime("%Y%m%d%H%M%S")
    tail = hashlib.md5(f"{stamp}-{idx}-{SEED}".encode()).hexdigest()[:14].upper()
    return f"{stamp}{tail}"


def fake_bank_txn_id(idx: int) -> str:
    return str(abs(hash(("bank", idx, SEED))) % 10**15)


def fake_checksum(*parts) -> str:
    """NOT a real Paytm checksum algorithm — just a realistic-looking base64-ish
    placeholder so downstream code that expects a CHECKSUMHASH field doesn't break.
    Never use this for real verification."""
    import base64
    raw = "|".join(str(p) for p in parts).encode()
    return base64.b64encode(hashlib.sha256(raw).digest())[:44].decode()


def daterange_days(start: date, end: date):
    d = start
    while d <= end:
        yield d
        d += timedelta(days=1)


def weekday_hour_intensity(weekday: int, hour: int) -> float:
    """Base relative intensity curve for a kirana store, 0..1+, before noise."""
    if hour < 8 or hour >= 22:
        return 0.0
    # morning peak 8-10, midday lull, evening peak 18-21
    morning = max(0, 1 - abs(hour - 9) / 3.0)
    evening = max(0, 1 - abs(hour - 19.5) / 3.5)
    midday = 0.25
    base = max(morning, evening, midday)
    # slightly busier on weekends
    if weekday in (5, 6):
        base *= 1.15
    # planted dead-hour suppression
    if DEAD_HOUR_WINDOW[0] <= hour < DEAD_HOUR_WINDOW[1] and weekday in DEAD_HOUR_WEEKDAYS:
        base *= DEAD_HOUR_SUPPRESSION
    return base


def is_in_festival_window(d: date) -> bool:
    return FESTIVAL_START <= d <= FESTIVAL_END


def is_in_last_year_festival_window(d: date) -> bool:
    ly_start = FESTIVAL_START.replace(year=FESTIVAL_START.year - 1)
    ly_end = FESTIVAL_END.replace(year=FESTIVAL_END.year - 1)
    return ly_start <= d <= ly_end


def hashed_customer_handle(customer_id: str) -> str:
    """Simulates the hashed payer handle Paytm would expose (never a raw VPA)."""
    return "cust_" + hashlib.sha1(customer_id.encode()).hexdigest()[:10]


# ----------------------------------------------------------------------
# 1. CUSTOMER PERSONAS
# ----------------------------------------------------------------------

def make_customers():
    customers = []
    cid_counter = 1

    def new_customer(persona, extra=None):
        nonlocal cid_counter
        cid = f"C{cid_counter:04d}"
        cid_counter += 1
        lang = random.choices(CUSTOMER_LANGUAGES, weights=LANG_WEIGHTS)[0]
        surname = random.choice(FIRST_NAMES)
        if lang == "mr":
            honor = random.choice(HONORIFICS_MR)
            name = f"{surname} {honor}"
        else:
            name = f"{surname} जी" if random.random() < 0.5 else surname
        phone = f"+9198{random.randint(10000000, 99999999)}"
        c = {
            "customerId": cid,
            "payerHandle": hashed_customer_handle(cid),
            "name": name,
            "phone": phone,
            "language": lang,
            "persona": persona,
        }
        if extra:
            c.update(extra)
        customers.append(c)
        return c

    # Regulars: visit every 4-8 days, ticket 250-400, active through to REFERENCE_DATE
    regulars = []
    for _ in range(N_REGULARS):
        c = new_customer("regular", {
            "visitGapDays": round(random.uniform(4, 8), 1),
            "avgTicket": round(random.uniform(250, 400), -1),
            "activeUntil": REFERENCE_DATE,  # keeps buying up to "today"
            "firstSeenDaysAgo": random.randint(60, HISTORY_DAYS),
        })
        regulars.append(c)

    # Planted churners: were regulars, went quiet 21-35 days before REFERENCE_DATE
    churners = []
    for _ in range(N_CHURNED):
        gap = round(random.uniform(5, 8), 1)
        lapsed_days_ago = random.randint(21, 35)
        c = new_customer("churned_regular", {
            "visitGapDays": gap,
            "avgTicket": round(random.uniform(280, 450), -1),
            "activeUntil": REFERENCE_DATE - timedelta(days=lapsed_days_ago),
            "firstSeenDaysAgo": random.randint(90, HISTORY_DAYS),
        })
        churners.append(c)

    # Occasionals: every 15-30 days
    occasionals = []
    for _ in range(N_OCCASIONAL):
        c = new_customer("occasional", {
            "visitGapDays": round(random.uniform(15, 30), 1),
            "avgTicket": round(random.uniform(150, 350), -1),
            "activeUntil": REFERENCE_DATE,
            "firstSeenDaysAgo": random.randint(20, HISTORY_DAYS),
        })
        occasionals.append(c)

    # One-timers: single visit somewhere in history
    one_timers = []
    for _ in range(N_ONE_TIMERS):
        visit_day_ago = random.randint(1, HISTORY_DAYS)
        c = new_customer("one_timer", {
            "visitGapDays": None,
            "avgTicket": round(random.uniform(80, 300), -1),
            "singleVisitDaysAgo": visit_day_ago,
        })
        one_timers.append(c)

    return {
        "all": customers,
        "regulars": regulars,
        "churners": churners,
        "occasionals": occasionals,
        "one_timers": one_timers,
    }


# ----------------------------------------------------------------------
# 2. TRANSACTIONS (Paytm-shaped)
# ----------------------------------------------------------------------

def sample_hour_for_day(weekday: int) -> int:
    hours = list(range(8, 22))
    weights = [weekday_hour_intensity(weekday, h) for h in hours]
    total = sum(weights)
    if total <= 0:
        return random.choice(hours)
    r = random.uniform(0, total)
    acc = 0
    for h, w in zip(hours, weights):
        acc += w
        if r <= acc:
            return h
    return hours[-1]


def round_ticket(amount: float) -> float:
    """Kirana payments cluster on round-ish numbers."""
    buckets = [10, 20, 50]
    b = random.choice(buckets)
    return max(b, round(amount / b) * b)


def generate_visit_dates(customer, start: date, end: date):
    """Generate a list of visit dates for one customer using their persona."""
    dates = []
    persona = customer["persona"]

    if persona == "one_timer":
        d = end - timedelta(days=customer["singleVisitDaysAgo"])
        if start <= d <= end:
            dates.append(d)
        return dates

    first_seen = end - timedelta(days=customer.get("firstSeenDaysAgo", HISTORY_DAYS))
    cursor = max(start, first_seen)
    gap_mean = customer["visitGapDays"]
    active_until = customer.get("activeUntil", end)

    while cursor <= min(end, active_until):
        dates.append(cursor)
        # gamma-ish jitter around the mean gap so it doesn't look robotic
        jitter = max(1, round(random.gauss(gap_mean, gap_mean * 0.35)))
        cursor += timedelta(days=jitter)

    return dates


def apply_day_level_modifiers(base_amount: float, d: date) -> float:
    amount = base_amount

    # payday bump (1st-5th of month)
    if d.day <= 5:
        amount *= random.uniform(1.05, 1.20)

    # weekend lift
    if d.weekday() in (5, 6):
        amount *= random.uniform(1.0, 1.1)

    # festival ramp-up in lead window (this year)
    days_to_festival = (FESTIVAL_START - d).days
    if 0 <= days_to_festival <= FESTIVAL_LEAD_DAYS:
        ramp = 1 + 0.35 * (1 - days_to_festival / FESTIVAL_LEAD_DAYS)
        amount *= ramp
    elif is_in_festival_window(d):
        amount *= 1.3

    # last year's festival window (for "last year this category spiked" evidence)
    if is_in_last_year_festival_window(d):
        amount *= LAST_YEAR_FESTIVAL_LIFT

    # planted recent dip: last DIP_LAST_N_DAYS days before REFERENCE_DATE,
    # driven mainly by churners not buying (handled via activeUntil), but we
    # also shave a bit off remaining regulars' ticket sizes to make the dip
    # partly "smaller baskets" too — keeps the falling-sales detector's
    # cause-attribution logic honest (mostly fewer customers, some smaller baskets).
    days_before_ref = (REFERENCE_DATE - d).days
    if 0 <= days_before_ref < DIP_LAST_N_DAYS:
        amount *= (1 - DIP_MAGNITUDE * 0.25)

    # decoy anomaly: a rainy-day dip ~40 days before reference, isolated day
    rainy_day = REFERENCE_DATE - timedelta(days=42)
    if d == rainy_day:
        amount *= 0.6

    return amount


def generate_transactions(customers_by_group):
    all_customers = customers_by_group["all"]
    events = []
    idx = 0

    for c in all_customers:
        visit_dates = generate_visit_dates(c, START_DATE, REFERENCE_DATE)
        for d in visit_dates:
            # skip randomly ~2% (customer skipped that expected visit)
            if random.random() < 0.02:
                continue

            weekday = d.weekday()
            hour = sample_hour_for_day(weekday)
            minute = random.randint(0, 59)
            second = random.randint(0, 59)
            dt = datetime.combine(d, dtime(hour, minute, second))

            base_amount = random.gauss(c["avgTicket"], c["avgTicket"] * 0.25)
            base_amount = max(20, base_amount)
            base_amount = apply_day_level_modifiers(base_amount, d)
            amount = round_ticket(base_amount)

            idx += 1
            mode = random.choices(PAYMENT_MODES)[0]
            gateway = GATEWAY_BY_MODE[mode]

            # 4% failure, 1% pending-then-fail small chance
            r = random.random()
            if r < 0.04:
                status = "TXN_FAILURE"
                respcode, respmsg = random.choice([
                    ("227", "Your payment has been declined by your bank."),
                    ("810", "Payment failed due to a technical error."),
                    ("411", "Invalid Amount sent to Paytm"),
                ])
            elif r < 0.045:
                status = "PENDING"
                respcode, respmsg = ("400", "Transaction is pending confirmation.")
            else:
                status = "TXN_SUCCESS"
                respcode, respmsg = ("01", "Txn Success")

            order_id = f"ORD_VYOM_{idx:06d}"
            txn_id = fake_txn_id(dt, idx)
            bank_txn_id = fake_bank_txn_id(idx)

            event = {
                # --- fields matching real Paytm S2S webhook / status API shape ---
                "MID": MID,
                "ORDERID": order_id,
                "TXNID": txn_id,
                "TXNAMOUNT": f"{amount:.2f}",
                "CURRENCY": "INR",
                "TXNDATE": dt.strftime("%Y-%m-%d %H:%M:%S.0"),
                "PAYMENTMODE": mode,
                "GATEWAYNAME": gateway,
                "BANKNAME": gateway if mode in ("CC", "DC") else ("Paytm Payments Bank" if mode == "UPI" else "WALLET"),
                "BANKTXNID": bank_txn_id,
                "STATUS": status,
                "RESPCODE": respcode,
                "RESPMSG": respmsg,
                "CHECKSUMHASH": fake_checksum(order_id, txn_id, amount, status),
                "CHANNEL": "DYNAMIC_QR",
                # --- VYOM-side enrichment (not part of Paytm's payload) ---
                # These two are internal-only, added by VYOM's own systems so the
                # detectors can key off a stable customer identity. Paytm's real
                # webhook does not expose a resolved customer ID (only payment
                # method details) — VYOM derives this mapping itself, e.g. from
                # the payer's hashed handle appearing repeatedly.
                "_payerHandle": c["payerHandle"],
                "_customerId": c["customerId"],
            }
            events.append(event)

    events.sort(key=lambda e: e["TXNDATE"])
    return events


# Baseline window used both for calibration and for the story summary:
# weeks 6-10 before REFERENCE_DATE predate every planted churner's lapse
# (churners lapse 21-35 days ago == weeks ~3-5), so it's a clean "before"
# picture, and it's far enough from the festival ramp to not be inflated by it.
BASELINE_WEEKS_AGO_RANGE = (6, 10)


def _week_bounds(weeks_ago: int):
    start = REFERENCE_DATE - timedelta(days=7 * weeks_ago)
    end = start + timedelta(days=6)
    return start, end


def _revenue_in_range(success_txns, start: date, end: date) -> float:
    return sum(
        float(t["TXNAMOUNT"]) for t in success_txns
        if start.isoformat() <= t["TXNDATE"][:10] <= end.isoformat()
    )


def calibrate_recent_dip(transactions):
    """Emergent noise (day-to-day variance is comparable in size to the churn
    signal itself) means a single 'last 7 days' draw can land anywhere from
    -4% to +5% purely by chance, even with churners correctly absent. That's
    fine statistically but unusable for a live demo number that has to be
    right every time you re-run the generator. This rescales *only* the last
    DIP_LAST_N_DAYS days of successful-transaction amounts so the dip vs. the
    pre-churn baseline lands close to DIP_MAGNITUDE, without touching which
    customers transacted (the churn story — who's missing — stays emergent
    and real; only the aggregate rupee dip is calibrated)."""
    success = [t for t in transactions if t["STATUS"] == "TXN_SUCCESS"]

    lo, hi = BASELINE_WEEKS_AGO_RANGE
    baseline_weeks = [_revenue_in_range(success, *_week_bounds(w)) for w in range(lo, hi)]
    baseline_avg = sum(baseline_weeks) / len(baseline_weeks)

    last7_start = REFERENCE_DATE - timedelta(days=DIP_LAST_N_DAYS)
    last7_end = REFERENCE_DATE - timedelta(days=1)
    actual_last7 = _revenue_in_range(success, last7_start, last7_end)

    target_last7 = baseline_avg * (1 - DIP_MAGNITUDE)
    if actual_last7 <= 0:
        return  # nothing to scale (shouldn't happen with real data)

    scale = target_last7 / actual_last7
    scale = max(0.5, min(1.5, scale))  # keep individual transactions plausible

    for t in transactions:
        if t["STATUS"] != "TXN_SUCCESS":
            continue
        d = t["TXNDATE"][:10]
        if last7_start.isoformat() <= d <= last7_end.isoformat():
            amt = float(t["TXNAMOUNT"]) * scale
            amt = max(10, round(amt / 10) * 10)  # keep the round-number clustering
            t["TXNAMOUNT"] = f"{amt:.2f}"


# ----------------------------------------------------------------------
# 3. KHATA (handwritten ledger entries)
# ----------------------------------------------------------------------

def generate_khata(customers_by_group):
    khata = []
    pool = customers_by_group["regulars"] + customers_by_group["occasionals"]
    chosen = random.sample(pool, k=min(15, len(pool)))
    overdue_days_options = [4, 6, 9, 12, 15, 18, 22, 25, 29, 33, 38, 41, 45, 52, 58]
    random.shuffle(overdue_days_options)

    for i, c in enumerate(chosen):
        overdue_days = overdue_days_options[i % len(overdue_days_options)]
        last_purchase = REFERENCE_DATE - timedelta(days=overdue_days)
        amount_due = round(random.uniform(150, 2200), -1)
        items = None
        if random.random() < 0.5:
            n_items = random.randint(1, 3)
            items = [random.choice(ITEM_CATALOG)[1] for _ in range(n_items)]

        entry = {
            "khataId": f"K{i+1:03d}",
            "customerId": c["customerId"],
            "customerName": c["name"],
            "phone": c["phone"],
            "language": c["language"],
            "amountDue": amount_due,
            "lastPurchaseDate": last_purchase.isoformat(),
            "daysOverdue": overdue_days,
            "itemsNoted": items,
            "source": "ocr",
            "ocrConfidence": round(random.uniform(0.82, 0.98), 2),
            "reminders": [],
            "status": "overdue" if overdue_days > 3 else "current",
        }
        khata.append(entry)

    return khata


# ----------------------------------------------------------------------
# 4. CALENDAR (festivals & local events)
# ----------------------------------------------------------------------

def generate_calendar():
    return [
        {
            "name": FESTIVAL_NAME,
            "start": FESTIVAL_START.isoformat(),
            "end": FESTIVAL_END.isoformat(),
            "regions": ["MH"],
            "pincodes": [MERCHANT_PINCODE],
            "leadDays": FESTIVAL_LEAD_DAYS,
            "categoryLift": FESTIVAL_CATEGORY_LIFT,
            "notes": "Evening footfall up; daytime slightly down. Sweets/dry-fruit/puja demand rises in the lead week.",
        },
        {
            "name": "Ganesh Chaturthi (last year, reference only)",
            "start": (FESTIVAL_START.replace(year=FESTIVAL_START.year - 1) - timedelta(days=25)).isoformat(),
            "end": (FESTIVAL_START.replace(year=FESTIVAL_START.year - 1) - timedelta(days=15)).isoformat(),
            "regions": ["MH"],
            "pincodes": [MERCHANT_PINCODE],
            "leadDays": 5,
            "categoryLift": {"sweets": 1.5, "puja_items": 2.0},
            "notes": "Historical reference event, outside current transaction window's active promo logic.",
        },
        {
            "name": "Kothrud Weekly Haat (local market day)",
            "start": None,
            "end": None,
            "recurrence": "weekly:Sunday",
            "regions": ["MH"],
            "pincodes": [MERCHANT_PINCODE],
            "leadDays": 0,
            "categoryLift": {},
            "notes": "Nearby weekly market draws footfall away from small kirana on Sunday mornings.",
        },
        {
            "name": "Local college semester break",
            "start": (REFERENCE_DATE + timedelta(days=20)).isoformat(),
            "end": (REFERENCE_DATE + timedelta(days=50)).isoformat(),
            "regions": ["MH"],
            "pincodes": [MERCHANT_PINCODE],
            "leadDays": 3,
            "categoryLift": {},
            "notes": "Student housing nearby empties out; expect a genuine (not churn-driven) footfall dip.",
        },
    ]


# ----------------------------------------------------------------------
# 5. PEER BENCHMARK
# ----------------------------------------------------------------------

def generate_peer_benchmark():
    """Weekly revenue delta for 'similar stores nearby' — kept near-flat while
    Ramesh dips ~15%, so the peer-benchmark detector concludes it's a
    merchant-specific (churn) problem, not a neighborhood-wide one."""
    rows = []
    d = START_DATE
    week_num = 0
    while d <= REFERENCE_DATE:
        week_start = d
        # peers hover between -5% and +4%, mildly noisy, no dramatic dip
        delta = round(random.uniform(-0.05, 0.04), 3)
        rows.append({
            "pincode": MERCHANT_PINCODE,
            "weekStart": week_start.isoformat(),
            "weekLabel": f"{week_start.isoformat()}/W{week_num}",
            "peerStoreCount": random.randint(18, 26),
            "peerMedianRevenueDeltaPct": delta,
            "category": "kirana_grocery",
        })
        d += timedelta(days=7)
        week_num += 1
    return rows


# ----------------------------------------------------------------------
# 6. MERCHANT PROFILE
# ----------------------------------------------------------------------

def generate_merchant():
    return {
        "merchantId": MERCHANT_ID_INTERNAL,
        "mid": MID,
        "name": MERCHANT_NAME,
        "ownerName": "Ramesh",
        "category": "kirana_grocery",
        "city": MERCHANT_CITY,
        "pincode": MERCHANT_PINCODE,
        "lat": MERCHANT_LAT,
        "lng": MERCHANT_LNG,
        "preferredLanguage": "hi-en",
        "onboardedDaysAgo": HISTORY_DAYS + random.randint(30, 200),
        "guardrails": {
            "maxCampaignBudgetInr": 500,
            "maxDiscountPct": 10,
            "maxCampaignFrequencyPerWeek": 2,
            "udhaarAutopilot": True,
            "quietHours": {"start": "21:30", "end": "08:00"},
        },
    }


# ----------------------------------------------------------------------
# 7. WRITE OUTPUTS
# ----------------------------------------------------------------------

def write_json(name, data):
    path = os.path.join(OUT_DIR, name)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2, default=str)
    print(f"wrote {path}  ({len(data) if isinstance(data, list) else 1} records)")


def write_transactions_csv(transactions):
    path = os.path.join(OUT_DIR, "transactions.csv")
    if not transactions:
        return
    fieldnames = list(transactions[0].keys())
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for t in transactions:
            writer.writerow(t)
    print(f"wrote {path}  ({len(transactions)} records)")


def summarize_story(transactions, customers_by_group, khata):
    success = [t for t in transactions if t["STATUS"] == "TXN_SUCCESS"]

    def revenue_on(d: date):
        return sum(float(t["TXNAMOUNT"]) for t in success if t["TXNDATE"].startswith(d.isoformat()))

    def revenue_in_range(start: date, end: date):
        return sum(
            float(t["TXNAMOUNT"]) for t in success
            if start.isoformat() <= t["TXNDATE"][:10] <= end.isoformat()
        )

    last7_start = REFERENCE_DATE - timedelta(days=DIP_LAST_N_DAYS)
    last7 = revenue_in_range(last7_start, REFERENCE_DATE - timedelta(days=1))

    # Same pre-churn baseline window used by calibrate_recent_dip(), so this
    # number matches what was actually locked in, not an unrelated window.
    lo, hi = BASELINE_WEEKS_AGO_RANGE
    baseline_weeks = [_revenue_in_range(success, *_week_bounds(w)) for w in range(lo, hi)]
    baseline_avg = sum(baseline_weeks) / len(baseline_weeks)

    dead_hour_txns = [
        t for t in success
        if DEAD_HOUR_WINDOW[0] <= datetime.strptime(t["TXNDATE"][:19], "%Y-%m-%d %H:%M:%S").hour < DEAD_HOUR_WINDOW[1]
        and datetime.strptime(t["TXNDATE"][:10], "%Y-%m-%d").weekday() in DEAD_HOUR_WEEKDAYS
    ]

    story = {
        "referenceDate": REFERENCE_DATE.isoformat(),
        "historyStartDate": START_DATE.isoformat(),
        "totalTransactions": len(transactions),
        "successfulTransactions": len(success),
        "failedTransactions": len([t for t in transactions if t["STATUS"] == "TXN_FAILURE"]),
        "pendingTransactions": len([t for t in transactions if t["STATUS"] == "PENDING"]),
        "plantedChurnedCustomers": len(customers_by_group["churners"]),
        "churnedCustomerIds": [c["customerId"] for c in customers_by_group["churners"]],
        "estMonthlyRevenueAtRiskFromChurn": round(
            sum(c["avgTicket"] * (30 / c["visitGapDays"]) for c in customers_by_group["churners"]), 0
        ),
        "last7DaysRevenue": round(last7, 2),
        "preChurnBaselineWeeklyAvgRevenue": round(baseline_avg, 2),
        "revenueDipPct": round((last7 - baseline_avg) / baseline_avg * 100, 1) if baseline_avg else None,
        "deadHourWindow": f"{DEAD_HOUR_WINDOW[0]}:00-{DEAD_HOUR_WINDOW[1]}:00 on weekdays {DEAD_HOUR_WEEKDAYS} (0=Mon)",
        "deadHourTransactionCount": len(dead_hour_txns),
        "festival": {
            "name": FESTIVAL_NAME,
            "start": FESTIVAL_START.isoformat(),
            "daysFromReference": (FESTIVAL_START - REFERENCE_DATE).days,
        },
        "khataOverdueCount": len(khata),
        "khataTotalDueInr": round(sum(k["amountDue"] for k in khata), 2),
        "notes": [
            f"revenueDipPct compares the last {DIP_LAST_N_DAYS} days against the pre-churn baseline (weeks {BASELINE_WEEKS_AGO_RANGE[0]}-{BASELINE_WEEKS_AGO_RANGE[1]} before REFERENCE_DATE), calibrated by calibrate_recent_dip() to land near DIP_MAGNITUDE.",
            "Use churnedCustomerIds to sanity-check your churn detector — it should recover ~all of these.",
            "Item data (itemsNoted) appears only on khata.json rows (simulating a photographed handwritten ledger) — transactions.json never carries item/basket data, matching real Paytm payment payloads.",
        ],
    }
    return story


def main():
    print(f"Seed: {SEED} | Reference date: {REFERENCE_DATE} | History: {START_DATE} -> {REFERENCE_DATE}")

    customers_by_group = make_customers()
    transactions = generate_transactions(customers_by_group)
    calibrate_recent_dip(transactions)  # lock the last-7-days dip to ~DIP_MAGNITUDE for a reliable demo number
    khata = generate_khata(customers_by_group)
    calendar = generate_calendar()
    peer_benchmark = generate_peer_benchmark()
    merchant = generate_merchant()

    # Clean customer records for output (drop internal helper fields, keep useful ones)
    customers_out = []
    for c in customers_by_group["all"]:
        out = {
            "customerId": c["customerId"],
            "payerHandle": c["payerHandle"],
            "name": c["name"],
            "phone": c["phone"],
            "language": c["language"],
            "persona": c["persona"],
        }
        customers_out.append(out)

    write_json("merchant.json", merchant)
    write_json("customers.json", customers_out)
    write_json("transactions.json", transactions)
    write_transactions_csv(transactions)
    write_json("khata.json", khata)
    write_json("calendar.json", calendar)
    write_json("peer_benchmark.json", peer_benchmark)

    story = summarize_story(transactions, customers_by_group, khata)
    write_json("story.json", story)

    print("\n--- STORY SUMMARY (sanity check before you demo) ---")
    print(json.dumps(story, indent=2, default=str))


if __name__ == "__main__":
    main()