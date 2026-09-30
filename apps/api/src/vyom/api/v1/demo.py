"""Demo and simulation endpoints for merchant walk-ins, payments, and time travel."""

from __future__ import annotations

import datetime
import random
from typing import Any

import structlog
from fastapi import APIRouter, status
from pydantic import BaseModel, Field

from vyom.clock import Clock
from vyom.core.deps import DatabaseDep
from vyom.core.sse import sse_hub
from vyom.models.enums import KhataEntrySource, KhataStatus, PaymentMode, TransactionSource
from vyom.models.khata import KhataEntry
from vyom.models.transaction import Transaction, TransactionItem
from vyom.scripts.seed import seed_master_data

logger = structlog.get_logger()

router = APIRouter(prefix="/demo", tags=["Demo Simulation"])


class SimulateVisitRequest(BaseModel):
    merchant_id: str = "merchant_sharma_01"
    customer_id: str | None = None
    amount_paise: int | None = Field(default=None, examples=[35000])
    payment_mode: str = Field(default="UPI", description="UPI | CASH | KHATA")
    items: list[dict[str, Any]] | None = None


class SimulatePaymentRequest(BaseModel):
    merchant_id: str = "merchant_sharma_01"
    amount_paise: int = Field(default=25000, examples=[25000])
    customer_id: str | None = None
    pay_token: str | None = None
    khata_entry_id: str | None = None


class SetTodayRequest(BaseModel):
    date_str: str = Field(..., examples=["2026-10-02"])


class AdvanceTimeRequest(BaseModel):
    days: int = Field(default=1, ge=1, le=365)


@router.post("/simulate-visit", status_code=status.HTTP_200_OK)
async def simulate_customer_visit(
    payload: SimulateVisitRequest,
    db: DatabaseDep,
) -> dict[str, Any]:
    """Simulate a customer in-store visit and transaction."""
    now_dt = Clock.now()

    # 1. Resolve customer
    cust_doc = None
    if payload.customer_id:
        cust_doc = await db.customers.find_one({"_id": payload.customer_id, "merchant_id": payload.merchant_id})
    if not cust_doc:
        cust_doc = await db.customers.find_one({"merchant_id": payload.merchant_id})

    customer_id = cust_doc.get("_id") if cust_doc else None
    customer_name = cust_doc.get("name", "Walk-in Customer") if cust_doc else "Walk-in Customer"

    # 2. Determine items and amount
    amount_paise = payload.amount_paise
    items_list: list[TransactionItem] = []

    if payload.items:
        for itm in payload.items:
            items_list.append(
                TransactionItem(
                    catalog_item_id=itm.get("catalog_item_id"),
                    name=itm.get("name", "Grocery item"),
                    qty=float(itm.get("qty", 1.0)),
                    unit_price_paise=int(itm.get("unit_price_paise", 5000)),
                )
            )
        if not amount_paise:
            amount_paise = sum(int(it.qty * it.unit_price_paise) for it in items_list)
    else:
        if not amount_paise:
            amount_paise = random.randint(15000, 75000)
        items_list.append(
            TransactionItem(
                name="Assorted Kirana Items",
                qty=1.0,
                unit_price_paise=amount_paise,
            )
        )

    mode = PaymentMode.UPI
    if payload.payment_mode.upper() == "CASH":
        mode = PaymentMode.CASH
    elif payload.payment_mode.upper() == "KHATA":
        mode = PaymentMode.KHATA

    # 3. If Khata, record credit entry
    khata_entry_id = None
    if mode == PaymentMode.KHATA and customer_id:
        due_date = Clock.today() + datetime.timedelta(days=7)
        khata_entry = KhataEntry(
            merchant_id=payload.merchant_id,
            customer_id=customer_id,
            amount_total_paise=amount_paise,
            opened_at=now_dt,
            due_date=due_date,
            status=KhataStatus.OPEN,
            source=KhataEntrySource.MANUAL,
        )
        await db.khata_entries.insert_one(khata_entry.to_mongo())
        khata_entry_id = khata_entry.id

    # 4. Insert transaction
    txn = Transaction(
        merchant_id=payload.merchant_id,
        customer_id=customer_id,
        amount_paise=amount_paise,
        items=items_list,
        payment_mode=mode,
        paid_at=now_dt,
        source=TransactionSource.PAYTM_SIM,
    )
    await db.transactions.insert_one(txn.to_mongo())

    # 5. Update customer RFM stats
    if customer_id:
        await db.customers.update_one(
            {"_id": customer_id},
            {
                "$set": {"rfm.recency_days": 0, "updated_at": now_dt},
                "$inc": {
                    "rfm.frequency_visits": 1,
                    "rfm.monetary_total_paise": amount_paise,
                },
            },
        )

    # 6. Broadcast SSE event
    await sse_hub.broadcast(
        payload.merchant_id,
        "demo.visit_simulated",
        {
            "transaction_id": txn.id,
            "customer_id": customer_id,
            "customer_name": customer_name,
            "amount_paise": amount_paise,
            "amount_rupees": amount_paise / 100.0,
            "payment_mode": mode.value,
            "khata_entry_id": khata_entry_id,
        },
    )

    return {
        "status": "visit_simulated",
        "transaction_id": txn.id,
        "customer_name": customer_name,
        "amount_paise": amount_paise,
        "payment_mode": mode.value,
        "khata_entry_id": khata_entry_id,
    }


@router.post("/simulate-payment", status_code=status.HTTP_200_OK)
async def simulate_soundbox_payment(
    payload: SimulatePaymentRequest,
    db: DatabaseDep,
) -> dict[str, Any]:
    """Simulate a Paytm Soundbox audio alert and UPI transaction."""
    now_dt = Clock.now()

    # 1. Update khata entry if specified
    if payload.khata_entry_id:
        entry_doc = await db.khata_entries.find_one({"_id": payload.khata_entry_id})
        if entry_doc:
            total = entry_doc.get("amount_total_paise", 0)
            current_paid = entry_doc.get("amount_paid_paise", 0) + payload.amount_paise
            new_status = "paid" if current_paid >= total else "open"
            await db.khata_entries.update_one(
                {"_id": payload.khata_entry_id},
                {
                    "$set": {
                        "amount_paid_paise": current_paid,
                        "status": new_status,
                        "updated_at": now_dt,
                    }
                },
            )
            await sse_hub.broadcast(
                payload.merchant_id,
                "khata.paid",
                {
                    "entry_id": payload.khata_entry_id,
                    "amount_paid_paise": payload.amount_paise,
                    "status": new_status,
                },
            )

    # 2. Record Transaction
    txn = Transaction(
        merchant_id=payload.merchant_id,
        customer_id=payload.customer_id,
        amount_paise=payload.amount_paise,
        items=[],
        payment_mode=PaymentMode.UPI,
        paid_at=now_dt,
        source=TransactionSource.PAYTM_SIM,
    )
    await db.transactions.insert_one(txn.to_mongo())

    # 3. Soundbox announcement text
    soundbox_text = f"Paytm par {payload.amount_paise // 100} rupaye prapt hue"

    # 4. Broadcast event
    await sse_hub.broadcast(
        payload.merchant_id,
        "paytm.payment_received",
        {
            "transaction_id": txn.id,
            "amount_paise": payload.amount_paise,
            "amount_rupees": payload.amount_paise / 100.0,
            "soundbox_announcement": soundbox_text,
            "paid_at": now_dt.isoformat(),
        },
    )

    return {
        "status": "payment_simulated",
        "transaction_id": txn.id,
        "amount_paise": payload.amount_paise,
        "amount_rupees": payload.amount_paise / 100.0,
        "soundbox_announcement": soundbox_text,
    }


@router.post("/set-today", status_code=status.HTTP_200_OK)
async def set_demo_today(payload: SetTodayRequest) -> dict[str, Any]:
    """Manually change the simulated date for festival phase verification."""
    Clock.set_demo_today(payload.date_str)
    new_today = Clock.today().isoformat()
    logger.info("demo_today_set", new_today=new_today)

    await sse_hub.broadcast(
        "merchant_sharma_01",
        "demo.date_changed",
        {"today": new_today},
    )

    return {
        "status": "updated",
        "today": new_today,
    }


@router.post("/advance-time", status_code=status.HTTP_200_OK)
async def advance_demo_time(payload: AdvanceTimeRequest) -> dict[str, Any]:
    """Advance the clock by N days to simulate time progression."""
    current_date = Clock.today()
    next_date = current_date + datetime.timedelta(days=payload.days)
    Clock.set_demo_today(next_date.isoformat())

    await sse_hub.broadcast(
        "merchant_sharma_01",
        "demo.date_changed",
        {
            "today": next_date.isoformat(),
            "advanced_days": payload.days,
        },
    )

    return {
        "status": "advanced",
        "previous_date": current_date.isoformat(),
        "today": next_date.isoformat(),
        "days_advanced": payload.days,
    }


@router.post("/reset", status_code=status.HTTP_200_OK)
async def reset_demo_state(db: DatabaseDep) -> dict[str, Any]:
    """Reset clock and re-seed master data to initial clean demo state."""
    Clock.reset()
    await seed_master_data(db)

    reset_today = Clock.today().isoformat()
    await sse_hub.broadcast(
        "merchant_sharma_01",
        "demo.reset",
        {"today": reset_today},
    )

    return {
        "status": "reset_completed",
        "today": reset_today,
        "message": "Demo state restored successfully.",
    }
