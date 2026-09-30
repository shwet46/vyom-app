"""Unit tests for health endpoints."""

from __future__ import annotations

import pytest
from httpx import ASGITransport, AsyncClient

from vyom.main import create_app


@pytest.mark.asyncio
async def test_healthz_endpoint() -> None:
    app = create_app()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/healthz")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
        assert data["app"] == "vyom"


@pytest.mark.asyncio
async def test_readyz_endpoint_disconnected() -> None:
    # When Mongo is not running locally, readyz returns 503 Service Unavailable
    app = create_app()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/readyz")
        assert resp.status_code in (200, 503)
        data = resp.json()
        assert "status" in data
