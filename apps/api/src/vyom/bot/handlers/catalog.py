"""Telegram bot handlers for store information, specials, and catalog search."""

from __future__ import annotations

from aiogram import F, Router
from aiogram.types import Message

from vyom.db import get_db

router = Router(name="catalog")


@router.message(F.text == "🛍️ Store & Specials")
async def handle_store_info(message: Message) -> None:
    """Display store details, opening hours, and today's specials."""
    db = get_db()
    merchant_doc = await db.merchants.find_one({"_id": "merchant_sharma_01"})
    if not merchant_doc:
        merchant_doc = await db.merchants.find_one({})

    name = merchant_doc.get("name", "Sharma Kirana Store") if merchant_doc else "Sharma Kirana Store"
    address = merchant_doc.get("address", "Shop No 4, Somwar Peth, Pune 411011") if merchant_doc else "Pune"
    timings = ", ".join(merchant_doc.get("timings", ["08:00 - 22:00"])) if merchant_doc else "08:00 - 22:00"
    special = merchant_doc.get("todays_special", "Fresh Vrat Sabudana & Pure Gir Cow Ghee available") if merchant_doc else "Fresh items in stock"

    text = (
        f"🏪 **{name}**\n\n"
        f"📍 **Address**: {address}\n"
        f"⏰ **Timings**: {timings}\n\n"
        f"⭐ **Today's Special**:\n_{special}_\n\n"
        "Kuch bhi search karne ke liye bas item ka naam likh kar bhejein (jaise: 'tel' ya 'sabudana')."
    )

    await message.answer(text, parse_mode="Markdown")


@router.message(F.text == "🔍 Search Items")
async def handle_search_prompt(message: Message) -> None:
    """Prompt user to enter product keywords."""
    await message.answer(
        "Aapko jo samaan chahiye uska naam likhein:\n_(Udaharan: Atta, Tel, Sabudana, Ghee, Maggi)_",
        parse_mode="Markdown",
    )


@router.message(F.text == "📞 Contact Store")
async def handle_contact_store(message: Message) -> None:
    """Display merchant phone number and contact info."""
    db = get_db()
    merchant_doc = await db.merchants.find_one({"_id": "merchant_sharma_01"})
    phone = merchant_doc.get("phone_e164", "+919876543210") if merchant_doc else "+919876543210"
    owner = merchant_doc.get("owner_name", "Ramesh Sharma") if merchant_doc else "Ramesh Sharma"

    await message.answer(
        f"📞 **Store Contact**\n\n"
        f"Dukaandar: {owner}\n"
        f"Phone/WhatsApp: {phone}\n\n"
        "Kisi bhi query ke liye aap seedha call ya WhatsApp kar sakte hain.",
        parse_mode="Markdown",
    )
