"""Server-Sent Events (SSE) endpoint streaming real-time alerts to the merchant PWA."""

from __future__ import annotations

import asyncio
import json
from collections.abc import AsyncGenerator

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from vyom.core.deps import CurrentMerchant
from vyom.core.sse import sse_hub

router = APIRouter(prefix="/events", tags=["Events"])


@router.get("")
async def sse_endpoint(merchant: CurrentMerchant) -> StreamingResponse:
    """Stream real-time updates (approvals, payments, orders, udhaar) to the merchant dashboard."""
    queue = sse_hub.subscribe(merchant.id)

    async def event_generator() -> AsyncGenerator[str, None]:
        # Initial greeting event
        yield f"event: connected\ndata: {json.dumps({'merchant_id': merchant.id})}\n\n"

        try:
            while True:
                try:
                    # Wait up to 15s for an event, then send keepalive ping
                    payload = await asyncio.wait_for(queue.get(), timeout=15.0)
                    evt = payload.get("event", "message")
                    data_json = json.dumps(payload.get("data", {}))
                    yield f"event: {evt}\ndata: {data_json}\n\n"
                except TimeoutError:
                    yield ": ping\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            sse_hub.unsubscribe(merchant.id, queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
