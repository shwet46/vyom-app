"""Injectable Clock for deterministic time.

All code uses Clock.now() instead of datetime.now(). The DEMO_TODAY env var
overrides "today" for festival phase testing and demos.
Time is always Asia/Kolkata (IST).
"""

from __future__ import annotations

import datetime
import os
from typing import Any
from zoneinfo import ZoneInfo

try:
    IST = ZoneInfo("Asia/Kolkata")
except Exception:
    IST = datetime.timezone(datetime.timedelta(hours=5, minutes=30), name="Asia/Kolkata")  # type: ignore[assignment]

try:
    UTC = ZoneInfo("UTC")
except Exception:
    UTC = datetime.UTC  # type: ignore[assignment]


class Clock:
    """Injectable clock. Use DEMO_TODAY to freeze the date for demos/tests."""

    _global_demo_date: datetime.date | None = None
    _tz: Any = IST

    def __init__(self, demo_today: str | None = None, tz: Any = IST) -> None:
        self._tz = tz
        self._demo_date: datetime.date | None = (
            datetime.date.fromisoformat(demo_today) if demo_today else None
        )

    @property
    def tz(self) -> Any:
        return self._tz

    def get_now(self) -> datetime.datetime:
        """Current datetime on this clock instance."""
        real_now = datetime.datetime.now(self._tz)
        if self._demo_date is not None:
            return real_now.replace(
                year=self._demo_date.year,
                month=self._demo_date.month,
                day=self._demo_date.day,
            )
        return real_now

    def get_today(self) -> datetime.date:
        """Today's date on this clock instance."""
        return self.get_now().date()

    def get_utcnow(self) -> datetime.datetime:
        """Current UTC datetime on this clock instance."""
        return self.get_now().astimezone(UTC)

    def set_instance_demo_today(self, date_str: str | None) -> None:
        """Change the demo date on this instance."""
        if date_str:
            self._demo_date = datetime.date.fromisoformat(date_str)
        else:
            self._demo_date = None

    # ── Class-level deterministic clock methods ───────────────────────────────

    @classmethod
    def _init_env(cls) -> None:
        if cls._global_demo_date is None:
            env_val = os.getenv("DEMO_TODAY")
            if env_val:
                cls._global_demo_date = datetime.date.fromisoformat(env_val)

    @classmethod
    def now(cls) -> datetime.datetime:
        """Current datetime in IST."""
        cls._init_env()
        real_now = datetime.datetime.now(cls._tz)
        if cls._global_demo_date is not None:
            return real_now.replace(
                year=cls._global_demo_date.year,
                month=cls._global_demo_date.month,
                day=cls._global_demo_date.day,
            )
        return real_now

    @classmethod
    def today(cls) -> datetime.date:
        """Today's date in IST."""
        return cls.now().date()

    @classmethod
    def utcnow(cls) -> datetime.datetime:
        """Current UTC datetime."""
        return cls.now().astimezone(UTC)

    @classmethod
    def set_demo_today(cls, date_str: str | None) -> None:
        """Set the global class-level demo date."""
        if date_str:
            cls._global_demo_date = datetime.date.fromisoformat(date_str)
        else:
            cls._global_demo_date = None

    @classmethod
    def reset(cls) -> None:
        """Reset global clock to environment state."""
        env_val = os.getenv("DEMO_TODAY")
        cls._global_demo_date = datetime.date.fromisoformat(env_val) if env_val else None
