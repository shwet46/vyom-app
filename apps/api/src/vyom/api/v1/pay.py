"""Pay API: rendering payment landing data, UPI intent links, and QR codes."""

from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel

from vyom.core.deps import DatabaseDep
from vyom.models.payment import Payment

router = APIRouter(prefix="/pay", tags=["Pay"])


class PayDetailsResponse(BaseModel):
    pay_token: str
    merchant_name: str
    amount_paise: int
    amount_rupees: float
    purpose: str
    status: str
    upi_intent: str


@router.get("/{token}")
async def get_payment_details(token: str, db: DatabaseDep) -> PayDetailsResponse:
    """Retrieve details for a payment link."""
    doc = await db.payments.find_one({"pay_token": token})
    if not doc:
        # Generate on-the-fly demo payment for instant testing
        return PayDetailsResponse(
            pay_token=token,
            merchant_name="Sharma Kirana Store",
            amount_paise=45000,
            amount_rupees=450.0,
            purpose="Udhaar Settlement",
            status="created",
            upi_intent=f"upi://pay?pa=sharmakirana@paytm&pn=Sharma%20Kirana&am=450.00&cu=INR&tn={token}",
        )

    payment = Payment.model_validate(doc)
    merchant_doc = await db.merchants.find_one({"_id": payment.merchant_id})
    m_name = merchant_doc.get("name", "Sharma Kirana Store") if merchant_doc else "Sharma Kirana Store"

    return PayDetailsResponse(
        pay_token=payment.pay_token,
        merchant_name=m_name,
        amount_paise=payment.amount_paise,
        amount_rupees=payment.amount_paise / 100.0,
        purpose=payment.purpose.value,
        status=payment.status.value,
        upi_intent=payment.upi_intent,
    )
