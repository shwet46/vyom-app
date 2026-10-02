# Telegram Customer Assistant Bot Flows

The Vyom Telegram Bot is built on **aiogram v3** and serves as the merchant's customer-facing assistant. It focuses strictly on customer billing/udhari, payment settlements, payment deadlines, store discounts, and merchant escalations.

---

## 1. Flow A: Customer Onboarding (`/start <shop_code>`)

1. **Trigger**: Customer scans in-store QR or opens `https://t.me/<BOT_USERNAME>?start=SHARMA01`.
2. **Main Menu Navigation**:
   - `[🧾 Mera Khata & Bill (Udhaar)]`
   - `[💳 Abhi Pay Karein (Pay Now / QR)]`
   - `[📅 Payment Deadline Set Karein]`
   - `[🏷️ Dukaan Ke Offers & Sales]`
   - `[📞 Dukaan Se Baat Karein (Support)]`

---

## 2. Flow B: Khata Bill, Partial Payments & Remaining Balance

1. **Trigger**: Customer taps `[🧾 Mera Khata & Bill (Udhaar)]` or asks for bill/hisaab.
2. **Ledger Aggregation**:
   - Computes Total Purchases (`total_purchases`), Amount Paid so far (`amount_paid`), and Remaining Balance (`remaining_balance`).
   - If partial payment exists:
     - Clearly displays:
       - **Kul Kharidari (Total Bill)**: e.g. ₹1,850
       - **Aapne Jama Kiye (Partial Paid)**: e.g. ₹500
       - **Baaki Rashi (Balance Left to Pay)**: **₹1,350**
   - Renders itemized grocery purchases, due date, and quick action buttons:
     - `[💳 Pay ₹1,350 via Paytm / UPI]`
     - `[📲 QR Code Dekhein]`
     - `[📅 Deadline Set Karein]`

---

## 3. Flow C: Instant Mock Paytm UPI Payment & QR Code

1. **Trigger**: Customer taps `[💳 Abhi Pay Karein]` or inline pay button.
2. **QR Code Delivery**:
   - Sends dynamic high-resolution QR image (`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://...`) scannable by any UPI app.
3. **Mock UPI Payment Link**:
   - Provides direct link to `/api/v1/pay/{token}/view`.
   - Displays authentic Paytm UPI checkout portal with the exact money the customer needs to pay.
   - Interactive "Pay via Paytm UPI" button triggers instant soundbox chime and auto-updates ledger in MongoDB.

---

## 4. Flow D: Setting Payment Deadline (Promise Date)

1. **Trigger**: Customer taps `[📅 Payment Deadline Set Karein]`.
2. **Options**:
   - `[⏰ Kal tak]`, `[🗓️ 3 Din mein]`, `[📆 1 Hafte mein]`, `[📅 Agle 15 Din mein]`, `[💳 Abhi Pay Karein]`.
3. **Resolution**:
   - Updates `khata_entries` status to `promised` with the new target date.
   - Emits real-time SSE event `customer.promise_updated` to Merchant Dashboard.
   - Confirms deadline to customer with option to pay earlier.

---

## 5. Flow E: Ongoing Sales & Store Discounts

1. **Trigger**: Customer taps `[🏷️ Dukaan Ke Offers & Sales]` or asks about offers/discounts.
2. **Specials Delivery**:
   - Displays current festival deals (Navratri Shuddh Vrat Kit 12% off), Afternoon Happy Hours (8% off staples), and Ration combos.
   - Interactive inline pre-ordering for kits.

---

## 6. Flow F: Unhandled Queries Escalation to Merchant

1. **Trigger**: Customer asks any other question or doubt (e.g. stock queries, delivery times, store policies).
2. **Escalation Protocol**:
   - Bot politely replies: *"Kshama karein, main is sawaal ka seedha uttar nahi de sakta. Maine aapki query dukaan ke owner (Ramesh Sharma ji) ko forward kar di hai."*
   - Displays merchant direct contact details (Phone/WhatsApp `+91 98765 43210`, address, timings).
   - Inserts escalation ticket into `db.support_escalations`.
   - Dispatches real-time SSE alert `customer.query_escalated` to the merchant live dashboard.
