"""Base MongoModel for all collections in VYOM."""

from __future__ import annotations

import datetime
from typing import Any

from bson import ObjectId
from pydantic import BaseModel, ConfigDict, Field, field_serializer

from vyom.clock import Clock


def new_id() -> str:
    """Generate a 24-character hexadecimal ObjectId string."""
    return str(ObjectId())


def _sanitize_for_mongo(obj: Any) -> Any:
    if isinstance(obj, datetime.date) and not isinstance(obj, datetime.datetime):
        return datetime.datetime(obj.year, obj.month, obj.day, 0, 0, 0)
    if isinstance(obj, dict):
        return {k: _sanitize_for_mongo(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_sanitize_for_mongo(item) for item in obj]
    return obj


class MongoModel(BaseModel):
    """Shared base model for all MongoDB documents."""

    id: str = Field(default_factory=new_id, alias="_id")
    created_at: datetime.datetime = Field(default_factory=Clock.now)
    updated_at: datetime.datetime = Field(default_factory=Clock.now)
    schema_version: int = Field(default=1)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )

    @field_serializer("created_at", "updated_at", when_used="json", check_fields=False)
    def serialize_datetime(self, dt: datetime.datetime) -> str:
        return dt.isoformat()

    def to_mongo(self, exclude_id: bool = False) -> dict[str, Any]:
        """Convert model to dict suitable for PyMongo insertion/update."""
        data: dict[str, Any] = self.model_dump(by_alias=True)
        if exclude_id:
            data.pop("_id", None)
        return _sanitize_for_mongo(data)

    def to_mongo_set(self) -> dict[str, Any]:
        """Convert model to dict suitable for PyMongo $set, excluding _id."""
        return self.to_mongo(exclude_id=True)

    def to_mongo_upsert(self) -> dict[str, Any]:
        """Convert model for safe upsert: $set without _id, $setOnInsert with _id."""
        return {
            "$set": self.to_mongo(exclude_id=True),
            "$setOnInsert": {"_id": self.id},
        }


class LocalizedText(BaseModel):
    """Multi-language text container for en, hi, mr, and hinglish."""

    en: str = ""
    hi: str = ""
    mr: str = ""
    hinglish: str = ""

    def get_for_lang(self, lang: str) -> str:
        """Return the string for a given language with English fallback."""
        val = getattr(self, lang, "")
        if val:
            return val
        return self.hinglish or self.en or self.hi or self.mr or ""
