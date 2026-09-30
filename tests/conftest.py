"""Global pytest fixtures and test configurations."""

from __future__ import annotations

from collections.abc import AsyncGenerator, Generator

import pytest
from httpx import ASGITransport, AsyncClient

from vyom.clock import Clock
from vyom.config import Settings
from vyom.main import create_app


@pytest.fixture(autouse=True)
def reset_clock() -> Generator[None, None, None]:
    """Ensure clock state is reset before and after each test."""
    Clock.reset()
    yield
    Clock.reset()


@pytest.fixture
def mock_settings() -> Settings:
    """Settings configured for unit testing."""
    return Settings(
        ai_mode="mock",
        demo_mode=True,
        demo_today="2026-09-30",
        mongodb_database="vyom_test",
    )


@pytest.fixture
async def async_client() -> AsyncGenerator[AsyncClient, None]:
    """Asynchronous HTTP test client for FastAPI endpoints."""
    app = create_app()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
