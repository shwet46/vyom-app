import datetime
import json
from collections import defaultdict
from typing import Any, Optional

from vyom.models.opportunity import Opportunity, OpportunityEvidence
from vyom.models.enums import OpportunityKind, OpportunityType, OpportunityStatus
from vyom.models.merchant import Merchant
from vyom.ai.llm import get_llm_client
import structlog

logger = structlog.get_logger()

class FeatureEngine:
    @staticmethod
    def calculate_sales_period(transactions: list[dict[str, Any]], start: datetime.datetime, end: datetime.datetime) -> float:
        total = 0.0
        for txn in transactions:
            if start <= txn["timestamp"] < end and txn.get("status") == "TXN_SUCCESS":
                total += float(txn.get("amount", 0.0))
        return total

    @staticmethod
    def identify_dead_hours(transactions: list[dict[str, Any]], end: datetime.datetime, days_back: int = 14) -> list[int]:
        start = end - datetime.timedelta(days=days_back)
        hour_counts = defaultdict(int)
        for txn in transactions:
            if start <= txn["timestamp"] < end and txn.get("status") == "TXN_SUCCESS":
                hour_counts[txn["timestamp"].hour] += 1
        
        active_hours = {h: c for h, c in hour_counts.items() if c > 0}
        if not active_hours:
            return []
        
        avg = sum(active_hours.values()) / len(active_hours)
        dead = [h for h, c in active_hours.items() if c < avg * 0.3]
        return dead

    @staticmethod
    def analyze_customers(transactions: list[dict[str, Any]], end: datetime.datetime) -> list[str]:
        customer_last_txn = {}
        customer_txns = defaultdict(list)
        for txn in transactions:
            cid = txn.get("customer_id")
            if not cid or txn.get("status") != "TXN_SUCCESS":
                continue
            customer_txns[cid].append(txn["timestamp"])
            if cid not in customer_last_txn or txn["timestamp"] > customer_last_txn[cid]:
                customer_last_txn[cid] = txn["timestamp"]
        
        churn_risk = []
        for cid, txns in customer_txns.items():
            if len(txns) < 3:
                continue
            txns.sort()
            gaps = [(txns[i] - txns[i-1]).days for i in range(1, len(txns))]
            avg_gap = sum(gaps) / len(gaps) if gaps else 0
            
            days_since_last = (end - customer_last_txn[cid]).days
            if avg_gap > 0 and days_since_last > avg_gap * 2:
                churn_risk.append(cid)
        return churn_risk

    @staticmethod
    def find_growth_opportunities(transactions: list[dict[str, Any]], end: datetime.datetime) -> dict[str, Any]:
        start = end - datetime.timedelta(days=28)
        day_sales = defaultdict(float)
        for txn in transactions:
            if start <= txn["timestamp"] < end and txn.get("status") == "TXN_SUCCESS":
                day_sales[txn["timestamp"].weekday()] += float(txn.get("amount", 0.0))
        
        if not day_sales:
            return {}
        
        best_day = max(day_sales.items(), key=lambda x: x[1])
        avg = sum(day_sales.values()) / len(day_sales)
        if best_day[1] > avg * 1.5:
            return {"best_day": best_day[0], "sales": best_day[1]}
        return {}


class ProactiveOpportunityEngine:
    @staticmethod
    async def detect_opportunities(transactions: list[dict[str, Any]], merchant: Merchant, today: Optional[datetime.datetime] = None) -> list[Opportunity]:
        if today is None:
            today = datetime.datetime.now()
        
        opps = []
        
        # 1. Falling sales
        recent_start = today - datetime.timedelta(days=7)
        prev_start = recent_start - datetime.timedelta(days=7)
        recent_sales = FeatureEngine.calculate_sales_period(transactions, recent_start, today)
        prev_sales = FeatureEngine.calculate_sales_period(transactions, prev_start, recent_start)
        
        if prev_sales > 0 and (prev_sales - recent_sales) / prev_sales >= 0.15:
            opp = Opportunity(
                merchant_id=merchant.id,
                type=OpportunityType.FALLING_SALES,
                kind=OpportunityKind.RISK,
                status=OpportunityStatus.NEW if not hasattr(OpportunityStatus, "DETECTED") else OpportunityStatus.DETECTED,
                title_key="falling_sales",
                dedupe_key=f"falling_sales_{today.strftime('%Y%m%d')}",
                est_return_paise=int((prev_sales - recent_sales) * 100),
                evidence=OpportunityEvidence(
                    reason=f"Sales dropped by {((prev_sales - recent_sales) / prev_sales)*100:.1f}% compared to last week.",
                    extra={"metric_delta_pct": ((prev_sales - recent_sales) / prev_sales)*100}
                )
            )
            opps.append(opp)

        # 2. Dead hours
        dead_hours = FeatureEngine.identify_dead_hours(transactions, today)
        if dead_hours:
            slot = f"{dead_hours[0]}:00 - {dead_hours[0]+1}:00"
            opp = Opportunity(
                merchant_id=merchant.id,
                type=OpportunityType.DEAD_HOUR,
                kind=OpportunityKind.GROWTH,
                status=OpportunityStatus.NEW if not hasattr(OpportunityStatus, "DETECTED") else OpportunityStatus.DETECTED,
                title_key="dead_hours",
                dedupe_key=f"dead_hours_{today.strftime('%Y%m%d')}",
                est_return_paise=100000, 
                evidence=OpportunityEvidence(
                    reason=f"Consistently low sales during {slot}.",
                    dead_hour_slot=slot
                )
            )
            opps.append(opp)
            
        # 3. Churn risk
        churn_risk_cids = FeatureEngine.analyze_customers(transactions, today)
        if churn_risk_cids:
            opp = Opportunity(
                merchant_id=merchant.id,
                type=OpportunityType.WINBACK,
                kind=OpportunityKind.RISK,
                status=OpportunityStatus.NEW if not hasattr(OpportunityStatus, "DETECTED") else OpportunityStatus.DETECTED,
                title_key="churn_risk",
                dedupe_key=f"churn_risk_{today.strftime('%Y%m%d')}",
                est_return_paise=len(churn_risk_cids) * 50000, 
                evidence=OpportunityEvidence(
                    reason=f"{len(churn_risk_cids)} regular customers are overdue for a visit.",
                    churned_customers_count=len(churn_risk_cids)
                ),
                audience_customer_ids=churn_risk_cids
            )
            opps.append(opp)
            
        # 4. Growth
        growth = FeatureEngine.find_growth_opportunities(transactions, today)
        if growth:
            days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
            best = days[growth["best_day"]]
            opp = Opportunity(
                merchant_id=merchant.id,
                type=OpportunityType.FESTIVAL_STOCKUP,
                kind=OpportunityKind.GROWTH,
                status=OpportunityStatus.NEW if not hasattr(OpportunityStatus, "DETECTED") else OpportunityStatus.DETECTED,
                title_key="high_sales_day",
                dedupe_key=f"growth_{today.strftime('%Y%m%d')}",
                est_return_paise=int(growth["sales"] * 100 * 0.1),
                evidence=OpportunityEvidence(
                    reason=f"{best} is typically your best sales day.",
                )
            )
            opps.append(opp)
            
        # Step 3: Explanation and Recommendation via LLM
        for opp in opps:
            await cls.enrich_with_llm(opp, merchant)
            
        return opps

    @classmethod
    async def enrich_with_llm(cls, opp: Opportunity, merchant: Merchant):
        llm = get_llm_client()
        prompt = f"""
You are an AI assistant for a kirana store merchant. An opportunity has been detected.
Type: {opp.type}
Evidence: {opp.evidence.reason}
Expected Return: {opp.est_return_paise / 100} INR

Provide an explanation in simple language and suggest one practical action.
Generate a JSON object with:
"headline": a short title
"body": plain language explanation
"offer_type": discount, alert, or campaign
"discount_pct": numerical discount percentage if applicable (0 if none)
"target_items": list of relevant products if any
"""
        try:
            res_str = await llm.generate([{"role": "user", "content": prompt}], json_mode=True)
            res_json = json.loads(res_str)
            
            # Apply guardrails
            if "discount_pct" in res_json:
                res_json = cls.check_guardrails(res_json, merchant)
            
            from vyom.models.opportunity import OpportunityRecommendation
            opp.recommendation = OpportunityRecommendation(**res_json)
        except Exception as e:
            logger.error("llm_enrichment_failed", error=str(e))

    @staticmethod
    def check_guardrails(recommendation: dict, merchant: Merchant) -> dict:
        max_discount = getattr(merchant.settings, "max_discount_pct", 10.0)
        
        # Enforce max discount
        if recommendation.get("discount_pct", 0) > max_discount:
            recommendation["discount_pct"] = max_discount
            logger.info("guardrail_applied", overridden_discount=max_discount)
            
        return recommendation
