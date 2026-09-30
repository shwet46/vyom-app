"""Telegram bot handler for /start, deep-linking, and customer onboarding."""

from __future__ import annotations

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

    # Find or register customer
    customer_doc = await db.customers.find_one({
        "merchant_id": merchant_id,
        "telegram.chat_id": chat_id,
    })

    if not customer_doc:
        # Check if customer exists by phone or username
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
    else:
        cust = Customer.model_validate(customer_doc)

    welcome_text = (
        f"🙏 **Namaste {user.first_name}!**\n\n"
        f"Aapka swagat hai **{store_name}** ke Telegram bot par.\n\n"
        "Yahan aap:\n"
        "• Dukan ka fresh samaan aur specials dekh sakte hain\n"
        "• Vrat aur Festival Puja Kits pre-order kar sakte hain\n"
        "• Apna Udhaar (Khata) hisaab dekh aur UPI se bhuqtan kar sakte hain\n"
        "• Bol kar (Voice Note se) seedha order de sakte hain!\n\n"
        "Neeche diye gaye menu se chunav karein:"
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
        await query.message.edit_text(f"✅ {msg}")
