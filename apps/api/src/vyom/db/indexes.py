"""Idempotent index creation for all collections.

Every compound index on merchant-scoped collections starts with merchant_id.
Run at startup via ensure_indexes().
"""

from __future__ import annotations

from typing import Any

import structlog
from pymongo import ASCENDING, DESCENDING, TEXT
from pymongo.asynchronous.database import AsyncDatabase
from pymongo.errors import OperationFailure

logger = structlog.get_logger()

IndexSpec = list[tuple[str, int]]


async def ensure_indexes(db: AsyncDatabase) -> None:  # type: ignore[type-arg]
    """Create all indexes idempotently."""
    index_map: dict[str, list[dict[str, Any]]] = {
        "merchants": [
            {"keys": [("phone_e164", ASCENDING)], "unique": True},
            {"keys": [("shop_code", ASCENDING)], "unique": True},
        ],
        "otp_sessions": [
            {"keys": [("expires_at", ASCENDING)], "expireAfterSeconds": 0},
        ],
        "customers": [
            {
                "keys": [("merchant_id", ASCENDING), ("telegram.chat_id", ASCENDING)],
                "unique": True,
                "sparse": True,
            },
            {"keys": [("merchant_id", ASCENDING), ("phone_e164", ASCENDING)]},
            {"keys": [("merchant_id", ASCENDING), ("last_visit_at", ASCENDING)]},
            {
                "keys": [("link_token", ASCENDING)],
                "unique": True,
                "sparse": True,
            },
        ],
        "product_categories": [
            {"keys": [("key", ASCENDING)], "unique": True},
        ],
        "merchant_catalog_items": [
            {"keys": [("merchant_id", ASCENDING), ("category_keys", ASCENDING)]},
            {"keys": [("merchant_id", ASCENDING), ("name.en", TEXT), ("aliases", TEXT)]},
        ],
        "transactions": [
            {"keys": [("merchant_id", ASCENDING), ("paid_at", DESCENDING)]},
            {
                "keys": [
                    ("merchant_id", ASCENDING),
                    ("customer_id", ASCENDING),
                    ("paid_at", DESCENDING),
                ]
            },
            {
                "keys": [("merchant_id", ASCENDING), ("coupon_code", ASCENDING)],
                "sparse": True,
            },
        ],
        "khata_entries": [
            {
                "keys": [
                    ("merchant_id", ASCENDING),
                    ("status", ASCENDING),
                    ("due_date", ASCENDING),
                ]
            },
            {"keys": [("merchant_id", ASCENDING), ("customer_id", ASCENDING)]},
        ],
        "khata_scans": [
            {"keys": [("merchant_id", ASCENDING), ("created_at", DESCENDING)]},
        ],
        "business_profiles": [
            {"keys": [("merchant_id", ASCENDING)], "unique": True},
        ],
        "festival_calendar": [
            {"keys": [("key", ASCENDING), ("year", ASCENDING)], "unique": True},
        ],
        "festival_playbooks": [
            {"keys": [("key", ASCENDING)], "unique": True},
        ],
        "festival_kit_requests": [
            {"keys": [("merchant_id", ASCENDING), ("status", ASCENDING)]},
            {"keys": [("merchant_id", ASCENDING), ("customer_id", ASCENDING)]},
        ],
        "opportunities": [
            {"keys": [("merchant_id", ASCENDING), ("status", ASCENDING)]},
            {
                "keys": [("merchant_id", ASCENDING), ("dedupe_key", ASCENDING)],
                "unique": True,
            },
        ],
        "campaigns": [
            {"keys": [("merchant_id", ASCENDING), ("status", ASCENDING)]},
            {"keys": [("idempotency_key", ASCENDING)], "unique": True},
        ],
        "campaign_deliveries": [
            {"keys": [("merchant_id", ASCENDING), ("campaign_id", ASCENDING)]},
            {"keys": [("idempotency_key", ASCENDING)], "unique": True},
        ],
        "coupons": [
            {"keys": [("code", ASCENDING)], "unique": True},
            {"keys": [("merchant_id", ASCENDING), ("campaign_id", ASCENDING)]},
        ],
        "payments": [
            {"keys": [("pay_token", ASCENDING)], "unique": True},
            {"keys": [("merchant_id", ASCENDING), ("status", ASCENDING)]},
        ],
        "guardrails": [
            {"keys": [("merchant_id", ASCENDING)], "unique": True},
        ],
        "memories": [
            {"keys": [("merchant_id", ASCENDING), ("kind", ASCENDING), ("created_at", DESCENDING)]},
        ],
        "bot_conversations": [
            {
                "keys": [("merchant_id", ASCENDING), ("customer_id", ASCENDING)],
                "unique": True,
            },
        ],
        "bot_messages": [
            {"keys": [("conversation_id", ASCENDING), ("ts", DESCENDING)]},
            {"keys": [("created_at", ASCENDING)], "expireAfterSeconds": 90 * 86400},  # 90 days
        ],
        "bot_updates_inbox": [
            {"keys": [("update_id", ASCENDING)], "unique": True},
            {"keys": [("created_at", ASCENDING)], "expireAfterSeconds": 48 * 3600},  # 48 hours
        ],
        "support_threads": [
            {"keys": [("merchant_id", ASCENDING), ("customer_id", ASCENDING)]},
        ],
        "copilot_sessions": [
            {"keys": [("merchant_id", ASCENDING)]},
        ],
        "copilot_messages": [
            {"keys": [("session_id", ASCENDING), ("ts", DESCENDING)]},
            {"keys": [("created_at", ASCENDING)], "expireAfterSeconds": 90 * 86400},
        ],
        "copilot_pending_actions": [
            {"keys": [("merchant_id", ASCENDING), ("status", ASCENDING)]},
        ],
        "audit_log": [
            {"keys": [("merchant_id", ASCENDING), ("ts", DESCENDING)]},
        ],
        "translation_cache": [
            {"keys": [("cache_key", ASCENDING)], "unique": True},
        ],
        "tts_cache": [
            {"keys": [("cache_key", ASCENDING)], "unique": True},
            {"keys": [("created_at", ASCENDING)], "expireAfterSeconds": 30 * 86400},  # 30 days
        ],
        "ai_usage": [
            {"keys": [("merchant_id", ASCENDING), ("ts", DESCENDING)]},
        ],
        "push_subscriptions": [
            {"keys": [("merchant_id", ASCENDING)]},
        ],
        "_migrations": [
            {"keys": [("version", ASCENDING)], "unique": True},
        ],
    }

    for collection_name, indexes in index_map.items():
        coll = db[collection_name]
        for idx in indexes:
            keys = idx.pop("keys")
            try:
                await coll.create_index(keys, **idx)
            except OperationFailure as exc:
                if exc.code == 86 or "IndexKeySpecsConflict" in str(exc) or "already exists" in str(exc):
                    # Drop existing conflicting index specification and recreate
                    try:
                        idx_name = idx.get("name") or "_".join(f"{k}_{v}" for k, v in keys)
                        await coll.drop_index(idx_name)
                        await coll.create_index(keys, **idx)
                        logger.info("index_recreated_after_conflict", collection=collection_name, index=idx_name)
                    except Exception as drop_exc:
                        logger.warning(
                            "index_conflict_unresolved",
                            collection=collection_name,
                            keys=keys,
                            error=str(drop_exc),
                        )
                else:
                    logger.warning(
                        "index_creation_skipped",
                        collection=collection_name,
                        keys=keys,
                        error=str(exc),
                    )
            except Exception as exc:
                logger.warning(
                    "index_creation_skipped",
                    collection=collection_name,
                    keys=keys,
                    error=str(exc),
                )
            # Restore keys for potential re-runs
            idx["keys"] = keys

    logger.info("indexes_ensured", collections=len(index_map))
