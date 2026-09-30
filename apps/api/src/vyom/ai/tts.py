"""Text-to-Speech (TTS) interface and implementations: Sarvam bulbul:v3 and Mock."""

from __future__ import annotations

import base64
from abc import ABC, abstractmethod

import httpx
import structlog

from vyom.config import Settings, get_settings

logger = structlog.get_logger()


class BaseTTSClient(ABC):
    """Abstract interface for speech synthesis."""

    @abstractmethod
    async def synthesize(
        self,
        text: str,
        target_language_code: str = "hi-IN",
        speaker: str = "meera",
        pace: float = 1.0,
    ) -> bytes:
        """Synthesize text into playable audio bytes (WAV/MP3)."""


class SarvamTTSClient(BaseTTSClient):
    """Production client calling Sarvam Text-to-Speech using bulbul:v3."""

    def __init__(self, settings: Settings) -> None:
        self.base_url = settings.sarvam_base_url.rstrip("/")
        self.api_key = settings.sarvam_api_key
        self.model = settings.sarvam_tts_model  # "bulbul:v3"

    async def synthesize(
        self,
        text: str,
        target_language_code: str = "hi-IN",
        speaker: str = "meera",
        pace: float = 1.0,
    ) -> bytes:
        url = f"{self.base_url}/text-to-speech"
        headers = {
            "api-subscription-key": self.api_key,
            "Content-Type": "application/json",
        }
        payload = {
            "inputs": [text],
            "target_language_code": target_language_code,
            "speaker": speaker,
            "pitch": 0,
            "pace": pace,
            "model": self.model,
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                resp = await client.post(url, headers=headers, json=payload)
                resp.raise_for_status()
                data = resp.json()
                audios = data.get("audios", [])
                if not audios:
                    raise ValueError("No audio returned from Sarvam TTS")
                return base64.b64decode(audios[0])
            except Exception as exc:
                logger.error("sarvam_tts_call_failed", error=str(exc))
                raise


class MockTTSClient(BaseTTSClient):
    """Deterministic mock speech synthesizer returning a valid 44-byte minimal WAV container."""

    async def synthesize(
        self,
        text: str,
        target_language_code: str = "hi-IN",
        speaker: str = "meera",
        pace: float = 1.0,
    ) -> bytes:
        # Minimal valid 44-byte RIFF WAV header with 0 PCM frames for demo playback
        wav_header = (
            b"RIFF$\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00"
            b"\x80>\x00\x00\x00}\x00\x00\x02\x00\x10\x00data\x00\x00\x00\x00"
        )
        return wav_header


def get_tts_client(settings: Settings | None = None) -> BaseTTSClient:
    """Factory selecting the TTS client."""
    cfg = settings or get_settings()

    if cfg.ai_mode == "mock":
        return MockTTSClient()

    if cfg.sarvam_api_key:
        return SarvamTTSClient(cfg)

    logger.warning("no_tts_api_key_found_using_mock")
    return MockTTSClient()
