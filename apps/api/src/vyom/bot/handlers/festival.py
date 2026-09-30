"""Telegram bot handlers for festival specials, Puja/Vrat Kits, and one-click pre-ordering."""

from __future__ import annotations

import structlog
from aiogram import F, Router
from aiogram.types import CallbackQuery, Message

from vyom.bot.keyboards import get_festival_kit_keyboard
from vyom.clock import Clock
from vyom.core.sse import sse_hub
from vyom.db import get_db

logger = structlog.get_logger()
router = Router(name="festival")


@router.message(F.text == "📦 Festival Kits")
async def handle_festival_kits_menu(message: Message) -> None:
    """Display active festival kits (e.g. Navratri Vrat Kit, Puja Kits)."""
    text = (
        "🌸 **Special Navratri Shuddh Vrat Kit**\n\n"
        "Shuddh aur verified vrat samagri ka complete bundle:\n"
        "• Vrat Special Sabudana (500g)\n"
        "• Pure Cow Ghee (500ml)\n"
        "• Singhara Atta (500g)\n"
        "• Sendha Namak (1kg)\n"
        "• Makhana (250g)\n\n"
        "💰 **Combo Price**: ₹450 ~~(₹510)~~ (Save 12%)\n"
        "📦 Ghar baithe pick-up ke liye pre-order karein:"
    )

    await message.answer(
        text,
        reply_markup=get_festival_kit_keyboard(kit_key="navratri_vrat_kit", price_rupees=450.0),
        parse_mode="Markdown",
    )


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

    # Find customer
    cust_doc = await db.customers.find_one({"telegram.chat_id": chat_id})
    customer_id = cust_doc.get("_id") if cust_doc else f"cust_tg_{chat_id}"

    # Insert Kit Request
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

    # Broadcast real-time SSE event to merchant dashboard
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
        "🎉 **Pre-order Confirmed!**\n\n"
        "Aapka **Navratri Shuddh Vrat Kit** order dukan par record ho gaya hai.\n\n"
        "• Dukaandar Ramesh Sharma ji isey pack karke taiyar rakhenge.\n"
        "• Dukan se pick-up ke samay aap cash ya UPI se pay kar sakte hain.\n\n"
        "Dhanyawad!"
    )

    await query.answer("Pre-order recorded successfully!")
    if query.message and isinstance(query.message, Message):
        await query.message.answer(confirmation_text, parse_mode="Markdown")


@router.callback_query(F.data.startswith("kit_items:"))
async def handle_kit_items_view(query: CallbackQuery) -> None:
    """Show detailed itemized list of what is included in the festival kit."""
    details = (
        "📋 **Navratri Shuddh Vrat Kit Contents:**\n\n"
        "1. Shuddh Sabudana - 500g (₹65)\n"
        "2. Pure Gir Cow Ghee - 500ml (₹280)\n"
        "3. Singhara / Kuttu Atta - 500g (₹75)\n"
        "4. Asli Sendha Namak - 1kg (₹40)\n"
        "5. Phool Makhana - 250g (₹50)\n\n"
        "Total MRP: ₹510 | **Kit Offer: ₹450**"
    )
    await query.answer()
    if query.message and isinstance(query.message, Message):
        await query.message.answer(details, parse_mode="Markdown")
