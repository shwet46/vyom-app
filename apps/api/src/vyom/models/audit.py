"""Audit log tracking all critical mutations, approvals, and AI decisions."""

from __future__ import annotations

import datetime
from typing import Any

from pydantic import Field

from vyom.models.base import MongoModel
from vyom.models.enums import AuditActor


class AuditLog(MongoModel):
    """Immutable audit trail entry for system, merchant, or AI activities."""

    merchant_id: str
    actor: AuditActor
    action: str  # e.g. "campaign.approved", "udhaar.reminder_sent", "guardrail.updated"
    entity_type: str  # "campaign", "khata_entry", "guardrails", "opportunity"
    entity_id: str
    payload_snapshot: dict[str, Any] = Field(default_factory=dict)
    ts: datetime.datetime = Field(default_factory=datetime.datetime.now)
