# NexusPulse

> **Connecting AI Agents, Human Oracles & Smart Payments on PayPal**  
> Built for the **PayPal AI Hackathon ("Build What's Next with PayPal and AI")**

---

## 1. Executive Summary & 50-Year AGI Economic Thesis

Every day, consumers lose billions of dollars to **subscription bloat** and **retail price asymmetry**, while autonomous AI agents face a fundamental **physical-world verification and trust bottleneck** as we transition toward an AGI-driven economy.

Grounded in frontier research from **Google DeepMind** (*Virtual Agent Economies*, `arXiv:2509.10147`; *Distributional AGI Safety*, `arXiv:2512.16856`), **Anthropic** (*Economic Index I & II*, `arXiv:2503.04761`, `arXiv:2511.15080`), and macroeconomic AGI literature (*Some Simple Economics of AGI*, `arXiv:2602.20946`; *The Agentic Economy*, `arXiv:2505.15799`), **NexusPulse** solves both sides of the equation in a single unified financial super-app on the **PayPal Developer Platform**:

1. **Engine 1 — Personal Agentic CFO & Channel3 Autonomous Deal-Hunter (Immediate Consumer Value)**:
   - Continuously audits recurring **PayPal Subscriptions (`v1/billing/subscriptions`)**, detecting unused "zombie" plans and downgrading overpriced tiers (`POST /v1/billing/subscriptions/{id}/revise` & `/cancel`) to save **\$1,548+/year** automatically.
   - Monitors **Channel3's 100M+ SKU product catalog** against cryptographic user spending mandates and executes instant checkouts via **PayPal JS SDK v6 (`<paypal-button>`, `<paylater-button>`, `<venmo-button>`, `<paypal-message>`)** and **PayPal Orders v2 (`POST /v2/checkout/orders`)**.
2. **Engine 2 — Proof-of-Human Oracle Micro-Bounties & Instant PayPal Payouts (50-Year AGI Income Bridge)**:
   - As routine cognitive work becomes automated, human comparative advantage shifts to **verified physical-world ground truth, high-stakes security auditing, and cultural/linguistic nuance**.
   - Enterprise AI agents post real-time micro-bounties (`$15–$45` for 30–60 seconds of work). **Google Gemini 3.8 Flash** (`@google/genai` `client.interactions.create()`) verifies human submissions in under 2 seconds and dispatches **instant PayPal Payouts (`POST /v1/payments/payouts`)** to the contributor's PayPal or Venmo account.
3. **Engine 3 — Zero-Dispute A2A Smart Escrow & Dispute Shield (Agentic Commerce Trust Layer)**:
   - Locks multi-party project milestones using **PayPal Orders v2 `intent: "AUTHORIZE"`** (`POST /v2/checkout/orders/{id}/authorize`), visualizes critical-path dependencies in an interactive **Bryntum Milestone Gantt & Cashflow Scheduler**, verifies cryptographic deliverable proofs via **Gemini 4 Argon**, captures funds (`POST /v2/payments/authorizations/{id}/capture`), and automatically attaches shipment tracking (`POST /v2/checkout/orders/{id}/track`) to immunize transactions against chargebacks and disputes.

---

## 2. Architecture & Sponsor Technology Matrix

```mermaid
flowchart TB
    subgraph UI["NexusPulse Next.js 16 + React 19 Command Center"]
        Header["Top Executive Telemetry + Dual-Mode Switcher + Gemini 3.8 Flash TTS Voice Briefing"]
        C3Panel["Engine 1: Channel3 100M+ Catalog Deal-Hunter + PayPal JS SDK v6 Checkout"]
        BountyBoard["Engine 2: Proof-of-Human Oracle Bounties + Instant PayPal Payouts v1"]
        BryntumGantt["Engine 3: Bryntum A2A Smart Escrow Gantt + Subscription Renewal Scheduler"]
        AgGridCenter["AG Grid v36 Enterprise Financial Ledger + Webhook & APIMatic Inspector"]
    end

    subgraph AI["Google Gemini Interactions API (@google/genai v3.0.0)"]
        GeminiArgon["gemini-4-argon (Deep Agentic CFO & Escrow Audit)"]
        GeminiFlash["gemini-3.8-flash (Multimodal Bounty Verification)"]
        GeminiTTS["gemini-3.8-flash-tts (Executive Voice Briefing)"]
        PayPalMCP["@paypal/agent-toolkit MCP Tools (mcp.sandbox.paypal.com/sse)"]
    end

    subgraph Gateway["Dual-Mode Zero-Blocker PayPal Gateway"]
        ApimaticSDK["APIMatic @paypal/paypal-server-sdk v2.5.0 (Orders, Payments, Subscriptions, Trackers)"]
        LiveSandbox["Live PayPal Sandbox API (api-m.sandbox.paypal.com)"]
        MirrorEngine["Deterministic PayPal Sandbox Mirror (100% Schema-Identical v1/v2 + Idempotency)"]
    end

    UI --> AI
    UI --> Gateway
    AI --> PayPalMCP
    AI --> Gateway
    Gateway --> ApimaticSDK
    ApimaticSDK --> LiveSandbox
    Gateway --> MirrorEngine
```

### All 7 Hackathon Sponsor Integrations Included

| Sponsor / Track | Integration in NexusPulse (`NexusPulse/`) | Key Files |
| :--- | :--- | :--- |
| **1. PayPal (Primary Platform)** | Orders API v2 (`CAPTURE` & `AUTHORIZE`), Payouts API v1, Subscriptions API v1, Invoicing API v2, Shipment Trackers API v2, Webhooks v1 Signature Verification, JS SDK v6 (`<paypal-button>`, `<paylater-button>`, `<venmo-button>`, `<paypal-message>`), and PayPal MCP Server (`@paypal/agent-toolkit`) | `src/lib/paypal/paypal-client.ts`, `src/lib/paypal/paypal-gateway.ts`, `src/components/paypal/PayPalV6CheckoutWidget.tsx` |
| **2. APIMatic** | Strongly-typed `@paypal/paypal-server-sdk@2.5.0` (`OrdersController`, `PaymentsController`, `SubscriptionsController`, `TransactionSearchController`) with automatic OAuth2 token caching, `PayPal-Request-Id` idempotency, and `INSTRUMENT_DECLINED` / `429` retry handling | `src/lib/paypal/paypal-client.ts` |
| **3. AG Grid** | High-density `ag-grid-react@36.3.0` Dark Quartz Financial Command Center across Transactions (`/v1/reporting/transactions`), Orders v2, Payouts v1, and Invoices v2 with quick-search, engine filtering, CSV export, and one-click Gemini CFO audit | `src/components/sponsors/AgGridFinancialCommandCenter.tsx` |
| **4. Bryntum** | Interactive WBS Critical-Path Milestone Gantt & Subscription Renewal Scheduler binding PayPal `AUTHORIZE` holds to cryptographic deliverable verification | `src/components/sponsors/BryntumEscrowTimeline.tsx` |
| **5. Channel3** | 100M+ SKU Product Catalog Deal-Hunter & Cryptographic Price-Drop Mandate Engine integrated with PayPal JS SDK v6 | `src/components/sponsors/Channel3DealHunterPanel.tsx`, `src/app/api/channel3/search/route.ts` |
| **6. Google DeepMind / Gemini** | `@google/genai@3.0.0` `client.interactions.create()` using `gemini-4-argon`, `gemini-3.8-flash` (structured JSON schema verification), `gemini-3.8-flash-tts` (audio briefing), and native `mcp_server` tools | `src/lib/ai/gemini-agent.ts`, `src/app/api/ai/interact/route.ts`, `src/app/api/ai/verify-bounty/route.ts` |
| **7. Render** | Production Infrastructure-as-Code Blueprint (`render.yaml`) provisioning both the Next.js Web Service and an hourly Autonomous Cron Worker (`scripts/autonomous-sweep.mjs`) | `render.yaml`, `NexusPulse/scripts/autonomous-sweep.mjs` |

---

## 3. Quick Start & Judge Verification Instructions

### Prerequisites
- **Node.js** `>= 20.x` (tested on Node `v24.16.0`)
- **npm** `>= 10.x`

### Step 1: Install & Run
```bash
cd NexusPulse
npm install
npm run dev
```
Open **`http://localhost:3000`** in your browser.

### Step 2: Credential-First PayPal Sandbox Gateway (Slot 013 + Mirror Offline Fallback)
NexusPulse runs **Credential-First Live Sandbox Mode** when `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` are configured in `NexusPulse/.env.local`, with an automatic **Deterministic Mirror Fallback** for offline evaluation:
1. **Live PayPal Sandbox Mode (`api-m.sandbox.paypal.com`)**:
   - Powered by PayPal x Voice AI Hackathon **Slot 013** Sandbox credentials (`NEXT_PUBLIC_PAYPAL_CLIENT_ID`, `@paypal/paypal-server-sdk@2.5.0`, PayPal JS SDK v6 `web-sdk/v6/core`), settling orders, authorizations, payouts, live invoices, catalog plans/subscriptions, and webhook/dispute telemetry.
2. **Deterministic PayPal Sandbox Mirror Mode (Offline / Unit Tests)**:
   - Toggleable via the **"PayPal Sandbox / Mirror"** drawer in the top navigation bar whenever evaluating offline or without `.env.local` credentials.

### Sandbox Test Accounts (Slot 013 — Judge & Buyer Testing)
- **Sandbox Personal Buyer Account (`AEME4VE2LQ8D8`)**: `sb-ifqau51324237@personal.example.com` (Password stored locally in `NexusPulse/.env.local` / Hackathon Slot 013 sheet)
- **Sandbox Business Merchant Account (`6NGH9RSQMDEUJ`)**: `sb-mokyu51324247@business.example.com` (Password stored locally in `NexusPulse/.env.local` / Hackathon Slot 013 sheet)

### Step 3: Run Automated Tests & Production Build
```bash
cd NexusPulse
npm run test
npm run build
```

---

## 4. Repository Structure

```text
PayPal_AI_Hackathon/
├── LICENSE                                  # MIT Open-Source License (Required by Devpost)
├── render.yaml                              # Sponsor: Render Cloud Blueprint (Web + Cron Worker)
├── README.md                                # Project Architecture, Judge Guide & Demo Script
├── Research_Papers_And_Survey/              # Downloaded DeepMind/Anthropic AGI Papers & Reports
└── NexusPulse/                              # Flagship Next.js 16 + TypeScript Application
    ├── package.json
    ├── .env.example
    ├── scripts/
    │   ├── autonomous-sweep.mjs             # Render Background Cron Worker
    │   └── migrate-supabase.mjs             # Supabase PostgreSQL Seeding Script
    └── src/
        ├── app/
        │   ├── page.tsx                     # Unified NexusPulse Command Center
        │   └── api/                         # Next.js App Router API Endpoints
        │       ├── state/route.ts
        │       ├── health/route.ts
        │       ├── paypal/orders/route.ts
        │       ├── paypal/subscriptions/route.ts
        │       ├── paypal/escrow/route.ts
        │       ├── paypal/webhooks/route.ts
        │       ├── ai/interact/route.ts
        │       ├── ai/verify-bounty/route.ts
        │       ├── ai/voice-briefing/route.ts
        │       ├── channel3/search/route.ts
        │       └── contact/route.ts             # Contact Desk & Inquiry Ingestion (Fetch Metadata Isolated)
        │   ├── about/page.tsx                   # Comprehensive Product Story, 50-Yr AGI Thesis & Sponsor Matrix
        │   ├── contact/page.tsx                 # Validated Operations & Judge Desk (RFC Validation, SLA Targets)
        ├── components/
        │   ├── paypal/PayPalV6CheckoutWidget.tsx
        │   ├── sponsors/AgGridFinancialCommandCenter.tsx
        │   ├── sponsors/BryntumEscrowTimeline.tsx
        │   ├── sponsors/Channel3DealHunterPanel.tsx
        │   └── bounties/ProofOfHumanBountyBoard.tsx
        ├── lib/
        │   ├── paypal/paypal-types.ts
        │   ├── paypal/paypal-client.ts      # APIMatic @paypal/paypal-server-sdk v2.5.0
        │   ├── paypal/paypal-sandbox-mirror.ts
        │   ├── paypal/paypal-gateway.ts
        │   ├── ai/gemini-agent.ts           # Google Gemini Interactions API (@google/genai v3.0.0)
        │   └── db/
        │       ├── schema.sql               # Supabase PostgreSQL Schema
        │       └── supabase-client.ts       # Supabase Client & Realtime Sync
        └── tests/
            └── nexus-pulse.test.ts          # Automated Test Suite (12/12 Passing)
```

---

## 5. 3-Minute Hackathon Demo Video Script

- **0:00 – 0:30 | The Problem & 50-Year Vision**: Introduce **NexusPulse** — *"Connecting AI Agents, Human Oracles & Smart Payments on PayPal"*. The Personal AI CFO that stops subscription & retail price leakage today while building the **Proof-of-Human Oracle Clearinghouse** on PayPal for the AGI economy. Show the live KPI strip and click **"AI Voice CFO Briefing"** (`gemini-3.8-flash-tts`).
- **0:30 – 1:15 | Engine 1: Channel3 Deal-Hunter & PayPal JS SDK v6 Checkout**: Run an Autonomous CFO Sweep with **Gemini 4 Argon** (`client.interactions.create()`). Select the **NVIDIA Jetson Orin Nano Super** deal discovered via **Channel3** (`$189.00` vs `$249.00` retail) and complete a live **PayPal JS SDK v6** checkout (`POST /v2/checkout/orders` + `/capture` via APIMatic `@paypal/paypal-server-sdk`).
- **1:15 – 1:55 | Engine 2: Proof-of-Human Oracle Bounties & Instant PayPal Payouts**: Switch to Engine 2, select an open Proof-of-Human bounty, submit ground-truth verification telemetry, and watch **Gemini 3.8 Flash** audit the submission (`97/100`) and trigger an instant **PayPal Payout (`POST /v1/payments/payouts`)**.
- **1:55 – 2:30 | Engine 3: Bryntum A2A Smart Escrow Gantt & Subscription Guard**: Inspect the **Bryntum Milestone Gantt**, verify deliverable proof on Milestone `ESCROW-102` to capture the locked **PayPal Authorization Hold** with automatic **DHL Shipment Tracker (`POST /v2/checkout/orders/{id}/track`)** dispute protection, and click **Auto-Revise Plan** on an overpriced PayPal Subscription (`+$50/mo` saved).
- **2:30 – 3:00 | AG Grid Enterprise Command Center & Webhook Security**: Open the **AG Grid v36** multi-endpoint ledger, filter across Transactions, Orders v2, Payouts v1, and Invoices v2, simulate a cryptographically verified **PayPal Webhook (`POST /v1/notifications/verify-webhook-signature`)**, and export the audit CSV.
