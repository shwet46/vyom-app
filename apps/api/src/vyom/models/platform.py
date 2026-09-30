"""Platform infrastructure models: memories, AI usage, translation and TTS caches, notifications, push subscriptions."""

from __future__ import annotations

import datetime
from typing import Any

from pydantic import BaseModel, Field

from vyom.models.base import MongoModel
from vyom.models.enums import MemoryKind


class Memory(MongoModel):
    """Long-term learned preferences and commercial campaign outcomes for a merchant."""

    merchant_id: str
    kind: MemoryKind
    text: str
    metadata: dict[str, Any] = Field(default_factory=dict)
    weight: float = 1.0
    forgotten: bool = False


class AIUsage(MongoModel):
    """Granular tracking of token, audio-seconds, or page-count usage across AI providers."""

    merchant_id: str
    provider: str  # sarvam | google | openai
    model: str  # sarvam-105b, saaras:v3, bulbul:v3, etc.
    kind: str  # llm | stt | tts | ocr | translate
    units: float  # tokens, seconds, characters, or pages
    est_cost_paise: int = 0
    ts: datetime.datetime = Field(default_factory=datetime.datetime.now)


class TranslationCache(MongoModel):
    """Cached UI or text translations to eliminate redundant API calls."""

    cache_key: str  # sha256(source + lang + glossary_version)
    source_text: str
    target_lang: str
    translated_text: str


class TTSCache(MongoModel):
    """Cached audio syntheses for recurring announcements or greetings (30d TTL)."""

    cache_key: str  # sha256(text + voice_id + pace)
    text: str
    voice_id: str
    audio_base64: str
    format: str = "wav"


class PushSubscriptionKeys(BaseModel):
    """P256dh and auth keys for web push."""

    p256dh: str
    auth: str


class PushSubscription(MongoModel):
    """Browser Web Push VAPID subscription for real-time notifications."""

    merchant_id: str
    endpoint: str
    keys: PushSubscriptionKeys


class Notification(MongoModel):
    """Merchant dashboard alert or urgent event."""

    merchant_id: str
    title: str
    body: str
    kind: str = "info"  # info | warning | success | urgent
    action_link: str | None = None
    read: bool = False
