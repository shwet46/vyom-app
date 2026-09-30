"""Audit service recording immutable actions across merchants, AI, and customers."""

from __future__ import annotations

import datetime
from typing import Any

from pymongo.asynchronous.database import AsyncDatabase

from vyom.models.audit import AuditLog
from vyom.models.enums import AuditActor


class AuditService:
    """Records tamper-evident log entries into the audit_log collection."""

    def __init__(self, db: AsyncDatabase) -> None:  # type: ignore[type-arg]
        self.db = db

    async def log(
        self,
        merchant_id: str,
        actor: AuditActor,
        action: str,
        entity_type: str,
        entity_id: str,
        payload_snapshot: dict[str, Any] | None = None,
    ) -> AuditLog:
        entry = AuditLog(
            merchant_id=merchant_id,
            actor=actor,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            payload_snapshot=payload_snapshot or {},
            ts=datetime.datetime.now(datetime.UTC),
        )
        await self.db.audit_log.insert_one(entry.to_mongo())
        return entry
