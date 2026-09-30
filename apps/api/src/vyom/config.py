"""Application configuration via environment variables.

All Sarvam model names are pinned here via env vars, never hardcoded in code.
Verified against Sarvam docs Sept 2026.
"""

from __future__ import annotations

from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central configuration. Every value comes from environment or .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ── MongoDB ───────────────────────────────────────────────────────────────
    mongodb_uri: str = "mongodb://localhost:27017/?replicaSet=rs0&directConnection=true"
    mongodb_database: str = "vyom"
    mongodb_username: str = ""
    mongodb_password: str = ""

    # ── Auth ──────────────────────────────────────────────────────────────────
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7  # 1 week

    # ── Telegram Bot ──────────────────────────────────────────────────────────
    telegram_bot_token: str = ""
    telegram_webhook_secret: str = ""
    bot_username: str = ""
    bot_mode: Literal["polling", "webhook"] = "polling"

    # ── Sarvam AI ─────────────────────────────────────────────────────────────
    # Auth header: api-subscription-key
    sarvam_api_key: str = ""
    sarvam_base_url: str = "https://api.sarvam.ai"

    # LLM: sarvam-105b via POST /v1/chat/completions (OpenAI-compatible)
    # sarvam-105b-conversations available for real-time dialogue
    # NOTE: sarvam-m and sarvam-30b are DEPRECATED and rejected by the API
    sarvam_llm_model: str = "sarvam-105b"

    # STT: saaras:v4 is now the latest/recommended (docs Sept 2026)
    # POST /speech-to-text (multipart), modes: transcribe/translate/verbatim/translit/codemix
    # 30s max per REST request. Keyterms supported on v4.
    sarvam_stt_model: str = "saaras:v4"

    # TTS: bulbul:v3 via POST /text-to-speech
    # Returns base64-encoded audio in audios[] array
    sarvam_tts_model: str = "bulbul:v3"

    # Document AI: POST /doc-ai/v1/job/digitise (async job)
    # Sarvam Vision 1.5, max 10 pages per job
    sarvam_doc_ai_enabled: bool = True

    # Realtime STT via WebSocket (saaras:v4 on /speech-to-text-realtime/ws)
    stt_realtime: bool = False

    # ── Google Cloud / Gemini ─────────────────────────────────────────────────
    google_translate_api_key: str = ""
    google_gemini_api_key: str = ""
    google_gemini_model: str = "gemini-2.5-flash"

    # ── Web / CORS ────────────────────────────────────────────────────────────
    web_origin: str = "http://localhost:3000"
    public_api_url: str = "http://localhost:8000"

    # ── Push Notifications ────────────────────────────────────────────────────
    vapid_public_key: str = ""
    vapid_private_key: str = ""

    # ── Mode Switches ─────────────────────────────────────────────────────────
    ai_mode: Literal["live", "mock"] = "mock"
    demo_mode: bool = True
    demo_today: str | None = None  # ISO date, e.g. "2026-09-30"

    # ── Timezone ──────────────────────────────────────────────────────────────
    app_timezone: str = "Asia/Kolkata"

    # ── Server ────────────────────────────────────────────────────────────────
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = False


def get_settings() -> Settings:
    """Factory for settings, cached at module level."""
    return Settings()
