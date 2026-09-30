"""Dead hours detector identifying recurring slow footfall slots to trigger happy-hour flash offers."""

from __future__ import annotations

import datetime

from vyom.models.customer import Customer
from vyom.models.enums import OpportunityKind, OpportunityStatus, OpportunityType
from vyom.models.opportunity import Opportunity, OpportunityEvidence
from vyom.models.transaction import BusinessProfile

WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


class DeadHoursDetector:
    """Detects persistent low-traffic slots from the business profile."""

    @staticmethod
    def detect_dead_hour_opportunity(
        merchant_id: str,
        profile: BusinessProfile,
        customers: list[Customer],
        today: datetime.date | None = None,
    ) -> Opportunity | None:
        ref_date = today or datetime.date.today()

        if not profile.dead_hours:
            return None

        # Pick the most pronounced dead slot in afternoon (typically 2 PM - 5 PM)
        afternoon_dead_slots = [slot for slot in profile.dead_hours if 13 <= slot.hour <= 17]
        target_slot = afternoon_dead_slots[0] if afternoon_dead_slots else profile.dead_hours[0]

        day_name = WEEKDAYS[target_slot.day_of_week]
        slot_label = f"{day_name} {target_slot.hour:02d}:00 - {target_slot.hour + 1:02d}:00"

        # Audience: customers with consent (up to 40)
        audience_ids = [c.id for c in customers if not c.opted_out and c.consent.marketing.granted][
            :40
        ]

        if not audience_ids:
            return None

        count = len(audience_ids)
        est_return_paise = count * 3500  # Rs 35 projected incremental margin per attendee
        est_cost_paise = count * 50

        dedupe_key = (
            f"dead-hour-{target_slot.day_of_week}-{target_slot.hour}-{ref_date.strftime('%Y-%W')}"
        )

        return Opportunity(
            merchant_id=merchant_id,
            kind=OpportunityKind.CAMPAIGN,
            type=OpportunityType.DEAD_HOUR,
            title_key="opportunity.dead_hour.title",
            evidence=OpportunityEvidence(
                reason=f"Footfall consistently drops during {slot_label}. A quick afternoon offer can boost sales.",
                dead_hour_slot=slot_label,
                historical_sales_paise=target_slot.avg_sales_paise,
            ),
            audience_customer_ids=audience_ids,
            est_return_paise=est_return_paise,
            est_cost_paise=est_cost_paise,
            confidence=0.78,
            score=round(est_return_paise - est_cost_paise, 2),
            status=OpportunityStatus.DETECTED,
            recommended_send_at=datetime.datetime.combine(
                ref_date + datetime.timedelta(days=1),
                datetime.time(12, 30),  # 12:30 PM before the afternoon dead slot
            ),
            expires_at=datetime.datetime.combine(
                ref_date + datetime.timedelta(days=7),
                datetime.time(21, 0),
            ),
            dedupe_key=dedupe_key,
        )
