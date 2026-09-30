"""MongoDB client using PyMongo's native async API (AsyncMongoClient).

Motor is deprecated; we use pymongo>=4.8 with AsyncMongoClient directly.
The client connects to a replica set for transaction support.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from pymongo import AsyncMongoClient
from pymongo.asynchronous.database import AsyncDatabase

if TYPE_CHECKING:
    from vyom.config import Settings

_client: AsyncMongoClient | None = None  # type: ignore[type-arg]
_db: AsyncDatabase | None = None  # type: ignore[type-arg]


async def init_mongo(settings: Settings) -> AsyncDatabase:  # type: ignore[type-arg]
    """Initialize the MongoDB client and return the database handle."""
    global _client, _db
    _client = AsyncMongoClient(settings.mongodb_uri)
    _db = _client[settings.mongodb_database]
    return _db


async def close_mongo() -> None:
    """Close the MongoDB client connection."""
    global _client, _db
    if _client is not None:
        await _client.close()
        _client = None
        _db = None


def get_db() -> AsyncDatabase:  # type: ignore[type-arg]
    """Get the database handle. Raises if not initialized."""
    if _db is None:
        raise RuntimeError("MongoDB not initialized. Call init_mongo() first.")
    return _db


def get_client() -> AsyncMongoClient:  # type: ignore[type-arg]
    """Get the client handle for transactions."""
    if _client is None:
        raise RuntimeError("MongoDB not initialized. Call init_mongo() first.")
    return _client
