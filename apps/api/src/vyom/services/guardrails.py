"""Merchant guardrails evaluator enforcing budgets, caps, discounts, and quiet hours."""

from __future__ import annotations

import datetime

from vyom.models.campaign import CampaignDraft, GuardrailEvaluationResult
from vyom.models.enums import GuardrailStatus
from vyom.models.guardrails import Guardrails
from vyom.models.opportunity import Opportunity


def is_in_quiet_hours(
    dt: datetime.datetime, start_str: str = "21:30", end_str: str = "08:30"
) -> bool:
    """Check if given time in IST falls in quiet hours."""
    t = dt.time()
    start_h, start_m = map(int, start_str.split(":"))
    end_h, end_m = map(int, end_str.split(":"))
    start_t = datetime.time(start_h, start_m)
    end_t = datetime.time(end_h, end_m)

    if start_t > end_t:  # Overnight span (e.g. 21:30 to 08:30)
        return t >= start_t or t <= end_t
    return start_t <= t <= end_t


class GuardrailsEvaluator:
    """Evaluates campaign proposals against merchant safety guardrails and adjusts where possible."""

    @staticmethod
    def evaluate(
        draft: CampaignDraft,
        guardrails: Guardrails,
        current_week_spend_paise: int = 0,
        proposed_send_at: datetime.datetime | None = None,
    ) -> GuardrailEvaluationResult:
        violations: list[str] = []
        adjustments: list[str] = []

        # 1. Kill switch: immediate rejection
        if guardrails.kill_switch:
            return GuardrailEvaluationResult(
                status=GuardrailStatus.VIOLATED,
                violations=["Merchant kill switch is active. Outbound communications are halted."],
                adjustments=[],
            )

        # 2. Weekly budget check
        remaining_budget = max(0, guardrails.weekly_budget_paise - current_week_spend_paise)
        if draft.est_cost_paise > remaining_budget:
            violations.append(
                f"Projected cost ₹{draft.est_cost_paise / 100:.2f} exceeds remaining weekly budget ₹{remaining_budget / 100:.2f}."
            )

        # 3. Max discount percentage check (Adjust before reject)
        if (
            draft.offer.discount_pct is not None
            and draft.offer.discount_pct > guardrails.max_discount_pct
        ):
            original_pct = draft.offer.discount_pct
            draft.offer.discount_pct = guardrails.max_discount_pct
            adjustments.append(
                f"Discount adjusted down from {original_pct:.1f}% to maximum permitted {guardrails.max_discount_pct:.1f}%."
            )

        # 4. Quiet hours check
        if proposed_send_at and is_in_quiet_hours(
            proposed_send_at,
            guardrails.quiet_hours.start,
            guardrails.quiet_hours.end,
        ):
            adjustments.append(
                f"Proposed send time {proposed_send_at.strftime('%H:%M')} falls in quiet hours ({guardrails.quiet_hours.start}-{guardrails.quiet_hours.end}). Rescheduled to 09:30 AM."
            )

        # Determine overall status
        if violations:
            status = GuardrailStatus.VIOLATED
        elif adjustments:
            status = GuardrailStatus.ADJUSTED
        else:
            status = GuardrailStatus.PASSED

        return GuardrailEvaluationResult(
            status=status,
            violations=violations,
            adjustments=adjustments,
        )

    @staticmethod
    def evaluate_opportunity(
        opportunity: Opportunity,
        guardrails: Guardrails,
    ) -> bool:
        """Check if an opportunity passes safety guardrails (kill switch and weekly budget)."""
        if guardrails.kill_switch:
            return False
        return opportunity.est_cost_paise <= guardrails.weekly_budget_paise

