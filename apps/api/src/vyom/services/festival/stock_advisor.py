"""Stock advisor calculating expected demand, suggested reorder ranges, and stock shortfalls."""

from __future__ import annotations

import math

from pydantic import BaseModel, Field

from vyom.models.base import LocalizedText
from vyom.models.catalog import MerchantCatalogItem
from vyom.models.festival import FestivalPlaybook
from vyom.services.festival.uplift import CategoryUpliftResult, UpliftEstimator


class StockAdviceItem(BaseModel):
    """Stock replenishment recommendation for an existing catalog item."""

    catalog_item_id: str
    name: LocalizedText
    category_key: str
    unit: str
    pack_size: str
    current_stock: float | None = None
    baseline_daily_units: float
    uplift_pct: float
    expected_festival_demand_units: float
    suggested_min_units: float
    suggested_max_units: float
    shortfall_units: float
    confidence_label: str


class MissingPlaybookItem(BaseModel):
    """Item recommended by cultural playbook but currently missing in merchant's catalog."""

    category_key: str
    recommended_name: str
    role: str
    expected_uplift_pct: float


class StockAdvisorReport(BaseModel):
    """Comprehensive inventory advisory report for an upcoming or active festival."""

    festival_key: str
    festival_window_days: int
    recommendations: list[StockAdviceItem] = Field(default_factory=list)
    missing_items: list[MissingPlaybookItem] = Field(default_factory=list)


class StockAdvisor:
    """Calculates required inventory buffers for festivals."""

    @staticmethod
    def generate_advice(
        playbook: FestivalPlaybook,
        catalog_items: list[MerchantCatalogItem],
        window_days: int = 7,
        history_days: int = 180,
    ) -> StockAdvisorReport:
        recommendations: list[StockAdviceItem] = []
        covered_categories: set[str] = set()

        # Map playbook category configurations
        cat_priors = {c.category_key: c for c in playbook.categories}

        for item in catalog_items:
            # Check if item belongs to any festival category
            matching_cats = [c for c in item.category_keys if c in cat_priors]
            if not matching_cats:
                continue

            primary_cat = matching_cats[0]
            covered_categories.add(primary_cat)
            p_cat = cat_priors[primary_cat]

            # Estimate uplift
            uplift_res: CategoryUpliftResult = UpliftEstimator.estimate_uplift(
                category_key=primary_cat,
                prior_uplift_pct=p_cat.uplift_prior_pct,
                history_days=history_days,
            )

            # Baseline daily velocity (or estimate default 2.0 units/day)
            daily_units = (
                item.velocity.daily_units_28d if item.velocity.daily_units_28d > 0 else 2.0
            )

            expected_units = daily_units * uplift_res.uplift_multiplier * window_days
            suggested_min = math.ceil(expected_units * 0.90)
            suggested_max = math.ceil(expected_units * 1.15)

            current_stock = item.stock_qty if item.stock_qty is not None else 0.0
            shortfall = max(0.0, suggested_max - current_stock)

            recommendations.append(
                StockAdviceItem(
                    catalog_item_id=item.id,
                    name=item.name,
                    category_key=primary_cat,
                    unit=item.unit,
                    pack_size=item.pack_size,
                    current_stock=item.stock_qty,
                    baseline_daily_units=round(daily_units, 2),
                    uplift_pct=uplift_res.uplift_pct,
                    expected_festival_demand_units=round(expected_units, 1),
                    suggested_min_units=suggested_min,
                    suggested_max_units=suggested_max,
                    shortfall_units=round(shortfall, 1),
                    confidence_label=uplift_res.source_label_hinglish,
                )
            )

        # Sort recommendations by highest shortfall first
        recommendations.sort(key=lambda r: r.shortfall_units, reverse=True)

        # Identify playbook categories missing from merchant catalog
        missing: list[MissingPlaybookItem] = []
        for p_cat in playbook.categories:
            if p_cat.category_key not in covered_categories:
                missing.append(
                    MissingPlaybookItem(
                        category_key=p_cat.category_key,
                        recommended_name=p_cat.category_key.replace("_", " ").title(),
                        role=p_cat.role.value,
                        expected_uplift_pct=p_cat.uplift_prior_pct,
                    )
                )

        return StockAdvisorReport(
            festival_key=playbook.key,
            festival_window_days=window_days,
            recommendations=recommendations,
            missing_items=missing,
        )
