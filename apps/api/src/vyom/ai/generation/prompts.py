"""Prompt templates for marketing copy generation and copilot reasoning."""

from __future__ import annotations


def build_winback_prompt(
    merchant_name: str,
    customer_name: str,
    days_since_last_visit: int,
    favorite_items: list[str],
    tone_profile: str = "festive",
) -> list[dict[str, str]]:
    """Build prompt for generating a warm customer winback message."""
    system_msg = (
        "You are an assistant writing WhatsApp/Telegram messages for an Indian neighbourhood Kirana store. "
        "Keep the message under 40 words, warm, respectful, and authentic. "
        "Use Hinglish or Hindi. Never make false religious promises or mention solemn period sales."
    )
    if tone_profile == "solemn":
        user_msg = (
            f"Store: {merchant_name}. Customer: {customer_name}. "
            f"The customer hasn't visited in {days_since_last_visit} days. "
            "Currently it is Pitru Paksha (a solemn period). DO NOT use words like 'dhamaka', 'bhaari chhoot', or 'loot'. "
            "Write a very respectful check-in asking if they need essential Shradh or puja items."
        )
    else:
        user_msg = (
            f"Store: {merchant_name}. Customer: {customer_name}. "
            f"The customer hasn't visited in {days_since_last_visit} days. "
            f"Their favorite items are: {', '.join(favorite_items[:3])}. "
            "Draft a warm winback message welcoming them back to the store with a friendly tone."
        )

    return [
        {"role": "system", "content": system_msg},
        {"role": "user", "content": user_msg},
    ]


def build_festival_kit_prompt(
    merchant_name: str,
    festival_name: str,
    kit_name: str,
    items: list[str],
    price_rupees: float,
    discount_pct: float,
) -> list[dict[str, str]]:
    """Build prompt for generating festival kit announcement copy."""
    system_msg = (
        "You are writing a short Telegram broadcast for a neighbourhood Kirana store in Pune, India. "
        "Focus on pure, authentic ritual ingredients, convenience, and festival blessings. Under 50 words."
    )
    user_msg = (
        f"Store: {merchant_name}. Upcoming Festival: {festival_name}. "
        f"Kit Name: {kit_name}. Items: {', '.join(items)}. "
        f"Special Price: ₹{price_rupees:.0f} ({discount_pct:.0f}% off). "
        "Write an enthusiastic yet respectful promotional message that customers can order via Telegram."
    )
    return [
        {"role": "system", "content": system_msg},
        {"role": "user", "content": user_msg},
    ]


def build_copilot_system_prompt(
    merchant_name: str,
    shop_code: str,
    city: str,
    active_festival_names: list[str],
) -> str:
    """Build the overarching system prompt for the Vyom Copilot assistant."""
    festivals_str = ", ".join(active_festival_names) if active_festival_names else "None"
    return (
        f"You are VYOM Copilot, an AI Business Partner for {merchant_name} ({shop_code}) in {city}, India. "
        f"Active/Upcoming Festivals: {festivals_str}. "
        "You help the merchant recover silently lost money, optimize inventory before festivals, and collect overdue udhaar politely. "
        "Speak in natural, conversational Hinglish (or Hindi/Marathi if the merchant asks). "
        "Be concise, actionable, and culturally attuned to Indian merchant customs. "
        "Never promise religious guarantees or suggest discounts higher than store guardrails."
    )
