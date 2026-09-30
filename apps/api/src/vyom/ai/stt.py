"""Speech-to-Text (STT) interface and implementations: Sarvam saaras:v4 and Mock."""

from __future__ import annotations

from abc import ABC, abstractmethod

import httpx
import structlog

from vyom.config import Settings, get_settings

logger = structlog.get_logger()


class BaseSTTClient(ABC):
    """Abstract interface for speech transcription."""

    @abstractmethod
    async def transcribe(
        self,
        audio_bytes: bytes,
        filename: str = "audio.wav",
        language_code: str = "hi-IN",
        prompt: str | None = None,
    ) -> str:
        """Transcribe spoken audio bytes to text."""


class SarvamSTTClient(BaseSTTClient):
    """Production client for Sarvam Speech-to-Text using saaras:v4."""

    def __init__(self, settings: Settings) -> None:
        self.base_url = settings.sarvam_base_url.rstrip("/")
        self.api_key = settings.sarvam_api_key
        self.model = settings.sarvam_stt_model  # "saaras:v4"

    async def transcribe(
        self,
        audio_bytes: bytes,
        filename: str = "audio.wav",
        language_code: str = "hi-IN",
        prompt: str | None = None,
    ) -> str:
        url = f"{self.base_url}/speech-to-text"
        headers = {
            "api-subscription-key": self.api_key,
        }
        data = {
            "model": self.model,
            "language_code": language_code,
        }
        if prompt:
            data["prompt"] = prompt

        files = {
            "file": (filename, audio_bytes, "audio/wav"),
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                resp = await client.post(url, headers=headers, data=data, files=files)
                resp.raise_for_status()
                result = resp.json()
                transcript: str = result.get("transcript", "")
                return transcript
            except Exception as exc:
                logger.error("sarvam_stt_call_failed", error=str(exc))
                raise


class MockSTTClient(BaseSTTClient):
    """Deterministic mock speech transcriber for demo mode and tests."""

    async def transcribe(
        self,
        audio_bytes: bytes,
        filename: str = "audio.wav",
        language_code: str = "hi-IN",
        prompt: str | None = None,
    ) -> str:
        # If audio is small or default test audio, return a realistic Kirana merchant query
        if language_code == "mr-IN":
            return "गणपती विसर्जन नंतर नवरात्रीसाठी साबुदाणा किती मागवायचा?"
        return "Navratri ke liye sabudana aur pure ghee ka stock kitna hai?"


def get_stt_client(settings: Settings | None = None) -> BaseSTTClient:
    """Factory selecting the STT client."""
    cfg = settings or get_settings()

    if cfg.ai_mode == "mock":
        return MockSTTClient()

    if cfg.sarvam_api_key:
        return SarvamSTTClient(cfg)

    logger.warning("no_stt_api_key_found_using_mock")
    return MockSTTClient()
