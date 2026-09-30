"""Global categories and merchant catalog items."""

from __future__ import annotations

import datetime

from pydantic import BaseModel, Field

from vyom.models.base import LocalizedText, MongoModel
from vyom.models.enums import CatalogItemSource


class ProductCategory(MongoModel):
    """Global taxonomy category for kirana products."""

    key: str  # Unique
    names: LocalizedText
    parent: str | None = None
    tags: list[str] = Field(
        default_factory=list
    )  # e.g. ["vrat_friendly", "sattvic", "puja", "decor", "sweet_ingredient", "contains_onion_garlic", "non_veg"]


class ItemVelocity(BaseModel):
    """Historical sales velocity."""

    daily_units_28d: float = 0.0


class MerchantCatalogItem(MongoModel):
    """Catalog item customized per merchant."""

    merchant_id: str
    name: LocalizedText
    aliases: list[str] = Field(default_factory=list)
    category_keys: list[str] = Field(default_factory=list)
    unit: str = "kg"  # kg, g, l, ml, piece, packet
    pack_size: str = "1 kg"
    price_paise: int
    cost_paise: int | None = None
    stock_qty: float | None = None
    stock_updated_at: datetime.datetime | None = None
    in_stock: bool = True
    is_seasonal: bool = False
    source: CatalogItemSource = CatalogItemSource.SEED
    velocity: ItemVelocity = Field(default_factory=ItemVelocity)
