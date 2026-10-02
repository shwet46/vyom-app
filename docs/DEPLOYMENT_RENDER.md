# Deploying VYOM on Render (Full Stack Guide)

This guide walks through deploying the entire VYOM platform on [Render](https://render.com), including the **FastAPI Backend**, **Customer Telegram Bot**, **Background Scheduler**, **Merchant PWA**, and **MongoDB Atlas**.

---

## 1. High-Level Architecture on Render

```
                                  ┌───────────────────────────┐
                                  │      MongoDB Atlas        │
                                  │   (Free M0 Replica Set)   │
                                  └─────────────▲─────────────┘
                                                │ MONGODB_URI
                                                │
┌───────────────────────────┐     ┌─────────────┴─────────────┐     ┌───────────────────────────┐
│     Customer Telegram     │◄───►│       vyom-api            │◄───►│       vyom-web            │
│        (aiogram v3)       │     │     Render Web Service    │     │    Render Static Site     │
│   (Webhook or Polling)    │     │  (FastAPI + In-app worker)│     │     (Vite React PWA)      │
└───────────────────────────┘     └───────────────────────────┘     └───────────────────────────┘
```

---

## 2. Key Components Breakdown

| Service | Render Component | Pricing / Tier | Notes |
|---|---|---|---|
| **Database** | MongoDB Atlas (External) | Free (M0) | 3-node replica set required for MongoDB ACID transactions (`client.start_session()`). |
| **Backend API** | Web Service (Docker) | Free or Starter ($7/mo) | Built with `docker/Dockerfile.api` (Python 3.12 + `ffmpeg` for voice processing). |
| **Telegram Bot** | Embedded in API Web Service | Included | **Webhook Mode** (recommended) or **Polling Mode**. |
| **Scheduler** | In-process (`RUN_WORKER_IN_API=true`) or Background Worker | Free (in-process) or $7/mo | Runs periodic opportunity detection and sweeps. |
| **Frontend PWA** | Static Site | **Free** | Vite static build (`pnpm build`), served globally via Render CDN. |

---

## 3. Step 1: Set up MongoDB Atlas (Free Replica Set)

Render does not offer native MongoDB. Because VYOM uses multi-document transactions, you need a MongoDB replica set. MongoDB Atlas free tier (M0) provides a 3-node replica set out of the box.

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) and sign in / register.
2. Create a **Free Shared Cluster (M0)** (choose AWS region close to your Render region, e.g., Frankfurt `eu-central-1` or Singapore/Mumbai `ap-south-1`).
3. Under **Security > Database Access**:
   - Create a database user (e.g. `vyom_user`) with a strong password.
4. Under **Security > Network Access**:
   - Add IP Access: `0.0.0.0/0` (Allow Access from Anywhere) so Render dynamic container IPs can connect.
5. Under **Database > Connect**:
   - Choose **Drivers (Python)**.
   - Copy connection string:
     ```text
     mongodb+srv://vyom_user:<PASSWORD>@cluster0.abcde.mongodb.net/vyom?retryWrites=true&w=majority
     ```

---

## 4. Step 2: Deploy Backend API & Telegram Bot (`vyom-api`)

### Option A: Using the Render Blueprint (`render.yaml`)
1. Push your repository to GitHub.
2. In the Render Dashboard, click **New + > Blueprint**.
3. Connect your repository. Render will automatically detect `render.yaml`.
4. Fill in the missing environment variables when prompted.

### Option B: Manual Creation in Render Dashboard
1. Go to **Dashboard > New + > Web Service**.
2. Connect your GitHub repository: `vyom-by-artemis-demo`.
3. Configure the service:
   - **Name**: `vyom-api`
   - **Language / Runtime**: `Docker`
   - **Dockerfile Path**: `./docker/Dockerfile.api`
   - **Docker Context**: `.`
   - **Instance Type**: `Free` (or `Starter` for 24/7 without idle sleep)
   - **Health Check Path**: `/healthz`
4. In **Environment Variables**, set:

| Variable | Value | Description |
|---|---|---|
| `MONGODB_URI` | `mongodb+srv://...` | Connection string from MongoDB Atlas |
| `MONGODB_DATABASE` | `vyom` | Target database name |
| `TELEGRAM_BOT_TOKEN` | `123456789:ABC...` | From `@BotFather` |
| `BOT_MODE` | `webhook` (or `polling`) | Use `webhook` on Render (see Section 6) |
| `BOT_USERNAME` | `YourBotName_bot` | Telegram handle |
| `RUN_WORKER_IN_API` | `true` | Runs background opportunity/udhaar jobs inside API |
| `AI_MODE` | `mock` (or `live`) | `mock` works with zero API keys; `live` uses Sarvam & Gemini |
| `DEMO_MODE` | `true` | Enables instant demo speeds and schedules |
| `JWT_SECRET` | `generate-a-random-32-char-string` | JWT authentication key |
| `WEB_ORIGIN` | `https://vyom-web.onrender.com` | Your frontend Render URL (update after creating frontend) |
| `PUBLIC_API_URL` | `https://vyom-api.onrender.com` | Your backend Render URL |
| `SARVAM_API_KEY` | *(optional)* | For live Hindi STT, TTS, and LLM |
| `GEMINI_API_KEY` | *(optional)* | For Gemini Copilot |

5. Click **Deploy Web Service**. Once deployed, your backend will be live at `https://vyom-api.onrender.com`.

---

## 5. Step 3: Deploy Frontend PWA (`vyom-web`)

1. Go to **Dashboard > New + > Static Site**.
2. Connect your GitHub repository.
3. Configure the static site:
   - **Name**: `vyom-web`
   - **Root Directory**: `apps/web`
   - **Build Command**: `pnpm install && pnpm build`
   - **Publish Directory**: `dist`
4. In **Environment Variables**:
   - `PUBLIC_API_URL`: `https://vyom-api.onrender.com` *(your API URL from Step 2)*
5. Under **Redirects / Rewrites**:
   - **Type**: `Rewrite`
   - **Source**: `/*`
   - **Destination**: `/index.html`
   - **Status**: `200` *(ensures SPA client-side routes work on page reload)*
6. Click **Create Static Site**.

> **Note on CORS:** Copy the generated URL of your static site (e.g. `https://vyom-web.onrender.com`) and update `WEB_ORIGIN` in your `vyom-api` Environment Variables.

---

## 6. Telegram Bot: Webhook vs Polling on Render

### Why Webhook Mode is Recommended on Render:
- Render's **Free Tier** web services spin down (sleep) after 15 minutes without web requests.
- In **Polling mode**, when the container sleeps, the bot stops polling and cannot respond to customers.
- In **Webhook mode**, whenever a customer interacts with the bot, Telegram sends an HTTPS POST request to `https://vyom-api.onrender.com/api/v1/webhooks/telegram`. This incoming HTTP request **instantly wakes up the container**, ensuring the bot always replies!

### How to Activate Webhook Mode:
1. In `vyom-api` environment variables, set:
   ```env
   BOT_MODE=webhook
   ```
2. Once `vyom-api` is deployed, register your webhook with Telegram:
   ```bash
   curl -F "url=https://vyom-api.onrender.com/api/v1/webhooks/telegram" \
        https://api.telegram.org/bot<YOUR_TELEGRAM_BOT_TOKEN>/setWebhook
   ```
3. Test your webhook status:
   ```bash
   curl https://api.telegram.org/bot<YOUR_TELEGRAM_BOT_TOKEN>/getWebhookInfo
   ```
   You should see `"url": "https://vyom-api.onrender.com/api/v1/webhooks/telegram"` and `"has_custom_certificate": false`.

### When to use Polling Mode:
- If you upgrade your `vyom-api` to a **Starter ($7/mo)** plan, the container never sleeps.
- Set `BOT_MODE=polling`. The bot will automatically delete any active webhook and start polling aiogram updates inside the FastAPI event loop on startup. No `curl` command needed!

---

## 7. Step 4: Seed Database with Initial Merchant Data

The platform needs initial master data (merchant store, 14-month synthetic transactions, Pune festival calendar, khata ledgers, and catalog).

### Option 1: Seed from your local machine (Fastest & Simplest)
On your laptop, run:
```bash
# Set your remote Atlas URI temporarily:
export MONGODB_URI="mongodb+srv://vyom_user:<PASSWORD>@cluster0.abcde.mongodb.net/vyom?retryWrites=true&w=majority"
export MONGODB_DATABASE="vyom"

# Run the master seed script:
uv run python -m vyom.scripts.seed
```

### Option 2: Run via Render Web Shell
1. In Render Dashboard, open your `vyom-api` service.
2. Click the **Shell** tab.
3. Run:
   ```bash
   python -m vyom.scripts.seed
   ```
4. Verify output ends with `seed_completed_successfully`.

---

## 8. Verification Checklist

1. **API Health**: Visit `https://vyom-api.onrender.com/healthz` -> returns `{"status":"ok","app":"vyom"}`.
2. **Database Readiness**: Visit `https://vyom-api.onrender.com/readyz` -> returns `{"status":"ready","database":"connected"}`.
3. **PWA Dashboard**: Open `https://vyom-web.onrender.com` -> login with merchant mobile `9822012345` / OTP `123456`.
4. **Telegram Bot**: Open Telegram, search your bot, and send `/start`. You should receive the Sharma Kirana welcome message and catalog menu.
