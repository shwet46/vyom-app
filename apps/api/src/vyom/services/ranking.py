"""Opportunity ranking engine scoring potential revenue, margin, confidence, and festival timing."""

from __future__ import annotations

import datetime

from vyom.models.opportunity import Opportunity


class OpportunityRanker:
    """Calculates prioritized opportunity scores."""

    @staticmethod
    def calculate_score(
        opportunity: Opportunity,
        today: datetime.date | None = None,
        memory_multiplier: float = 1.0,
    ) -> float:
        ref_date = today or datetime.date.today()

        # 1. Base expected net return
        net_return_paise = max(0, opportunity.est_return_paise - opportunity.est_cost_paise)
        base_value = net_return_paise / 100.0  # In Rupees

        # 2. Timing factor
        timing_factor = 1.0
        if opportunity.recommended_send_at:
            rec_date = opportunity.recommended_send_at.date()
            diff_days = (rec_date - ref_date).days
            if diff_days == 0:
                timing_factor = 1.3  # Ideal today
            elif 0 < diff_days <= 3:
                timing_factor = 1.15  # Optimal prep window
            elif diff_days < 0:
                # Past recommended date: decaying relevance
                timing_factor = max(0.5, 1.0 - (abs(diff_days) * 0.15))

        # 3. Final score
        score = base_value * opportunity.confidence * memory_multiplier * timing_factor

        return round(score, 2)

    @classmethod
    def rank_opportunities(
        cls,
        opportunities: list[Opportunity],
        today: datetime.date | None = None,
        memory_multipliers: dict[str, float] | None = None,
    ) -> list[Opportunity]:
        """Rank and sort a list of opportunities by descending composite score."""
        multipliers = memory_multipliers or {}

        for opp in opportunities:
            mult = multipliers.get(opp.type.value, 1.0)
            opp.score = cls.calculate_score(opp, today=today, memory_multiplier=mult)

        # Sort by score descending
        opportunities.sort(key=lambda o: o.score, reverse=True)
        return opportunities
