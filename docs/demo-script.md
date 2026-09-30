# VYOM — 5-Minute Live Presentation Script

**Demo Date Context:** 30 September 2026 (Pune, Maharashtra)  
**Store Profile:** Sharma Kirana Store (Owner: Ramesh Sharma)  
**Mode:** Zero-Key Demo Mode (`AI_MODE=mock`, `DEMO_MODE=true`, `DEMO_TODAY=2026-09-30`)

---

## Minute 1: The Store & Morning Pulse
1. **Open the Merchant PWA** (`http://localhost:3000`).
2. Point out the **Impact Hero**:
   - "Vyom recovered ₹18,450 this week (+28% uplift) silently across dead hours, churn recovery, and udhaar sweeps."
3. Highlight the **Festival Context Banner**:
   - Notice today's active period: **Pitru Paksha** (Day 4/14, solemn tone active).
   - Notice the upcoming countdown: **Sharad Navratri starts in 11 days** (11 Oct).
   - "Unlike generic CRMs, Vyom understands that kirana shopping changes completely during Indian festivals."

---

## Minute 2: Festivals & AI Stock Advisor
1. Tap the **Festivals** tab.
2. Review the **Pune Festival Timeline**:
   - Ganesh Chaturthi (ended 25 Sep): Vyom identified the post-visarjan dip and dampened alarm thresholds.
   - Pitru Paksha (27 Sep – 10 Oct): Solemn tone enforced; sale terminology strictly banned.
   - Sharad Navratri (11 Oct): 11-day prep window is officially open.
3. Show the **AI Stock Advisor**:
   - Sabudana 500g: Expected +240% uplift. Current stock 18, suggested 65 (Low Stock alert).
   - Rajgira Atta & Sendha Namak: Reorder alerts before festival rush starts.
4. Tap **"Generate Vrat Kits"** to create a tailored pantry pre-order campaign.

---

## Minute 3: Conversational Copilot & Campaign Approval
1. Tap the global **🎙 Voice FAB** (bottom-right cluster).
2. The **Vyom Copilot** drawer opens with waveform visuals.
3. Tap the suggestion chip or speak:
   - *"Navratri ke liye kya stock karun?"*
4. Vyom responds instantly with speech output (Sarvam Bulbul TTS):
   - *"Navratri 11 din mein shuru hai. Sabudana aur rajgira atta ka stock low hai. Maine vrat kit campaign taiyar kiya hai."*
5. Navigate to the **Grow** tab:
   - Open the **Navratri Vrat Kit** proposal.
   - Show the 10% holdout split (10% uncontacted control group to measure true incremental return).
   - Tap **"Approve & Launch"**.

---

## Minute 4: Customer Telegram Experience
1. Open the **Telegram Shop Bot** (`https://t.me/<BOT_USERNAME>?start=SHARMA01`).
2. The bot greets the customer and offers the approved **Navratri Vrat Kit**:
   - Shows Sabudana, Rajgira Atta, Sendha Namak, Pure Ghee.
3. Tap **[✅ Mujhe ye chahiye]**:
   - The bot registers the kit pre-order.
4. Switch back to the **Merchant PWA** (`Shop → Customers`):
   - Notice the kit request appeared live via Server-Sent Events (SSE).
   - Tap **"Mark Ready"** — the customer receives an instant pickup notification!

---

## Minute 5: Handwritten Khata Scanning & Udhaar Recovery
1. Tap the global **📷 Camera FAB** (stacked above Voice FAB).
2. The **Khata Scanner** sheet opens:
   - Select **"Take Photo with Camera"** (or upload sample ledger).
   - Sarvam Vision Document AI analyzes handwritten Devanagari numerals (`१,२५०/-`).
   - Show the **Interactive Review Table**: customer names fuzzy-matched against the store directory with match scores.
   - Tap **"Confirm & Add to Ledger"**.
3. Open the **Udhaar** tab:
   - Point out the overdue aging tiers (1–7 days gentle, 8–20 days polite-firm).
   - Tap **"Send Polite Reminder"** for an overdue account.
   - Open the **Demo Lab** (top right) and tap **"Simulate Paytm UPI Payment"**:
   - Notice the balance updates live to ₹0 with a green checkmark!
