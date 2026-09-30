"""Merchant safety guardrails and spending limits."""

from __future__ import annotations

from pydantic import BaseModel, Field

from vyom.models.base import MongoModel


class QuietHours(BaseModel):
    """Night-time window when customer messaging is completely suppressed."""

    start: str = "21:30"  # 9:30 PM IST
    end: str = "08:30"  # 8:30 AM IST


class Guardrails(MongoModel):
    """Enforceable boundaries configured by or default for a merchant."""

    merchant_id: str
    weekly_budget_paise: int = 50000  # Rs 500 max spend per week on offers
    max_discount_pct: float = 15.0  # Max 15% discount allowed on campaigns
    max_msgs_per_customer_week: int = 2  # Fatigue limit: max 2 promotional msgs/week
    quiet_hours: QuietHours = Field(default_factory=QuietHours)
    udhaar_autonomy: bool = False  # False = merchant confirms every reminder
    udhaar_max_reminders: int = 3  # Maximum reminders before escalation
    udhaar_min_gap_days: int = 4  # Minimum days between consecutive reminders
    kill_switch: bool = False  # Emergency halt for all outbound campaigns and bot proactive actions
    updated_by: str = "merchant"
