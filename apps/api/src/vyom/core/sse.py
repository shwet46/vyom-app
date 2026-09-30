"""Server-Sent Events (SSE) hub for real-time merchant dashboard updates."""

from __future__ import annotations

import asyncio
from collections import defaultdict
from typing import Any

import structlog

logger = structlog.get_logger()


class SSEHub:
    """Manages active SSE client connections per merchant and broadcasts events."""

    def __init__(self) -> None:
        self._subscribers: dict[str, set[asyncio.Queue[dict[str, Any]]]] = defaultdict(set)

    def subscribe(self, merchant_id: str) -> asyncio.Queue[dict[str, Any]]:
        """Register a new SSE client queue for a merchant."""
        q: asyncio.Queue[dict[str, Any]] = asyncio.Queue()
        self._subscribers[merchant_id].add(q)
        logger.info("sse_subscribed", merchant_id=merchant_id, total=len(self._subscribers[merchant_id]))
        return q

    def unsubscribe(self, merchant_id: str, queue: asyncio.Queue[dict[str, Any]]) -> None:
        """Remove an SSE client queue."""
        self._subscribers[merchant_id].discard(queue)
        if not self._subscribers[merchant_id]:
            del self._subscribers[merchant_id]
        logger.info("sse_unsubscribed", merchant_id=merchant_id)

    async def broadcast(self, merchant_id: str, event_type: str, data: dict[str, Any]) -> None:
        """Broadcast an event to all connected dashboard tabs of the merchant."""
        queues = list(self._subscribers.get(merchant_id, []))
        if not queues:
            return

        import contextlib

        payload = {"event": event_type, "data": data}
        for q in queues:
            with contextlib.suppress(Exception):
                q.put_nowait(payload)


# Global singleton hub
sse_hub = SSEHub()
