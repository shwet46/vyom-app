"""Telegram bot keyboards and interactive menus for customer navigation."""

from __future__ import annotations

from aiogram.types import (
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    KeyboardButton,
    ReplyKeyboardMarkup,
)


def get_main_menu_keyboard() -> ReplyKeyboardMarkup:
    """Standard customer navigation menu keyboard."""
    return ReplyKeyboardMarkup(
        keyboard=[
            [
                KeyboardButton(text="🛍️ Store & Specials"),
                KeyboardButton(text="📦 Festival Kits"),
            ],
            [
                KeyboardButton(text="📒 Mera Khata (Udhaar)"),
                KeyboardButton(text="🔍 Search Items"),
            ],
            [
                KeyboardButton(text="🗣️ Voice Order"),
                KeyboardButton(text="📞 Contact Store"),
            ],
        ],
        resize_keyboard=True,
        persistent=True,
    )


def get_language_keyboard() -> InlineKeyboardMarkup:
    """Language selection inline keyboard."""
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text="🇮🇳 Hinglish", callback_data="lang:hinglish"),
                InlineKeyboardButton(text="हिंदी", callback_data="lang:hi"),
            ],
            [
                InlineKeyboardButton(text="मराठी", callback_data="lang:mr"),
                InlineKeyboardButton(text="English", callback_data="lang:en"),
            ],
        ]
    )


def get_festival_kit_keyboard(kit_key: str, price_rupees: float) -> InlineKeyboardMarkup:
    """Inline keyboard for one-click festival kit pre-ordering."""
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text=f"🛒 Pre-order Kit (₹{price_rupees:.0f})",
                    callback_data=f"kit_order:{kit_key}",
                ),
            ],
            [
                InlineKeyboardButton(
                    text="📋 View Items List",
                    callback_data=f"kit_items:{kit_key}",
                ),
            ],
        ]
    )


def get_khata_payment_keyboard(pay_token: str, amount_rupees: float) -> InlineKeyboardMarkup:
    """Inline keyboard for settling udhaar via UPI or pay-link."""
    pay_url = f"https://paytm.me/pay?token={pay_token}"
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text=f"💳 Pay ₹{amount_rupees:.0f} via UPI",
                    url=pay_url,
                ),
            ],
            [
                InlineKeyboardButton(
                    text="📜 View Hisaab Details",
                    callback_data="khata:details",
                ),
            ],
        ]
    )
