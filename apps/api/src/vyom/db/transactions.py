"""Transaction helpers for MongoDB replica set."""

from __future__ import annotations

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from pymongo.asynchronous.client_session import AsyncClientSession

from vyom.db import get_client


@asynccontextmanager
async def transaction() -> AsyncGenerator[AsyncClientSession, None]:
    """Context manager for a MongoDB transaction.

    Usage:
        async with transaction() as session:
            await db.campaigns.insert_one(doc, session=session)
            await db.deliveries.insert_many(docs, session=session)
    """
    client = get_client()
    async with client.start_session() as session, await session.start_transaction():
        yield session
