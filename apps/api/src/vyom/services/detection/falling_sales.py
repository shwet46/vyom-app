"""Festival-aware falling sales detection explaining normal post-festival demand dips."""

from __future__ import annotations

import datetime

from vyom.models.enums import OpportunityKind, OpportunityStatus, OpportunityType
from vyom.models.opportunity import Opportunity, OpportunityEvidence
from vyom.models.transaction import BusinessProfile


class FallingSalesDetector:
    """Detects sales decline and contextually explains post-festival lulls."""

    @staticmethod
    def detect_falling_sales(
        merchant_id: str,
        profile: BusinessProfile,
        today: datetime.date | None = None,
    ) -> Opportunity | None:
        ref_date = today or datetime.date.today()

        # Check if drop exceeds 15%
        if profile.trend.delta_pct >= -15.0:
            return None

        drop_pct = abs(profile.trend.delta_pct)
        is_post_fest = profile.trend.expected_post_festival

        if is_post_fest:
            reason = (
                f"Sales are down {drop_pct:.1f}% vs last month. "
                "This dip is expected right after major festival celebrations (e.g. post-Ganesh Chaturthi). "
                "A gentle clearance or everyday essentials reminder is recommended."
            )
            confidence = 0.65  # Lower confidence because dip is natural
            title_key = "opportunity.falling_sales.post_festival.title"
        else:
            reason = (
                f"Sales dropped {drop_pct:.1f}% over the last 7 days compared to baseline. "
                "Reconnecting with top regulars can restore daily revenue."
            )
            confidence = 0.85
            title_key = "opportunity.falling_sales.alarm.title"

        dedupe_key = f"falling-sales-{ref_date.strftime('%Y-%m')}-d{ref_date.day // 7}"

        return Opportunity(
            merchant_id=merchant_id,
            kind=OpportunityKind.ADVISORY,
            type=OpportunityType.FALLING_SALES,
            title_key=title_key,
            evidence=OpportunityEvidence(
                reason=reason,
                expected_uplift_pct=-drop_pct,
                historical_sales_paise=int(profile.trend.ma7 * 7),
                extra={
                    "is_post_festival": is_post_fest,
                    "ma7": profile.trend.ma7,
                    "baseline28": profile.trend.baseline28,
                },
            ),
            audience_customer_ids=[],
            est_return_paise=int(profile.trend.baseline28 * 0.15 * 7),
            est_cost_paise=0,
            confidence=confidence,
            score=round(profile.trend.baseline28 * 0.15, 2),
            status=OpportunityStatus.DETECTED,
            recommended_send_at=datetime.datetime.combine(
                ref_date + datetime.timedelta(days=1),
                datetime.time(10, 0),
            ),
            expires_at=datetime.datetime.combine(
                ref_date + datetime.timedelta(days=5),
                datetime.time(21, 0),
            ),
            dedupe_key=dedupe_key,
        )
