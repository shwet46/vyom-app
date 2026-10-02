"""Telegram bot keyboards and interactive menus for customer navigation."""

from __future__ import annotations

from aiogram.types import (
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    KeyboardButton,
    ReplyKeyboardMarkup,
)


def get_main_menu_keyboard() -> ReplyKeyboardMarkup:
    """Customer navigation menu keyboard focused on Khata/Bill, payments, deadlines, store discounts, and store contact."""
    return ReplyKeyboardMarkup(
        keyboard=[
            [
                KeyboardButton(text="🧾 Mera Khata & Bill (Udhaar)"),
                KeyboardButton(text="💳 Abhi Pay Karein (Pay Now / QR)"),
            ],
            [
                KeyboardButton(text="📅 Payment Deadline Set Karein"),
                KeyboardButton(text="🏷️ Dukaan Ke Offers & Sales"),
            ],
            [
                KeyboardButton(text="📞 Dukaan Se Baat Karein (Support)"),
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


def get_khata_action_keyboard(
    pay_token: str,
    amount_rupees: float,
    pay_url: str | None = None,
    upi_intent: str | None = None,
) -> InlineKeyboardMarkup:
    """Action keyboard for viewing bill, paying via Paytm link/QR, or setting payment deadline.

    Note: Telegram only allows http/https URLs in inline buttons (rejects localhost AND upi://).
    When ``pay_url`` is a localhost address (dev mode), the Pay button is rendered as a
    callback button that responds with UPI details as text.
    """
    raw_url = pay_url or f"https://paytm.me/pay?token={pay_token}"
    is_localhost = raw_url.startswith(("http://localhost", "http://127.", "https://localhost"))

    if is_localhost:
        # Dev mode: can't use localhost or upi:// URLs — use a callback button instead
        pay_button = InlineKeyboardButton(
            text=f"💳 Pay ₹{amount_rupees:.0f} — UPI Details",
            callback_data=f"khata:pay_info:{pay_token}:{amount_rupees:.0f}",
        )
    else:
        pay_button = InlineKeyboardButton(
            text=f"💳 Pay ₹{amount_rupees:.0f} — Paytm / UPI",
            url=raw_url,
        )

    return InlineKeyboardMarkup(
        inline_keyboard=[
            [pay_button],
            [
                InlineKeyboardButton(
                    text="📲 QR Code Dekhein & Scan Karein",
                    callback_data=f"khata:qr:{pay_token}",
                ),
            ],
            [
                InlineKeyboardButton(
                    text="📅 Deadline Set Karein",
                    callback_data="khata:set_deadline",
                ),
                InlineKeyboardButton(
                    text="📜 Item Breakdown",
                    callback_data="khata:details",
                ),
            ],
            [
                InlineKeyboardButton(
                    text="📞 Dukaan Se Sampark",
                    callback_data="help:contact",
                ),
                InlineKeyboardButton(
                    text="🏠 Main Menu",
                    callback_data="help:menu",
                ),
            ],
        ]
    )


def get_khata_payment_keyboard(pay_token: str, amount_rupees: float) -> InlineKeyboardMarkup:
    """Legacy helper for settling udhaar via UPI or pay-link."""
    pay_url = f"https://paytm.me/pay?token={pay_token}"
    return get_khata_action_keyboard(pay_token=pay_token, amount_rupees=amount_rupees, pay_url=pay_url)


def get_deadline_selection_keyboard() -> InlineKeyboardMarkup:
    """Inline keyboard for customer setting their payment promise date / deadline."""
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text="⏰ Kal Tak (Tomorrow)", callback_data="deadline:1_day"),
                InlineKeyboardButton(text="🗓️ 3 Din Mein", callback_data="deadline:3_days"),
            ],
            [
                InlineKeyboardButton(text="📆 1 Hafte Mein (7 Days)", callback_data="deadline:7_days"),
                InlineKeyboardButton(text="📅 15 Din Mein", callback_data="deadline:15_days"),
            ],
            [
                InlineKeyboardButton(
                    text="💳 Abhi Pay Karein (Pay Now)",
                    callback_data="khata:pay_now",
                ),
            ],
            [
                InlineKeyboardButton(text="🏠 Main Menu", callback_data="help:menu"),
            ],
        ]
    )


def get_offers_keyboard() -> InlineKeyboardMarkup:
    """Inline keyboard for store offers, ongoing sales, festival discounts, and notification opt-in."""
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="🌸 Navratri Vrat Kit Pre-order (12% Off — ₹450)",
                    callback_data="kit_order:navratri_vrat_kit",
                ),
            ],
            [
                InlineKeyboardButton(
                    text="⚡ Dopahar Flash Hours Details (8% Off)",
                    callback_data="offer:happy_hours",
                ),
            ],
            [
                InlineKeyboardButton(
                    text="📋 Kit Items List Dekhein",
                    callback_data="kit_items:navratri_vrat_kit",
                ),
            ],
            [
                InlineKeyboardButton(
                    text="🔔 Offers Notifications ON Karein",
                    callback_data="offer:notifications_on",
                ),
            ],
            [
                InlineKeyboardButton(
                    text="🧾 Mera Khata Check Karein",
                    callback_data="khata:check",
                ),
                InlineKeyboardButton(
                    text="📞 Dukaan Se Enquiry",
                    callback_data="help:contact",
                ),
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
                    text="📋 View Full Items List",
                    callback_data=f"kit_items:{kit_key}",
                ),
            ],
            [
                InlineKeyboardButton(text="🏠 Main Menu", callback_data="help:menu"),
            ],
        ]
    )


def get_escalation_keyboard(phone: str = "+919167586024") -> InlineKeyboardMarkup:
    """Inline keyboard when a query is escalated to the merchant."""
    clean_phone = phone.replace("+", "").replace(" ", "").replace("-", "")
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="💬 WhatsApp Store",
                    url=f"https://wa.me/{clean_phone}",
                ),
            ],
            [
                InlineKeyboardButton(
                    text=f"📞 Call Store ({phone})",
                    callback_data="contact:call_info",
                ),
            ],
            [
                InlineKeyboardButton(text="🧾 Mera Khata Check Karein", callback_data="khata:check"),
                InlineKeyboardButton(text="🏠 Main Menu", callback_data="help:menu"),
            ],
        ]
    )


def get_campaign_offer_keyboard(
    offer_code: str = "OFFER10",
    phone: str = "+919167586024",
) -> InlineKeyboardMarkup:
    """Inline keyboard for campaign/offer promotions sent directly to Telegram customers."""
    clean_phone = phone.replace("+", "").replace(" ", "").replace("-", "")
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="🏷️ Dukaan Ke Sabhi Offers Dekhein",
                    callback_data="offer:all_offers",
                ),
            ],
            [
                InlineKeyboardButton(
                    text="💬 WhatsApp Store",
                    url=f"https://wa.me/{clean_phone}?text=Namaste%20Sharma%20ji,%20mujhe%20offer%20ka%20labh%20uthana%20hai",
                ),
                InlineKeyboardButton(
                    text="📞 Call Store",
                    callback_data="contact:call_info",
                ),
            ],
            [
                InlineKeyboardButton(
                    text="🧾 Mera Khata Check Karein",
                    callback_data="khata:check",
                ),
                InlineKeyboardButton(
                    text="🏠 Main Menu",
                    callback_data="help:menu",
                ),
            ],
        ]
    )

