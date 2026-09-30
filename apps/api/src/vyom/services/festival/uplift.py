"""Uplift estimation engine blending merchant history and cultural playbook priors."""

from __future__ import annotations

from pydantic import BaseModel


class CategoryUpliftResult(BaseModel):
    """Estimated demand uplift for a specific category during a festival."""

    category_key: str
    uplift_multiplier: float  # e.g. 1.50 means +50% sales expected
    uplift_pct: float  # e.g. 50.0%
    weight_history: float  # Weight w ∈ [0.0, 1.0] given to store's own history
    source_label_en: str
    source_label_hi: str
    source_label_hinglish: str


class UpliftEstimator:
    """Computes blended category sales uplift for festivals."""

    @staticmethod
    def estimate_uplift(
        category_key: str,
        prior_uplift_pct: float,
        last_year_festival_daily_sales_paise: float | None = None,
        baseline_daily_sales_paise: float | None = None,
        history_days: int = 0,
    ) -> CategoryUpliftResult:
        """Blend merchant's own historical sales uplift with curated playbook priors.

        Formula:
            w = min(1.0, history_days / 180)
            own_uplift = (last_year_daily / baseline_daily) - 1.0
            uplift_pct = w * own_uplift_pct + (1 - w) * prior_uplift_pct
            multiplier = 1.0 + (uplift_pct / 100.0)
        """
        prior_pct = max(0.0, prior_uplift_pct)
        w = min(1.0, max(0.0, history_days / 180.0))

        if (
            last_year_festival_daily_sales_paise is not None
            and baseline_daily_sales_paise is not None
            and baseline_daily_sales_paise > 0
        ):
            own_uplift_pct = max(
                0.0,
                ((last_year_festival_daily_sales_paise / baseline_daily_sales_paise) - 1.0) * 100.0,
            )
            blended_pct = (w * own_uplift_pct) + ((1.0 - w) * prior_pct)
            if w >= 0.5:
                source_en = "From your store's last year sales"
                source_hi = "आपकी पिछले साल की बिक्री के आधार पर"
                source_hinglish = "Aapki last year ki bikri se"
            else:
                source_en = "Blended store history and typical festival trends"
                source_hi = "आपकी बिक्री और त्यौहारी रुझान का अनुमान"
                source_hinglish = "Aapki bikri aur festival trends ka mix"
        else:
            blended_pct = prior_pct
            w = 0.0
            source_en = "Typical festival estimate for Pune kiranas"
            source_hi = "पुणे किराना दुकानों का सामान्य त्यौहारी अनुमान"
            source_hinglish = "Typical festival estimate"

        multiplier = 1.0 + (blended_pct / 100.0)

        return CategoryUpliftResult(
            category_key=category_key,
            uplift_multiplier=round(multiplier, 2),
            uplift_pct=round(blended_pct, 1),
            weight_history=round(w, 2),
            source_label_en=source_en,
            source_label_hi=source_hi,
            source_label_hinglish=source_hinglish,
        )
