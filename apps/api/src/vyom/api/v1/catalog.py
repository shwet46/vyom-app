"""Catalog API: managing store items, pricing, aliases, and stock quantities."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Query
from pydantic import BaseModel, Field

from vyom.clock import Clock
from vyom.core.deps import CurrentMerchant, DatabaseDep
from vyom.core.errors import NotFoundError
from vyom.models.base import LocalizedText
from vyom.models.catalog import MerchantCatalogItem, ProductCategory
from vyom.models.enums import CatalogItemSource

router = APIRouter(prefix="/catalog", tags=["Catalog"])


class CreateCatalogItemRequest(BaseModel):
    name: LocalizedText
    category_keys: list[str]
    unit: str = "kg"
    pack_size: str = "1 kg"
    price_paise: int
    cost_paise: int | None = None
    stock_qty: float | None = None
    aliases: list[str] = Field(default_factory=list)


class UpdateStockRequest(BaseModel):
    stock_qty: float


@router.get("/items")
async def list_catalog_items(
    merchant: CurrentMerchant,
    db: DatabaseDep,
    category: str | None = Query(None),
    q: str | None = Query(None),
) -> list[MerchantCatalogItem]:
    """List merchant catalog items with category and text search filters."""
    query: dict[str, Any] = {"merchant_id": merchant.id}
    if category:
        query["category_keys"] = category
    if q:
        query["$or"] = [
            {"name.en": {"$regex": q, "$options": "i"}},
            {"name.hinglish": {"$regex": q, "$options": "i"}},
            {"aliases": {"$regex": q, "$options": "i"}},
        ]

    cursor = db.merchant_catalog_items.find(query).sort("name.en", 1)
    return [MerchantCatalogItem.model_validate(item) async for item in cursor]


@router.post("/items")
async def create_catalog_item(
    payload: CreateCatalogItemRequest,
    merchant: CurrentMerchant,
    db: DatabaseDep,
) -> MerchantCatalogItem:
    """Add a new item to the store catalog."""
    item = MerchantCatalogItem(
        merchant_id=merchant.id,
        name=payload.name,
        aliases=payload.aliases,
        category_keys=payload.category_keys,
        unit=payload.unit,
        pack_size=payload.pack_size,
        price_paise=payload.price_paise,
        cost_paise=payload.cost_paise,
        stock_qty=payload.stock_qty,
        stock_updated_at=Clock.now() if payload.stock_qty is not None else None,
        source=CatalogItemSource.MANUAL,
    )
    await db.merchant_catalog_items.insert_one(item.to_mongo())
    return item


@router.put("/items/{item_id}")
async def update_catalog_item(
    item_id: str,
    payload: CreateCatalogItemRequest,
    merchant: CurrentMerchant,
    db: DatabaseDep,
) -> MerchantCatalogItem:
    """Update an existing catalog item."""
    update_data = {
        "name": payload.name.model_dump(),
        "aliases": payload.aliases,
        "category_keys": payload.category_keys,
        "unit": payload.unit,
        "pack_size": payload.pack_size,
        "price_paise": payload.price_paise,
        "cost_paise": payload.cost_paise,
        "stock_qty": payload.stock_qty,
        "stock_updated_at": Clock.now() if payload.stock_qty is not None else None,
        "updated_at": Clock.now(),
    }
    res = await db.merchant_catalog_items.update_one(
        {"_id": item_id, "merchant_id": merchant.id},
        {"$set": update_data},
    )
    if res.matched_count == 0:
        raise NotFoundError("Catalog item not found")

    doc = await db.merchant_catalog_items.find_one({"_id": item_id})
    return MerchantCatalogItem.model_validate(doc)


@router.patch("/items/{item_id}/stock")
async def update_item_stock(
    item_id: str,
    payload: UpdateStockRequest,
    merchant: CurrentMerchant,
    db: DatabaseDep,
) -> dict[str, Any]:
    """Quick update of item stock quantity."""
    now_dt = Clock.now()
    res = await db.merchant_catalog_items.update_one(
        {"_id": item_id, "merchant_id": merchant.id},
        {
            "$set": {
                "stock_qty": payload.stock_qty,
                "in_stock": payload.stock_qty > 0,
                "stock_updated_at": now_dt,
                "updated_at": now_dt,
            }
        },
    )
    if res.matched_count == 0:
        raise NotFoundError("Catalog item not found")
    return {"status": "updated", "item_id": item_id, "stock_qty": payload.stock_qty}


@router.delete("/items/{item_id}")
async def delete_catalog_item(
    item_id: str,
    merchant: CurrentMerchant,
    db: DatabaseDep,
) -> dict[str, str]:
    """Remove an item from the merchant catalog."""
    res = await db.merchant_catalog_items.delete_one({"_id": item_id, "merchant_id": merchant.id})
    if res.deleted_count == 0:
        raise NotFoundError("Catalog item not found")
    return {"status": "deleted"}


@router.get("/categories")
async def list_categories(
    db: DatabaseDep,
) -> list[ProductCategory]:
    """List standard product categories for organization and festival tagging."""
    cursor = db.product_categories.find({}).sort("display_order", 1)
    return [ProductCategory.model_validate(c) async for c in cursor]
