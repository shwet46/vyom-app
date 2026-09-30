"""Payment records for UPI intents, dynamic QR codes, and pay-links."""

from __future__ import annotations

import datetime
from typing import Any

from vyom.models.base import MongoModel
from vyom.models.enums import PaymentPurpose, PaymentStatus


class Payment(MongoModel):
    """Payment transaction for udhaar repayment, coupon purchase, or kit preorder."""

    merchant_id: str
    customer_id: str | None = None
    purpose: PaymentPurpose = PaymentPurpose.UDHAAR
    khata_entry_id: str | None = None
    coupon_id: str | None = None
    kit_request_id: str | None = None
    amount_paise: int
    pay_token: str  # Unique token in pay link
    status: PaymentStatus = PaymentStatus.CREATED
    upi_intent: str  # upi://pay?...
    qr_media_id: str | None = None
    paid_at: datetime.datetime | None = None
    webhook_payload: dict[str, Any] | None = None
