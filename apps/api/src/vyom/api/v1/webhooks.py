"""Webhook endpoints for Paytm Soundbox/POS and Telegram bot updates."""

from __future__ import annotations

from typing import Any

import structlog
from fastapi import APIRouter, Header, Request, status
from pydantic import BaseModel, Field

from vyom.clock import Clock
from vyom.core.deps import DatabaseDep
from vyom.core.sse import sse_hub
from vyom.models.enums import PaymentMode, PaymentStatus, TransactionSource
from vyom.models.payment import Payment
from vyom.models.transaction import Transaction

logger = structlog.get_logger()

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


class PaytmWebhookPayload(BaseModel):
    """Payload sent by Paytm POS / Soundbox payment event notification."""

    merchant_id: str = Field(default="merchant_sharma_01")
    order_id: str
    amount_paise: int
    status: str = Field(default="SUCCESS", description="SUCCESS | FAILURE | PENDING")
    payment_mode: str = Field(default="UPI", description="UPI | WALLET | CARD | NETBANKING")
    customer_phone: str | None = None
    customer_id: str | None = None
    pay_token: str | None = None
    coupon_code: str | None = None
    campaign_id: str | None = None
    kit_request_id: str | None = None


@router.post("/paytm", status_code=status.HTTP_200_OK)
async def paytm_webhook(
    payload: PaytmWebhookPayload,
    db: DatabaseDep,
    x_paytm_signature: str | None = Header(None),
) -> dict[str, Any]:
    """Handle incoming Paytm Soundbox / UPI transaction notifications."""
    now_dt = Clock.now()
    logger.info(
        "paytm_webhook_received",
        order_id=payload.order_id,
        amount_paise=payload.amount_paise,
        status=payload.status,
    )

    if payload.status.upper() == "SUCCESS":
        # 1. Check if linked to an existing Payment link (udhaar or festival kit)
        if payload.pay_token:
            payment_doc = await db.payments.find_one({"pay_token": payload.pay_token})
            if payment_doc:
                payment = Payment.model_validate(payment_doc)
                await db.payments.update_one(
                    {"_id": payment.id},
                    {
                        "$set": {
                            "status": PaymentStatus.PAID,
                            "paid_at": now_dt,
                            "webhook_payload": payload.model_dump(),
                            "updated_at": now_dt,
                        }
                    },
                )

                # If udhaar repayment
                if payment.khata_entry_id:
                    entry_doc = await db.khata_entries.find_one({"_id": payment.khata_entry_id})
                    if entry_doc:
                        total = entry_doc.get("amount_total_paise", 0)
                        current_paid = entry_doc.get("amount_paid_paise", 0) + payload.amount_paise
                        new_status = "paid" if current_paid >= total else "open"
                        await db.khata_entries.update_one(
                            {"_id": payment.khata_entry_id},
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
                                "entry_id": payment.khata_entry_id,
                                "amount_paid_paise": payload.amount_paise,
                                "status": new_status,
                            },
                        )

        # 2. Record sale transaction in database
        txn = Transaction(
            merchant_id=payload.merchant_id,
            customer_id=payload.customer_id,
            amount_paise=payload.amount_paise,
            items=[],
            payment_mode=PaymentMode.UPI if payload.payment_mode.upper() == "UPI" else PaymentMode.CASH,
            paid_at=now_dt,
            source=TransactionSource.PAYTM_SIM,
            coupon_code=payload.coupon_code,
            campaign_id=payload.campaign_id,
            kit_request_id=payload.kit_request_id,
        )
        await db.transactions.insert_one(txn.to_mongo())

        # 3. Broadcast real-time SSE event to merchant dashboard
        soundbox_text = f"Paytm par {payload.amount_paise // 100} rupaye prapt hue"
        await sse_hub.broadcast(
            payload.merchant_id,
            "paytm.payment_received",
            {
                "order_id": payload.order_id,
                "amount_paise": payload.amount_paise,
                "amount_rupees": payload.amount_paise / 100.0,
                "soundbox_announcement": soundbox_text,
                "paid_at": now_dt.isoformat(),
                "customer_phone": payload.customer_phone,
            },
        )

    return {
        "status": "processed",
        "order_id": payload.order_id,
        "amount_paise": payload.amount_paise,
    }


@router.post("/telegram", status_code=status.HTTP_200_OK)
async def telegram_webhook(
    request: Request,
    x_telegram_bot_api_secret_token: str | None = Header(None),
) -> dict[str, Any]:
    """Handle incoming Telegram webhook updates for the customer shop bot."""
    update_data: dict[str, Any] = await request.json()
    logger.info("telegram_webhook_received", update_id=update_data.get("update_id"))

    # When bot module is wired in Phase 5, feed to aiogram dispatcher
    try:
        from aiogram.types import Update

        from vyom.bot.app import bot, dp

        telegram_update = Update.model_validate(update_data, context={"bot": bot})
        await dp.feed_update(bot, telegram_update)
    except (ImportError, Exception) as exc:
        logger.debug("telegram_bot_dispatcher_skipped", error=str(exc))

    return {"ok": True}
