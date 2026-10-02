"""Telegram bot handlers for ongoing store sales, discounts, festival specials, and kits."""

from __future__ import annotations

import structlog
from aiogram import F, Router
from aiogram.types import CallbackQuery, Message

from vyom.bot.keyboards import get_festival_kit_keyboard, get_main_menu_keyboard, get_offers_keyboard
from vyom.clock import Clock
from vyom.core.sse import sse_hub
from vyom.db import get_db

logger = structlog.get_logger()
router = Router(name="festival")


@router.message(F.text.in_({
    "🏷️ Dukaan Ke Offers & Sales",
    "📦 Festival Kits",
    "Offers",
    "Offer",
    "Sale",
    "Sales",
    "Discount",
    "Discounts",
    "Chhoot",
    "Specials",
}))
async def handle_store_sales_and_discounts(message: Message) -> None:
    """Display active store discounts, ongoing sales, and festival kit pre-orders."""
    now = Clock.now()
    hour = now.hour

    # Time-sensitive offer note
    if 14 <= hour < 16:
        flash_note = "⚡ *ABHI ACTIVE HAI — Dopahar Flash Hours!* 2-4 PM tak 8% off milega! Jaldi aayein! 🔥\n\n"
    else:
        flash_note = (
            f"_Dopahar Flash Hours sirf 2:00 PM – 4:00 PM mein milta hai._\n"
            f"_Abhi: {now.strftime('%I:%M %p')} IST_\n\n"
        )

    text = (
        "🏷️ *Sharma Kirana Store — Ongoing Sales & Discounts (Chal Rahe Offers)*\n\n"
        f"{flash_note}"
        "━━━━━━━━━━━━━━━━━━━━\n\n"
        "1️⃣ 🌸 *Navratri Shuddh Vrat Combo Kit*\n"
        "   Sabudana + Singhara Atta + Pure Gir Cow Ghee + Sendha Namak + Makhana\n"
        "   💰 *Offer: ₹450* ~~(₹510)~~ — *Save 12% OFF!*\n\n"
        "2️⃣ ⚡ *Dopahar Flash Hours* (2:00 PM – 4:00 PM, Mon–Sat)\n"
        "   Sab Daalein, Atta, Khane Tel par *Flat 8% Instant Chhoot!*\n\n"
        "3️⃣ 📦 *Monthly Ration Saving Deal*\n"
        "   ₹1,500+ ki shopping par *₹120 Cash Discount* + Free Home Delivery!\n\n"
        "4️⃣ 💳 *Paytm UPI Fast Pay Reward*\n"
        "   Paytm UPI se bill settle karte hi instant confirmation + reward points!\n\n"
        "5️⃣ 🎁 *Udhaar Clearance Bonus*\n"
        "   Poora udhaar ek baar mein chukao → ₹50 store credit milega!\n\n"
        "━━━━━━━━━━━━━━━━━━━━\n"
        "Neeche se apna vikalp chunein:"
    )

    await message.answer(text, reply_markup=get_offers_keyboard(), parse_mode="Markdown")


@router.callback_query(F.data == "offer:happy_hours")
async def handle_happy_hours_info(query: CallbackQuery) -> None:
    """Show details about afternoon happy hours discount."""
    now = Clock.now()
    hour = now.hour
    is_active = 14 <= hour < 16

    if is_active:
        status_text = "🟢 *ABHI ACTIVE HAI!* Seedha dukaan par aakar labh uthayein!"
    else:
        status_text = f"🔴 Abhi active nahi. Agle 2 PM se 4 PM tak aayein.\n_(Abhi: {now.strftime('%I:%M %p')} IST)_"

    text = (
        "⚡ *Dopahar Flash Hours Offer*\n\n"
        f"{status_text}\n\n"
        "📅 *Timing*: Somwar–Shanivar, 2:00 PM – 4:00 PM\n"
        "🏷️ *Discount*: Sabhi Daalein, Atta, Khane Tel par *8% Flat Off*\n\n"
        "Kripya dukaan par aakar counter par batayein ya advance order Telegram se karein.\n\n"
        "Dhanyawad! 🙏"
    )
    await query.answer()
    if query.message and isinstance(query.message, Message):
        await query.message.answer(text, parse_mode="Markdown")


@router.callback_query(F.data.startswith("kit_order:"))
async def handle_kit_preorder(query: CallbackQuery) -> None:
    """Handle one-click pre-order for a festival kit."""
    if not query.data or not query.from_user:
        return

    kit_key = query.data.split(":")[1]
    db = get_db()
    now_dt = Clock.now()
    chat_id = query.from_user.id
    customer_name = query.from_user.full_name or "Telegram Customer"

    cust_doc = await db.customers.find_one({"telegram.chat_id": chat_id})
    customer_id = cust_doc.get("_id") if cust_doc else f"cust_tg_{chat_id}"

    kit_request = {
        "_id": f"kit_req_{int(now_dt.timestamp())}",
        "merchant_id": "merchant_sharma_01",
        "customer_id": customer_id,
        "customer_name": customer_name,
        "festival_key": "navratri",
        "kit_key": kit_key,
        "amount_paise": 45000,
        "status": "requested",
        "requested_at": now_dt,
    }
    await db.kit_requests.insert_one(kit_request)

    await sse_hub.broadcast(
        "merchant_sharma_01",
        "kit_request.created",
        {
            "kit_request_id": kit_request["_id"],
            "customer_name": customer_name,
            "kit_name": "Navratri Shuddh Vrat Kit",
            "amount_paise": 45000,
            "requested_at": now_dt.isoformat(),
        },
    )

    confirmation_text = (
        "🎉 *Pre-order Confirmed! Discount Applied!*\n\n"
        "Aapka *Navratri Shuddh Vrat Kit (₹450)* order dukan par record ho gaya hai.\n\n"
        "📦 *Kit Contents:*\n"
        "• Vrat Sabudana (500g)\n"
        "• Pure Gir Cow Desi Ghee (500ml)\n"
        "• Singhara / Kuttu Atta (500g)\n"
        "• Shuddh Sendha Namak (1kg)\n"
        "• Premium Phool Makhana (250g)\n\n"
        "✅ Dukaandar *Ramesh Sharma ji* ise pack karke counter par ready rakhenge.\n"
        "💳 Pick-up ke samay Cash ya Paytm QR se pay karein.\n\n"
        "Dhanyawad! 🙏"
    )

    await query.answer("✅ Pre-order recorded successfully!")
    if query.message and isinstance(query.message, Message):
        await query.message.answer(confirmation_text, parse_mode="Markdown")


@router.callback_query(F.data.startswith("kit_items:"))
async def handle_kit_items_view(query: CallbackQuery) -> None:
    """Show detailed itemized list of what is included in the festival kit."""
    details = (
        "📋 *Navratri Shuddh Vrat Kit — Item List:*\n\n"
        "1. 🌾 Vrat Special Sabudana (500g, Clean & Graded)\n"
        "2. 🥛 Pure Gir Cow Desi Ghee (500ml Tin)\n"
        "3. 🌿 Kuttu / Singhara Atta (500g Fresh Ground)\n"
        "4. 🧂 Shuddh Sendha Namak / Rock Salt (1kg)\n"
        "5. 🌰 Premium Phool Makhana (250g Pouch)\n\n"
        "💰 MRP: ~~₹510~~ | *Offer Price: ₹450 (Save ₹60 — 12% Off)*\n\n"
        "📅 Valid through Navratri season only. Limited stock!"
    )
    await query.answer()
    if query.message and isinstance(query.message, Message):
        await query.message.answer(
            details,
            reply_markup=get_festival_kit_keyboard(kit_key="navratri_vrat_kit", price_rupees=450.0),
            parse_mode="Markdown",
        )


@router.callback_query(F.data == "offer:notifications_on")
async def handle_notifications_opt_in(query: CallbackQuery) -> None:
    """Opt customer into store offer/sale notifications."""
    if not query.from_user:
        return

    db = get_db()
    await db.customers.update_one(
        {"telegram.chat_id": query.from_user.id},
        {"$set": {"offer_notifications": True, "updated_at": Clock.now()}},
    )

    await query.answer("✅ Notifications ON!")
    if query.message and isinstance(query.message, Message):
        await query.message.answer(
            "🔔 *Bilkul!* Aapko ab Sharma Kirana Store ke sabhi offers, sales aur discounts ke baare mein turant notification milegi.\n\n"
            "Dhanyawad ki aapne hamare saath bane rehne ka chunav kiya! 🙏",
            parse_mode="Markdown",
        )
