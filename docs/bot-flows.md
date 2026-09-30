# Telegram Shop Bot Flows

The Vyom Telegram Shop Bot is built on **aiogram v3** and serves as the merchant's automated digital storefront. It runs in either polling or webhook mode (`/telegram/webhook`) and handles both structured inline keyboard callbacks and free-form voice notes.

---

## 1. Flow A: Customer Onboarding (`/start <shop_code>`)

1. **Trigger**: Customer scans the in-store QR poster or opens `https://t.me/<BOT_USERNAME>?start=SHARMA01`.
2. **Shop Resolution**: Middleware resolves `SHARMA01` to "Sharma Kirana Store" in Pune.
3. **Language Selection**:
   - Buttons: `[हिन्दी] [मराठी] [Hinglish] [English]`.
4. **Plain-Language Consent**:
   - Explains that the shop will send festival updates and balance receipts.
   - Buttons: `[✅ Haan, theek hai] [❌ Nahi]`.
5. **Main Menu Presentation**:
   - `[🎁 Mere Offers] [📒 Mera Khata]`
   - `[🏪 Dukaan Info] [🪔 Tyohaar ki taiyari]`
   - `[⚙️ Settings]`

---

## 2. Flow B: Navratri Vrat Kit Pre-Ordering

1. **Trigger**: Customer taps `[🪔 Tyohaar ki taiyari]` or receives an approved campaign offer.
2. **Context Resolution**: The bot injects today's date (`30 Sep 2026`) and detects Navratri starting in 11 days (11 Oct).
3. **Item Catalog Presentation**:
   - The bot dynamically renders available fasting items from the store catalog:
     - Sabudana 500g (₹65)
     - Rajgira Atta 500g (₹55)
     - Sendha Namak 1kg (₹40)
     - Pure Cow Ghee 1L (₹620)
     - Makhana 250g (₹180)
   - Excluded items (onion, garlic, non-veg) are strictly filtered out by code.
4. **Pre-Order Confirmation**:
   - Customer taps `[✅ Mujhe ye chahiye]`.
   - Creates a document in `festival_kit_requests`.
   - Emits a real-time SSE event `kit.requested` to the Merchant PWA.
   - The merchant marks the kit as "Ready" in the Shop tab, triggering an automated pickup alert back to the customer.

---

## 3. Flow C: Autonomous Polite Udhaar Reminders

1. **Trigger**: Morning scheduled sweep (09:30 AM IST) identifies overdue entries outside quiet hours.
2. **Tone Tier Application**:
   - **Tiers 1–7 days**: Soft and courteous ("Namaste Sunita ji 🙏 Suvidha ho to bhugtaan kar dijiye").
   - **Tiers 8–20 days**: Polite-firm.
   - **Tiers 21+ days**: Firm but always respectful. Never shaming or threatening.
3. **Customer Actions**:
   - `[💳 Abhi pay karo ₹1,250]`: Opens simulated Paytm UPI checkout with dynamic QR code.
   - `[✅ Maine pay kar diya]`: Sets status to `claimed_paid` and alerts merchant PWA for verification.
   - `[📅 Kuch samay chahiye]`: Offers quick extension chips (`[Kal]`, `[3 din mein]`, `[Is Ravivar]`), setting `promise_date` and halting reminders.

---

## 4. Flow D: Voice Note Orders

1. **Customer sends a Telegram voice note**: "Bhaiyya, 2 packet sabudana aur aadha kilo ghee rakh dena kal subah ke liye."
2. **Audio Pipeline**:
   - Telegram voice audio (OGG/Opus) is routed to **Sarvam Saaras:v4** STT.
   - Hinglish transcription extracts item names and quantities.
   - The bot replies with a confirmed item list and pre-order receipt.
