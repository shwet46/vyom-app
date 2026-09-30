"""Churn detection identifying lapsed high-value customers for winback campaigns."""

from __future__ import annotations

import datetime

from vyom.models.customer import Customer
from vyom.models.enums import OpportunityKind, OpportunityStatus, OpportunityType
from vyom.models.opportunity import Opportunity, OpportunityEvidence


class ChurnDetector:
    """Detects customers at risk of churn based on their personal visit intervals."""

    @staticmethod
    def detect_churn_opportunities(
        merchant_id: str,
        customers: list[Customer],
        avg_ticket_paise: int = 35000,  # default Rs 350
        margin_pct: float = 0.18,  # 18% typical kirana gross margin
        reactivation_rate: float = 0.25,  # 25% expected winback response
        today: datetime.date | None = None,
    ) -> Opportunity | None:
        ref_date = today or datetime.date.today()
        churned_customer_ids: list[str] = []

        for cust in customers:
            # Must have at least 3 historical visits and non-zero avg gap
            if cust.rfm.frequency < 3 or cust.rfm.avg_gap_days <= 0:
                continue

            # Must have marketing consent and not opted out
            if cust.opted_out or not cust.consent.marketing.granted:
                continue

            # Churn condition: days_since_last_visit > 2 * own_avg_gap
            if cust.rfm.recency_days > (2 * cust.rfm.avg_gap_days):
                churned_customer_ids.append(cust.id)

        if not churned_customer_ids:
            return None

        count = len(churned_customer_ids)
        # Est. return = count * reactivation_rate * avg_ticket * margin
        est_recovered_revenue = int(count * reactivation_rate * avg_ticket_paise)
        est_return_paise = int(est_recovered_revenue * margin_pct)
        est_cost_paise = count * 50  # ~50 paise messaging cost per delivery

        # Dedupe key ensures one active winback proposal per merchant per 14-day cycle
        cycle_key = ref_date.strftime("%Y-%m") + f"-w{ref_date.day // 14}"
        dedupe_key = f"churn-winback-{cycle_key}"

        return Opportunity(
            merchant_id=merchant_id,
            kind=OpportunityKind.CAMPAIGN,
            type=OpportunityType.WINBACK,
            title_key="opportunity.winback.title",
            evidence=OpportunityEvidence(
                reason=f"{count} regular customers have not visited in more than double their normal gap.",
                churned_customers_count=count,
                historical_sales_paise=est_recovered_revenue,
            ),
            audience_customer_ids=churned_customer_ids,
            est_return_paise=est_return_paise,
            est_cost_paise=est_cost_paise,
            confidence=0.82,
            score=round(est_return_paise - est_cost_paise, 2),
            status=OpportunityStatus.DETECTED,
            recommended_send_at=datetime.datetime.combine(
                ref_date + datetime.timedelta(days=1),
                datetime.time(11, 0),  # 11:00 AM IST
            ),
            expires_at=datetime.datetime.combine(
                ref_date + datetime.timedelta(days=7),
                datetime.time(21, 0),
            ),
            dedupe_key=dedupe_key,
        )
