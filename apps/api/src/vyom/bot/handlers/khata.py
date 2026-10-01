"""Telegram bot handlers for customer credit balance, hisaab details, and UPI payments."""

from __future__ import annotations

import datetime

import structlog
from aiogram import F, Router
from aiogram.types import CallbackQuery, Message

from vyom.bot.keyboards import get_khata_payment_keyboard
from vyom.clock import Clock
from vyom.db import get_db

logger = structlog.get_logger()
router = Router(name="khata")


@router.message(F.text == "📒 Mera Khata (Udhaar)")
async def handle_my_khata(message: Message) -> None:
    """Display customer's outstanding balance, due date, and payment options."""
    if not message.from_user:
        return

    db = get_db()
    chat_id = message.from_user.id

    cust_doc = await db.customers.find_one({"telegram.chat_id": chat_id})
    if not cust_doc:
        # Fallback to seeded demo customer
        cust_doc = await db.customers.find_one({"_id": "cust_sharma_001"})

    customer_id = cust_doc.get("_id") if cust_doc else "cust_sharma_001"
    customer_name = cust_doc.get("name", "Grahak") if cust_doc else "Grahak"

    # Query open khata entries
    cursor = db.khata_entries.find({
        "customer_id": customer_id,
        "status": {"$in": ["open", "promised"]},
    })

    total_outstanding_paise = 0
    earliest_due: datetime.date | None = None
    entry_count = 0

    async for entry in cursor:
        bal = entry.get("amount_total_paise", 0) - entry.get("amount_paid_paise", 0)
        if bal > 0:
            total_outstanding_paise += bal
            entry_count += 1
            due = entry.get("due_date")
            if due:
                due_d = due.date() if isinstance(due, datetime.datetime) else due
                if not earliest_due or due_d < earliest_due:
                    earliest_due = due_d

    if total_outstanding_paise == 0:
        await message.answer(
            f"🙏 **Namaste {customer_name}!**\n\n"
            "Aapka Sharma Kirana Store par koi bhi hisaab (udhaar) baaki nahi hai. "
            "Aapka account bilkul clean hai! Dhanyawad.",
            parse_mode="Markdown",
        )
        return

    amount_rupees = total_outstanding_paise / 100.0
    due_str = earliest_due.strftime("%d %b %Y") if earliest_due else "Due soon"
    pay_token = f"pay_khata_{customer_id[:10]}_{int(Clock.now().timestamp())}"

    # Upsert Payment intent record in DB
    payment_doc = {
        "_id": f"pay_{pay_token}",
        "merchant_id": "merchant_sharma_01",
        "customer_id": customer_id,
        "amount_paise": total_outstanding_paise,
        "purpose": "udhaar",
        "pay_token": pay_token,
        "status": "created",
        "upi_intent": f"upi://pay?pa=sharmakirana@paytm&pn=Sharma%20Kirana&am={amount_rupees:.2f}&cu=INR&tn=Udhaar%20Settlement",
        "created_at": Clock.now(),
    }
    await db.payments.update_one({"pay_token": pay_token}, {"$set": payment_doc}, upsert=True)

    text = (
        f"📒 **Aapka Khata Hisaab ({customer_name})**\n\n"
        f"• Kul Baki Rashi: **₹{amount_rupees:.0f}**\n"
        f"• Entries: {entry_count} purchases\n"
        f"• Due Date: {due_str}\n\n"
        "Aap niche diye gaye button se seedha Paytm / UPI dwara bhuqtan kar sakte hain:"
    )

    await message.answer(
        text,
        reply_markup=get_khata_payment_keyboard(pay_token=pay_token, amount_rupees=amount_rupees),
        parse_mode="Markdown",
    )


@router.callback_query(F.data == "khata:details")
async def handle_khata_details(query: CallbackQuery) -> None:
    """Show detailed breakdown of ledger entries."""
    if not query.from_user:
        return

    db = get_db()
    cust_doc = await db.customers.find_one({"telegram.chat_id": query.from_user.id})
    customer_id = cust_doc.get("_id") if cust_doc else "cust_sharma_001"

    cursor = db.khata_entries.find({"customer_id": customer_id}).sort("opened_at", -1).limit(5)
    lines = ["📜 **Pichhle Khata Entries:**\n"]

    async for entry in cursor:
        dt = entry.get("opened_at")
        dt_str = dt.strftime("%d/%m") if isinstance(dt, datetime.datetime) else "Recent"
        amt = entry.get("amount_total_paise", 0) / 100.0
        status = entry.get("status", "open").upper()
        lines.append(f"• {dt_str}: ₹{amt:.0f} [{status}]")

    await query.answer()
    if query.message and isinstance(query.message, Message):
        await query.message.answer("\n".join(lines), parse_mode="Markdown")
