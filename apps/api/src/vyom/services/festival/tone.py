"""Code-enforced tone and cultural sensitivity rules for message generation."""

from __future__ import annotations

import re
from typing import Any

from vyom.models.enums import ToneProfile


class ToneValidationError(Exception):
    """Raised when generated text violates cultural, religious, or sensitivity rules."""

    def __init__(self, message: str, violations: list[str]) -> None:
        super().__init__(message)
        self.violations = violations


# Banned phrases for solemn festivals (e.g. Pitru Paksha, Shradh)
SOLEMN_BANNED_PHRASES = [
    # English
    "sale",
    "mega sale",
    "dhamaka",
    "super offer",
    "discount",
    "huge discount",
    "buy 1 get 1",
    "hurry up",
    "limited time",
    "loot",
    "celebrate",
    "happy pitru paksha",
    "festive greetings",
    "party",
    "carnival",
    "flat 50%",
    "flat 20%",
    "best deal",
    # Hindi / Hinglish
    "सेल",
    "धमाका",
    "बंपर छूट",
    "भारी छूट",
    "ऑफर",
    "लूट लो",
    "खुशखबरी",
    "बधाई",
    "मुबारक",
    "पार्टी",
]

# Prohibited emojis during solemn periods: only 🙏 is permitted
ALLOWED_SOLEMN_EMOJIS = {"🙏", "\u200d", "\ufe0f"}

# Inappropriate emojis across Indian commercial communication
DISALLOWED_GENERAL_EMOJIS = {"🍺", "🍻", "🍾", "🍷", "🍸", "🍹", "🍖", "🍗", "🥩", "🥓"}

# Religious superiority or guarantee claims strictly disallowed across all tones
GUARANTEE_BANNED_PHRASES = [
    "guaranteed punya",
    "moksha guarantee",
    "paap mukti",
    "bhagwan prasanna honge",
    "100% punya",
    "swarg prapti",
]


class ToneValidator:
    """Enforces tone guidelines and dietary sensitivity on communications."""

    @classmethod
    def validate(
        cls,
        text: str,
        tone_profile: ToneProfile | str,
        excluded_categories: list[str] | None = None,
    ) -> dict[str, Any]:
        """Validate text against tone rules and return a validation report.

        Raises ToneValidationError if violations are found.
        """
        violations: list[str] = []
        clean_text_lower = text.lower()
        profile = ToneProfile(tone_profile) if isinstance(tone_profile, str) else tone_profile

        # 1. Check religious claims or guarantees (banned in all profiles)
        for phrase in GUARANTEE_BANNED_PHRASES:
            if phrase in clean_text_lower:
                violations.append(f"Forbidden religious guarantee or claim: '{phrase}'")

        # 2. Solemn tone profile rules (e.g., Pitru Paksha)
        if profile == ToneProfile.SOLEMN:
            for phrase in SOLEMN_BANNED_PHRASES:
                # Word boundary check for English phrases, substring for Devanagari
                pattern = rf"\b{re.escape(phrase)}\b" if phrase.isascii() else re.escape(phrase)
                if re.search(pattern, clean_text_lower):
                    violations.append(
                        f"Solemn profile violation: promotional phrase '{phrase}' is not allowed"
                    )

            # Check emojis: Only Namaste (🙏) allowed in solemn profile
            for ch in text:
                if ord(ch) > 0x1F000 and ch not in ALLOWED_SOLEMN_EMOJIS:
                    violations.append(
                        f"Solemn profile violation: non-solemn emoji '{ch}' is not permitted"
                    )

        # 3. Observant tone profile rules (e.g., Navratri Vrat)
        elif profile == ToneProfile.OBSERVANT:
            observant_banned = ["non-veg", "chicken", "mutton", "egg", "fish", "meat", "anda"]
            for phrase in observant_banned:
                if re.search(rf"\b{re.escape(phrase)}\b", clean_text_lower):
                    violations.append(
                        f"Observant profile violation: non-fasting item '{phrase}' mentioned"
                    )

        # 4. Check globally disallowed emojis
        for ch in text:
            if ch in DISALLOWED_GENERAL_EMOJIS:
                violations.append(f"Disallowed emoji found: '{ch}'")

        # 5. Check explicitly excluded categories
        if excluded_categories:
            for cat in excluded_categories:
                cat_lower = cat.lower().replace("_", " ")
                if cat_lower in clean_text_lower:
                    violations.append(
                        f"Excluded category violation: '{cat}' cannot be mentioned during this festival"
                    )

        is_valid = len(violations) == 0
        if not is_valid:
            raise ToneValidationError(
                f"Tone validation failed with {len(violations)} violation(s).",
                violations=violations,
            )

        return {"valid": True, "tone_profile": profile.value, "violations": []}
