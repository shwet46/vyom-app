"""Pay API: rendering payment landing data, UPI intent links, and QR codes."""

from __future__ import annotations

from fastapi import APIRouter
from fastapi.responses import HTMLResponse
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
            amount_paise=135000,
            amount_rupees=1350.0,
            purpose="Udhaar Settlement",
            status="created",
            upi_intent=f"upi://pay?pa=sharmakirana@paytm&pn=Sharma%20Kirana&am=1350.00&cu=INR&tn={token}",
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


@router.get("/{token}/view", response_class=HTMLResponse)
async def view_payment_page(token: str, db: DatabaseDep) -> HTMLResponse:
    """Render a mobile-friendly, interactive mock Paytm / UPI payment portal."""
    doc = await db.payments.find_one({"pay_token": token})
    if doc:
        amount_paise = doc.get("amount_paise", 135000)
        merchant_id = doc.get("merchant_id", "merchant_sharma_01")
        purpose = doc.get("purpose", "Udhaar Settlement")
    else:
        amount_paise = 135000
        merchant_id = "merchant_sharma_01"
        purpose = "Udhaar Settlement"

    merchant_doc = await db.merchants.find_one({"_id": merchant_id})
    store_name = merchant_doc.get("name", "Sharma Kirana Store") if merchant_doc else "Sharma Kirana Store"
    store_upi = merchant_doc.get("upi_id", "sharmakirana@paytm") if merchant_doc else "sharmakirana@paytm"
    amount_rupees = amount_paise / 100.0

    upi_intent = f"upi://pay?pa={store_upi}&pn=Sharma%20Kirana&am={amount_rupees:.2f}&cu=INR&tn={token}"
    qr_url = f"https://api.qrserver.com/v1/create-qr-code/?size=280x280&data={upi_intent}&bgcolor=ffffff&color=002e6e&margin=10"

    # Format purpose nicely
    purpose_display = "Udhaar (Credit) Settlement" if "udhaar" in str(purpose).lower() else purpose.replace("_", " ").title()

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <title>Pay ₹{amount_rupees:.0f} — {store_name}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}
    :root {{
      --paytm-blue: #002570;
      --paytm-sky: #00BAF2;
      --paytm-light: #E8F4FD;
      --green: #00C853;
      --green-dark: #00A042;
      --text-primary: #0A0F1E;
      --text-secondary: #546E7A;
      --border: #E3ECF5;
      --bg: #F0F4F8;
      --card-bg: #FFFFFF;
      --shadow: 0 20px 60px rgba(0, 37, 112, 0.12);
    }}
    body {{
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: var(--bg);
      min-height: 100vh;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: 16px;
    }}
    .wrapper {{
      width: 100%;
      max-width: 420px;
    }}

    /* ── Card ── */
    .card {{
      background: var(--card-bg);
      border-radius: 28px;
      box-shadow: var(--shadow);
      overflow: hidden;
    }}

    /* ── Header ── */
    .header {{
      background: linear-gradient(160deg, #002570 0%, #0055C8 55%, #00BAF2 100%);
      padding: 28px 24px 24px;
      position: relative;
      overflow: hidden;
    }}
    .header::before {{
      content: '';
      position: absolute;
      top: -40px; right: -40px;
      width: 160px; height: 160px;
      border-radius: 50%;
      background: rgba(255,255,255,0.06);
    }}
    .header::after {{
      content: '';
      position: absolute;
      bottom: -30px; left: 10px;
      width: 100px; height: 100px;
      border-radius: 50%;
      background: rgba(0,186,242,0.12);
    }}
    .brand-row {{
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 18px;
    }}
    .paytm-logo {{
      display: flex;
      align-items: center;
      gap: 6px;
    }}
    .paytm-p {{
      background: #00BAF2;
      color: #fff;
      font-size: 13px;
      font-weight: 900;
      width: 28px; height: 28px;
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      letter-spacing: -1px;
    }}
    .paytm-text {{
      font-size: 20px;
      font-weight: 900;
      color: #fff;
      letter-spacing: -0.5px;
    }}
    .verified-badge {{
      margin-left: auto;
      background: rgba(255,255,255,0.18);
      backdrop-filter: blur(4px);
      border: 1px solid rgba(255,255,255,0.25);
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 20px;
      display: flex;
      align-items: center;
      gap: 4px;
    }}
    .merchant-row {{
      display: flex;
      align-items: center;
      gap: 14px;
    }}
    .merchant-avatar {{
      width: 52px; height: 52px;
      border-radius: 16px;
      background: rgba(255,255,255,0.2);
      backdrop-filter: blur(6px);
      border: 2px solid rgba(255,255,255,0.3);
      display: flex; align-items: center; justify-content: center;
      font-size: 24px;
      flex-shrink: 0;
    }}
    .merchant-info {{ color: #fff; }}
    .merchant-name {{ font-size: 18px; font-weight: 800; line-height: 1.2; }}
    .merchant-sub {{ font-size: 12px; opacity: 0.80; margin-top: 3px; font-weight: 500; }}

    /* ── Body ── */
    .body {{ padding: 24px; }}

    /* ── Amount Box ── */
    .amount-section {{
      background: linear-gradient(135deg, var(--paytm-light) 0%, #D6EDFF 100%);
      border: 1.5px solid #B8D9F0;
      border-radius: 20px;
      padding: 20px;
      text-align: center;
      margin-bottom: 20px;
      position: relative;
      overflow: hidden;
    }}
    .amount-section::after {{
      content: '₹';
      position: absolute;
      right: -10px; top: -20px;
      font-size: 120px;
      font-weight: 900;
      color: rgba(0,37,112,0.04);
      line-height: 1;
    }}
    .amount-label {{
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: var(--paytm-blue);
      opacity: 0.7;
      margin-bottom: 6px;
    }}
    .amount-value {{
      font-size: 44px;
      font-weight: 900;
      color: var(--paytm-blue);
      line-height: 1;
      letter-spacing: -1px;
    }}
    .amount-purpose {{
      font-size: 12px;
      color: var(--paytm-blue);
      opacity: 0.65;
      margin-top: 6px;
      font-weight: 600;
    }}

    /* ── Divider ── */
    .divider {{
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 18px 0;
      color: var(--text-secondary);
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }}
    .divider::before, .divider::after {{
      content: '';
      flex: 1;
      height: 1px;
      background: var(--border);
    }}

    /* ── QR Section ── */
    .qr-section {{
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 20px;
    }}
    .qr-frame {{
      background: #fff;
      border: 2px solid var(--border);
      border-radius: 20px;
      padding: 14px;
      box-shadow: 0 4px 16px rgba(0,37,112,0.07);
      position: relative;
    }}
    .qr-frame .corner {{
      position: absolute;
      width: 16px; height: 16px;
      border-color: var(--paytm-sky);
      border-style: solid;
    }}
    .qr-frame .corner.tl {{ top: 6px; left: 6px; border-width: 3px 0 0 3px; border-radius: 4px 0 0 0; }}
    .qr-frame .corner.tr {{ top: 6px; right: 6px; border-width: 3px 3px 0 0; border-radius: 0 4px 0 0; }}
    .qr-frame .corner.bl {{ bottom: 6px; left: 6px; border-width: 0 0 3px 3px; border-radius: 0 0 0 4px; }}
    .qr-frame .corner.br {{ bottom: 6px; right: 6px; border-width: 0 3px 3px 0; border-radius: 0 0 4px 0; }}
    .qr-frame img {{
      width: 200px; height: 200px;
      display: block;
      border-radius: 8px;
    }}
    .qr-hint {{
      font-size: 12px;
      color: var(--text-secondary);
      font-weight: 500;
      margin-top: 10px;
      text-align: center;
    }}
    .upi-apps {{
      display: flex;
      gap: 12px;
      margin-top: 10px;
      align-items: center;
    }}
    .upi-app {{
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
      font-size: 10px;
      font-weight: 600;
      color: var(--text-secondary);
    }}
    .upi-app-icon {{
      width: 32px; height: 32px;
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px;
      border: 1px solid var(--border);
    }}

    /* ── Buttons ── */
    .btn {{
      width: 100%;
      padding: 16px;
      border-radius: 16px;
      font-size: 15px;
      font-weight: 800;
      border: none;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      letter-spacing: -0.2px;
    }}
    .btn-primary {{
      background: linear-gradient(135deg, #002570, #0055C8);
      color: #fff;
      box-shadow: 0 6px 20px rgba(0,37,112,0.35);
      margin-bottom: 10px;
    }}
    .btn-primary:hover {{ transform: translateY(-1px); box-shadow: 0 8px 24px rgba(0,37,112,0.45); }}
    .btn-primary:active {{ transform: translateY(0); }}
    .btn-secondary {{
      background: var(--paytm-light);
      color: var(--paytm-blue);
      border: 1.5px solid #B8D9F0;
      margin-bottom: 14px;
    }}
    .btn-secondary:hover {{ background: #D0E9F8; }}
    .btn-upi {{
      background: linear-gradient(135deg, #6C47FF, #9B72FF);
      color: #fff;
      box-shadow: 0 6px 20px rgba(108,71,255,0.35);
    }}
    .btn-upi:hover {{ transform: translateY(-1px); box-shadow: 0 8px 24px rgba(108,71,255,0.45); }}

    /* ── Info Row ── */
    .info-row {{
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      background: #F8FAFC;
      border: 1px solid var(--border);
      border-radius: 10px;
      font-size: 12px;
      color: var(--text-secondary);
      margin-bottom: 10px;
    }}
    .info-row strong {{ color: var(--text-primary); }}

    /* ── Security footer ── */
    .security {{
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      font-size: 11px;
      color: #94A3B8;
      font-weight: 600;
      padding-top: 4px;
      margin-top: 4px;
    }}

    /* ── Processing Overlay ── */
    .processing-overlay {{
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,37,112,0.55);
      backdrop-filter: blur(6px);
      z-index: 100;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 20px;
    }}
    .processing-overlay.active {{ display: flex; }}
    .spinner {{
      width: 56px; height: 56px;
      border-radius: 50%;
      border: 4px solid rgba(255,255,255,0.2);
      border-top-color: #fff;
      animation: spin 0.8s linear infinite;
    }}
    @keyframes spin {{ to {{ transform: rotate(360deg); }} }}
    .processing-text {{
      color: #fff;
      font-size: 15px;
      font-weight: 700;
      text-align: center;
    }}

    /* ── Success Screen ── */
    .success-screen {{
      display: none;
      padding: 40px 24px 32px;
      text-align: center;
      background: #fff;
    }}
    .success-screen.active {{ display: block; }}
    .success-icon {{
      width: 84px; height: 84px;
      border-radius: 50%;
      background: linear-gradient(135deg, #00C853, #00A042);
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 20px;
      box-shadow: 0 12px 32px rgba(0,200,83,0.35);
      font-size: 40px;
      animation: pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    }}
    @keyframes pop {{ from {{ transform: scale(0); opacity: 0; }} to {{ transform: scale(1); opacity: 1; }} }}
    .success-title {{
      font-size: 26px;
      font-weight: 900;
      color: var(--text-primary);
      margin-bottom: 6px;
    }}
    .success-amount {{
      font-size: 16px;
      font-weight: 700;
      color: var(--green);
      margin-bottom: 24px;
    }}
    .receipt-card {{
      background: #F8FAFC;
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 18px;
      text-align: left;
      margin-bottom: 24px;
    }}
    .receipt-row {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      font-size: 13px;
      border-bottom: 1px solid var(--border);
    }}
    .receipt-row:last-child {{ border-bottom: none; padding-bottom: 0; }}
    .receipt-row .label {{ color: var(--text-secondary); font-weight: 500; }}
    .receipt-row .value {{ font-weight: 700; color: var(--text-primary); font-size: 12.5px; }}
    .receipt-row .value.green {{ color: var(--green); }}
    .txn-id {{
      font-family: 'Courier New', monospace;
      font-size: 11px;
      background: #E8F4FD;
      padding: 3px 7px;
      border-radius: 6px;
      color: var(--paytm-blue);
    }}
    .btn-done {{
      background: linear-gradient(135deg, #002570, #0055C8);
      color: #fff;
      box-shadow: 0 6px 20px rgba(0,37,112,0.30);
      width: 100%;
      padding: 16px;
      border-radius: 16px;
      font-size: 15px;
      font-weight: 800;
      border: none;
      cursor: pointer;
    }}
  </style>
</head>
<body>
  <!-- Processing Overlay -->
  <div class="processing-overlay" id="processing-overlay">
    <div class="spinner"></div>
    <div class="processing-text">Processing Your Payment...<br><span style="font-size:12px;opacity:0.8;">Please wait, contacting bank</span></div>
  </div>

  <div class="wrapper">
    <div class="card">
      <!-- Header -->
      <div class="header">
        <div class="brand-row">
          <div class="paytm-logo">
            <div class="paytm-p">P</div>
            <span class="paytm-text">Paytm</span>
          </div>
          <div class="verified-badge">✓ Verified Merchant</div>
        </div>
        <div class="merchant-row">
          <div class="merchant-avatar">🏪</div>
          <div class="merchant-info">
            <div class="merchant-name">{store_name}</div>
            <div class="merchant-sub">📍 Somwar Peth, Pune • UPI: {store_upi}</div>
          </div>
        </div>
      </div>

      <!-- Payment Form -->
      <div id="payment-form" class="body">
        <!-- Amount -->
        <div class="amount-section">
          <div class="amount-label">Kul Baki Rashi (Amount Due)</div>
          <div class="amount-value">₹{amount_rupees:.0f}</div>
          <div class="amount-purpose">{purpose_display}</div>
        </div>

        <!-- Info -->
        <div class="info-row">
          <span>🏪</span>
          <span>Pay to: <strong>{store_upi}</strong></span>
        </div>
        <div class="info-row">
          <span>🧾</span>
          <span>Ref: <strong style="font-family:monospace;font-size:11px;">{token[:20]}</strong></span>
        </div>

        <div class="divider">Scan QR Code</div>

        <!-- QR Code -->
        <div class="qr-section">
          <div class="qr-frame">
            <div class="corner tl"></div>
            <div class="corner tr"></div>
            <div class="corner bl"></div>
            <div class="corner br"></div>
            <img src="{qr_url}" alt="Paytm UPI QR Code — {store_name}" loading="eager" />
          </div>
          <div class="qr-hint">Scan with any UPI app to pay ₹{amount_rupees:.0f}</div>
          <div class="upi-apps">
            <div class="upi-app"><div class="upi-app-icon">💙</div><span>Paytm</span></div>
            <div class="upi-app"><div class="upi-app-icon">🟣</div><span>PhonePe</span></div>
            <div class="upi-app"><div class="upi-app-icon">⬛</div><span>GPay</span></div>
            <div class="upi-app"><div class="upi-app-icon">🟠</div><span>BHIM</span></div>
          </div>
        </div>

        <div class="divider">Or Pay Directly</div>

        <!-- Buttons -->
        <button id="pay-btn-paytm" class="btn btn-primary" onclick="processMockPayment('paytm')">
          💳 Pay ₹{amount_rupees:.0f} via Paytm UPI
        </button>
        <button id="pay-btn-upi" class="btn btn-upi" onclick="processMockPayment('upi')">
          📲 Pay via GPay / PhonePe / BHIM
        </button>

        <div class="security">🔒 256-bit SSL Encrypted • RBI Regulated • Instant Soundbox Confirmation</div>
      </div>

      <!-- Success Screen -->
      <div id="success-screen" class="success-screen">
        <div class="success-icon">✓</div>
        <div class="success-title">Payment Successful!</div>
        <div class="success-amount">₹{amount_rupees:.0f} Paid to {store_name}</div>

        <div class="receipt-card">
          <div class="receipt-row">
            <span class="label">Status</span>
            <span class="value green">✓ Completed</span>
          </div>
          <div class="receipt-row">
            <span class="label">Amount Paid</span>
            <span class="value">₹{amount_rupees:.2f}</span>
          </div>
          <div class="receipt-row">
            <span class="label">Payment Mode</span>
            <span class="value" id="payment-mode-val">Paytm UPI</span>
          </div>
          <div class="receipt-row">
            <span class="label">Merchant</span>
            <span class="value">{store_name}</span>
          </div>
          <div class="receipt-row">
            <span class="label">Khata</span>
            <span class="value green">✓ Settled in Ledger</span>
          </div>
          <div class="receipt-row">
            <span class="label">Txn ID</span>
            <span class="value"><span class="txn-id" id="txn-id-val">UPI-PAYTM-{token[:12].upper()}</span></span>
          </div>
        </div>

        <button class="btn-done" onclick="window.close()">Done — Vapas Jaayein ✓</button>
      </div>
    </div>
  </div>

  <script>
    async function processMockPayment(mode) {{
      const overlay = document.getElementById('processing-overlay');
      overlay.classList.add('active');

      const modeNames = {{ paytm: 'Paytm UPI', upi: 'UPI (GPay/PhonePe)' }};
      document.getElementById('payment-mode-val').textContent = modeNames[mode] || 'UPI';

      const txnPrefix = mode === 'paytm' ? 'PAYTM' : 'GPAY';
      document.getElementById('txn-id-val').textContent = txnPrefix + '-' + '{token[:12].upper()}';

      try {{
        await fetch('/api/v1/webhooks/paytm', {{
          method: 'POST',
          headers: {{ 'Content-Type': 'application/json' }},
          body: JSON.stringify({{
            merchant_id: '{merchant_id}',
            order_id: 'ord_{token}',
            amount_paise: {amount_paise},
            status: 'SUCCESS',
            payment_mode: mode.toUpperCase(),
            pay_token: '{token}'
          }})
        }});
      }} catch(err) {{
        console.warn('Webhook simulated:', err);
      }}

      // Play Soundbox TTS confirmation
      try {{
        const res = await fetch('/api/v1/copilot/tts/base64', {{
          method: 'POST',
          headers: {{ 'Content-Type': 'application/json' }},
          body: JSON.stringify({{ text: 'Paytm par {amount_rupees:.0f} rupaye prapt hue. Dhanyawad.' }})
        }});
        if (res.ok) {{
          const data = await res.json();
          if (data.audio_base64) {{
            const audio = new Audio('data:audio/mp3;base64,' + data.audio_base64);
            audio.play().catch(() => {{}});
          }}
        }}
      }} catch(e) {{
        if ('speechSynthesis' in window) {{
          const utter = new SpeechSynthesisUtterance('Paytm par {amount_rupees:.0f} rupaye prapt hue. Dhanyawad.');
          utter.lang = 'hi-IN';
          window.speechSynthesis.speak(utter);
        }}
      }}

      setTimeout(() => {{
        overlay.classList.remove('active');
        document.getElementById('payment-form').style.display = 'none';
        document.getElementById('success-screen').classList.add('active');
      }}, 2200);
    }}
  </script>
</body>
</html>
"""
    return HTMLResponse(content=html, status_code=200)
