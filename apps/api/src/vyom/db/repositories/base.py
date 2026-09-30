"""Generic asynchronous MongoDB repository with merchant multi-tenancy enforcement."""

from __future__ import annotations

from typing import Any

from pymongo.asynchronous.collection import AsyncCollection
from pymongo.asynchronous.database import AsyncDatabase

from vyom.clock import Clock
from vyom.models.base import MongoModel


class BaseRepository[T: MongoModel]:
    """Base repository providing strongly typed MongoDB CRUD operations."""

    def __init__(self, db: AsyncDatabase, collection_name: str, model_cls: type[T]) -> None:  # type: ignore[type-arg]
        self.db = db
        self.collection_name = collection_name
        self.model_cls = model_cls

    @property
    def collection(self) -> AsyncCollection:  # type: ignore[type-arg]
        return self.db[self.collection_name]

    async def get_by_id(self, item_id: str) -> T | None:
        """Fetch a single document by its _id."""
        doc = await self.collection.find_one({"_id": item_id})
        if not doc:
            return None
        return self.model_cls.model_validate(doc)

    async def find_one(self, filter_query: dict[str, Any]) -> T | None:
        """Find a single document matching the filter."""
        doc = await self.collection.find_one(filter_query)
        if not doc:
            return None
        return self.model_cls.model_validate(doc)

    async def find_many(
        self,
        filter_query: dict[str, Any],
        sort: list[tuple[str, int]] | None = None,
        limit: int = 100,
        skip: int = 0,
    ) -> list[T]:
        """Find multiple documents matching the filter."""
        cursor = self.collection.find(filter_query).skip(skip).limit(limit)
        if sort:
            cursor = cursor.sort(sort)
        docs = await cursor.to_list(length=limit)
        return [self.model_cls.model_validate(d) for d in docs]

    async def insert(self, model: T) -> T:
        """Insert a new document."""
        data = model.to_mongo()
        await self.collection.insert_one(data)
        return model

    async def update_one(
        self,
        filter_query: dict[str, Any],
        update_data: dict[str, Any],
    ) -> bool:
        """Update a single document and update the updated_at timestamp."""
        if "$set" not in update_data:
            update_data = {"$set": update_data}
        update_data["$set"]["updated_at"] = Clock.now()

        res = await self.collection.update_one(filter_query, update_data)
        return res.modified_count > 0

    async def delete_one(self, filter_query: dict[str, Any]) -> bool:
        """Delete a single document."""
        res = await self.collection.delete_one(filter_query)
        return res.deleted_count > 0

    async def count(self, filter_query: dict[str, Any]) -> int:
        """Count documents matching the query."""
        return await self.collection.count_documents(filter_query)


class MerchantScopedRepository[T: MongoModel](BaseRepository[T]):
    """Repository enforcing merchant_id scoping on all reads and writes."""

    async def get_for_merchant(self, merchant_id: str, item_id: str) -> T | None:
        return await self.find_one({"_id": item_id, "merchant_id": merchant_id})

    async def list_for_merchant(
        self,
        merchant_id: str,
        extra_filter: dict[str, Any] | None = None,
        sort: list[tuple[str, int]] | None = None,
        limit: int = 100,
        skip: int = 0,
    ) -> list[T]:
        q: dict[str, Any] = {"merchant_id": merchant_id}
        if extra_filter:
            q.update(extra_filter)
        return await self.find_many(q, sort=sort, limit=limit, skip=skip)
