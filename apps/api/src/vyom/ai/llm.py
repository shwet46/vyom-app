"""LLM client interface and implementations: Sarvam 105b, Google Gemini, and deterministic Mock."""

from __future__ import annotations

import json
from abc import ABC, abstractmethod
from typing import Any

import httpx
import structlog

from vyom.config import Settings, get_settings

logger = structlog.get_logger()


class BaseLLMClient(ABC):
    """Abstract interface for LLM chat completions and structured generation."""

    @abstractmethod
    async def generate(
        self,
        messages: list[dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 1024,
        json_mode: bool = False,
    ) -> str:
        """Generate response text or JSON string given chat messages."""


class SarvamLLMClient(BaseLLMClient):
    """Production client calling Sarvam AI chat completions (sarvam-105b)."""

    def __init__(self, settings: Settings) -> None:
        self.base_url = settings.sarvam_base_url.rstrip("/")
        self.api_key = settings.sarvam_api_key
        self.model = settings.sarvam_llm_model  # "sarvam-105b"

    async def generate(
        self,
        messages: list[dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 1024,
        json_mode: bool = False,
    ) -> str:
        url = f"{self.base_url}/v1/chat/completions"
        headers = {
            "api-subscription-key": self.api_key,
            "Content-Type": "application/json",
        }
        payload: dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if json_mode:
            payload["response_format"] = {"type": "json_object"}

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                resp = await client.post(url, headers=headers, json=payload)
                resp.raise_for_status()
                data = resp.json()
                content: str = data["choices"][0]["message"]["content"]
                return content
            except Exception as exc:
                logger.error("sarvam_llm_call_failed", error=str(exc))
                raise


class GeminiLLMClient(BaseLLMClient):
    """Production client calling Google Gemini (gemini-2.5-flash)."""

    def __init__(self, settings: Settings) -> None:
        self.api_key = settings.google_gemini_api_key
        self.model = settings.google_gemini_model  # "gemini-2.5-flash"

    async def generate(
        self,
        messages: list[dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 1024,
        json_mode: bool = False,
    ) -> str:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
        headers = {"Content-Type": "application/json"}

        # Convert chat messages to Gemini contents structure
        contents = []
        for m in messages:
            role = "user" if m.get("role") in ("user", "system") else "model"
            contents.append({"role": role, "parts": [{"text": m.get("content", "")}]})

        body: dict[str, Any] = {
            "contents": contents,
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens,
            },
        }
        if json_mode:
            body["generationConfig"]["responseMimeType"] = "application/json"

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                resp = await client.post(url, headers=headers, json=body)
                resp.raise_for_status()
                data = resp.json()
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        return str(parts[0].get("text", ""))
                return ""
            except Exception as exc:
                logger.error("gemini_llm_call_failed", error=str(exc))
                raise


class MockLLMClient(BaseLLMClient):
    """Deterministic, context-aware mock LLM for testing and zero-key demo mode."""

    async def generate(
        self,
        messages: list[dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 1024,
        json_mode: bool = False,
    ) -> str:
        prompt_text = " ".join([m.get("content", "") for m in messages]).lower()

        # 1. JSON mode generation
        if json_mode:
            if "winback" in prompt_text or "campaign" in prompt_text:
                return json.dumps({
                    "headline": "Special Offer for You",
                    "body": "Namaste! Aapke pasandeeda kirana samaan par is hafte special 8% discount.",
                    "offer_type": "discount",
                    "discount_pct": 8.0,
                    "target_items": ["Fortune Sunlite Oil 1L", "Aashirvaad Shudh Chakki Atta 5kg"],
                })
            elif "kit" in prompt_text or "festival" in prompt_text:
                return json.dumps({
                    "kit_name": "Navratri Shuddh Vrat Kit",
                    "items": ["Sabudana 500g", "Singhara Atta 500g", "Sendha Namak 1kg", "Cow Ghee 500ml"],
                    "bundle_price_rupees": 450.0,
                    "discount_pct": 7.0,
                })
            elif "stock" in prompt_text:
                return json.dumps({
                    "category": "vrat_special",
                    "recommended_reorder_units": 65,
                    "confidence": 0.92,
                    "reasoning": "Navratri demand surge 2.4x based on Pune regional customer base.",
                })
            else:
                return json.dumps({
                    "reply": "Request processed successfully.",
                    "status": "ok",
                })

        # 2. Free-text generation
        if "navratri" in prompt_text:
            return (
                "Navratri ke liye humne aapke store ke liye special Vrat Essentials Kit tayyar ki hai. "
                "Isme Sabudana, Singhara Atta aur Cow Ghee shamil hain. Aap is campaign ko ek click mein bhej sakte hain."
            )
        elif "pitru" in prompt_text or "shradh" in prompt_text:
            return (
                "Pitru Paksha mein Shradh ritual samagri jaise Til, Jau aur Ghee counter ke saamne display karein. "
                "Is samay koi dhamaka sale ya loud promotions na karein."
            )
        elif "udhaar" in prompt_text:
            return (
                "Aapke 5 customers ka udhaar due ho chuka hai. "
                "Pitru Paksha ka dhyan rakhte hue humne gentle aur respectful reminder message draft kiya hai."
            )

        return (
            "Namaste Sharma ji! Main Vyom hoon, aapka AI Business Partner. "
            "Aapki kirana dukaan ki bikri badhane aur khata vasooli ke liye main taiyar hoon."
        )


def get_llm_client(settings: Settings | None = None) -> BaseLLMClient:
    """Factory selecting the appropriate LLM client based on configuration."""
    cfg = settings or get_settings()

    if cfg.ai_mode == "mock":
        return MockLLMClient()

    if cfg.sarvam_api_key:
        return SarvamLLMClient(cfg)

    if cfg.google_gemini_api_key:
        return GeminiLLMClient(cfg)

    logger.warning("no_llm_api_key_found_using_mock")
    return MockLLMClient()
