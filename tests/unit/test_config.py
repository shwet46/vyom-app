"""Unit tests for configuration and settings."""

from __future__ import annotations

from vyom.config import Settings


def test_settings_defaults() -> None:
    settings = Settings()
    assert settings.sarvam_llm_model == "sarvam-105b"
    assert settings.sarvam_stt_model == "saaras:v4"
    assert settings.sarvam_tts_model == "bulbul:v3"
    assert settings.sarvam_tts_speaker == "shubh"
    assert settings.app_timezone == "Asia/Kolkata"
    assert settings.ai_mode in ("mock", "live")


def test_settings_overrides() -> None:
    custom = Settings(
        sarvam_llm_model="custom-llm",
        ai_mode="live",
        demo_today="2026-10-01",
    )
    assert custom.sarvam_llm_model == "custom-llm"
    assert custom.ai_mode == "live"
    assert custom.demo_today == "2026-10-01"
