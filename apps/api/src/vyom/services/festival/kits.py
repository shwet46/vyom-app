"""Festival kit bundle generator and customer customization builder."""

from __future__ import annotations

from pydantic import BaseModel, Field

from vyom.models.base import LocalizedText
from vyom.models.catalog import MerchantCatalogItem
from vyom.models.customer import Customer
from vyom.models.enums import RitualRole
from vyom.models.festival import FestivalPlaybook


class KitBundleItem(BaseModel):
    """Line item in a curated festival essentials kit."""

    catalog_item_id: str
    name: LocalizedText
    category_key: str
    unit: str
    pack_size: str
    qty: float
    unit_price_paise: int
    total_price_paise: int


class FestivalKitBundle(BaseModel):
    """Complete assembled shopping bundle with code-computed pricing."""

    festival_key: str
    bundle_name: LocalizedText
    items: list[KitBundleItem] = Field(default_factory=list)
    total_mrp_paise: int
    bundle_price_paise: int
    savings_paise: int = 0
    dietary_notes_applied: list[str] = Field(default_factory=list)


ROLE_PRIORITY: dict[RitualRole, int] = {
    RitualRole.FASTING_FOOD: 10,
    RitualRole.PUJA_ITEM: 9,
    RitualRole.SWEET_INGREDIENT: 8,
    RitualRole.DECOR: 7,
    RitualRole.STAPLE: 6,
    RitualRole.GIFTING: 5,
    RitualRole.HOSPITALITY: 4,
}


class FestivalKitBuilder:
    """Builds personalized or standard festival shopping kits."""

    @staticmethod
    def build_kit(
        playbook: FestivalPlaybook,
        catalog_items: list[MerchantCatalogItem],
        customer: Customer | None = None,
        discount_pct: float = 0.0,
    ) -> FestivalKitBundle:
        """Assemble up to 8 candidate items matching festival categories and dietary rules."""
        excluded_cats = set(playbook.excluded_categories)
        cat_to_role = {c.category_key: c.role for c in playbook.categories}

        # Check self-declared customer dietary preferences
        dietary_notes: list[str] = []
        if customer and customer.preferences.dietary_notes:
            dietary_notes = customer.preferences.dietary_notes

        candidate_items: list[tuple[MerchantCatalogItem, float, int]] = []

        for item in catalog_items:
            # Must be in stock
            if not item.in_stock:
                continue

            # Must not be in festival excluded categories
            if any(cat in excluded_cats for cat in item.category_keys):
                continue

            # If customer declared vrat, avoid items containing onion/garlic or non-sattvic
            if "vrat" in dietary_notes and any(
                "onion" in cat or "garlic" in cat for cat in item.category_keys
            ):
                continue

            # Must belong to playbook category
            matching_cats = [c for c in item.category_keys if c in cat_to_role]
            if not matching_cats:
                continue

            primary_cat = matching_cats[0]
            role = cat_to_role[primary_cat]
            role_prio = ROLE_PRIORITY.get(role, 5)

            # Score = velocity * role priority
            velocity = item.velocity.daily_units_28d if item.velocity.daily_units_28d > 0 else 1.0
            score = velocity * role_prio

            candidate_items.append((item, score, item.price_paise))

        # Sort by score descending and take up to 8 items
        candidate_items.sort(key=lambda x: x[1], reverse=True)
        selected_candidates = candidate_items[:8]

        bundle_items: list[KitBundleItem] = []
        total_mrp_paise = 0

        for item, _, price in selected_candidates:
            qty = 1.0
            item_total = int(price * qty)
            total_mrp_paise += item_total

            matching_cat = next(c for c in item.category_keys if c in cat_to_role)

            bundle_items.append(
                KitBundleItem(
                    catalog_item_id=item.id,
                    name=item.name,
                    category_key=matching_cat,
                    unit=item.unit,
                    pack_size=item.pack_size,
                    qty=qty,
                    unit_price_paise=price,
                    total_price_paise=item_total,
                )
            )

        # Apply guardrail discount if provided
        bundle_price_paise = total_mrp_paise
        savings_paise = 0
        if 0 < discount_pct <= 20.0:
            savings_paise = int(total_mrp_paise * (discount_pct / 100.0))
            bundle_price_paise = total_mrp_paise - savings_paise

        bundle_name = LocalizedText(
            en=f"{playbook.names.en} Essentials Kit",
            hi=f"{playbook.names.hi} आवश्यक सामग्री किट",
            mr=f"{playbook.names.mr} आवश्यक साहित्य किट",
            hinglish=f"{playbook.names.hinglish} Puja / Vrat Kit",
        )

        return FestivalKitBundle(
            festival_key=playbook.key,
            bundle_name=bundle_name,
            items=bundle_items,
            total_mrp_paise=total_mrp_paise,
            bundle_price_paise=bundle_price_paise,
            savings_paise=savings_paise,
            dietary_notes_applied=dietary_notes,
        )
