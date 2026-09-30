"""Translation and Transliteration interface: Sarvam mayura:v1 and Mock."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import ClassVar

import httpx
import structlog

from vyom.config import Settings, get_settings

logger = structlog.get_logger()


class BaseTranslateClient(ABC):
    """Abstract interface for translation across Indian languages."""

    @abstractmethod
    async def translate(
        self,
        text: str,
        source_language: str = "en-IN",
        target_language: str = "hi-IN",
    ) -> str:
        """Translate text from source to target language."""


class SarvamTranslateClient(BaseTranslateClient):
    """Production client calling Sarvam Translate (mayura:v1)."""

    def __init__(self, settings: Settings) -> None:
        self.base_url = settings.sarvam_base_url.rstrip("/")
        self.api_key = settings.sarvam_api_key

    async def translate(
        self,
        text: str,
        source_language: str = "en-IN",
        target_language: str = "hi-IN",
    ) -> str:
        url = f"{self.base_url}/translate"
        headers = {
            "api-subscription-key": self.api_key,
            "Content-Type": "application/json",
        }
        payload = {
            "input": text,
            "source_language_code": source_language,
            "target_language_code": target_language,
            "speaker_gender": "Female",
            "mode": "formal",
            "model": "mayura:v1",
        }

        async with httpx.AsyncClient(timeout=20.0) as client:
            try:
                resp = await client.post(url, headers=headers, json=payload)
                resp.raise_for_status()
                data = resp.json()
                translated_text: str = data.get("translated_text", text)
                return translated_text
            except Exception as exc:
                logger.error("sarvam_translate_failed", error=str(exc))
                raise


class MockTranslateClient(BaseTranslateClient):
    """Deterministic mock translation dictionary for core app strings."""

    _MOCK_DICTIONARY: ClassVar[dict[str, dict[str, str]]] = {
        "Namaste": {"hi-IN": "नमस्ते", "mr-IN": "नमस्कार", "en-IN": "Hello"},
        "Special Offer": {"hi-IN": "विशेष छूट", "mr-IN": "विशेष सवलत", "en-IN": "Special Offer"},
        "Payment Reminder": {"hi-IN": "उधार भुगतान स्मरण", "mr-IN": "उधारी देय स्मरण", "en-IN": "Payment Reminder"},
    }

    async def translate(
        self,
        text: str,
        source_language: str = "en-IN",
        target_language: str = "hi-IN",
    ) -> str:
        if source_language == target_language:
            return text

        for eng_key, translations in self._MOCK_DICTIONARY.items():
            if eng_key.lower() in text.lower() and target_language in translations:
                return translations[target_language]

        # Standard prefix indicator for mock translations
        if "mr" in target_language:
            return f"[मराठी] {text}"
        elif "hi" in target_language:
            return f"[हिंदी] {text}"
        return text


def get_translate_client(settings: Settings | None = None) -> BaseTranslateClient:
    """Factory selecting the translation client."""
    cfg = settings or get_settings()

    if cfg.ai_mode == "mock":
        return MockTranslateClient()

    if cfg.sarvam_api_key:
        return SarvamTranslateClient(cfg)

    logger.warning("no_translate_api_key_found_using_mock")
    return MockTranslateClient()
