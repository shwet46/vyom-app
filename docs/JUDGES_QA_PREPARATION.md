# VYOM by Artemis — Judges Q&A Defense Guide

> **Hackathon Track:** Merchant Growth AI — *Build the AI Business Partner for Every Paytm Merchant*  
> **Purpose:** Master reference for the team during the hackathon judging round. Contains the toughest anticipated questions, underlying judge motivations, punchy 10-second opening hooks, comprehensive technical responses, and traps to avoid.

---

## Quick Navigation
1. [Category 1: Product, User Adoption & Merchant Psychology](#1-product-user-adoption--merchant-psychology)
2. [Category 2: AI Safety, Reliability & Hallucination Prevention](#2-ai-safety-reliability--hallucination-prevention)
3. [Category 3: Paytm Ecosystem Value & Monetization](#3-paytm-ecosystem-value--monetization)
4. [Category 4: Sponsored Technologies (Sarvam, Cognee, n8n)](#4-sponsored-technologies-sarvam-cognee-n8n)
5. [Category 5: Cultural Intelligence & Festival Engine](#5-cultural-intelligence--festival-engine)
6. [Category 6: Technical Scalability, Offline Architecture & Performance](#6-technical-scalability-offline-architecture--performance)
7. [Category 7: Data Privacy, DPDP Act & Legal Compliance](#7-data-privacy-dpdp-act--legal-compliance)
8. [Category 8: Business Impact, Holdout ROI & Future Roadmap](#8-business-impact-holdout-roi--future-roadmap)

---

## 1. Product, User Adoption & Merchant Psychology

### Q1: "Kirana store owners are busy and low-tech. Why would they use another app instead of their trusted paper khata?"
* **Judge's Underlying Angle:** Testing whether you understand the target persona or built an ivory-tower Silicon Valley product for a Pune shopkeeper.
* **10-Second Punchline:**  
  *"We don't ask the merchant to become an accountant. Vyom requires zero typing—he talks in Hinglish, photographs his paper ledger with his camera, and taps 'Haan' once to approve actions."*
* **In-Depth Answer:**  
  1. **Zero-UI & Voice-First:** A traditional kirana owner works 14-hour days standing behind a counter. He will never manually enter inventory barcodes or create marketing flyers. Vyom uses **Sarvam Saaras:v4** for voice queries and **Sarvam Bulbul:v3** for spoken audio responses.
  2. **Camera-Driven Digitization:** Instead of asking him to abandon his paper notebook, we let him keep it. He takes a photo of his handwritten *bahi-khata*, and our unified OCR (Sarvam DocAI + Gemini Vision) extracts rows, translates Devanagari numerals (`१,२५०/-`), and updates the digital ledger.
  3. **Preserving Autonomy with 1-Tap Approvals:** Vyom is an *agentic assistant*, not an autonomous rogue bot. It prepares the exact customer message and financial calculation, presenting a simple *"Haan, Bhejo"* (Yes, Send) button. The merchant remains 100% in control.
* **Trap to Avoid:** Do not say *"We will train merchants with YouTube tutorials."* If an app for kiranas requires training, it has already failed.

---

### Q2: "Why wouldn't a merchant just use WhatsApp or Khatabook directly?"
* **Judge's Underlying Angle:** Testing your competitive moat and differentiation.
* **10-Second Punchline:**  
  *"Khatabook is a passive digital ledger; WhatsApp is a dumb messaging pipe. Neither of them knows that Navratri is in 11 days, that you have dead hours at 2 PM, or how to calculate incremental holdout ROI."*
* **In-Depth Answer:**  
  - **Passive vs. Autonomous Proactive:** Khatabook records debt *after* the merchant types it in, but it doesn't analyze footfall trends, detect when a high-value customer hasn't visited in 3 weeks, or advise on restocking fasting goods.
  - **Closed-Loop Commerce:** WhatsApp by itself doesn't connect to inventory, margins, or Paytm Soundbox reconciliation. With Vyom, when a customer pre-orders a festive kit on Telegram/WhatsApp, the order lands on the merchant's screen via SSE, stock levels decrement, a Paytm UPI link is generated, and a Soundbox ping confirms payment.
  - **Context-Aware Memory (Cognee):** Generic tools don't remember that Mrs. Joshi fasts on Tuesdays or that Mr. Kulkarni pays his credit on the 5th of every month. Vyom builds this business memory automatically.
* **Trap to Avoid:** Don't disparage Khatabook; acknowledge they proved Indian merchants will digitize credit, but explain Vyom represents the next evolutionary leap: from *recording debt* to *growing revenue*.

---

## 2. AI Safety, Reliability & Hallucination Prevention

### Q3: "LLMs hallucinate constantly. What if Vyom suggests a 90% discount, quotes the wrong price, or invents a fake customer?"
* **Judge's Underlying Angle:** The classic enterprise AI trap: reliability, financial risk, and guardrails.
* **10-Second Punchline:**  
  *"The LLM in Vyom never does math, never sets prices, and never calculates dates. All numbers are computed deterministically in Python from MongoDB; the LLM only formats verified facts into polite Hinglish."*
* **In-Depth Answer:**  
  1. **Strict Separation of Math and Copywriting:** Our backend strictly separates *Deterministic Intelligence* from *Generative Intelligence*.
     - Price calculations, customer overdue balances, margin thresholds, and festival calendar dates are computed strictly in Python (`vyom/services/detection/` and `vyom/clock.py`).
     - The LLM receives structured JSON variables (e.g., `{"customer_name": "Rohan", "balance": 1350, "due_days": 12}`) and only generates respectful wording around those frozen variables.
  2. **Code-Level Financial Guardrails:**  
     - Maximum campaign discount is hard-coded at **10%** in the schema (`vyom/models/campaign.py`). Even if an LLM prompt requested 50%, the backend validator rejects the payload.
     - Rate-limits restrict marketing outreach to a maximum of 2 promotional pings per customer per week.
  3. **Emergency Kill Switch:** The merchant has a master 1-tap kill switch in `Shop Settings` that instantly revokes background worker tokens and halts all automated sweeps.
* **Trap to Avoid:** Never say *"We used few-shot prompting to tell the LLM to be accurate."* Prompt engineering is not a guarantee; code-level schema validation and deterministic Python math are.

---

### Q4: "What if the AI sends an aggressive or rude reminder to an elderly neighborhood customer over a ₹200 udhaar and ruins the merchant's relationship?"
* **Judge's Underlying Angle:** Testing cultural sensitivity, brand safety, and local Indian social dynamics.
* **10-Second Punchline:**  
  *"Vyom enforces a 3-tier cultural escalation ladder where tone is locked by deterministic code rules, not generative mood."*
* **In-Depth Answer:**  
  - **The 3-Tier Ladder:**
    1. *Tier 1 (1–7 days overdue):* Courtesy greeting + soft digital bill copy (*"Aapki suvidha ke liye pichle hafte ka bill bhej rahe hain"*).
    2. *Tier 2 (8–20 days overdue):* Polite settlement request with a flexible payment link or promise-date extension option.
    3. *Tier 3 (21+ days overdue):* Respectful personal note inviting the customer to stop by the shop.
  - **Quiet Hours Enforcement:** Code strictly prevents any message dispatch between **21:00 and 08:00 IST** (`vyom/services/udhaar_service.py`), respecting community peace and TRAI DND regulations.
  - **Human-in-the-Loop Review:** The merchant sees the exact text preview and customer name before any communication is dispatched.
* **Trap to Avoid:** Saying *"The AI decides the best tone based on its emotional intelligence."* Reiterate that tones are constrained by strict rule templates.

---

## 3. Paytm Ecosystem Value & Monetization

### Q5: "How does Vyom help Paytm make money? Why should Paytm deploy this to their 40 million merchants?"
* **Judge's Underlying Angle:** Business viability, B2B alignment, and ecosystem synergy for Paytm.
* **10-Second Punchline:**  
  *"Vyom transforms Paytm Soundbox from a single-purpose notification speaker into a high-retention merchant growth ecosystem, driving higher UPI GMV and de-risking merchant lending."*
* **In-Depth Answer:**  
  1. **Defending the Soundbox Moat against Competitors:** PhonePe, Google Pay, and BharatPe all offer soundboxes. Merchants frequently switch for cheaper subscription fees. By bundling Vyom as an intelligent business partner inside the Paytm for Business app, Paytm locks in merchant stickiness.
  2. **Direct Boost to Paytm UPI & QR GMV:**
     - By recovering ₹1.5L+ in trapped paper *udhaar* via instant Paytm UPI payment links (`upi://pay?pa=...`), offline cash transactions convert into digitized on-rail Paytm GMV.
     - By converting dead afternoon hours into flash promotion orders, store transactions increase by 15–28%.
  3. **De-risking Paytm Merchant Lending (Micro-Loans):**
     - Traditional merchant loan underwriting only sees POS/QR volume.
     - Vyom uncovers the merchant's true financial health: uncollected credit book, customer visit frequencies (RFM), inventory turnover, and festival resilience. Paytm can underwrite working capital loans with significantly lower default risk.
  4. **Monetization Model:**
     - **Freemium Tier:** Free basic khata scanning and festival calendar.
     - **Paytm Pro Merchant Subscription:** ₹199–₹299/month bundled with the Soundbox hardware rental for autonomous campaign execution and CRM bot integration.
* **Trap to Avoid:** Do not say *"We will take a 5% commission on all kirana sales."* Kirana gross margins are thin (12–18%); a 5% cut would kill adoption instantly.

---

### Q6: "How is Paytm Soundbox technically integrated into your flow?"
* **Judge's Underlying Angle:** Verifying whether you understand Paytm's real developer APIs and webhook architecture.
* **10-Second Punchline:**  
  *"We consume Paytm S2S payment webhooks with cryptographic validation, triggering instant Soundbox audio playback, auto-reconciling the Khata ledger, and notifying the PWA in under 200 milliseconds."*
* **In-Depth Answer:**  
  - **S2S Webhook Ingestion:** When a customer completes a UPI payment, Paytm's server fires an HTTP POST to `/api/v1/webhooks/paytm` with payload fields matching Paytm's production schema (`ORDER_ID`, `TXNAMOUNT`, `STATUS`, `PAYMENTMODE`, `BANKNAME`, `CHECKSUMHASH`).
  - **Live Auto-Reconciliation:**
    - If the payment carries a `pay_token` linked to a Khata entry or festival kit pre-order, the backend immediately updates the ledger status from `OPEN` to `PAID`.
    - It triggers Server-Sent Events (SSE) on `/api/v1/events`, so the merchant's screen updates without requiring a page refresh.
  - **Hardware Soundbox Confirmation:** The webhook event triggers the simulated Soundbox voice synthesizer (*"Paytm par ₹1,350 prapt hue"*), confirming to the merchant that money is in his bank account.
* **Trap to Avoid:** Claiming you hacked into a physical Soundbox hardware firmware. Clarify that you interface cleanly with Paytm's official Server-to-Server (S2S) notification API which triggers the Soundbox hardware.

---

## 4. Sponsored Technologies (Sarvam, Cognee, n8n)

### Q7: "Why use Sarvam AI instead of OpenAI GPT-4o or Anthropic Claude?"
* **Judge's Underlying Angle:** Testing your rationale for choosing sponsor tech and Indic language reality.
* **10-Second Punchline:**  
  *"Western models stumble on Indian retail semantics, code-mixed Hinglish, and regional phonetics. Sarvam is built specifically for India's 22 official languages with native speech and OCR capability."*
* **In-Depth Answer:**  
  1. **Sarvam-105B Reasoning:** Highly optimized for Indic code-mixing (*"Bhaiya 1 kg sabudana aur sendha namak ka kya rate hai"*). GPT-4o often translates colloquial Hinglish into formal, unnatural textbook Hindi that sounds alien to a shopkeeper.
  2. **Sarvam Saaras:v4 (Indic Speech-to-Text):** Ambient noise in an Indian kirana store (traffic horns, ceiling fans, chatter) ruins generic STT engines. Saaras:v4 has state-of-the-art acoustic robustness for Indian accents and mixed-language vocabulary.
  3. **Sarvam Bulbul:v3 (Text-to-Speech):** Speaks in natural, warm Indian cadence rather than a synthetic Western robotic accent, establishing emotional trust with rural/semi-urban merchants.
  4. **Sarvam DocAI (Vision 1.5):** Unlike generic OCRs that assume typed Latin text, Sarvam DocAI is trained on Indian handwriting styles and correctly parses Devanagari numerals (`१,२५०/-`) from noisy bahi-khata sheets.
* **Trap to Avoid:** Saying *"We used Sarvam just because it was a hackathon sponsor."* Highlight the tangible technological advantages of native Indic models.

---

### Q8: "How does Cognee fit into Vyom, and why is it better than a basic vector database (RAG)?"
* **Judge's Underlying Angle:** Testing your understanding of agentic memory frameworks and knowledge graphs.
* **10-Second Punchline:**  
  *"Standard RAG only searches flat text chunks; Cognee creates a connected Semantic Knowledge Graph of the merchant's entire business, linking customer relationships, ritual habits, and inventory dynamics."*
* **In-Depth Answer:**  
  - **The Problem with Vector RAG in Retail:** Kirana queries require relational reasoning across entities (e.g., *"Which customers buy fasting goods on credit and settle within 7 days?"*). Vector embeddings cannot reliably navigate multi-hop entity graphs.
  - **How Cognee Works in Vyom:**
    - Ingests multimodal records (transactions, scanned khata entries, festival dates, and chat logs).
    - Constructs graph nodes: `Customer(Sharma)` $\rightarrow$ `Purchased(Sabudana, 2kg)` $\rightarrow$ `Event(Navratri)` $\rightarrow$ `Settled_Via(Paytm UPI)` $\rightarrow$ `Average_Lag(4 days)`.
    - When the copilot reasons over questions like *"Navratri stock-up"*, Cognee traverses the graph and provides dense, structured context to Sarvam-105B in minimal tokens, eliminating hallucinations and reducing API latency.
* **Trap to Avoid:** Claiming Cognee is just another vector database. Emphasize that it is a *Knowledge Graph Engine with Semantic Memory Pipelines*.

---

### Q9: "Where does n8n sit in your architecture, and why didn't you write plain Python cron jobs?"
* **Judge's Underlying Angle:** Architecture maturity, maintainability, and enterprise agentic workflow design.
* **10-Second Punchline:**  
  *"FastAPI is built for sub-second REST endpoints, while n8n handles our asynchronous, resilient agentic orchestration: multi-channel dispatch, retry logic, and external webhook routing."*
* **In-Depth Answer:**  
  - **Separation of Concerns:** Writing complex multi-step background flows in raw Python cron scripts leads to fragile code, hard-coded secrets, and brittle retry loops.
  - **n8n Agentic Pipelines:**
    1. *Nightly Sweeps (23:00 IST):* n8n triggers the detection engines, collects candidate opportunities, filters them through tone guardrails, and stages the top 3 morning moves.
    2. *Multi-Channel Messaging Orchestrator:* Dispatches campaigns across Telegram, WhatsApp Business API, and SMS with built-in backoff, delivery tracking, and dead-letter queues.
    3. *Distributor PO Trigger:* When festival inventory predictions exceed current stock, n8n formats a WhatsApp draft Purchase Order directly to the local distributor's number.
    4. *Visual Observability:* If an external messaging provider fails or an API key expires, n8n provides visual error tracking and automated alert fallbacks.
* **Trap to Avoid:** Saying *"We used n8n because we didn't want to code."* Explain that n8n is an enterprise-grade workflow engine used alongside FastAPI for operational resilience.

---

## 5. Cultural Intelligence & Festival Engine

### Q10: "India has thousands of festivals. How do you handle regional variations, and what if a merchant is in Tamil Nadu instead of Maharashtra?"
* **Judge's Underlying Angle:** Generalizability beyond the hackathon demo dataset.
* **10-Second Punchline:**  
  *"Vyom decouples the Festival Logic Engine from the calendar dataset. We ingest regional Hindu, Islamic, Christian, and state holiday calendars keyed by pin-code and state."*
* **In-Depth Answer:**  
  - **Modular Architecture (`vyom/models/festival.py`):** The festival service evaluates calendars by geographical jurisdiction (`region="MH-PUNE"` in the demo, extensible to `"TN-CHENNAI"` or `"WB-KOLKATA"`).
  - **Cultural Rule Engine:**
    - In Maharashtra: Ganesh Chaturthi has a post-visarjan dip; Navratri triggers *Upvas* items (Sabudana, Rajgira).
    - In West Bengal: Durga Puja triggers celebratory gifting and sweet-making staples.
    - During Ramadan: Pre-dawn *Sehri* and evening *Iftar* reverse the daily footfall timeline completely, turning late nights into peak hours.
  - **Deterministic Calendar Calculations:** Lunar tithi cycles and solar festival dates are calculated deterministically using astronomical calendar algorithms, ensuring dates are never guessed by an LLM.
* **Trap to Avoid:** Pretending Pune's festival rules apply uniformly across India. Acknowledge regional nuances proudly and show how your config schema handles them.

---

### Q11: "Do you infer customer religion or dietary habits from their names to target festival kits?"
* **Judge's Underlying Angle:** Ethics, bias, and discrimination in AI.
* **10-Second Punchline:**  
  *"Never. Golden Rule #6 strictly forbids name-to-religion inference. All dietary and ritual preferences are recorded solely via explicit customer self-declaration."*
* **In-Depth Answer:**  
  - **The Risk:** Inferring religion or diet from names (e.g., assuming a customer with a certain surname fasts or eats meat) is unethical, prone to grave social errors, and violates privacy standards.
  - **The Vyom Approach:** In our customer-facing bot (`vyom/bot/`), customers can optionally choose their preferences via self-service buttons (*"Main Navratri vrat rakhta hoon"* or *"Everyday Essentials only"*).
  - If a customer has not opted in, they receive only general, non-religious store promotions (e.g., standard pantry staples).
* **Trap to Avoid:** Never admit to any heuristic like *"If the name ends in 'Sharma', we assume vegetarian."* This will immediately disqualify you on ethics.

---

## 6. Technical Scalability, Offline Architecture & Performance

### Q12: "Kirana stores are notorious for flaky 2G/3G network. What happens to Vyom when the internet drops?"
* **Judge's Underlying Angle:** Practical real-world resilience for Indian infrastructure.
* **10-Second Punchline:**  
  *"Vyom is an installable PWA powered by a Serwist service worker, caching core UI assets and queuing offline khata updates in IndexedDB for automatic background sync."*
* **In-Depth Answer:**  
  1. **Next.js 14+ PWA with Serwist Service Worker:** All critical app shells, stylesheets, and icons are precached locally on the merchant's device.
  2. **Offline Khata Ingestion:** If the merchant snaps a photo of a ledger while offline, the image is stored in local browser `IndexedDB`. As soon as connectivity is restored, the service worker pushes the queued payload to the `/khata/scans` endpoint via Background Sync API.
  3. **Zero-Key Deterministic Mocks:** For evaluation and testing, our backend supports `AI_MODE=mock`, allowing the full end-to-end loop to run without external API dependencies.
* **Trap to Avoid:** Claiming an LLM can run locally on an entry-level ₹8,000 Android smartphone. Be clear that the client caches data and UI, while the AI models run on optimized cloud endpoints.

---

### Q13: "How does your backend scale when 50,000 Paytm Soundbox webhooks fire concurrently between 7 PM and 9 PM?"
* **Judge's Underlying Angle:** System architecture, database bottlenecking, and concurrency handling.
* **10-Second Punchline:**  
  *"Our FastAPI webhook endpoint is stateless and non-blocking, writing to an async MongoDB replica set with compound indexing and queuing heavier analysis to background workers."*
* **In-Depth Answer:**  
  - **Stateless Async Ingestion:** The `/api/v1/webhooks/paytm` endpoint performs no heavy synchronous computation. It validates the payload signature, executes an atomic `$set` update on the transaction collection via `AsyncIOMotorClient`, pushes an SSE event, and returns HTTP 200 within 15ms.
  - **Indexed Data Architecture:** MongoDB collections are partitioned with compound indexes on `{ merchant_id: 1, created_at: -1 }` and `{ pay_token: 1 }` (`vyom/db/mongo.py`), ensuring $O(1)$ query lookups.
  - **Asynchronous Decoupling:** Heavy tasks (running the Churn or Falling Sales detection models) do not execute inside the webhook request loop; they are scheduled during off-peak night hours via APScheduler / n8n pipelines.
* **Trap to Avoid:** Saying *"FastAPI is fast, so it will handle anything."* Provide concrete architecture specifics: non-blocking I/O, database indexes, and worker decoupling.

---

## 7. Data Privacy, DPDP Act & Legal Compliance

### Q14: "How does Vyom comply with India's new DPDP (Digital Personal Data Protection) Act 2023?"
* **Judge's Underlying Angle:** Legal compliance, regulatory awareness, and customer trust.
* **10-Second Punchline:**  
  *"Vyom enforces explicit granular consent, automated opt-out mechanisms, and data minimization: we never expose raw customer financial VPAs or share data across merchants."*
* **In-Depth Answer:**  
  1. **Consent Management (`vyom/models/customer.py`):** Every customer entity tracks explicit consent flags:
     ```python
     consent: {
       marketing: { granted: bool, timestamp: datetime },
       khata_reminders: { granted: bool, timestamp: datetime }
     }
     ```
  2. **Zero-Friction Opt-Out:** Every marketing message sent via Telegram or WhatsApp includes an instant opt-out button (*"Stop updates"*). Tapping it sets `opted_out: true` in the database, immediately excluding them from all future campaigns.
  3. **Data Isolation (Multi-Tenant Security):** Merchant data is strictly scoped by `merchant_id`. No customer phone number, transaction record, or credit ledger is ever shared or trained into a public model across shops.
  4. **Data Minimization:** Hashed customer identifiers are used in telemetry; raw customer bank credentials are never stored.
* **Trap to Avoid:** Dismissing compliance as *"just a hackathon prototype issue."* Demonstrating DPDP compliance earns immense bonus points with senior enterprise judges.

---

## 8. Business Impact, Holdout ROI & Future Roadmap

### Q15: "How do you prove that Vyom actually increased sales, rather than taking credit for natural footfall?"
* **Judge's Underlying Angle:** Testing whether your ROI claims are scientifically verifiable or just fabricated marketing metrics.
* **10-Second Punchline:**  
  *"Every campaign automatically withholds a 10% uncontacted control group, calculating verifiable incremental uplift strictly by comparing contacted vs. holdout cohorts."*
* **In-Depth Answer:**  
  - **The Holdout Methodology (`vyom/models/campaign.py`):**
    - When Vyom prepares an audience of 100 lapsed or dead-hour customers, it randomly assigns **90 customers to the Contacted Group** and **10 customers to the Holdout Group**.
    - The holdout group receives *zero* messages.
    - Over the 7-day campaign window, the backend tracks the visit rate and spend of both cohorts.
  - **The Mathematical Uplift Formula:**
    $$\text{Incremental Lift} = \text{Revenue}_{\text{Contacted}} - (\text{Revenue}_{\text{Holdout}} \times \text{Cohort Ratio})$$
  - If the holdout group shops at the same rate, Vyom reports **₹0 incremental gain**. This transparency builds unshakeable merchant trust.
* **Trap to Avoid:** Claiming *"Sales went up 28%, so the AI did all of it."* The 10% holdout is your scientific proof of incrementality.

---

### Q16: "What is your roadmap if you had 3 months to take Vyom to production?"
* **Judge's Underlying Angle:** Vision, ambition, and whether you are thinking like startup founders / product leaders.
* **10-Second Punchline:**  
  *"In 3 months, we move from standalone PWA to an embedded Paytm for Business Mini-App, integrate distributor ONDC rails for auto-replenishment, and launch voice Soundbox interaction."*
* **In-Depth Answer:**  
  1. **Month 1 — Paytm App SDK & Production S2S:** Embed Vyom directly inside the **Paytm for Business Android app** as a native React Native / WebView mini-app with Paytm SSO.
  2. **Month 2 — ONDC Distributor Integration:** When the Festival Engine predicts low stock on high-margin items (e.g., Sabudana), enable the merchant to tap *"Order from Distributor"* directly via the Open Network for Digital Commerce (ONDC) B2B rail.
  3. **Month 3 — 2-Way Conversational Soundbox:** Partner with Paytm Hardware R&D to test microphone-enabled Soundboxes, allowing shopkeepers to record a Khata entry vocally without even picking up their phone (*"Sharma ji, Mohan ka ₹200 udhaar likho"*).
* **Trap to Avoid:** Saying *"We will add blockchain and Web3."* Stick to grounded, commercially valuable retail fintech milestones.

---

## 9. The Golden Rules Cheat Sheet (Keep Memorized!)

Before facing the panel, ensure every team member has these 6 Golden Rules committed to memory:

```
┌────────────────────────────────────────────────────────────────────────┐
│                      VYOM'S 6 GOLDEN RULES                             │
├────────────────────────────────────────────────────────────────────────┤
│ 1. DETERMINISTIC NUMBERS : LLM writes copy; Python computes prices.   │
│ 2. 10% DISCOUNT CEILING : Max promotional discount capped in code.     │
│ 3. 1-TAP KILL SWITCH     : Merchant can freeze all AI outreach.        │
│ 4. QUIET HOURS           : No outgoing pings between 21:00 & 08:00 IST.│
│ 5. CULTURAL TONE POLICY  : Solemn language in Pitru Paksha; no meat/   │
│                            onion/garlic in religious fasting kits.     │
│ 6. NO RELIGION INFERENCE : Customer preferences by self-choice only.   │
└────────────────────────────────────────────────────────────────────────┘
```
