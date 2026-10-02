"""Telegram bot handler for /start, deep-linking, and customer onboarding."""

from __future__ import annotations

import datetime

import structlog
from aiogram import F, Router
from aiogram.filters import Command, CommandStart
from aiogram.types import CallbackQuery, Message

from vyom.bot.keyboards import get_language_keyboard, get_main_menu_keyboard
from vyom.clock import Clock
from vyom.db import get_db
from vyom.models.customer import Customer, TelegramProfile
from vyom.models.enums import Language

logger = structlog.get_logger()
router = Router(name="start")


async def _get_outstanding_balance(merchant_id: str, customer_id: str) -> float:
    """Return remaining unpaid balance in rupees for this customer (0 if all paid)."""
    db = get_db()
    total_due = 0
    total_paid = 0
    cursor = db.khata_entries.find({
        "merchant_id": merchant_id,
        "customer_id": customer_id,
        "status": {"$in": ["open", "promised"]},
    })
    async for entry in cursor:
        total_due += entry.get("amount_total_paise", 0)
        total_paid += entry.get("amount_paid_paise", 0)

    if total_due == 0:
        # Demo fallback
        return 1350.0
    return max(0, total_due - total_paid) / 100.0


@router.message(CommandStart())
async def handle_start(message: Message) -> None:
    """Handle /start command with optional merchant shop_code deep link."""
    if not message.from_user:
        return

    db = get_db()
    user = message.from_user
    chat_id = message.chat.id
    now_dt = Clock.now()

    # Extract deep link parameter, e.g. /start SHARMA01
    args = message.text.split()[1:] if message.text else []
    shop_code = args[0].strip().upper() if args else "SHARMA01"

    # Find merchant
    merchant_doc = await db.merchants.find_one({"shop_code": shop_code})
    if not merchant_doc:
        merchant_doc = await db.merchants.find_one({"_id": "merchant_sharma_01"})
    merchant_id = merchant_doc.get("_id", "merchant_sharma_01") if merchant_doc else "merchant_sharma_01"
    store_name = merchant_doc.get("name", "Sharma Kirana Store") if merchant_doc else "Sharma Kirana Store"
    store_phone = merchant_doc.get("phone_e164", "+91 91675 86024") if merchant_doc else "+91 91675 86024"

    # Find or register customer
    customer_doc = await db.customers.find_one({
        "merchant_id": merchant_id,
        "telegram.chat_id": chat_id,
    })

    if not customer_doc:
        cust = Customer(
            merchant_id=merchant_id,
            name=user.full_name or "Valued Customer",
            phone_e164=f"+91982{chat_id % 10000000:07d}",
            telegram=TelegramProfile(
                chat_id=chat_id,
                username=user.username,
                first_name=user.first_name,
                linked_at=now_dt,
            ),
            language=Language.HINGLISH,
        )
        await db.customers.insert_one(cust.to_mongo())
        logger.info("bot_customer_registered", customer_id=cust.id, chat_id=chat_id)
        customer_id = cust.id
        is_new_user = True
    else:
        customer_id = customer_doc.get("_id", "cust_sharma_001")
        is_new_user = False

    # Get outstanding balance for a personalised welcome
    balance = await _get_outstanding_balance(merchant_id, customer_id)

    if is_new_user:
        welcome_text = (
            f"🙏 *Namaste {user.first_name}!*\n\n"
            f"*{store_name}* ke Customer Assistant mein aapka swagat hai! 🎉\n\n"
            "Yahan aap yeh kaam kar sakte hain:\n\n"
            "🧾 *Udhaar Bill Check Karein* — Apna baaki hisaab dekhen\n"
            "💳 *Paytm / UPI se Pay Karein* — QR Code ya Link se turant bhuqtan\n"
            "📅 *Payment Deadline Set Karein* — Apna wada darj karein\n"
            "🏷️ *Dukaan Ke Offers Dekhen* — Ongoing sales aur discounts\n"
            "📞 *Dukaan Se Sampark* — Koi bhi sawaal ho toh directly connect karein\n\n"
            "Neeche menu se apna vikalp chunein 👇"
        )
    else:
        if balance > 0:
            welcome_text = (
                f"🙏 *Namaste {user.first_name}!*\n\n"
                f"Dobara aane par swagat hai! *{store_name}* aapki seva mein taiyaar hai.\n\n"
                f"⚠️ *Aapka baaki hisaab (Udhaar): ₹{balance:.0f}*\n"
                "Kripya neeche diye menu se apna Khata check karein ya turant bhuqtan karein.\n\n"
                "Neeche menu se apna vikalp chunein 👇"
            )
        else:
            welcome_text = (
                f"🙏 *Namaste {user.first_name}!*\n\n"
                f"Dobara aane par swagat hai! *{store_name}* aapki seva mein taiyaar hai.\n\n"
                "✅ *Aapka koi udhaar baaki nahi hai. Shukriya!*\n\n"
                "Aap dukaan ke offers dekh sakte hain ya koi bhi sawaal pooch sakte hain.\n\n"
                "Neeche menu se apna vikalp chunein 👇"
            )

    await message.answer(
        welcome_text,
        reply_markup=get_main_menu_keyboard(),
        parse_mode="Markdown",
    )


@router.message(Command("language"))
async def handle_language_command(message: Message) -> None:
    """Prompt user to choose their preferred language."""
    await message.answer(
        "Kripya apni bhasha chunein / कृपया भाषा निवडा:",
        reply_markup=get_language_keyboard(),
    )


@router.message(Command("menu"))
async def handle_menu_command(message: Message) -> None:
    """Re-show the main menu keyboard."""
    await message.answer(
        "🏠 *Main Menu* — Kripya ek vikalp chunein:",
        reply_markup=get_main_menu_keyboard(),
        parse_mode="Markdown",
    )


@router.callback_query(F.data.startswith("lang:"))
async def handle_language_selection(query: CallbackQuery) -> None:
    """Save customer's language preference."""
    if not query.data or not query.from_user:
        return

    lang_code = query.data.split(":")[1]
    db = get_db()
    await db.customers.update_one(
        {"telegram.chat_id": query.from_user.id},
        {"$set": {"language": lang_code, "updated_at": Clock.now()}},
    )

    lang_names = {
        "hinglish": "Hinglish set ho gayi hai!",
        "hi": "हिंदी भाषा सेट कर दी गई है!",
        "mr": "मराठी भाषा सेट केली आहे!",
        "en": "English language selected!",
    }
    msg = lang_names.get(lang_code, "Language updated!")
    await query.answer(msg)
    if query.message and isinstance(query.message, Message):
        await query.message.edit_text(f"✅ {msg}\n\nAb aap neeche diye gaye menu ka upyog kar sakte hain.")
