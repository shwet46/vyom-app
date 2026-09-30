"""Telegram customer bot conversations, messages, support relay, and inbox models."""

from __future__ import annotations

import datetime
from typing import Any

from pydantic import BaseModel, Field

from vyom.models.base import MongoModel
from vyom.models.enums import BotMessageDirection, BotMessageKind


class BotOpenContext(BaseModel):
    """Context state tracking active customer goals in bot conversation."""

    active_delivery_id: str | None = None
    active_khata_id: str | None = None
    active_festival_key: str | None = None
    active_kit_request_id: str | None = None
    awaiting: str | None = None  # Expected next input type


class BotConversation(MongoModel):
    """Customer chat state machine with rolling summary and open context."""

    merchant_id: str
    customer_id: str
    chat_id: int
    state: str = "idle"
    rolling_summary: str = ""
    last_intent: str | None = None
    open_context: BotOpenContext = Field(default_factory=BotOpenContext)
    message_count: int = 0
    last_message_at: datetime.datetime | None = None


class BotMessage(MongoModel):
    """Inbound or outbound Telegram message with 90-day retention."""

    conversation_id: str
    merchant_id: str
    customer_id: str
    direction: BotMessageDirection
    kind: BotMessageKind = BotMessageKind.TEXT
    text: str
    transcript: str | None = None
    telegram_message_id: int | None = None
    intent: str | None = None
    entities: dict[str, Any] = Field(default_factory=dict)
    generation_meta: dict[str, Any] = Field(default_factory=dict)
    action_ids: list[str] = Field(default_factory=list)
    ts: datetime.datetime = Field(default_factory=datetime.datetime.now)


class BotUpdateInbox(MongoModel):
    """Deduplication store for raw incoming Telegram updates (TTL 48 hours)."""

    update_id: int  # Unique
    raw_payload: dict[str, Any] = Field(default_factory=dict)


class SupportThread(MongoModel):
    """Human handoff support session between customer and merchant."""

    merchant_id: str
    customer_id: str
    status: str = "open"  # open, resolved
    last_activity_at: datetime.datetime = Field(default_factory=datetime.datetime.now)


class SupportMessage(MongoModel):
    """Relayed message between customer and merchant dashboard."""

    thread_id: str
    sender_type: str  # customer | merchant
    text: str
    ts: datetime.datetime = Field(default_factory=datetime.datetime.now)
