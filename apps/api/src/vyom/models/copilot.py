"""Merchant-facing AI Copilot sessions, messages, and pending action models."""

from __future__ import annotations

import datetime
from typing import Any

from pydantic import BaseModel, Field

from vyom.models.base import MongoModel
from vyom.models.enums import ActionStatus, CopilotMessageKind, CopilotRole, Language


class CopilotToolCall(BaseModel):
    """Function / tool invoked by Copilot."""

    name: str
    args: dict[str, Any] = Field(default_factory=dict)
    result: dict[str, Any] | None = None


class CopilotSession(MongoModel):
    """Interactive conversation thread between merchant and Vyom Copilot."""

    merchant_id: str
    language: Language = Language.HINGLISH
    rolling_summary: str = ""
    last_intent: str | None = None


class CopilotMessage(MongoModel):
    """Spoken or typed exchange between merchant and copilot (90-day TTL)."""

    session_id: str
    merchant_id: str
    role: CopilotRole
    kind: CopilotMessageKind = CopilotMessageKind.TEXT
    text: str
    transcript: str | None = None
    intent: str | None = None
    tool_calls: list[CopilotToolCall] = Field(default_factory=list)
    audio_ref: str | None = None
    ts: datetime.datetime = Field(default_factory=datetime.datetime.now)


class CopilotPendingAction(MongoModel):
    """Two-phase confirmation state for high-consequence merchant actions."""

    merchant_id: str
    session_id: str
    action_type: str  # approve_campaign, send_udhaar_reminder, adjust_guardrail, apply_stock_order
    params: dict[str, Any] = Field(default_factory=dict)
    summary_key: str
    expires_at: datetime.datetime
    status: ActionStatus = ActionStatus.PENDING
    confirmed_via: str | None = None  # tap | voice
