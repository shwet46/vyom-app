"""Business profile computation engine aggregating sales patterns, dead hours, and trends."""

from __future__ import annotations

import datetime
from collections import defaultdict
from typing import Any

from vyom.models.enums import FestivalPhase
from vyom.models.festival import FestivalCalendar
from vyom.models.transaction import BusinessProfile, BusinessTrend, DeadHourSlot, Transaction
from vyom.services.festival.context import classify_phase


class ProfileBuilder:
    """Computes and updates the merchant BusinessProfile from transactions."""

    @staticmethod
    def compute_profile(
        merchant_id: str,
        transactions: list[Transaction],
        calendars: list[FestivalCalendar] | None = None,
        as_of_date: datetime.date | None = None,
    ) -> BusinessProfile:
        ref_date = as_of_date or datetime.date.today()
        calendars = calendars or []

        # 1. Initialize hourly matrix (7 days x 24 hours)
        hourly_matrix: list[list[int]] = [[0] * 24 for _ in range(7)]
        total_revenue_paise = 0
        total_txns = len(transactions)
        customer_visit_counts: dict[str, int] = defaultdict(int)
        item_sales: dict[str, dict[str, Any]] = {}
        category_sales: dict[str, int] = defaultdict(int)

        # 2. Daily revenue aggregation for trend analysis
        daily_revenue: dict[datetime.date, int] = defaultdict(int)

        # Build festival windows to exclude from baseline
        festival_peak_days: set[datetime.date] = set()
        is_post_festival = False

        for cal in calendars:
            phase = classify_phase(
                today=ref_date,
                start_date=cal.start_date,
                end_date=cal.end_date,
                peak_start=cal.peak_start,
                peak_end=cal.peak_end,
            )
            if phase == FestivalPhase.POST:
                is_post_festival = True

            # Mark all peak and active days of the festival
            cur = cal.start_date
            while cur <= cal.end_date:
                festival_peak_days.add(cur)
                cur += datetime.timedelta(days=1)

        for txn in transactions:
            txn_date = txn.paid_at.date()
            weekday = txn.paid_at.weekday()  # 0=Monday, 6=Sunday
            hour = txn.paid_at.hour  # 0-23

            hourly_matrix[weekday][hour] += txn.amount_paise
            total_revenue_paise += txn.amount_paise
            daily_revenue[txn_date] += txn.amount_paise

            if txn.customer_id:
                customer_visit_counts[txn.customer_id] += 1

            for item in txn.items:
                item_key = item.catalog_item_id or item.name
                if item_key not in item_sales:
                    item_sales[item_key] = {
                        "name": item.name,
                        "catalog_item_id": item.catalog_item_id,
                        "qty": 0.0,
                        "revenue_paise": 0,
                    }
                item_sales[item_key]["qty"] += item.qty
                item_sales[item_key]["revenue_paise"] += item.qty * item.unit_price_paise

        # 3. Compute avg ticket and repeat rate
        avg_ticket_paise = int(total_revenue_paise / total_txns) if total_txns > 0 else 0
        repeat_customers = sum(1 for c, count in customer_visit_counts.items() if count > 1)
        total_unique_customers = len(customer_visit_counts)
        repeat_rate = (
            round(repeat_customers / total_unique_customers, 3)
            if total_unique_customers > 0
            else 0.0
        )

        # 4. Identify dead hours (slots below 70% of weekly active average)
        # We only consider business hours (8 AM to 10 PM = hours 8..21)
        business_hour_totals: list[int] = []
        for day in range(7):
            for h in range(8, 22):
                business_hour_totals.append(hourly_matrix[day][h])

        avg_hour_sales = (
            sum(business_hour_totals) / len(business_hour_totals) if business_hour_totals else 0
        )
        dead_threshold = avg_hour_sales * 0.70

        dead_hours: list[DeadHourSlot] = []
        for day in range(7):
            for h in range(8, 22):
                sales = hourly_matrix[day][h]
                if sales < dead_threshold:
                    dead_hours.append(
                        DeadHourSlot(
                            day_of_week=day,
                            hour=h,
                            avg_sales_paise=sales,
                        )
                    )

        # 5. Trend analysis: 7-day MA vs 28-day baseline (excluding festival peaks)
        ma7_sum = 0
        ma7_count = 0
        for d in range(7):
            day_key = ref_date - datetime.timedelta(days=d)
            ma7_sum += daily_revenue.get(day_key, 0)
            ma7_count += 1
        ma7 = (ma7_sum / ma7_count) if ma7_count > 0 else 0.0

        baseline_sum = 0
        baseline_count = 0
        for d in range(7, 35):
            day_key = ref_date - datetime.timedelta(days=d)
            # Exclude festival peak days from baseline calculation!
            if day_key not in festival_peak_days:
                baseline_sum += daily_revenue.get(day_key, 0)
                baseline_count += 1

        baseline28 = (baseline_sum / baseline_count) if baseline_count > 0 else (ma7 or 1.0)
        delta_pct = round(((ma7 - baseline28) / baseline28) * 100.0, 1) if baseline28 > 0 else 0.0

        trend = BusinessTrend(
            ma7=round(ma7, 2),
            baseline28=round(baseline28, 2),
            delta_pct=delta_pct,
            festival_adjusted=len(festival_peak_days) > 0,
            expected_post_festival=is_post_festival and delta_pct < -10.0,
        )

        # Top 10 items
        sorted_items = sorted(item_sales.values(), key=lambda x: x["revenue_paise"], reverse=True)[
            :10
        ]

        return BusinessProfile(
            merchant_id=merchant_id,
            hourly_sales=hourly_matrix,
            top_items=sorted_items,
            avg_ticket_paise=avg_ticket_paise,
            repeat_rate=repeat_rate,
            dead_hours=dead_hours,
            trend=trend,
            category_sales=dict(category_sales),
            computed_at=datetime.datetime.now(datetime.UTC),
        )
