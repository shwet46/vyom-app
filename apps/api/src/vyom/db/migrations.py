"""Migration runner. Records applied versions in _migrations."""

from __future__ import annotations

import datetime

import structlog
from pymongo.asynchronous.database import AsyncDatabase

logger = structlog.get_logger()


async def run_migrations(db: AsyncDatabase) -> None:  # type: ignore[type-arg]
    """Run pending migrations in order.

    Each migration is a (version, description, callable) tuple.
    Applied versions are recorded in the _migrations collection.
    """
    migrations: list[tuple[int, str]] = [
        (1, "initial_schema"),
    ]

    coll = db["_migrations"]

    for version, description in migrations:
        existing = await coll.find_one({"version": version})
        if existing is not None:
            continue

        logger.info("running_migration", version=version, description=description)

        # For v1 we just record the schema version; actual data migrations
        # go here as the schema evolves.
        await coll.insert_one(
            {
                "version": version,
                "description": description,
                "applied_at": datetime.datetime.now(datetime.UTC),
            }
        )

        logger.info("migration_applied", version=version)


apply_migrations = run_migrations
