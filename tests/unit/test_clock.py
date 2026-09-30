"""Unit tests for injectable Clock."""

from __future__ import annotations

import datetime

from vyom.clock import Clock


def test_clock_now_returns_ist() -> None:
    now = Clock.now()
    assert now.tzinfo is not None
    assert str(now.tzinfo) == "Asia/Kolkata"


def test_clock_today_matches_now_date() -> None:
    today = Clock.today()
    now = Clock.now()
    assert today == now.date()


def test_clock_demo_today_override() -> None:
    Clock.set_demo_today("2026-09-30")
    today = Clock.today()
    assert today == datetime.date(2026, 9, 30)

    now = Clock.now()
    assert now.year == 2026
    assert now.month == 9
    assert now.day == 30

    # Reset
    Clock.set_demo_today(None)


def test_clock_instance_independence() -> None:
    clock_a = Clock(demo_today="2026-10-15")
    clock_b = Clock(demo_today="2026-11-01")

    assert clock_a.get_today() == datetime.date(2026, 10, 15)
    assert clock_b.get_today() == datetime.date(2026, 11, 1)
