"""Telegram bot handlers for store contact and query escalation to merchant."""

from __future__ import annotations

import structlog
from aiogram import F, Router
from aiogram.types import CallbackQuery, InlineKeyboardButton, InlineKeyboardMarkup, Message

from vyom.bot.keyboards import get_escalation_keyboard, get_main_menu_keyboard
from vyom.clock import Clock
from vyom.core.sse import sse_hub
from vyom.db import get_db

logger = structlog.get_logger()
router = Router(name="catalog")

def _clean_phone_number(phone: str) -> str:
    """Normalize phone to E.164 digits with leading plus."""
    digits = "".join(c for c in phone if c.isdigit() or c == "+")
    if not digits.startswith("+"):
        digits = "+91" + digits
    return digits


def _build_merchant_vcard(owner: str, store_name: str, phone_e164: str, address: str) -> str:
    """Build standard vCard string for Telegram Contact Card sharing."""
    return (
        "BEGIN:VCARD\r\n"
        "VERSION:3.0\r\n"
        f"FN:{owner} ({store_name})\r\n"
        f"ORG:{store_name}\r\n"
        f"TEL;TYPE=CELL,VOICE,PREF:{phone_e164}\r\n"
        f"ADR;TYPE=WORK:;;{address};Pune;Maharashtra;411011;India\r\n"
        "TITLE:Dukaandar / Store Owner\r\n"
        f"NOTE:{store_name} Customer Support\r\n"
        "END:VCARD\r\n"
    )


# ─── Exact-match bot menu texts go first (order matters in aiogram routing) ────

@router.message(F.text.in_({
    "📞 Dukaan Se Baat Karein (Support)",
    "📞 Contact Store",
    "Contact",
    "Help",
    "Madad",
    "Dukaan",
}))
async def handle_contact_store(message: Message) -> None:
    """Display merchant phone number and direct contact info, sharing native Telegram Contact card."""
    db = get_db()
    merchant_doc = await db.merchants.find_one({"_id": "merchant_sharma_01"})
    phone = merchant_doc.get("phone_e164", "+91 91675 86024") if merchant_doc else "+91 91675 86024"
    owner = merchant_doc.get("owner_name", "Ramesh Sharma") if merchant_doc else "Ramesh Sharma"
    address = merchant_doc.get("address", "Shop No 4, Somwar Peth, Pune 411011") if merchant_doc else "Shop No 4, Somwar Peth, Pune 411011"
    timings = ", ".join(merchant_doc.get("timings", ["08:00 AM - 10:00 PM"])) if merchant_doc else "08:00 AM – 10:00 PM"
    clean_phone = _clean_phone_number(phone)

    text = (
        f"📞 *Sharma Kirana Store — Sampark Karein*\n\n"
        f"• 👨‍💼 Dukaandar: *{owner} ji*\n"
        f"• 📱 Phone / WhatsApp: *{phone}*\n"
        f"• 📍 Pata: {address}\n"
        f"• ⏰ Timings: {timings}\n\n"
        "Kisi bhi sawaal, samaan ki jankari, delivery ya koi bhi madad ke liye\n"
        "seedha *call ya WhatsApp* karein. Hum aapki seva mein hamesha taiyaar hain! 🙏"
    )

    await message.answer(text, reply_markup=get_escalation_keyboard(phone=phone), parse_mode="Markdown")

    # Native Telegram Contact Component
    try:
        vcard = _build_merchant_vcard(owner=owner, store_name="Sharma Kirana Store", phone_e164=clean_phone, address=address)
        await message.answer_contact(
            phone_number=clean_phone,
            first_name=owner,
            last_name="Sharma Kirana Store",
            vcard=vcard,
        )
    except Exception as exc:
        logger.warning("contact_component_send_failed", error=str(exc))


@router.callback_query(F.data == "help:contact")
async def handle_contact_callback(query: CallbackQuery) -> None:
    """Show contact details upon inline button press, sharing native Telegram Contact card."""
    if not query.message or not isinstance(query.message, Message):
        return

    await query.answer()

    # Fetch merchant info directly — no need for message.from_user here
    db = get_db()
    merchant_doc = await db.merchants.find_one({"_id": "merchant_sharma_01"})
    phone = merchant_doc.get("phone_e164", "+91 91675 86024") if merchant_doc else "+91 91675 86024"
    owner = merchant_doc.get("owner_name", "Ramesh Sharma") if merchant_doc else "Ramesh Sharma"
    address = merchant_doc.get("address", "Shop No 4, Somwar Peth, Pune 411011") if merchant_doc else "Shop No 4, Somwar Peth, Pune 411011"
    timings = ", ".join(merchant_doc.get("timings", ["08:00 AM - 10:00 PM"])) if merchant_doc else "08:00 AM – 10:00 PM"
    clean_phone = _clean_phone_number(phone)

    text = (
        f"📞 *Sharma Kirana Store — Sampark Karein*\n\n"
        f"• 👨‍💼 Dukaandar: *{owner} ji*\n"
        f"• 📱 Phone / WhatsApp: *{phone}*\n"
        f"• 📍 Pata: {address}\n"
        f"• ⏰ Timings: {timings}\n\n"
        "Kisi bhi sawaal, samaan ki jankari, delivery ya koi bhi madad ke liye\n"
        "seedha *call ya WhatsApp* karein. Hum aapki seva mein hamesha taiyaar hain! 🙏"
    )
    await query.message.answer(text, reply_markup=get_escalation_keyboard(phone=phone), parse_mode="Markdown")

    # Native Telegram Contact Component
    try:
        vcard = _build_merchant_vcard(owner=owner, store_name="Sharma Kirana Store", phone_e164=clean_phone, address=address)
        await query.message.answer_contact(
            phone_number=clean_phone,
            first_name=owner,
            last_name="Sharma Kirana Store",
            vcard=vcard,
        )
    except Exception as exc:
        logger.warning("contact_component_send_failed", error=str(exc))


@router.callback_query(F.data == "contact:call_info")
async def handle_call_info(query: CallbackQuery) -> None:
    """Share store phone as native Telegram Contact component when customer selects Call Store."""
    db = get_db()
    merchant_doc = await db.merchants.find_one({"_id": "merchant_sharma_01"})
    phone = merchant_doc.get("phone_e164", "+91 91675 86024") if merchant_doc else "+91 91675 86024"
    owner = merchant_doc.get("owner_name", "Ramesh Sharma") if merchant_doc else "Ramesh Sharma"
    address = merchant_doc.get("address", "Shop No 4, Somwar Peth, Pune 411011") if merchant_doc else "Shop No 4, Somwar Peth, Pune 411011"
    clean_phone = _clean_phone_number(phone)
    vcard = _build_merchant_vcard(owner=owner, store_name="Sharma Kirana Store", phone_e164=clean_phone, address=address)

    await query.answer("📞 Contact card")
    if query.message and isinstance(query.message, Message):
        contact_kb = InlineKeyboardMarkup(
            inline_keyboard=[
                [
                    InlineKeyboardButton(
                        text="💬 WhatsApp Store",
                        url=f"https://wa.me/{clean_phone.replace('+', '')}",
                    ),
                ],
                [
                    InlineKeyboardButton(text="🧾 Mera Khata Check Karein", callback_data="khata:check"),
                    InlineKeyboardButton(text="🏠 Main Menu", callback_data="help:menu"),
                ],
            ]
        )
        try:
            await query.message.answer_contact(
                phone_number=clean_phone,
                first_name=owner,
                last_name="Sharma Kirana Store",
                vcard=vcard,
                reply_markup=contact_kb,
            )
        except Exception as exc:
            logger.warning("contact_component_send_failed", error=str(exc))
            await query.message.answer(
                f"📞 *Dukaan Call Info*\n\n"
                f"• Dukaandar: *{owner} ji*\n"
                f"• Phone: `{phone}`\n\n"
                f"Seedha is number par call karne ke liye tap karein: `{phone}`",
                reply_markup=contact_kb,
                parse_mode="Markdown",
            )


@router.callback_query(F.data == "help:menu")
async def handle_back_to_menu(query: CallbackQuery) -> None:
    """Return customer to the main menu."""
    await query.answer()
    if query.message and isinstance(query.message, Message):
        await query.message.answer(
            "🏠 *Main Menu* — Kripya ek vikalp chunein:",
            reply_markup=get_main_menu_keyboard(),
            parse_mode="Markdown",
        )


# ─── Catch-all: escalate unrecognised queries to the merchant ──────────────────

@router.message(F.text)
async def handle_unrecognized_query_escalation(message: Message) -> None:
    """Escalate customer query or doubt to the merchant when outside bot's scope."""
    if not message.text or not message.from_user:
        return

    chat_id = message.from_user.id
    customer_name = message.from_user.full_name or "Valued Customer"
    now_dt = Clock.now()

    db = get_db()
    cust_doc = await db.customers.find_one({"telegram.chat_id": chat_id})
    customer_id = cust_doc.get("_id") if cust_doc else f"cust_tg_{chat_id}"

    merchant_doc = await db.merchants.find_one({"_id": "merchant_sharma_01"})
    phone = merchant_doc.get("phone_e164", "+91 91675 86024") if merchant_doc else "+91 91675 86024"
    owner = merchant_doc.get("owner_name", "Ramesh Sharma") if merchant_doc else "Ramesh Sharma"

    # Record escalation in DB
    escalation_doc = {
        "_id": f"esc_{int(now_dt.timestamp())}_{chat_id}",
        "merchant_id": "merchant_sharma_01",
        "customer_id": customer_id,
        "customer_name": customer_name,
        "chat_id": chat_id,
        "query_text": message.text,
        "status": "escalated_to_merchant",
        "created_at": now_dt,
    }
    try:
        await db.support_escalations.insert_one(escalation_doc)
    except Exception as exc:
        logger.warning("support_escalation_insert_warning", error=str(exc))

    # Real-time SSE alert to merchant web dashboard
    try:
        await sse_hub.broadcast(
            "merchant_sharma_01",
            "customer.query_escalated",
            {
                "escalation_id": escalation_doc["_id"],
                "customer_name": customer_name,
                "query": message.text,
                "chat_id": chat_id,
                "created_at": now_dt.isoformat(),
            },
        )
    except Exception as exc:
        logger.warning("sse_broadcast_warning", error=str(exc))

    clean_phone = phone.replace("+", "").replace(" ", "").replace("-", "")

    # Build escalation inline keyboard (no tel: scheme which Telegram rejects)
    escalation_kb = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="💬 WhatsApp Store Now",
                    url=f"https://wa.me/{clean_phone}?text=Namaste%20{owner}%20ji%2C%20mujhe%20{message.text[:60].replace(' ', '%20')}%20ke%20baare%20mein%20poochhna%20tha.",
                ),
            ],
            [
                InlineKeyboardButton(
                    text=f"📞 Call {owner} ji ({phone})",
                    callback_data="contact:call_info",
                ),
            ],
            [
                InlineKeyboardButton(text="🧾 Mera Khata Check Karein", callback_data="khata:check"),
                InlineKeyboardButton(text="🏠 Main Menu", callback_data="help:menu"),
            ],
        ]
    )

    reply_text = (
        f"🤖 *Sharma Kirana Store — Auto Reply*\n\n"
        f"_\"Kshama karein, main is sawaal ka seedha uttar nahi de sakta._\n"
        f"_Aapki query store ke owner *{owner} ji* ko turant forward kar di hai.\"_\n\n"
        f"━━━━━━━━━━━━━━━━━━━━━━━\n\n"
        f"Aap *turant* dukaandar se seedha sampark kar sakte hain:\n\n"
        f"📱 *Phone / WhatsApp*: `{phone}`\n"
        f"📍 *Pata*: Shop No 4, Somwar Peth, Pune 411011\n"
        f"⏰ *Timings*: 08:00 AM – 10:00 PM\n\n"
        f"🔔 *{owner} ji* jald hi aapke sawaal ka jawab denge. Dhanyawad! 🙏"
    )

    await message.answer(
        reply_text,
        reply_markup=escalation_kb,
        parse_mode="Markdown",
    )
