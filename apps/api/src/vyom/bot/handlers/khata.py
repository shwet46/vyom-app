"""Telegram bot handlers for customer credit balance, bill details, partial payments, QR codes, and payment deadlines."""

from __future__ import annotations

import datetime
import io

import qrcode
import structlog
from aiogram import Bot, F, Router
from aiogram.types import (
    BufferedInputFile,
    CallbackQuery,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    Message,
)

from vyom.ai.ocr import get_ocr_client
from vyom.bot.keyboards import (
    get_deadline_selection_keyboard,
    get_khata_action_keyboard,
    get_main_menu_keyboard,
)
from vyom.clock import Clock
from vyom.config import get_settings
from vyom.core.sse import sse_hub
from vyom.db import get_db

logger = structlog.get_logger()
router = Router(name="khata")


def _generate_qr_input_file(upi_intent: str) -> BufferedInputFile:
    """Generate in-memory QR code PNG as BufferedInputFile for direct upload to Telegram."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=4,
    )
    qr.add_data(upi_intent)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#002266", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return BufferedInputFile(buf.getvalue(), filename="udhaar_qr.png")

# ─── Demo Data ─────────────────────────────────────────────────────────────────
_DEMO_ITEMS = [
    ("2x Fortune Sunlite Oil (1L)", 240, 0),
    ("5kg Aashirvaad Chakki Atta", 290, 0),
    ("500g Gir Cow Pure Ghee", 520, 0),
    ("2x Tata Namak (1kg)", 50, 0),
    ("Harpic + Lizol Combo", 250, 0),
    ("Surf Excel (1kg)", 200, 50),   # partially paid
    ("Maggi x 12 pack", 300, 0),
]


async def _get_customer_khata_summary(chat_id: int) -> dict:
    """Retrieve or compute customer's khata summary including partial payment and remaining balance."""
    db = get_db()
    cust_doc = await db.customers.find_one({"telegram.chat_id": chat_id})
    if not cust_doc:
        cust_doc = await db.customers.find_one({"_id": "cust_sharma_001"})

    customer_id = cust_doc.get("_id") if cust_doc else "cust_sharma_001"
    customer_name = cust_doc.get("name", "Grahak") if cust_doc else "Grahak"
    merchant_id = cust_doc.get("merchant_id", "merchant_sharma_01") if cust_doc else "merchant_sharma_01"

    cursor = db.khata_entries.find({
        "customer_id": customer_id,
        "status": {"$in": ["open", "promised"]},
    })

    total_purchases_paise = 0
    total_paid_paise = 0
    earliest_due: datetime.date | None = None
    entry_count = 0
    items_detail: list[dict] = []

    async for entry in cursor:
        tot = entry.get("amount_total_paise", 0)
        paid = entry.get("amount_paid_paise", 0)
        total_purchases_paise += tot
        total_paid_paise += paid
        entry_count += 1

        due = entry.get("due_date") or entry.get("promise_date")
        if due:
            due_d = due.date() if isinstance(due, datetime.datetime) else due
            if not earliest_due or due_d < earliest_due:
                earliest_due = due_d

        if entry.get("items"):
            for item in entry.get("items", []):
                if isinstance(item, dict):
                    items_detail.append(item)
                else:
                    items_detail.append({"name": str(item), "amount_paise": 0, "paid_paise": 0})

    # Fallback to realistic demo khata bill
    if total_purchases_paise == 0:
        total_purchases_paise = 185000  # ₹1,850 total bill
        total_paid_paise = 50000        # ₹500 partial payment already made
        entry_count = 3
        earliest_due = Clock.now().date() + datetime.timedelta(days=5)
        items_detail = [
            {"name": "2x Fortune Sunlite Oil (1L)", "amount_paise": 24000, "paid_paise": 24000},
            {"name": "5kg Aashirvaad Chakki Atta", "amount_paise": 29000, "paid_paise": 26000},
            {"name": "500g Gir Cow Pure Ghee", "amount_paise": 52000, "paid_paise": 0},
            {"name": "2x Tata Namak (1kg)", "amount_paise": 5000, "paid_paise": 0},
            {"name": "Harpic + Lizol Combo", "amount_paise": 25000, "paid_paise": 0},
            {"name": "Surf Excel (1kg)", "amount_paise": 20000, "paid_paise": 0},
            {"name": "Maggi x 12 pack", "amount_paise": 30000, "paid_paise": 0},
        ]

    remaining_balance_paise = max(0, total_purchases_paise - total_paid_paise)

    # Build a clean text items summary
    if items_detail:
        lines = []
        for it in items_detail[:5]:
            n = it.get("name", "Item")
            a = it.get("amount_paise", 0) / 100.0
            p = it.get("paid_paise", 0) / 100.0
            if p > 0:
                lines.append(f"{n} (₹{a:.0f}, Paid ₹{p:.0f})")
            else:
                lines.append(f"{n} (₹{a:.0f})")
        if len(items_detail) > 5:
            lines.append(f"...aur {len(items_detail) - 5} aur items")
        items_summary = " | ".join(lines)
    else:
        items_summary = "Kirana grocery essentials (Oil, Atta, Ghee)"

    return {
        "customer_id": customer_id,
        "customer_name": customer_name,
        "merchant_id": merchant_id,
        "total_purchases_paise": total_purchases_paise,
        "total_paid_paise": total_paid_paise,
        "remaining_balance_paise": remaining_balance_paise,
        "total_purchases_rupees": total_purchases_paise / 100.0,
        "total_paid_rupees": total_paid_paise / 100.0,
        "remaining_balance_rupees": remaining_balance_paise / 100.0,
        "entry_count": entry_count,
        "earliest_due": earliest_due,
        "items_summary": items_summary,
        "items_detail": items_detail,
    }


def _build_bill_text(summary: dict, pay_url: str | None = None) -> str:
    """Build a detailed, customer-friendly Hinglish bill message with partial payment and Pay Now balance."""
    cust_name = summary["customer_name"]
    rem = summary["remaining_balance_rupees"]
    total = summary["total_purchases_rupees"]
    paid = summary["total_paid_rupees"]
    due_str = (
        summary["earliest_due"].strftime("%d %b %Y")
        if summary["earliest_due"]
        else "Jald (Soon)"
    )
    items = summary.get("items_detail", [])

    # Header
    lines = [
        "🧾 *Aapka Udhaar Bill — Sharma Kirana Store*",
        f"👤 *Naam*: {cust_name}",
        "",
    ]

    # Item-wise breakdown (up to 5 items to keep photo caption concise)
    if items:
        lines.append("📋 *Item-wise Hisaab:*")
        for it in items[:5]:
            n = it.get("name", "Item")
            a_r = it.get("amount_paise", 0) / 100.0
            p_r = it.get("paid_paise", 0) / 100.0
            bal = a_r - p_r
            if p_r > 0:
                lines.append(f"  • {n}: ₹{a_r:.0f} _(Paid ₹{p_r:.0f} | Baki ₹{bal:.0f})_")
            else:
                lines.append(f"  • {n}: ₹{a_r:.0f}")
        if len(items) > 5:
            lines.append(f"  • ...aur {len(items) - 5} aur items")
        lines.append("")

    # Summary totals & partial payments
    lines += [
        "━━━━━━━━━━━━━━━━━━━━",
        f"🛍️ *Kul Kharidari (Total Purchases)*: ₹{total:.0f}",
    ]
    if paid > 0:
        lines.append(f"✅ *Aapne Pehle Diye (Partially Paid)*: ₹{paid:.0f}")
    lines += [
        f"⚠️ *BAAKI RASHI (BALANCE DUE)*: *₹{rem:.0f}*",
        f"👉 *Yeh ₹{rem:.0f} baaki hai — kripya ise abhi pay karein (Pay It Now)!*",
        "━━━━━━━━━━━━━━━━━━━━",
        f"📅 *Due Date*: {due_str}",
    ]
    if pay_url:
        lines += [
            "",
            "📱 *Paytm Mock UPI Payment Portal*:",
            f"🔗 [Paytm se ₹{rem:.0f} Pay Karne Ke Liye Yahan Tap Karein]({pay_url})",
        ]
    lines += [
        "",
        "💡 Neeche diye gaye QR code ko scan karein ya Paytm link se pay karein.",
    ]
    return "\n".join(lines)


# ─── Handle: Mera Khata ────────────────────────────────────────────────────────

@router.message(F.text.in_({
    "🧾 Mera Khata & Bill (Udhaar)",
    "📒 Mera Khata (Udhaar)",
    "Mera Khata",
    "Khata",
    "Udhaar",
    "Bill",
    "Hisaab",
    "Baki",
    "Balance",
}))
async def handle_my_khata(message: Message) -> None:
    """Display customer's bill, partial payments made, remaining balance, and action buttons."""
    if not message.from_user:
        return

    chat_id = message.from_user.id
    summary = await _get_customer_khata_summary(chat_id)
    rem_balance = summary["remaining_balance_rupees"]
    customer_id = summary["customer_id"]

    if rem_balance <= 0:
        await message.answer(
            "✅ *Badhaai Ho!*\n\n"
            "Aapka Sharma Kirana Store par koi bhi udhaar baaki nahi hai.\n"
            "Aapka account bilkul clean hai! Dhanyawad 🙏",
            reply_markup=get_main_menu_keyboard(),
            parse_mode="Markdown",
        )
        return

    settings = get_settings()
    pay_token = f"pay_khata_{customer_id[:10]}_{int(Clock.now().timestamp())}"
    pay_url = f"{settings.public_api_url}/api/v1/pay/{pay_token}/view"

    db = get_db()
    upi_intent = (
        f"upi://pay?pa=sharmakirana@paytm&pn=Sharma%20Kirana"
        f"&am={rem_balance:.2f}&cu=INR&tn=Udhaar%20Settlement"
    )
    payment_doc = {
        "_id": f"pay_{pay_token}",
        "merchant_id": summary["merchant_id"],
        "customer_id": customer_id,
        "amount_paise": summary["remaining_balance_paise"],
        "purpose": "udhaar",
        "pay_token": pay_token,
        "status": "created",
        "upi_intent": upi_intent,
        "created_at": Clock.now(),
    }
    await db.payments.update_one({"pay_token": pay_token}, {"$set": payment_doc}, upsert=True)

    text = _build_bill_text(summary, pay_url=pay_url)
    keyboard = get_khata_action_keyboard(
        pay_token=pay_token, amount_rupees=rem_balance, pay_url=pay_url, upi_intent=upi_intent
    )

    try:
        photo_file = _generate_qr_input_file(upi_intent)
        await message.answer_photo(
            photo=photo_file,
            caption=text,
            reply_markup=keyboard,
            parse_mode="Markdown",
        )
    except Exception as exc:
        logger.warning("khata_bill_photo_failed_fallback_text", error=str(exc))
        await message.answer(
            text,
            reply_markup=keyboard,
            parse_mode="Markdown",
        )


@router.callback_query(F.data == "khata:check")
async def handle_khata_callback(query: CallbackQuery) -> None:
    """Handle check khata inline callback."""
    if not query.from_user or not query.message or not isinstance(query.message, Message):
        return

    await query.answer()

    # query.message.from_user is None (bot-sent message); use query.from_user.id instead.
    chat_id = query.from_user.id
    summary = await _get_customer_khata_summary(chat_id)
    rem_balance = summary["remaining_balance_rupees"]
    customer_id = summary["customer_id"]

    if rem_balance <= 0:
        await query.message.answer(
            "✅ *Badhaai Ho!*\n\n"
            "Aapka Sharma Kirana Store par koi bhi udhaar baaki nahi hai.\n"
            "Aapka account bilkul clean hai! Dhanyawad 🙏",
            reply_markup=get_main_menu_keyboard(),
            parse_mode="Markdown",
        )
        return

    settings = get_settings()
    pay_token = f"pay_khata_{customer_id[:10]}_{int(Clock.now().timestamp())}"
    pay_url = f"{settings.public_api_url}/api/v1/pay/{pay_token}/view"

    db = get_db()
    upi_intent_str = (
        f"upi://pay?pa=sharmakirana@paytm&pn=Sharma%20Kirana"
        f"&am={rem_balance:.2f}&cu=INR&tn=Udhaar%20Settlement"
    )
    payment_doc = {
        "_id": f"pay_{pay_token}",
        "merchant_id": summary["merchant_id"],
        "customer_id": customer_id,
        "amount_paise": summary["remaining_balance_paise"],
        "purpose": "udhaar",
        "pay_token": pay_token,
        "status": "created",
        "upi_intent": upi_intent_str,
        "created_at": Clock.now(),
    }
    await db.payments.update_one({"pay_token": pay_token}, {"$set": payment_doc}, upsert=True)

    text = _build_bill_text(summary, pay_url=pay_url)
    keyboard = get_khata_action_keyboard(
        pay_token=pay_token, amount_rupees=rem_balance, pay_url=pay_url, upi_intent=upi_intent_str
    )

    try:
        photo_file = _generate_qr_input_file(upi_intent_str)
        await query.message.answer_photo(
            photo=photo_file,
            caption=text,
            reply_markup=keyboard,
            parse_mode="Markdown",
        )
    except Exception as exc:
        logger.warning("khata_callback_photo_failed_fallback_text", error=str(exc))
        await query.message.answer(
            text,
            reply_markup=keyboard,
            parse_mode="Markdown",
        )


@router.callback_query(F.data.startswith("khata:pay_info:"))
async def handle_pay_info_callback(query: CallbackQuery) -> None:
    """Show UPI payment details as text and provide test settlement option."""
    if not query.message or not isinstance(query.message, Message):
        return

    # Parse amount from callback data: "khata:pay_info:..."
    parts = (query.data or "").split(":")
    amount_str = parts[-1] if len(parts) >= 3 else "1350"

    await query.answer()

    markup = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="⚡ Test Payment (Instant Settle)",
                    callback_data=f"khata:mock_settle:{amount_str}",
                ),
            ],
            [
                InlineKeyboardButton(
                    text="📲 QR Code Dekhein",
                    callback_data="khata:pay_now",
                ),
                InlineKeyboardButton(
                    text="🏠 Main Menu",
                    callback_data="help:menu",
                ),
            ],
        ]
    )

    await query.message.answer(
        f"💳 *UPI Payment Details*\n\n"
        f"• 🏪 *UPI ID*: `sharmakirana@paytm`\n"
        f"• 💰 *Amount*: ₹{amount_str}\n"
        f"• 📝 *Note*: Udhaar Settlement\n\n"
        f"*Kaise pay karein:*\n"
        f"1️⃣ Koi bhi UPI app kholen (Paytm, PhonePe, GPay)\n"
        f"2️⃣ 'Pay' → UPI ID type karein: `sharmakirana@paytm`\n"
        f"3️⃣ Amount ₹{amount_str} bharein aur confirm karein\n\n"
        f"_Neeche diye gaye button se instant test bhuqtan bhi kar sakte hain:_ 👇",
        reply_markup=markup,
        parse_mode="Markdown",
    )


@router.callback_query(F.data.startswith("khata:mock_settle:"))
async def handle_mock_settle_callback(query: CallbackQuery) -> None:
    """Instantly settle customer's khata in MongoDB for demo/dev purposes."""
    if not query.from_user or not query.message or not isinstance(query.message, Message):
        return

    chat_id = query.from_user.id
    summary = await _get_customer_khata_summary(chat_id)
    customer_id = summary["customer_id"]
    customer_name = summary["customer_name"]
    merchant_id = summary["merchant_id"]
    now_dt = Clock.now()

    parts = (query.data or "").split(":")
    try:
        amount_rupees = float(parts[-1])
    except (IndexError, ValueError):
        amount_rupees = summary["remaining_balance_rupees"]

    amount_paise = int(amount_rupees * 100)
    db = get_db()

    # 1. Settle all open/promised khata entries for this customer
    await db.khata_entries.update_many(
        {"customer_id": customer_id, "status": {"$in": ["open", "promised"]}},
        {
            "$set": {
                "status": "paid",
                "amount_paid_paise": summary["total_purchases_paise"],
                "updated_at": now_dt,
            }
        },
    )

    # 2. Record Transaction
    from vyom.models.enums import PaymentMode, TransactionSource
    from vyom.models.transaction import Transaction

    txn = Transaction(
        merchant_id=merchant_id,
        customer_id=customer_id,
        amount_paise=amount_paise,
        items=[],
        payment_mode=PaymentMode.UPI,
        paid_at=now_dt,
        source=TransactionSource.PAYTM_SIM,
    )
    await db.transactions.insert_one(txn.to_mongo())

    # 3. Real-time SSE alert to merchant web dashboard
    await sse_hub.broadcast(
        merchant_id,
        "khata.paid",
        {
            "customer_id": customer_id,
            "customer_name": customer_name,
            "amount_paid_paise": amount_paise,
            "status": "paid",
        },
    )
    await sse_hub.broadcast(
        merchant_id,
        "paytm.payment_received",
        {
            "order_id": f"ord_tg_{int(now_dt.timestamp())}",
            "amount_paise": amount_paise,
            "amount_rupees": amount_rupees,
            "soundbox_announcement": f"Paytm par {int(amount_rupees)} rupaye prapt hue",
            "paid_at": now_dt.isoformat(),
        },
    )

    await query.answer("✅ Payment successful! Khata settled!")
    await query.message.answer(
        f"🎉 *Bhuqtan Safal (Payment Received)!*\n\n"
        f"• 💰 *Amount*: ₹{amount_rupees:.0f}\n"
        f"• 💳 *Mode*: Paytm UPI\n"
        f"• 🏪 *Merchant*: Sharma Kirana Store\n"
        f"• 🧾 *Status*: ✅ Khata poori tarah se settle ho gaya hai\n\n"
        f"Aapka ledger balance ab *₹0* hai. Bahut bahut shukriya! 🙏",
        reply_markup=get_main_menu_keyboard(),
        parse_mode="Markdown",
    )


# ─── Handle: Pay Now / QR Code ────────────────────────────────────────────────

@router.message(F.text.in_({
    "💳 Abhi Pay Karein (Pay Now / QR)",
    "Pay",
    "Pay Now",
    "UPI",
    "QR",
    "QR Code",
}))
async def handle_pay_now_direct(message: Message) -> None:
    """Directly present QR code and payment info to customer."""
    if not message.from_user:
        return

    chat_id = message.from_user.id
    summary = await _get_customer_khata_summary(chat_id)
    rem_balance = summary["remaining_balance_rupees"]
    customer_id = summary["customer_id"]

    if rem_balance <= 0:
        await message.answer(
            "✅ *Aapka koi hisaab baaki nahi hai.*\n\nBhuqtan karne ki avashyakta nahi. Dhanyawad! 🙏",
            parse_mode="Markdown",
        )
        return

    settings = get_settings()
    pay_token = f"pay_qr_{customer_id[:10]}_{int(Clock.now().timestamp())}"
    pay_url = f"{settings.public_api_url}/api/v1/pay/{pay_token}/view"

    db = get_db()
    upi_intent = (
        f"upi://pay?pa=sharmakirana@paytm&pn=Sharma%20Kirana"
        f"&am={rem_balance:.2f}&cu=INR&tn=Udhaar%20Bill"
    )
    await db.payments.update_one(
        {"pay_token": pay_token},
        {
            "$set": {
                "_id": f"pay_{pay_token}",
                "merchant_id": summary["merchant_id"],
                "customer_id": customer_id,
                "amount_paise": summary["remaining_balance_paise"],
                "purpose": "udhaar",
                "pay_token": pay_token,
                "status": "created",
                "upi_intent": upi_intent,
                "created_at": Clock.now(),
            }
        },
        upsert=True,
    )

    is_localhost = pay_url.startswith(("http://localhost", "http://127.", "https://localhost"))

    caption = (
        f"📲 *QR Code — Sharma Kirana Store*\n\n"
        f"• 💰 *Bhuqtan Rashi*: *₹{rem_balance:.0f}*\n"
        f"• 🏪 *Payee UPI ID*: `sharmakirana@paytm`\n"
        f"• 🧾 *Bill Ref*: `{pay_token[:18]}`\n\n"
        f"*QR Code kaise use karein:*\n"
        f"1️⃣ Koi bhi UPI app kholen (Paytm, PhonePe, GPay)\n"
        f"2️⃣ QR Scanner se is code ko scan karein\n"
        f"3️⃣ ₹{rem_balance:.0f} auto-fill ho jayega — confirm karein"
    )
    if not is_localhost:
        caption += f"\n\n📱 Ya seedha Paytm payment link kholein:\n🔗 [Paytm se ₹{rem_balance:.0f} Pay Karein]({pay_url})"

    try:
        photo_file = _generate_qr_input_file(upi_intent)
        await message.answer_photo(
            photo=photo_file,
            caption=caption,
            reply_markup=get_khata_action_keyboard(
                pay_token=pay_token, amount_rupees=rem_balance, pay_url=pay_url, upi_intent=upi_intent
            ),
            parse_mode="Markdown",
        )
    except Exception as exc:
        logger.warning("qr_photo_send_failed_fallback_text", error=str(exc))
        await message.answer(
            caption,
            reply_markup=get_khata_action_keyboard(
                pay_token=pay_token, amount_rupees=rem_balance, pay_url=pay_url, upi_intent=upi_intent
            ),
            parse_mode="Markdown",
        )


@router.callback_query(F.data.startswith("khata:qr:") | (F.data == "khata:pay_now"))
async def handle_qr_callback(query: CallbackQuery) -> None:
    """Send QR Code and link upon inline button tap."""
    if not query.from_user or not query.message or not isinstance(query.message, Message):
        return

    await query.answer("📲 QR Code taiyar kiya ja raha hai...")

    # query.message.from_user is always None (it's the bot's own message).
    # Use query.from_user.id (the customer who clicked) instead.
    chat_id = query.from_user.id
    summary = await _get_customer_khata_summary(chat_id)
    rem_balance = summary["remaining_balance_rupees"]
    customer_id = summary["customer_id"]

    if rem_balance <= 0:
        await query.message.answer(
            "✅ *Aapka koi hisaab baaki nahi hai.*\n\nBhuqtan karne ki avashyakta nahi. Dhanyawad! 🙏",
            parse_mode="Markdown",
        )
        return

    settings = get_settings()
    pay_token = f"pay_qr_{customer_id[:10]}_{int(Clock.now().timestamp())}"
    pay_url = f"{settings.public_api_url}/api/v1/pay/{pay_token}/view"

    db = get_db()
    upi_intent = (
        f"upi://pay?pa=sharmakirana@paytm&pn=Sharma%20Kirana"
        f"&am={rem_balance:.2f}&cu=INR&tn=Udhaar%20Bill"
    )
    await db.payments.update_one(
        {"pay_token": pay_token},
        {
            "$set": {
                "_id": f"pay_{pay_token}",
                "merchant_id": summary["merchant_id"],
                "customer_id": customer_id,
                "amount_paise": summary["remaining_balance_paise"],
                "purpose": "udhaar",
                "pay_token": pay_token,
                "status": "created",
                "upi_intent": upi_intent,
                "created_at": Clock.now(),
            }
        },
        upsert=True,
    )

    is_localhost = pay_url.startswith(("http://localhost", "http://127.", "https://localhost"))

    caption = (
        f"📲 *QR Code — Sharma Kirana Store*\n\n"
        f"• 💰 *Bhuqtan Rashi*: *₹{rem_balance:.0f}*\n"
        f"• 🏪 *Payee UPI ID*: `sharmakirana@paytm`\n"
        f"• 🧾 *Bill Ref*: `{pay_token[:18]}`\n\n"
        f"*QR Code kaise use karein:*\n"
        f"1️⃣ Koi bhi UPI app kholen (Paytm, PhonePe, GPay)\n"
        f"2️⃣ QR Scanner se is code ko scan karein\n"
        f"3️⃣ ₹{rem_balance:.0f} auto-fill ho jayega — confirm karein"
    )
    if not is_localhost:
        caption += f"\n\n📱 Ya seedha Paytm payment link kholein:\n🔗 [Paytm se ₹{rem_balance:.0f} Pay Karein]({pay_url})"

    try:
        photo_file = _generate_qr_input_file(upi_intent)
        await query.message.answer_photo(
            photo=photo_file,
            caption=caption,
            reply_markup=get_khata_action_keyboard(
                pay_token=pay_token, amount_rupees=rem_balance, pay_url=pay_url, upi_intent=upi_intent
            ),
            parse_mode="Markdown",
        )
    except Exception as exc:
        logger.warning("qr_photo_send_failed_fallback_text", error=str(exc))
        await query.message.answer(
            caption,
            reply_markup=get_khata_action_keyboard(
                pay_token=pay_token, amount_rupees=rem_balance, pay_url=pay_url, upi_intent=upi_intent
            ),
            parse_mode="Markdown",
        )


# ─── Handle: Payment Deadline ──────────────────────────────────────────────────

@router.message(F.text.in_({"📅 Payment Deadline Set Karein", "Deadline", "Wada", "Promise"}))
async def handle_deadline_menu(message: Message) -> None:
    """Display payment deadline / promise options to the customer."""
    if not message.from_user:
        return

    chat_id = message.from_user.id
    summary = await _get_customer_khata_summary(chat_id)
    rem_balance = summary["remaining_balance_rupees"]

    text = (
        f"📅 *Payment Deadline (Wada Tarikh) Set Karein*\n\n"
        f"Aapka kul baaki balance: *₹{rem_balance:.0f}*\n\n"
        f"Aap yeh rashi kab tak chuka payenge?\n"
        f"Kripya ek suvidhajanak vikalp chunein:\n\n"
        f"_\\(Aapka wada dukaandar Sharma Kirana Store ko turant notify ho jayega\\)_"
    )

    await message.answer(text, reply_markup=get_deadline_selection_keyboard(), parse_mode="Markdown")


@router.callback_query(F.data == "khata:set_deadline")
async def handle_set_deadline_callback(query: CallbackQuery) -> None:
    """Prompt deadline selection upon inline button click."""
    if not query.from_user or not query.message or not isinstance(query.message, Message):
        return

    await query.answer()

    # query.message.from_user is None (bot-sent message); use query.from_user.id instead.
    chat_id = query.from_user.id
    summary = await _get_customer_khata_summary(chat_id)
    rem_balance = summary["remaining_balance_rupees"]

    text = (
        f"\U0001f4c5 *Payment Deadline (Wada Tarikh) Set Karein*\n\n"
        f"Aapka kul baaki balance: *\u20b9{rem_balance:.0f}*\n\n"
        f"Aap yeh rashi kab tak chuka payenge?\n"
        f"Kripya ek suvidhajanak vikalp chunein:\n\n"
        f"_\\(Aapka wada dukaandar Sharma Kirana Store ko turant notify ho jayega\\)_"
    )
    await query.message.answer(text, reply_markup=get_deadline_selection_keyboard(), parse_mode="Markdown")


@router.callback_query(F.data.startswith("deadline:"))
async def handle_deadline_selection(query: CallbackQuery) -> None:
    """Record customer's payment promise date in MongoDB and notify merchant."""
    if not query.data or not query.from_user:
        return

    code = query.data.split(":")[1]
    days_map = {
        "1_day": 1,
        "3_days": 3,
        "7_days": 7,
        "15_days": 15,
    }
    days_to_add = days_map.get(code, 7)
    now_dt = Clock.now()
    new_promise_date = now_dt.date() + datetime.timedelta(days=days_to_add)

    db = get_db()
    chat_id = query.from_user.id
    summary = await _get_customer_khata_summary(chat_id)
    customer_id = summary["customer_id"]
    customer_name = summary["customer_name"]
    rem_balance = summary["remaining_balance_rupees"]

    # Update khata entries status to promised
    await db.khata_entries.update_many(
        {"customer_id": customer_id, "status": {"$in": ["open", "promised"]}},
        {
            "$set": {
                "status": "promised",
                "promise_date": datetime.datetime.combine(new_promise_date, datetime.time.min),
                "updated_at": now_dt,
            }
        },
    )

    # Real-time SSE alert to merchant dashboard
    await sse_hub.broadcast(
        "merchant_sharma_01",
        "customer.promise_updated",
        {
            "customer_id": customer_id,
            "customer_name": customer_name,
            "promised_date": new_promise_date.isoformat(),
            "amount_rupees": rem_balance,
            "source": "telegram_bot",
        },
    )

    formatted_date = new_promise_date.strftime("%d %B %Y (%A)")

    # Build a payment link for quick reference
    settings = get_settings()
    pay_token = f"pay_deadline_{customer_id[:10]}_{int(now_dt.timestamp())}"
    pay_url = f"{settings.public_api_url}/api/v1/pay/{pay_token}/view"

    await db.payments.update_one(
        {"pay_token": pay_token},
        {
            "$set": {
                "_id": f"pay_{pay_token}",
                "merchant_id": summary["merchant_id"],
                "customer_id": customer_id,
                "amount_paise": summary["remaining_balance_paise"],
                "purpose": "udhaar",
                "pay_token": pay_token,
                "status": "created",
                "upi_intent": (
                    f"upi://pay?pa=sharmakirana@paytm&pn=Sharma%20Kirana"
                    f"&am={rem_balance:.2f}&cu=INR&tn=Udhaar%20Deadline"
                ),
                "created_at": now_dt,
            }
        },
        upsert=True,
    )

    from vyom.bot.keyboards import get_khata_action_keyboard

    confirmation_text = (
        f"✅ *Payment Deadline Safalta-purvak Set Ho Gayi!*\n\n"
        f"Aapka wada darj kar liya gaya hai:\n"
        f"• 💰 *Baki Balance*: ₹{rem_balance:.0f}\n"
        f"• 📅 *Nayi Payment Deadline*: *{formatted_date}*\n\n"
        f"🏪 Sharma Kirana Store ke owner (*Ramesh Sharma ji*) ko aapki deadline suchit kar di gayi hai.\n\n"
        f"Aap chahein toh deadline se pehle bhi kisi bhi samay neeche diye gaye button se UPI se pay kar sakte hain. Dhanyawad! 🙏"
    )

    await query.answer("✅ Payment deadline set ho gayi!")
    if query.message and isinstance(query.message, Message):
        deadline_upi = (
            f"upi://pay?pa=sharmakirana@paytm&pn=Sharma%20Kirana"
            f"&am={rem_balance:.2f}&cu=INR&tn=Udhaar%20Deadline"
        )
        await query.message.answer(
            confirmation_text,
            reply_markup=get_khata_action_keyboard(
                pay_token=pay_token, amount_rupees=rem_balance, pay_url=pay_url, upi_intent=deadline_upi
            ),
            parse_mode="Markdown",
        )


# ─── Handle: Bill Details ─────────────────────────────────────────────────────

@router.callback_query(F.data == "khata:details")
async def handle_khata_details(query: CallbackQuery) -> None:
    """Show detailed breakdown of past and open ledger purchases."""
    if not query.from_user:
        return

    db = get_db()
    cust_doc = await db.customers.find_one({"telegram.chat_id": query.from_user.id})
    customer_id = cust_doc.get("_id") if cust_doc else "cust_sharma_001"

    cursor = db.khata_entries.find({"customer_id": customer_id}).sort("opened_at", -1).limit(5)
    lines = ["📜 *Pichhle Bahi-Khata Ledger Entries:*\n"]
    found_any = False

    async for entry in cursor:
        found_any = True
        dt = entry.get("opened_at")
        dt_str = dt.strftime("%d %b %Y") if isinstance(dt, datetime.datetime) else "Recent"
        tot = entry.get("amount_total_paise", 0) / 100.0
        paid = entry.get("amount_paid_paise", 0) / 100.0
        bal = tot - paid
        status_str = entry.get("status", "open").upper()
        if paid > 0:
            lines.append(
                f"• {dt_str}: Total ₹{tot:.0f}\n"
                f"  ✅ Paid ₹{paid:.0f} | ⚠️ Baki ₹{bal:.0f} [{status_str}]"
            )
        else:
            lines.append(f"• {dt_str}: ₹{tot:.0f} [{status_str}]")

    if not found_any:
        lines.append("• 24 Sep: 2L Fortune Oil + 5kg Atta (₹950)")
        lines.append("  ✅ Paid: ₹500 | ⚠️ Baki: ₹450 [PARTIAL]")
        lines.append("• 28 Sep: 500g Ghee + Tata Salt (₹400) [OPEN]")
        lines.append("• 30 Sep: Grocery & Masale (₹500) [OPEN]")

    lines.append("\n💡 Kisi bhi enquiry ke liye aap dukaandar se seedha sampark kar sakte hain.")

    await query.answer()
    if query.message and isinstance(query.message, Message):
        await query.message.answer("\n".join(lines), parse_mode="Markdown")


@router.message(F.photo)
async def handle_khata_photo_upload(message: Message) -> None:
    """Process uploaded bill or handwritten register photo via Sarvam Document Intelligence OCR."""
    if not message.photo:
        return

    status_msg = await message.answer(
        "📸 *Photo Prapt Hua!*\n\n"
        "⏳ *Sarvam Document Intelligence (hi-IN) OCR* se bahi-khata / bill scan aur digitize kar rahe hain...\n"
        "_Kripya thoda intezaar karein..._",
        parse_mode="Markdown",
    )

    try:
        photo = message.photo[-1]
        bot = message.bot
        if not bot:
            return

        file_info = await bot.get_file(photo.file_id)
        if not file_info.file_path:
            await status_msg.edit_text("❌ Photo download nahi ho paya. Kripya dobara bhejein.")
            return

        file_bytes_io = io.BytesIO()
        await bot.download_file(file_info.file_path, destination=file_bytes_io)
        file_bytes = file_bytes_io.getvalue()

        ocr_client = get_ocr_client()
        ocr_result = await ocr_client.extract_khata_rows(file_bytes)
        rows = ocr_result.get("rows", [])

        if not rows:
            await status_msg.edit_text(
                "⚠️ *OCR Parinam:* Bahi-khata ya bill entry saaf nahi padhi ja saki.\n\n"
                "Kripya acchi roshni me seedha photo khinchein ya Vyom Web App se scan karein.",
                parse_mode="Markdown",
            )
            return

        # Structure and save to DB
        db = get_db()
        now_dt = Clock.now()
        scan_id = f"scan_tg_{int(now_dt.timestamp())}"

        scan_doc = {
            "_id": scan_id,
            "merchant_id": "merchant_sharma_01",
            "status": "confirmed",
            "created_via": "telegram",
            "created_at": now_dt,
            "rows": rows,
        }
        await db.khata_scans.insert_one(scan_doc)

        total_paise = sum(r.get("amount_paise", 0) for r in rows)
        total_rs = total_paise / 100.0

        lines = [
            "✅ *Sarvam Document Intelligence OCR — Khata Digitize Hua!*\n",
            f"📋 *Extracted Entries ({len(rows)} rows):*",
        ]
        for r in rows[:8]:
            amt = r.get("amount_paise", 0) / 100.0
            name = r.get("customer_name", "Grahak")
            items = r.get("items_summary", "Kirana items")
            typ = "Udhaar" if r.get("entry_type") == "credit_given" else "Jama"
            lines.append(f"• *{name}*: ₹{amt:.0f} ({items}) [{typ}]")

        lines.append(f"\n💰 *Kul Rashi (Total): ₹{total_rs:.0f}*")
        lines.append("\n✅ Yeh entries Sharma Kirana digital bahi-khate me safalta-purvak jud gayi hain!")

        await status_msg.edit_text("\n".join(lines), parse_mode="Markdown")

    except Exception as exc:
        logger.error("khata_photo_ocr_error", error=str(exc))
        await status_msg.edit_text(
            "⚠️ Photo process karne me samasya aayi. Kripya thodi der baad dobara koshish karein.",
            parse_mode="Markdown",
        )


@router.message(F.document)
async def handle_khata_document_upload(message: Message) -> None:
    """Process uploaded PDF or image document via Sarvam Document Intelligence OCR."""
    if not message.document:
        return

    doc = message.document
    mime = doc.mime_type or ""
    if not (mime.startswith("image/") or mime == "application/pdf"):
        return

    status_msg = await message.answer(
        "📄 *Document Prapt Hua!*\n\n"
        "⏳ *Sarvam Document Intelligence (hi-IN) OCR* se document process kar rahe hain...\n"
        "_Kripya thoda intezaar karein..._",
        parse_mode="Markdown",
    )

    try:
        bot = message.bot
        if not bot:
            return

        file_info = await bot.get_file(doc.file_id)
        if not file_info.file_path:
            await status_msg.edit_text("❌ Document download nahi ho paya. Kripya dobara bhejein.")
            return

        file_bytes_io = io.BytesIO()
        await bot.download_file(file_info.file_path, destination=file_bytes_io)
        file_bytes = file_bytes_io.getvalue()

        ocr_client = get_ocr_client()
        ocr_result = await ocr_client.extract_khata_rows(file_bytes)
        rows = ocr_result.get("rows", [])

        if not rows:
            await status_msg.edit_text(
                "⚠️ *OCR Parinam:* Document me bahi-khata records saaf nahi mile.\n\n"
                "Kripya saaf photo ya PDF upload karein.",
                parse_mode="Markdown",
            )
            return

        db = get_db()
        now_dt = Clock.now()
        scan_id = f"scan_tg_doc_{int(now_dt.timestamp())}"

        scan_doc = {
            "_id": scan_id,
            "merchant_id": "merchant_sharma_01",
            "status": "confirmed",
            "created_via": "telegram",
            "created_at": now_dt,
            "rows": rows,
        }
        await db.khata_scans.insert_one(scan_doc)

        total_paise = sum(r.get("amount_paise", 0) for r in rows)
        total_rs = total_paise / 100.0

        lines = [
            "✅ *Sarvam Document Intelligence OCR — Document Digitize Hua!*\n",
            f"📋 *Extracted Entries ({len(rows)} rows):*",
        ]
        for r in rows[:8]:
            amt = r.get("amount_paise", 0) / 100.0
            name = r.get("customer_name", "Grahak")
            items = r.get("items_summary", "Kirana items")
            typ = "Udhaar" if r.get("entry_type") == "credit_given" else "Jama"
            lines.append(f"• *{name}*: ₹{amt:.0f} ({items}) [{typ}]")

        lines.append(f"\n💰 *Kul Rashi (Total): ₹{total_rs:.0f}*")
        lines.append("\n✅ Yeh entries Sharma Kirana digital bahi-khate me safalta-purvak jud gayi hain!")

        await status_msg.edit_text("\n".join(lines), parse_mode="Markdown")

    except Exception as exc:
        logger.error("khata_doc_ocr_error", error=str(exc))
        await status_msg.edit_text(
            "⚠️ Document process karne me samasya aayi. Kripya thodi der baad dobara koshish karein.",
            parse_mode="Markdown",
        )

