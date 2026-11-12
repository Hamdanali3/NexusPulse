# NexusPulse — Complete Website Technical Analysis & $5,000 Best Demo Video Script

**Workspace Target:** [`NexusPulse/`](./NexusPulse/) (Next.js `16.3.6` + React `19.2.8` + TypeScript)  
**Latest Verified Commits Audited:** `0d0b605` (Gemini `response_format` + token refinement), `8f22772` (PayPal JS SDK v6 `500ms` button fallback), and `fae64a9` (duplicate heading removal, `sanitizeSeedCopy()`, mobile responsive views, AG Grid auto-height trim)  
**Hackathon Alignment:** PayPal AI Hackathon (`paypalaihackathon.devpost.com`) — targeting **$5,000 Best Demo Video**, **Best Use of Agentic Commerce ($5,000)**, **Best Use of PayPal + AI ($5,000)**, plus **AG Grid**, **APIMatic**, **Bryntum**, **Channel3**, and **Render** partner tracks.  
**Verification Basis:** Inspected latest source modules and `.env.local` key presence, built production bundle (`next build`), ran `tsc --noEmit` (`0` errors) and `npm run test` (`17/17` passing), verified `https://nexus-pulse-bice.vercel.app/api/health`, exercised every flow in headless Chrome CDP (`http://localhost:3006`), checked `1432px` desktop + `375px` mobile overflow (`0px` on all checked views), logged `0` browser runtime exceptions, and captured **21 visually inspected `2160×1215` (16:9 HiDPI)** screenshots in [`HD_Screenshots/`](./HD_Screenshots/CAPTIONS.md).

---

## Part 1 — Complete Website & Architecture Analysis (Post-`fae64a9`)

### 1. Core Thesis & Problem Solved
NexusPulse is an **Agentic Financial Clearinghouse built on PayPal** addressing three operational bottlenecks in autonomous AI commerce:
1. **Deliberate Consumer Spending & Subscription Waste (`Engine 1 — Price watch` + `Spending review`):** AI assistants cannot safely spend without deterministic price ceilings, and recurring SaaS/compute plans silently waste budget when usage drops.
2. **Proof-of-Human Ground-Truth Verification (`Engine 2 — Verified tasks`):** Autonomous software agents lack eyes in the physical world (EV charger bays, cold-chain inventory, nuanced cultural audits, smart-contract security checks). NexusPulse crowdsources short tasks, grades evidence with multimodal Gemini, and disburses instant PayPal Payouts.
3. **Milestone-Gated Escrow & Unified Auditability (`Engine 3 — Milestone escrow` + `Engine 4 — Ledger`):** Contractor/agent-to-agent deliverables lock funds using PayPal `Orders v2 AUTHORIZE`, require delivery/tracking verification (`DHL-...`) before capture, and unify all orders, payouts, invoices, and webhook verification events in an AG Grid financial ledger backed by Supabase Postgres.

---

### 2. Design System, Routing & UX Evolution (`fae64a9` Refactor)

- **Calm Swiss Editorial Aesthetic (`src/app/globals.css`, `src/lib/format.ts`, `src/components/layout/`):**
  - Clean monochrome zinc palette (`#fafafa` canvas, `#ffffff` cards, `1px` borders) with a single indigo accent (`#4f46e5`), emerald/red tabular currency deltas, `Geist` + `Geist Mono` typography, and font weights constrained (`400`/`500`/`600`) for high readability.
  - **`fae64a9` Copy Hygiene (`sanitizeSeedCopy`):** Strips legacy hype jargon (`Autonomous Agent...`, `Proof-of-Human Oracle...`, raw endpoint strings) across seeded overview cards, Price watch, Verified tasks, Milestone escrow, and Ledger tables so business stakeholders see clean human-readable labels.
  - **Single Canonical `<h1>` Header (`FeaturePageHeader.tsx`):** Removed duplicate `<h2>` headers inside Engine 1–4 panels; each view now displays a breadcrumb (`<- Overview > ...`), one clean `<h1>` (`Price watch`, `Verified tasks`, `Milestone escrow`, `Ledger`), and a top-right `Next:` workflow pill.
  - **Completely Redesigned `/about` and `/contact` Routes (`src/app/about/page.tsx`, `src/app/contact/page.tsx`):** Replaced dense gradient badge styling with matching Swiss editorial layouts featuring interactive workflow comparison tabs, integration breakdowns, priority selection cards, and reviewer FAQs.
  - **Responsive Breakpoints Verified (`task-389`):** Mobile stacked card layouts (`<md` comparison/milestones, `<lg` AG Grid ledger) plus `.ag-layout-auto-height` min-height fix (`0px` horizontal overflow at both `1432px` desktop and `375px` mobile; compact AG Grid height without empty bottom space).
- **Sticky Header & Workspace Menu (`NexusHeader.tsx`):**
  - Left navigation: `Overview`, `Tools` dropdown (`Price watch`, `Verified tasks`, `Milestone escrow`, `Ledger`), `About`, `Contact`.
  - Right controls: `Workspace` menu (`Payment environment`: **Auto / Demo / Sandbox**, `Play audio summary`, `Reset demo data`, `PayPal sandbox keys` config drawer) and `Sign in` / `Get started` (or active persona badge like `JE Judge`).
- **Role-Based Auth Modal (`AuthModal.tsx`, `auth-types.ts`, `/api/auth/login`):**
  - Supports `Sample accounts`, `Sign in`, and `Sign up`.
  - 4 instant evaluation personas: `Judge Evaluator` (`Judge / Admin`), `Alex Rivera` (`Consumer Buyer`), `Elena Rostova` (`Human Oracle`), and `Marcus Vance` (`Enterprise Agent`). Note: legacy unused components like `PersonaQuickSwitchBanner.tsx` and `LandingAuthCard.tsx` are no longer rendered on `/`.

---

### 3. Core Interactive Engines & AI Stack Breakdown

#### A. Spending Review & Audio Briefings (`src/app/page.tsx`, `src/lib/ai/gemini-agent.ts`, `/api/ai/interact`, `/api/ai/voice-briefing`)
- Uses `@google/genai@^3.0.0` (`0d0b605` switched interaction structured output to `{ type: "object" }`) with declared function-calling tools (`optimize_paypal_subscription`, `create_paypal_order`, etc.) and optional PayPal remote MCP server when an active PayPal OAuth token is supplied.
- **Verified Live Behavior (`06_Spending_Review_Gemini_CFO_Report.png`):** Prompt `"Optimize unused PayPal subscriptions and save money"` completed in `1070ms` (`Reference: int_nexus_1794517588173`), executed `optimize_paypal_subscription` (`Checks run: 1`), downgraded `I-BW452GLLEP1G` (`$50.00/mo`, `$600.00/yr` savings), and rendered structured sections with `Summary`, `JSON`, `Copy`, and `Save PDF` export.
- **Confirmed Prompt-Trigger Regression (see Findings below):** Clicking the updated `Check subscriptions` chip sends `"Review unused PayPal subscriptions..."`, which misses the strict keyword trigger in `gemini-agent.ts`.

#### B. Engine 1 — Price Watch & PayPal JS SDK v6 (`Channel3DealHunterPanel.tsx`, `PayPalV6CheckoutWidget.tsx`, `/api/channel3/search`, `/api/paypal/client-token`)
- Searches product alerts (`6 active price alerts`, percent discount + 4× installment math), lets buyers create validated alerts (`Add price alert` drawer enforcing retail > target cap), and renders live PayPal JS SDK v6 checkout (`PayPal` + `Venmo` buttons) backed by `/api/paypal/client-token`.
- **`8f22772` SDK Timeout Fallback:** Adds a `500ms` timeout in `PayPalV6CheckoutWidget.tsx` if JS SDK v6 web-component buttons stay stuck loading, revealing interactive PayPal / Pay Later / Venmo buttons that open the confirmation `<dialog>` (`Order reference: 9NPY2FXKZRZW0RLNF`, `$2,687.04` in `09` & `14b`).

#### C. Engine 2 — Verified Tasks & Instant Payouts (`ProofOfHumanBountyBoard.tsx`, `/api/media/upload`, `/api/ai/verify-bounty`)
- Filters `All (3)` / `Open (3)` / `Paid (0)`, presents checklists, verification notes, 1-click sample evidence loader, 10MB file upload (`bounty-evidence` Supabase bucket or base64 fallback), and email/`@venmo` payout destination.
- **Verified Live Behavior (`11` & `11b`):** Submitting `#BOUNTY-102` (`$45.00`) returned live Gemini audit verdict **`97/100`** and dispatched real PayPal Sandbox Payouts v1 Batch **`RMWRLXRAQY72S`** (`$45.00 USD` to `sb-ifqau51324237@personal.example.com`).

#### D. Engine 3 — Milestone Escrow & Subscriptions Guard (`BryntumEscrowTimeline.tsx`, `/api/paypal/escrow`, `/api/paypal/subscriptions`)
- Interactive November 1–30 Gantt view across `ESCROW-101` (`$850.00 • Captured`), `ESCROW-102` (`$1,250.00 • Captured`), and `ESCROW-103` (`$1,350.00 • In progress`), date/progress editor, `intent: "AUTHORIZE"` milestone hold creation, deliverable verification capture, and carrier tracking attachment (`Tracking DHL-PK-88992211`).
- Lower `Subscriptions` section compares active recurring plans against lower-cost tiers and protects `Downgrade` / `Cancel subscription` actions behind `ConfirmDialog` (`Downgrade NebulaCompute Cloud Services?` saving `$600.00/yr` in `13`).

#### E. Engine 4 — Transaction Ledger, Live Invoicing v2 & Webhooks (`AgGridFinancialCommandCenter.tsx`, `/api/paypal/sync`, `/api/paypal/invoices`, `/api/paypal/webhooks`)
- Powered by `ag-grid-react@^36.3.0` (`ag-grid-community@^36.3.0`) across `Transactions`, `Orders`, `Payouts`, and `Invoices` tabs with quick search, category filtering, `Columns` toggle, `Sync PayPal`, `Issue invoice`, `Export CSV`, and `Review ledger`.
- **Verified Live Behavior (`14b` & `15`):** Confirmed order `9NPY2FXKZRZW0RLNF` (`$2,687.04`, `Authorized`) synced in `Orders (56)`, and created & sent a live PayPal Invoicing v2 invoice **`NP-383250`** (`$49.00` to `John Doe (Slot 013 Buyer)`, with clickable Sandbox `Open invoice` link).

#### F. Floating Groq RAG Assistant (`NexusAiChatbot.tsx`, `/api/ai/chatbot`)
- Grounded workspace Q&A powered by `groq-sdk@^1.6.0` with client-supplied `API Key` / `Custom key` override, suggested prompts, and clear/expand controls (`16`).

---

### 4. Backend Architecture, Package Stack & Live Environment Audit

- **Core PayPal Integration:** `@paypal/paypal-server-sdk@2.5.0` (APIMatic typed controllers), `@paypal/agent-toolkit@^1.11.0`, `@paypal/react-paypal-js@^10.6.1`, plus direct `paypalSandboxFetch` with cached OAuth tokens, idempotency UUIDs (`PayPal-Request-Id`), Payouts v1, Invoicing v2, Disputes, Trackers v2, and Webhooks verification (`src/lib/paypal/`).
- **Persistence & Ops Blueprints:** `@supabase/supabase-js@^2.119.0` + `pg@^8.23.1` (`src/lib/db/supabase-client.ts`), `NexusPulse/vercel.json` (daily cron `/api/ai/interact`), and root [`render.yaml`](./render.yaml) (web service + 15-min `/api/ai/interact` autonomous sweeper cron).
- **Local `.env.local` & Hosted Vercel Comparison:**
  - Local `NexusPulse/.env.local` has all required keys configured (`GEMINI_API_KEY`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `NEXT_PUBLIC_PAYPAL_CLIENT_ID`, `PAYPAL_WEBHOOK_ID`, Supabase keys, `DATABASE_URL`, `GROQ_API_KEY`), confirmed by `/api/health` returning `activeMode: "sandbox"`, `hasLiveSandboxCredentials: true`, `publicClientIdConfigured: true`, `sandboxSlot: "013"`.
  - Hosted **`https://nexus-pulse-bice.vercel.app/api/health`** returned HTTP `200` with `activeMode: "mirror"`, `hasLiveSandboxCredentials: false`, `publicClientIdConfigured: false`, `sandboxSlot: "013"`, `ai.configured: true` — meaning live PayPal env vars are not yet added to the Vercel deployment.

---

### 5. Verified Findings & Pre-Demo Fixes Identified

Directly observed in source code inspection and live Chrome CDP / HTTP probes during this audit:

1. **Checkout Modal Title Contrast Bug (`globals.css:56–62` + `PayPalV6CheckoutWidget.tsx:497–502` + Screenshot `09`):**
   - Unlayered `h1, h2, h3, h4 { color: var(--np-text-primary); }` in `globals.css` overrides Tailwind's `text-white` utility on `<h3 id="paypal-v6-dialog-title">`. Live computed color check returned **`rgb(9, 9, 11)`** on a dark `bg-zinc-950` modal header bar, making `"Confirm PayPal payment"` invisible against the header (`!text-white` or moving base heading rules inside `@layer base` fixes this cleanly).
2. **`Spending review` Prompt Chips Miss Gemini Tool Regex (`page.tsx:947–964` vs `gemini-agent.ts:381–485`):**
   - When the prompt chips were rewritten in plain English (`"Check subscriptions"` -> `"Review unused PayPal subscriptions and recommend lower-cost plans"`), `"review"` missed `gemini-agent.ts`'s strict substring checks (`"optimize" | "downgrade" | "cancel" | "fix" | "audit subscription"`). Clicking `"Check subscriptions"` returned **`Checks run: 0`** and an empty `01 Executive Assessment & Findings` card (`task-389.log`), whereas sending **`"Optimize unused PayPal subscriptions and save money"`** triggered **`optimize_paypal_subscription`** in `1070ms` (`Checks run: 1`, `task-452` / Screenshot `06`). In addition, markdown pipe tables returned in non-tool prose render as bullet lists because the custom parser lacks table parsing.
3. **PayPal Webhook Signature Verification Schema Error (`WEBHOOK-NEXUS-PULSE-SANDBOX`):**
   - Live `POST /api/paypal/webhooks` in Sandbox returned HTTP **`400`**: `/webhook_id` value `"WEBHOOK-NEXUS-PULSE-SANDBOX"` violates PayPal's `^[a-zA-Z0-9]+$` schema regex. Setting an authentic alphanumeric Sandbox Webhook ID (or falling back gracefully when a hyphenated placeholder ID is present) fixes live webhook testing on Engine 4.
4. **Vercel Deployment Running in `mirror` Mode:**
   - `https://nexus-pulse-bice.vercel.app/api/health` has `hasLiveSandboxCredentials: false`. Configure Slot `013` PayPal env vars on Vercel before Devpost judge review if judges test the live hosted URL.
5. **Minor UI Counter Sync & Chatbot Polish (`11`, `12`, `16`):**
   - In Engine 2 (`11`), `All (3)` / `Open (3)` / `Paid (0)` chip counters stayed stale right after `BOUNTY-102` payout dispatch; in Engine 3 (`12`), `Held (0)` omits `ESCROW-103` (`In progress`); in `Assistant` (`16`) + `chatbot/route.ts` (`115–121`), raw `<br>` in markdown table cells isn't stripped cleanly and fallback prose when `stateContext` is null retains older figures.
6. **Ledger Accumulation Prior to `RESET_STATE`:**
   - Before running `POST /api/state { action: "RESET_STATE" }`, accumulated Sandbox transactions in Supabase Postgres caused Overview to show `Net balance −$795.98` / `Orders (56)`; running `RESET_STATE` cleanly restores `$4,820.50` Wallet balance and `$1,960.80` Annual savings. Always call **Reset demo data** right before recording.

---

## Part 2 — Top-Level `< 3 Minute` ($5,000 Best Demo Video) Script

### Why This Structure Targets the $5,000 Award
- **Exact Runtime:** **2 minutes 48 seconds (`0:00 – 2:48`)** — safely inside Devpost's strict `3:00` limit with a 12-second buffer.
- **Stage 1 Gate Lock:** Both **PayPal** and **Google Gemini** appear clearly in narration and UI inside the first **12 seconds** and drive every engine end-to-end.
- **Stage 2 Equal 20% Scoring Matrix:**
  - *Technological Implementation (1st Tie-Breaker):* Demonstrates live tool execution (`optimize_paypal_subscription`), PayPal JS SDK v6, Orders v2 `AUTHORIZE`, Payouts v1 batch settlement, Invoicing v2, Shipment Trackers v2, APIMatic `@paypal/paypal-server-sdk`, AG Grid Ledger, Channel3 catalog, and Supabase Postgres.
  - *Design:* Highlights the freshly refactored Swiss-minimalist zinc UI, zero-whitespace AG Grid, and single-heading clarity across `/`, Tools 1–4, `/about`, and `/contact`.
  - *Potential Impact & Innovation:* Unblocks all 3 walls of autonomous commerce — deliberate purchasing, physical ground-truth verification, and dispute-shielded agent escrow.
  - *Presentation (~142 WPM, ~395 spoken words):* Conversational, punchy cadence, zoom keyframes on exact IDs/scores, jump-cuts over 1–2s network waits, zero copyrighted music, and zero unauthorized logos.

---

### Frame-by-Frame Production Script (`0:00 – 2:48`)

#### Scene 1 — Hook, Value Prop & 1-Click Workspace (`0:00 – 0:24` | ~56 words)
- **Visual Direction:**
  - Open full-screen on [`01_Overview_SignedOut_Hero.png`](./HD_Screenshots/01_Overview_SignedOut_Hero.png) (`Spend smarter. Pay people fairly. Release money when work is done.`).
  - Smooth cursor pan across KPI ribbon (`$1,960.80` savings, `$3,450.00` held in escrow, `$4,820.50` wallet balance), click `Sign in` -> [`03_Auth_Modal_Personas.png`](./HD_Screenshots/03_Auth_Modal_Personas.png) -> click `Judge Evaluator` -> land cleanly on [`04_Overview_SignedIn_Command_Center.png`](./HD_Screenshots/04_Overview_SignedIn_Command_Center.png).
  - *Lower-third overlay:* **`NexusPulse • Google Gemini × PayPal Agentic Clearinghouse`**
- **Narration:**
  > "AI agents can reason in milliseconds—yet they still stall when real money is involved. How do you stop agents from overspending, verify physical real-world tasks, and protect milestone contracts? Meet **NexusPulse**: one calm workspace connecting **Google Gemini** directly to live **PayPal Sandbox** financial rails. Let's sign in as Judge Evaluator and walk through all four engines live."

#### Scene 2 — Live Gemini Spending Review & Subscription Recovery (`0:24 – 0:50` | ~62 words)
- **Visual Direction:**
  - Open `Workspace` ([`05_Workspace_Sandbox_Settings.png`](./HD_Screenshots/05_Workspace_Sandbox_Settings.png)), highlight `Sandbox` active & `PayPal sandbox keys: Ready`, then close menu.
  - In `Spending review`, enter/run **`"Optimize unused PayPal subscriptions and save money"`** *(recording note: use this exact prompt so Gemini executes the live tool!)* -> speed-cut 1s wait -> [`06_Spending_Review_Gemini_CFO_Report.png`](./HD_Screenshots/06_Spending_Review_Gemini_CFO_Report.png).
  - Zoom in on **`Checks run: 1`**, **`1070ms`**, and **`optimize_paypal_subscription`** badge (`$50.00/mo · $600.00/yr`).
  - *Callout badge:* **`@google/genai` • `PayPal MCP` • `Subscriptions v1`**
- **Narration:**
  > "Inside live **PayPal Sandbox**, our **Spending review** assistant runs `@google/genai` with function calling and PayPal MCP bindings. Watch what happens when I ask it to optimize idle subscriptions: in **1.07 seconds**, Gemini doesn't just write advice—it executes `optimize_paypal_subscription`, identifies an underused GPU cluster, downgrades the tier, recovers **$600 a year**, and exports clean `Summary`, `JSON`, or `PDF` reports."

#### Scene 3 — Engine 1: Price Watch & PayPal JS SDK v6 Checkout (`0:50 – 1:16` | ~60 words)
- **Visual Direction:**
  - Open `Tools -> Price watch` ([`07_Engine1_Channel3_Deal_Hunter.png`](./HD_Screenshots/07_Engine1_Channel3_Deal_Hunter.png)).
  - Briefly show [`08_Engine1_Add_Price_Alert_Drawer.png`](./HD_Screenshots/08_Engine1_Add_Price_Alert_Drawer.png) setting a target cap (`We only alert or prepare checkout at or below this price`), then focus on `ASUS ROG Strix SCAR 18 RTX 5090` (`$2,687.04` vs `Target $2,799.00`) + `PayPal` and `Venmo` SDK buttons -> click to show [`09_Engine1_PayPal_Checkout_Dialog.png`](./HD_Screenshots/09_Engine1_PayPal_Checkout_Dialog.png) (`Order reference: 9NPY2FXKZRZW0RLNF`).
  - *Callout badge:* **`Channel3 Feed` • `PayPal JS SDK v6` • `Orders v2`**
- **Narration:**
  > "**Engine 1 — Price watch**: Powered by **Channel3**, buyers lock a strict maximum price before any purchase runs. When the RTX 5090 laptop drops 18.5% below our target cap, our **PayPal JS SDK v6** integration renders native **PayPal**, **Pay Later**, and **Venmo** checkout buttons backed by live `Orders v2` creation—so automated shopping never breaks your budget."

#### Scene 4 — Engine 2: Verified Tasks & Instant PayPal Payouts (`1:16 – 1:46` | ~68 words)
- **Visual Direction:**
  - Click `Next: Verified tasks ->` ([`10_Engine2_Proof_Of_Human_Bounties.png`](./HD_Screenshots/10_Engine2_Proof_Of_Human_Bounties.png)).
  - Click `Use sample`, point to checklist + 10MB receipt uploader + PayPal recipient input, and click `Verify and pay`.
  - Cut cleanly to [`11_Engine2_Gemini_Verify_And_Payout_Receipt.png`](./HD_Screenshots/11_Engine2_Gemini_Verify_And_Payout_Receipt.png) zooming on **`score 97/100`** and **`payout batch RMWRLXRAQY72S`**, then scroll down to [`11b_Engine2_Verification_Receipt_And_Payouts_History.png`](./HD_Screenshots/11b_Engine2_Verification_Receipt_And_Payouts_History.png).
  - *Callout badge:* **`Gemini Multimodal Audit` → `PayPal Payouts v1`**
- **Narration:**
  > "**Engine 2 — Verified tasks**: Whenever an AI needs human verification—hardware checks, field inspections, or security audits—contributors upload notes or photos against a rubric checklist. **Gemini** scores the submission against those exact rules. Here, task `BOUNTY-102` passes at **97 out of 100**, immediately triggering an idempotent **PayPal Payouts v1** batch—sending **$45 straight to the contributor's Sandbox wallet** in seconds."

#### Scene 5 — Engine 3: Milestone Escrow & Dispute Shield (`1:46 – 2:14` | ~64 words)
- **Visual Direction:**
  - Click `Next: Milestone escrow ->` ([`12_Engine3_Smart_Escrow_Gantt_And_Inspector.png`](./HD_Screenshots/12_Engine3_Smart_Escrow_Gantt_And_Inspector.png)).
  - Highlight Gantt schedule bars (`ESCROW-101..103`, `$3,450.00`), jump to inspector & release badge (`Tracking DHL-PK-88992211`), then scroll down to [`13_Engine3_Subscriptions_And_Confirm_Dialog.png`](./HD_Screenshots/13_Engine3_Subscriptions_And_Confirm_Dialog.png) showing `Downgrade NebulaCompute Cloud Services?` confirmation modal (`$600.00/yr` savings).
  - *Callout badge:* **`Orders v2 AUTHORIZE` • `Shipment Trackers v2` • `Subscriptions v1`**
- **Narration:**
  > "**Engine 3 — Milestone escrow**: Multi-stage contractor deliverables run on an interactive **Bryntum-inspired milestone schedule**. Capital is locked—not captured—via **PayPal Orders v2 `AUTHORIZE`**. Only when work is confirmed and carrier tracking like `DHL-PK-88992211` is attached for chargeback protection does PayPal capture funds, alongside guarded one-click recurring plan downgrades."

#### Scene 6 — Engine 4: AG Grid Ledger, Live Invoicing & Close (`2:14 – 2:48` | ~85 words)
- **Visual Direction:**
  - Click `Next: Ledger ->` ([`14_Engine4_AG_Grid_Financial_Ledger.png`](./HD_Screenshots/14_Engine4_AG_Grid_Financial_Ledger.png)). Flip cleanly from `Transactions` -> `Orders` ([`14b_Engine4_AG_Grid_Orders_And_Payouts.png`](./HD_Screenshots/14b_Engine4_AG_Grid_Orders_And_Payouts.png) highlighting `9NPY2FXKZRZW0RLNF`) -> click `Issue invoice` -> `Send invoice` -> [`15_Engine4_Live_Invoice_V2_Issued.png`](./HD_Screenshots/15_Engine4_Live_Invoice_V2_Issued.png) zooming on `NP-383250 ($49.00)` & `Open invoice`.
  - Flash [`16_Floating_AI_Chatbot_Assistant.png`](./HD_Screenshots/16_Floating_AI_Chatbot_Assistant.png) for 2s, quick montage of [`17_About_Hero_And_Architecture.png`](./HD_Screenshots/17_About_Hero_And_Architecture.png) + [`18_About_Sponsor_Technology_Matrix.png`](./HD_Screenshots/18_About_Sponsor_Technology_Matrix.png), ending on a crisp title slate.
  - *End Card Text:* **`NexusPulse • PayPal × Google Gemini × APIMatic × AG Grid × Bryntum × Channel3 × Render`**
- **Narration:**
  > "Finally, every payment converges in **Engine 4 — Ledger**: our **AG Grid** financial workspace synced to **Supabase Postgres** and wrapped in **APIMatic's typed `@paypal/paypal-server-sdk`** with `PayPal-Request-Id` idempotency. We can audit orders, export CSVs, or issue live **PayPal Invoicing v2** bills with a single click—plus a built-in RAG workspace assistant and one-click Sandbox/Demo switching. **NexusPulse: Spend smarter, pay people fairly, and settle autonomously on PayPal.**"

---

### Pre-Recording Execution Checklist (Quick 10-Minute Polish Before Shooting)
1. **Fix the 3 Small Live Polish Bugs First (Recommended):**
   - Add `!text-white` (or wrap heading base rules in `@layer base` inside `globals.css`) on `<h3 id="paypal-v6-dialog-title">` in `PayPalV6CheckoutWidget.tsx` so `"Confirm PayPal payment"` is clearly legible in Scene 3!
   - Update `Check subscriptions` / `Review price watch` / `Inspect escrow holds` chip copy in `page.tsx` (or include `"review unused"` / `"price"` / `"escrow"` patterns in `gemini-agent.ts`) so 1-click prompt chips trigger `Checks run: 1` live on camera.
   - Set a valid alphanumeric Sandbox `WEBHOOK_ID` (matching `^[a-zA-Z0-9]+$`) in `.env.local` and copy `.env.local` PayPal/Gemini/Supabase env vars to Vercel so hosted judges also hit live Sandbox!
2. **Reset & Capture Clean (`1920×1080`, `60fps`):**
   - Click `Workspace -> Reset demo data` right before recording so Wallet balance reads `$4,820.50` cleanly and skeletons are pre-warmed.
   - Use zoom keyframes on the 5 proof points (`optimize_paypal_subscription` badge, `Orders v2` reference ID, `97/100` + batch `RMWRLXRAQY72S`, `Tracking DHL-PK-88992211`, invoice `NP-383250`), royalty-free music ducked cleanly behind crisp studio mic VO, English YouTube CC enabled, public unlisted/public setting checked (< 3:00 total!).
