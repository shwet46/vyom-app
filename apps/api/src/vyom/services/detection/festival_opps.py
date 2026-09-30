"""Festival opportunity generator for kits, stock-up alerts, greetings, and post-festival clearance."""

from __future__ import annotations

import datetime

from vyom.models.customer import Customer
from vyom.models.enums import FestivalPhase, OpportunityKind, OpportunityStatus, OpportunityType
from vyom.models.festival import FestivalPlaybook
from vyom.models.merchant import Merchant
from vyom.models.opportunity import Opportunity, OpportunityEvidence
from vyom.services.festival.context import FestivalContext


class FestivalOpportunityGenerator:
    """Generates growth and advisory opportunities based on active and upcoming festival phases."""

    @staticmethod
    def generate_festival_opportunities(
        merchant: Merchant,
        context: FestivalContext,
        customers: list[Customer],
        playbooks: dict[str, FestivalPlaybook],
        today: datetime.date | None = None,
    ) -> list[Opportunity]:
        ref_date = today or datetime.date.today()
        opportunities: list[Opportunity] = []

        # Find eligible audience: consented, active, not opted-out
        consented_customer_ids = [
            c.id
            for c in customers
            if not c.opted_out and (c.consent.marketing.granted or c.telegram.chat_id is not None)
        ]

        # 1. UPCOMING / PREP FESTIVALS (e.g. Navratri)
        for fest in context.upcoming:
            playbook = playbooks.get(fest.key)
            if not playbook or not fest.enabled_for_merchant:
                continue

            # Prioritize customers who self-declared observance of this festival
            observing_customer_ids = [
                c.id
                for c in customers
                if fest.key in c.preferences.observes_festivals and c.id in consented_customer_ids
            ]
            audience_ids = observing_customer_ids or consented_customer_ids[:50]

            # In Prep Phase (e.g. 5 to 12 days before festival):
            # A) Emit Festival Kit Campaign
            if fest.phase == FestivalPhase.PREP or (1 <= fest.days_to_start <= fest.lead_days):
                send_day = max(
                    ref_date, fest.start_date - datetime.timedelta(days=min(5, fest.days_to_start))
                )
                dedupe_key = f"fest-kit-{fest.key}-{fest.start_date.year}"

                opportunities.append(
                    Opportunity(
                        merchant_id=merchant.id,
                        kind=OpportunityKind.CAMPAIGN,
                        type=OpportunityType.FESTIVAL_KIT,
                        festival_key=fest.key,
                        phase=FestivalPhase.PREP,
                        title_key="opportunity.festival_kit.title",
                        evidence=OpportunityEvidence(
                            reason=f"{fest.names.en} starts in {fest.days_to_start} days. Send a curated essentials & puja kit offer.",
                            festival_name=fest.names.en,
                            days_to_festival=fest.days_to_start,
                            expected_uplift_pct=45.0,
                        ),
                        audience_customer_ids=audience_ids,
                        est_return_paise=len(audience_ids)
                        * 12500,  # Rs 125 expected margin per kit
                        est_cost_paise=len(audience_ids) * 50,
                        confidence=0.88,
                        score=round(len(audience_ids) * 124.5, 2),
                        status=OpportunityStatus.DETECTED,
                        recommended_send_at=datetime.datetime.combine(
                            send_day,
                            datetime.time(10, 0),  # 10:00 AM IST outside quiet hours
                        ),
                        expires_at=datetime.datetime.combine(
                            fest.start_date,
                            datetime.time(20, 0),
                        ),
                        dedupe_key=dedupe_key,
                    )
                )

                # B) Emit Festival Stockup Advisory (for the merchant inventory)
                stock_dedupe_key = f"fest-stockup-{fest.key}-{fest.start_date.year}"
                opportunities.append(
                    Opportunity(
                        merchant_id=merchant.id,
                        kind=OpportunityKind.ADVISORY,
                        type=OpportunityType.FESTIVAL_STOCKUP,
                        festival_key=fest.key,
                        phase=FestivalPhase.PREP,
                        title_key="opportunity.festival_stockup.title",
                        evidence=OpportunityEvidence(
                            reason=f"Prepare stock for {fest.names.en}. Key fasting and puja items see high local demand.",
                            festival_name=fest.names.en,
                            days_to_festival=fest.days_to_start,
                        ),
                        audience_customer_ids=[],
                        est_return_paise=850000,  # Rs 8,500 protected revenue against stockouts
                        est_cost_paise=0,
                        confidence=0.90,
                        score=8500.0,
                        status=OpportunityStatus.DETECTED,
                        recommended_send_at=datetime.datetime.combine(
                            ref_date,
                            datetime.time(9, 30),
                        ),
                        expires_at=datetime.datetime.combine(
                            fest.start_date,
                            datetime.time(21, 0),
                        ),
                        dedupe_key=stock_dedupe_key,
                    )
                )

        # 2. ACTIVE FESTIVALS (e.g. Pitru Paksha)
        for fest in context.current:
            playbook = playbooks.get(fest.key)
            if not playbook or not fest.enabled_for_merchant:
                continue

            # During Solemn periods (e.g. Pitru Paksha), generate a respectful advisory, NOT a promotional discount!
            if fest.tone_profile.value == "solemn":
                dedupe_key = f"fest-solemn-advisory-{fest.key}-{fest.start_date.year}"
                opportunities.append(
                    Opportunity(
                        merchant_id=merchant.id,
                        kind=OpportunityKind.ADVISORY,
                        type=OpportunityType.FESTIVAL_STOCKUP,
                        festival_key=fest.key,
                        phase=FestivalPhase.ACTIVE,
                        title_key="opportunity.solemn_samagri.title",
                        evidence=OpportunityEvidence(
                            reason=(
                                f"{fest.names.en} is ongoing ({fest.days_to_end} days remaining). "
                                "Customers require Shraddha & Tarpan samagri (sesame, barley, ghee). "
                                "Keep essentials organized; no promotional discounts should be sent."
                            ),
                            festival_name=fest.names.en,
                            days_to_festival=0,
                        ),
                        audience_customer_ids=[],
                        est_return_paise=400000,
                        est_cost_paise=0,
                        confidence=0.85,
                        score=4000.0,
                        status=OpportunityStatus.DETECTED,
                        recommended_send_at=datetime.datetime.combine(
                            ref_date,
                            datetime.time(9, 0),
                        ),
                        expires_at=datetime.datetime.combine(
                            fest.end_date,
                            datetime.time(21, 0),
                        ),
                        dedupe_key=dedupe_key,
                    )
                )

        # 3. RECENT POST-FESTIVAL PERIODS (e.g. Ganesh Chaturthi)
        for fest in context.recent:
            dedupe_key = f"fest-clearance-{fest.key}-{fest.end_date.year}"
            opportunities.append(
                Opportunity(
                    merchant_id=merchant.id,
                    kind=OpportunityKind.CAMPAIGN,
                    type=OpportunityType.POST_FESTIVAL_CLEARANCE,
                    festival_key=fest.key,
                    phase=FestivalPhase.POST,
                    title_key="opportunity.post_festival_clearance.title",
                    evidence=OpportunityEvidence(
                        reason=f"{fest.names.en} concluded recently. Clear surplus festive decor and perishable sweets ingredients.",
                        festival_name=fest.names.en,
                    ),
                    audience_customer_ids=consented_customer_ids[:30],
                    est_return_paise=150000,
                    est_cost_paise=len(consented_customer_ids[:30]) * 50,
                    confidence=0.75,
                    score=1400.0,
                    status=OpportunityStatus.DETECTED,
                    recommended_send_at=datetime.datetime.combine(
                        ref_date,
                        datetime.time(11, 0),
                    ),
                    expires_at=datetime.datetime.combine(
                        ref_date + datetime.timedelta(days=4),
                        datetime.time(21, 0),
                    ),
                    dedupe_key=dedupe_key,
                )
            )

        return opportunities
