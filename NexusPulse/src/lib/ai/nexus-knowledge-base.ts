import type { NexusPulseState } from "@/lib/paypal/paypal-sandbox-mirror";

export interface KnowledgeDocument {
  id: string;
  title: string;
  category:
    | "identity"
    | "platform_overview"
    | "engine_1_channel3"
    | "engine_2_bounties"
    | "engine_3_escrow"
    | "telemetry_aggrid"
    | "paypal_apis"
    | "ai_cfo_console"
    | "security_webhooks"
    | "byok_settings"
    | "navigation"
    | "limitations"
    | "about_page"
    | "contact_page";
  route: string;
  tabId: "overview" | "channel3" | "bounties" | "bryntum" | "aggrid" | "about" | "contact";
  sectionId: string;
  keywords: string[];
  summary: string;
  details: string;
}

/**
 * Verified Navigation Map for NexusPulse
 * Used both for RAG grounding and to prevent hallucinated URLs.
 */
export const VERIFIED_NAVIGATION_LINKS = {
  overview: {
    label: "Clearinghouse Overview (Home)",
    url: "/?tab=overview#main-workspace",
    hashUrl: "/#main-workspace",
    tabId: "overview" as const,
    description: "Main dashboard featuring the Hero, KPI Telemetry Ribbon, and Autonomous CFO Console.",
  },
  cfoConsole: {
    label: "Autonomous CFO & MCP Command Console",
    url: "/?tab=overview#gemini-console-heading",
    hashUrl: "/#gemini-console-heading",
    tabId: "overview" as const,
    description: "Multi-turn AI CFO sweep console with one-click PayPal tool execution.",
  },
  kpiRibbon: {
    label: "Financial KPI Telemetry Ribbon",
    url: "/?tab=overview#kpi-telemetry-ribbon",
    hashUrl: "/#kpi-telemetry-ribbon",
    tabId: "overview" as const,
    description: "Real-time metrics for Annual AI Savings, Proof-of-Human Payouts, Active Escrow Holds, and Protected Wallet.",
  },
  channel3: {
    label: "Engine 1: Channel3 Deal Hunter & Subscription Guard",
    url: "/?tab=channel3#engine-channel3",
    hashUrl: "/#deal-hunter",
    tabId: "channel3" as const,
    description: "100M+ SKU price mandate scanner and PayPal JS SDK v6 multi-funding checkout.",
  },
  bounties: {
    label: "Engine 2: Proof-of-Human Oracle Bounties",
    url: "/?tab=bounties#engine-bounties",
    hashUrl: "/#human-bounties",
    tabId: "bounties" as const,
    description: "Real-world verification micro-bounties audited by AI and settled via PayPal Payouts v1.",
  },
  bryntum: {
    label: "Engine 3: Bryntum Smart Escrow Gantt & Subscriptions",
    url: "/?tab=bryntum#engine-bryntum",
    hashUrl: "/#escrow-gantt",
    tabId: "bryntum" as const,
    description: "PayPal Orders v2 AUTHORIZE milestone holds, Dispute Shield tracking, and Subscription Optimizer.",
  },
  aggrid: {
    label: "AG Grid Financial Telemetry Command Center",
    url: "/?tab=aggrid#aggrid-heading",
    hashUrl: "/#telemetry",
    tabId: "aggrid" as const,
    description: "Institutional ledger across Transactions, Orders, Payouts, and Invoices with CSV export.",
  },
  webhooks: {
    label: "PayPal Webhooks v1 Signature Verifier",
    url: "/?tab=aggrid#webhooks-security",
    hashUrl: "/#webhooks-security",
    tabId: "aggrid" as const,
    description: "Interactive SHA256withRSA webhook signature verifier and APIMatic SDK inspector.",
  },
  about: {
    label: "About NexusPulse & 50-Year AGI Thesis",
    url: "/about",
    hashUrl: "/about",
    tabId: "about" as const,
    description: "Comprehensive architectural breakdown, 50-year AGI macroeconomic thesis, and 7-sponsor matrix.",
  },
  contact: {
    label: "Contact & Judge Support Desk",
    url: "/contact",
    hashUrl: "/contact",
    tabId: "contact" as const,
    description: "Direct communications clearinghouse with expedited <2h SLA for PayPal Hackathon judges and developers.",
  },
};

/**
 * Structured Knowledge Corpus covering the entire NexusPulse website
 */
export const NEXUS_KNOWLEDGE_CORPUS: KnowledgeDocument[] = [
  {
    id: "doc-about-page",
    title: "About NexusPulse: Product Overview, 50-Year AGI Thesis & Sponsor Architecture",
    category: "about_page",
    route: "/about",
    tabId: "about",
    sectionId: "thesis",
    keywords: [
      "about",
      "about page",
      "about nexuspulse",
      "what is nexuspulse",
      "what is this product",
      "tell me about this product",
      "product information",
      "50-year agi thesis",
      "macroeconomic thesis",
      "deepmind",
      "anthropic",
      "sponsor matrix",
      "all sponsors",
      "architecture",
    ],
    summary:
      "Comprehensive structured overview of NexusPulse, its 50-year AGI macroeconomic thesis, 3 autonomous engines, and 7 hackathon sponsor integrations.",
    details: `NexusPulse About Page (/about):
- High-level Mission: Connecting AI Agents, Human Oracles & Smart Payments on PayPal for the PayPal AI Hackathon 2026.
- 50-Year AGI Economic Thesis: Solves consumer subscription bloat ($1,548+/yr lost) and the physical-world trust bottleneck for AI agents through human comparative advantage.
- Grounded in Research: Google DeepMind (arXiv:2509.10147, arXiv:2512.16856), Anthropic Economic Index (arXiv:2503.04761), and Macroeconomics of AGI (arXiv:2602.20946).
- 3 Engines:
  1. Engine 1: Personal Agentic CFO & Channel3 100M+ Deal-Hunter (PayPal Subscriptions v1 + Orders v2 + JS SDK v6).
  2. Engine 2: Proof-of-Human Oracle Micro-Bounties (Gemini 3.8 Flash audit in <2s + Instant PayPal Payouts v1).
  3. Engine 3: Zero-Dispute A2A Smart Escrow & Dispute Shield (PayPal Orders v2 AUTHORIZE + Bryntum Gantt + Shipment Trackers v2).
- Sponsor Matrix: All 7 hackathon tracks integrated (PayPal, APIMatic, Google Gemini, Channel3, AG Grid, Bryntum, Render).
- Dual-Mode Gateway: Hot-swaps between Live PayPal Sandbox and Deterministic Sandbox Mirror for 100% zero-blocker judge evaluation.
- Link: [Open About Page](/about)`,
  },
  {
    id: "doc-contact-page",
    title: "NexusPulse Contact, Hackathon Judge Support Desk & Direct Inquiry Clearinghouse",
    category: "contact_page",
    route: "/contact",
    tabId: "contact",
    sectionId: "contact-desk",
    keywords: [
      "contact",
      "contact page",
      "contact team",
      "support",
      "judge desk",
      "judge support",
      "inquiry",
      "how to contact",
      "help desk",
      "get in touch",
      "reach out",
      "feedback",
      "email",
    ],
    summary:
      "Direct communications clearinghouse with an expedited <2h SLA for PayPal Hackathon judges and developers, featuring RFC-validated form inputs and quick-fill presets.",
    details: `NexusPulse Contact Desk (/contact):
- Dedicated Channel: Specifically structured for PayPal AI Hackathon judges, developers integrating APIMatic & PayPal SDKs, and enterprise partners.
- Response SLAs:
  * Hackathon Judge Priority: < 2 Hours direct escalation.
  * Technical Blocker / Escrow Hold: < 12 Hours.
  * Standard SLA: 24–48 Hours.
- Quick-Fill Presets: Includes 1-click presets for Hackathon Judge Review, Developer / APIMatic SDK Integration, and Security / Webhooks Disclosure.
- Form Validation: Strict RFC email checking, full name bounds, urgency level, category selection, character counters, XSS sanitization, and spam honeypot.
- Ticket Tracking: Every submission receives a cryptographic reference ticket (e.g. NEXUS-REQ-XXXX) with instant copy functionality.
- Direct Channels: Direct links to GitHub repository, PayPal sandbox test credentials (sb-buyer-nexus@personal.example.com / sb-merchant-nexus@business.example.com), and security disclosure.
- Link: [Open Contact Page](/contact)`,
  },
  {
    id: "doc-identity",
    title: "NexusPulse AI Assistant Identity, Creator & Purpose",
    category: "identity",
    route: "/?tab=overview#main-workspace",
    tabId: "overview",
    sectionId: "main-workspace",
    keywords: [
      "who are you",
      "what are you",
      "your name",
      "who created you",
      "who built you",
      "who made you",
      "developer",
      "creator",
      "your purpose",
      "what do you do",
      "capabilities",
      "help me",
      "assistant",
      "chatbot",
    ],
    summary:
      "The NexusPulse AI Assistant is the official intelligent platform assistant and financial guide integrated into NexusPulse.",
    details: `Identity: NexusPulse AI Assistant — the dedicated intelligent assistant for the NexusPulse Autonomous Financial Clearinghouse.
Creator: Engineered by the NexusPulse architecture and development team specifically for the NexusPulse platform.
Purpose: To help users understand, navigate, and operate NexusPulse's three financial engines (Deal Hunter, Proof-of-Human Bounties, and Smart Escrow), inspect live wallet and transaction telemetry, explain PayPal API integrations, and guide workflows step by step.
Capabilities:
1. Live Financial Telemetry: Reports real-time wallet balance, AI savings, bounty payouts, escrow holds, subscriptions, and invoices.
2. Feature Walkthroughs: Explains how to scan Channel3 deals, create price mandates, claim human bounties, lock/capture escrow milestones, and downgrade idle subscriptions.
3. Direct Website Navigation: Provides clickable links and action buttons to jump directly to any engine or section.
4. Technical Architecture Guidance: Explains PayPal Orders v2, Payouts v1, Subscriptions v1, Invoicing v2, Trackers v2, Webhooks v1, Dual-Mode Sandbox Mirror, and Supabase persistence.`,
  },
  {
    id: "doc-platform-overview",
    title: "NexusPulse Platform Overview, Mission & Target Audience",
    category: "platform_overview",
    route: "/?tab=overview#main-workspace",
    tabId: "overview",
    sectionId: "main-workspace",
    keywords: [
      "nexuspulse",
      "website",
      "platform",
      "what is this",
      "what is website for",
      "about",
      "overview",
      "problem",
      "solve",
      "who is it for",
      "audience",
      "three engines",
      "3 engines",
      "clearinghouse",
    ],
    summary:
      "NexusPulse is an Autonomous Financial Clearinghouse built on PayPal REST APIs and JS SDK v6 uniting autonomous deal hunting, human-oracle micro-bounties, and zero-dispute milestone escrow.",
    details: `What NexusPulse Is: An Autonomous Financial Clearinghouse that connects AI agents, human verifiers, and programmable payments on PayPal.
Problems Solved:
1. Overpaying on hardware/electronics and leaking money on unused SaaS subscriptions.
2. AI agents lacking verified physical-world ground truth and needing a fast way to pay human verifiers.
3. B2B and freelance payment disputes caused by releasing funds before deliverables and shipping proofs are verified.
Who It Is Designed For:
- Everyday consumers automating deal hunting and subscription savings.
- Independent builders, freelancers, and human verifiers earning instant PayPal/Venmo payouts.
- Autonomous AI teams and enterprises orchestrating milestone-based B2B escrow and financial telemetry.
Three Core Engines:
- Engine 1 (SAVE): Channel3 Deal Hunter & Subscription Guard ([Open Engine 1](/?tab=channel3#engine-channel3))
- Engine 2 (EARN): Proof-of-Human Oracle Micro-Bounties ([Open Engine 2](/?tab=bounties#engine-bounties))
- Engine 3 (PROTECT): Bryntum Zero-Dispute Smart Escrow Gantt ([Open Engine 3](/?tab=bryntum#engine-bryntum))
Plus the AG Grid Financial Telemetry Command Center ([Open AG Grid Ledger](/?tab=aggrid#aggrid-heading)).`,
  },
  {
    id: "doc-engine1-channel3",
    title: "Engine 1: Channel3 Autonomous Deal Arbitrage & PayPal JS SDK v6 Checkout",
    category: "engine_1_channel3",
    route: "/?tab=channel3#engine-channel3",
    tabId: "channel3",
    sectionId: "engine-channel3",
    keywords: [
      "engine 1",
      "channel3",
      "deal",
      "deals",
      "deal hunter",
      "shopping",
      "mandate",
      "price mandate",
      "asus",
      "rog strix",
      "macbook",
      "keychron",
      "sony",
      "wh-1000xm5",
      "headphones",
      "keyboard",
      "laptop",
      "bnpl",
      "pay later",
      "venmo",
      "sku",
      "catalog",
    ],
    summary:
      "Engine 1 scans Channel3's 100M+ SKU catalog against user target price mandates and executes 1-click checkout via PayPal JS SDK v6 (PayPal Wallet, Pay Later BNPL, or Venmo).",
    details: `Engine 1: Channel3 Autonomous Deal Arbitrage & PayPal Checkout
Location: [Engine 1: Deal Hunter](/?tab=channel3#engine-channel3)
How It Works:
1. Search or Scan Catalog: Use the search bar or click "Scan Catalog" to query \`/api/channel3/search\` across indexed merchants.
2. Create Price Mandate: Click "+ New Price Mandate" to specify a Product Title, Brand, Category, Retail Price, and Target Mandate Price.
3. Autonomous Match & Checkout: When a merchant price meets or beats your target mandate, the status changes to "TARGET_MET_READY".
4. PayPal JS SDK v6 Checkout: Select the matched product to pay via PayPal Wallet, PayPal Pay Later (BNPL 4 interest-free payments or monthly installments), or Venmo using PayPal Orders v2 (\`POST /v2/checkout/orders\` and \`POST /v2/checkout/orders/{id}/capture\`).
Preloaded Channel3 Deals:
- C3-PROD-9001: ASUS ROG Strix SCAR 18 RTX 5090 (SKU: C3-736081) — Retail $3,299.00, Channel3 Best Price $2,687.04 (Save $611.96 / 18.5%), Target Mandate $2,799.00, Pay Later $671.76/mo, Status: TARGET_MET_READY.
- C3-PROD-9002: Apple MacBook Pro 16-inch M4 Max (SKU: APL-MBP16-M4M) — Retail $1,599.00, Channel3 Best Price $1,279.00 (Save $320.00 / 20%), Target Mandate $1,300.00, Pay Later $106.58/mo, Status: TARGET_MET_READY.
- C3-PROD-9003: Keychron Q1 Max Wireless Custom Mechanical Keyboard (SKU: KC-Q1MAX-BANA) — Retail $229.00, Channel3 Best Price $174.00 (Save $55.00 / 24%), Target Mandate $180.00, Pay Later $43.50/mo, Status: TARGET_MET_READY.
- C3-PROD-9004: Sony WH-1000XM5 Wireless Noise Canceling Headphones (SKU: SNY-WH1000XM5-BLK) — Retail $399.99, Channel3 Best Price $228.00 (Save $171.99 / 43%), Purchased via PayPal Order #5O190127TN364715T.`,
  },
  {
    id: "doc-engine2-bounties",
    title: "Engine 2: Proof-of-Human Oracle Micro-Bounties & Instant PayPal Payouts v1",
    category: "engine_2_bounties",
    route: "/?tab=bounties#engine-bounties",
    tabId: "bounties",
    sectionId: "engine-bounties",
    keywords: [
      "engine 2",
      "bounty",
      "bounties",
      "human",
      "oracle",
      "proof of human",
      "proof-of-human",
      "earn",
      "payout",
      "payouts",
      "verify",
      "evidence",
      "micro-bounty",
      "bounty-101",
      "bounty-102",
      "bounty-103",
      "bounty-104",
    ],
    summary:
      "Engine 2 lets human contributors claim 30–60s physical-world and expert verification micro-bounties posted by AI agents, verified in under 2 seconds and paid immediately via PayPal Payouts v1.",
    details: `Engine 2: Proof-of-Human Oracle Micro-Bounties & Instant PayPal Payouts
Location: [Engine 2: Human Bounties](/?tab=bounties#engine-bounties)
How It Works:
1. Select an Open Bounty: Browse micro-bounties posted by enterprise AI agents (e.g., SupplyChain-Sentinel-v4, ColdChain-Audit-Bot, SecOps-Agent-Prime).
2. Submit Field Evidence: Enter your verification report/telemetry and your recipient PayPal email (e.g. \`sb-buyer-nexus@personal.example.com\`).
3. Automated AI Verification: Clicking "Verify & Trigger Instant PayPal Payout" sends the submission to \`POST /api/ai/verify-bounty\`. The auditor scores deliverable fidelity from 0–100 against the required verification criteria.
4. Instant PayPal Settlement: Passing submissions (score >= 70) immediately trigger \`POST /v1/payments/payouts\` with a unique \`PayPal-Request-Id\` idempotency header.
Default Bounties:
- BOUNTY-101: Verify Retail GPU Shelf Stock & Price Tag at BestBuy / MicroCenter ($28.50 USD, 45s, Status: OPEN).
- BOUNTY-102: Cold-Chain Pharmaceutical Reefer Container Seal & Temp Log Inspection ($42.00 USD, 60s, Status: OPEN).
- BOUNTY-103: Smart Contract & PayPal Webhook Idempotency Edge-Case Sanity Review ($65.00 USD, 55s, Status: OPEN).
- BOUNTY-104: Urdu/English Bilingual Voice Checkout Prompt Naturalness Rating ($25.00 USD, 35s, Status: PAID_OUT — Batch BATCH-NP-99401).`,
  },
  {
    id: "doc-engine3-escrow",
    title: "Engine 3: Bryntum Zero-Dispute A2A Smart Escrow Gantt & Subscription Guard",
    category: "engine_3_escrow",
    route: "/?tab=bryntum#engine-bryntum",
    tabId: "bryntum",
    sectionId: "engine-bryntum",
    keywords: [
      "engine 3",
      "escrow",
      "bryntum",
      "gantt",
      "milestone",
      "milestones",
      "authorize",
      "authorization",
      "capture",
      "dispute",
      "dispute shield",
      "tracking",
      "dhl",
      "fedex",
      "subscription",
      "subscriptions",
      "downgrade",
      "cancel",
      "escrow-101",
      "escrow-102",
      "escrow-103",
      "sub-ai-cloud-8801",
      "sub-dev-suite-4410",
    ],
    summary:
      "Engine 3 binds PayPal Orders v2 AUTHORIZE holds to a Bryntum Gantt milestone timeline, verifies deliverable proofs before capture, attaches DHL/FedEx tracking via Trackers v2, and optimizes recurring PayPal subscriptions.",
    details: `Engine 3: Bryntum Zero-Dispute Smart Escrow Milestone Gantt & Subscription Optimizer
Location: [Engine 3: Escrow Gantt](/?tab=bryntum#engine-bryntum)
How Smart Escrow Works:
1. Lock Funds via AUTHORIZE: Click "+ New PayPal Auth Escrow Milestone" to lock funds using PayPal Orders v2 (\`intent: "AUTHORIZE"\`) before work begins.
2. Track on Bryntum Gantt Timeline: Visualize WBS task numbers, dependencies, locked USD amounts, and authorization IDs on the interactive timeline.
3. Verify Deliverable & Capture: Select a locked milestone (such as ESCROW-102 or ESCROW-103), paste the deliverable proof (GitHub commit hash, audit log, or bill of lading), and click "Verify Deliverable & Capture Escrow".
4. Dispute Shield Tracking Injection: Upon verification, NexusPulse captures the authorization (\`POST /v2/payments/authorizations/{id}/capture\`) and attaches carrier tracking (\`POST /v1/shipping/trackers\`) for Seller Protection.
Default Escrow Milestones:
- ESCROW-101 (WBS 1.1): Autonomous Agent Subscriptions Auditor Engine — $850.00 USD, Auth: 0AU48201992019441, Status: CAPTURED_AND_TRACKED (DHL-9948201944).
- ESCROW-102 (WBS 1.2): High-Speed Multimodal Proof-of-Human Oracle Gateway — $1,250.00 USD, Auth: 0VF52814937998046, Client: Indus Clean Energy DAO, Status: AUTH_HOLD_PENDING_DELIVERABLE.
- ESCROW-103 (WBS 1.3): Cross-Border B2B Dispute Shield & Auto-Tracking Injector — $1,350.00 USD, Auth: 0AU11223344556677, Client: Global Logistics Clearinghouse Bot, Status: AUTH_HOLD_PENDING_DELIVERABLE.
Recurring Subscription Optimizer (\`/v1/billing/subscriptions\`):
- I-SUB-AI-CLOUD-8801: CloudGPU Compute Cluster Pro ($189.00/mo, 14% utilization) -> Recommended downgrade to Standard On-Demand ($49.00/mo), saving $140.00/mo ($1,680/yr).
- I-SUB-DEV-SUITE-4410: Enterprise Telemetry & Log Retention SaaS ($99.00/mo, 22% utilization) -> Recommended downgrade to Core Developer Tier ($29.00/mo), saving $70.00/mo ($840/yr).
- I-SUB-DESIGN-1029: Nexus Creative Cloud Seat ($54.99/mo, 88% utilization) -> Healthy active usage.`,
  },
  {
    id: "doc-telemetry-aggrid",
    title: "AG Grid Financial Telemetry Command Center, Invoices & Disputes",
    category: "telemetry_aggrid",
    route: "/?tab=aggrid#aggrid-heading",
    tabId: "aggrid",
    sectionId: "aggrid-heading",
    keywords: [
      "ag grid",
      "aggrid",
      "telemetry",
      "ledger",
      "transactions",
      "orders",
      "invoices",
      "invoice",
      "disputes",
      "csv",
      "export",
      "filter",
      "search",
      "table",
      "reporting",
      "t-code",
    ],
    summary:
      "The AG Grid Financial Command Center provides a multi-tab institutional ledger for PayPal Transactions, Orders v2, Payouts v1, and Invoices v2 with quick search, engine filtering, and 1-click CSV export.",
    details: `AG Grid Financial Telemetry Command Center
Location: [AG Grid Financial Ledger](/?tab=aggrid#aggrid-heading)
Features:
1. Four Ledger Views: Switch tabs between Unified Transactions (\`/v1/reporting/transactions\`), Orders v2 (\`/v2/checkout/orders\`), Payouts v1 (\`/v1/payments/payouts\`), and Invoices v2 (\`/v2/invoicing/invoices\`).
2. Engine Filter & Quick Search: Filter by ALL, CHANNEL3_DEALS, PROOF_OF_HUMAN_BOUNTY, SMART_ESCROW, or SUBSCRIPTION_OPTIMIZER, or type any keyword/ID in the search box.
3. 1-Click CSV Export: Click "Export CSV" to download a full accounting spreadsheet of the current ledger.
4. AI Ledger Audit: Click "Ask AI CFO to Audit Ledger" to run an automated anomaly and cashflow review.
Invoices & Disputes Summary:
- INV-2026-NP-8821: $1,250.00 USD billed to Indus Clean Energy DAO (UNPAID, 3% early-payment discount available).
- INV-2026-NP-8815: $850.00 USD billed to ProcureBot Enterprise Agent (PAID).
- PP-D-490128: $228.00 USD Dispute (MERCHANDISE_OR_SERVICE_NOT_RECEIVED) — AUTO_COUNTERED_WITH_TRACKING via DHL proof.`,
  },
  {
    id: "doc-paypal-apis",
    title: "PayPal REST APIs, JS SDK v6, APIMatic Server SDK & Dual-Mode Gateway",
    category: "paypal_apis",
    route: "/?tab=aggrid#webhooks-security",
    tabId: "aggrid",
    sectionId: "webhooks-security",
    keywords: [
      "paypal",
      "api",
      "apis",
      "sdk",
      "v6",
      "apimatic",
      "dual-mode",
      "dual mode",
      "sandbox",
      "mirror",
      "sms",
      "oauth",
      "idempotency",
      "paypal-request-id",
      "supabase",
      "database",
      "architecture",
      "tech stack",
    ],
    summary:
      "NexusPulse integrates 7 PayPal APIs, PayPal JS SDK v6, @paypal/paypal-server-sdk v2.5.0 (APIMatic), Supabase PostgreSQL, and a Dual-Mode Sandbox Mirror Gateway.",
    details: `PayPal APIs & Architecture Integrated in NexusPulse:
1. Orders v2 (\`POST /v2/checkout/orders\`, \`/capture\`, \`/authorize\`): Multi-funding checkout and smart escrow authorization holds.
2. Authorizations v2 (\`POST /v2/payments/authorizations/{id}/capture\`): Milestone fund release after deliverable verification.
3. Payouts v1 (\`POST /v1/payments/payouts\`): Instant disbursements to human oracle verifiers.
4. Subscriptions v1 (\`GET/POST /v1/billing/subscriptions/{id}/revise\`): Automated SaaS plan auditing and tier downgrades.
5. Invoicing v2 (\`POST /v2/invoicing/invoices\`): B2B invoices with early-payment discounts.
6. Trackers v2 (\`POST /v1/shipping/trackers\`): Injects DHL/FedEx tracking numbers for Dispute Shield protection.
7. Transaction Search v1 (\`GET /v1/reporting/transactions\`) & Webhooks v1 (\`POST /v1/notifications/verify-webhook-signature\`).
Dual-Mode Gateway (Zero-Blocker Evaluation):
- Deterministic Sandbox Mirror Mode (Default): Works immediately with realistic preloaded state and spec-compliant PayPal response payloads—eliminating regional SMS verification blockers.
- Live PayPal Sandbox Mode: Click the "PayPal Mirror / Sandbox" pill in the top header to hot-swap your \`PAYPAL_CLIENT_ID\` and \`PAYPAL_CLIENT_SECRET\` at runtime or via \`.env.local\`.`,
  },
  {
    id: "doc-cfo-voice-webhooks",
    title: "Autonomous CFO Sweep Console, Voice CFO Briefing & Webhook Security",
    category: "ai_cfo_console",
    route: "/?tab=overview#gemini-console-heading",
    tabId: "overview",
    sectionId: "gemini-console-heading",
    keywords: [
      "cfo",
      "sweep",
      "voice",
      "voice cfo",
      "tts",
      "audio",
      "briefing",
      "webhook",
      "webhooks",
      "signature",
      "sha256withrsa",
      "paypal-transmission-sig",
      "reset",
      "header",
    ],
    summary:
      "Includes the stateful Autonomous CFO Sweep console on the Overview tab, the 1-click Voice CFO executive audio briefing in the header, and the SHA256withRSA Webhook Signature Verifier.",
    details: `1. Autonomous CFO Sweep Console ([Open CFO Console](/?tab=overview#gemini-console-heading)):
   - Located on the Overview homepage. Maintains stateful multi-turn context via \`previous_interaction_id\` and can autonomously execute PayPal tools (optimize subscriptions, purchase Channel3 deals, dispatch payouts, and audit escrow).
2. Voice CFO Executive Briefing:
   - Click the "Voice CFO" button in the top navigation bar (\`POST /api/ai/voice-briefing\`) to generate and listen to a spoken executive summary of your wallet balance, savings, and pending escrow milestones.
3. Cryptographic Webhook Verifier ([Open Webhook Verifier](/?tab=aggrid#webhooks-security)):
   - Located in the AG Grid Telemetry tab. Simulates and verifies \`PAYPAL-TRANSMISSION-SIG\` headers via \`POST /v1/notifications/verify-webhook-signature\` before allowing state changes.`,
  },
  {
    id: "doc-byok-settings",
    title: "Bring Your Own Groq API Key (BYOK) Chatbot Configuration",
    category: "byok_settings",
    route: "/?tab=overview#main-workspace",
    tabId: "overview",
    sectionId: "main-workspace",
    keywords: [
      "byok",
      "api key",
      "groq key",
      "personal key",
      "own key",
      "connect key",
      "settings",
      "rate limit",
      "quota",
      "configure key",
    ],
    summary:
      "Users can optionally connect their own personal Groq API key in the chatbot Settings panel to run requests through their own account.",
    details: `Bring Your Own API Key (BYOK) in NexusPulse AI Assistant:
- How to Configure: Click the Key / Settings icon in the top-right header of the chatbot window.
- Features: Enter your personal Groq API key (\`gsk_...\`), toggle visibility (Show/Hide), click "Save & Verify" to validate the key live, or click "Remove Key" at any time to revert to the default NexusPulse platform AI configuration.
- Security & Privacy: Your key is stored only in your browser's local storage, sent exclusively over HTTPS request headers to the backend route, and never logged or exposed in URLs or public responses.
- Usage Policy: Connecting a personal API key routes inference through your own Groq account subject to your account's applicable rate limits, usage tiers, and policies.`,
  },
  {
    id: "doc-limitations-anti-hallucination",
    title: "Verified Scope & Non-Existent Features (Anti-Hallucination Guardrails)",
    category: "limitations",
    route: "/?tab=overview#main-workspace",
    tabId: "overview",
    sectionId: "main-workspace",
    keywords: [
      "bitcoin",
      "crypto",
      "mining",
      "nft",
      "forex",
      "stock trading",
      "stocks",
      "mobile app",
      "ios app",
      "android app",
      "download app",
      "pricing page",
      "login page",
      "signup",
      "password reset",
      "credit score",
      "mortgage",
      "loan",
    ],
    summary:
      "Clarifies features that do NOT exist on NexusPulse so the assistant never hallucinates capabilities or fake URLs.",
    details: `What NexusPulse Does NOT Have (Verified Boundaries):
- No Cryptocurrency Mining, NFT Minting, or Stock/Forex Brokerage: NexusPulse operates strictly in USD via PayPal REST APIs (Orders v2, Payouts v1, Subscriptions v1, Invoicing v2, Trackers v2).
- No Native iOS/Android Mobile App Download: NexusPulse is a responsive web application accessible directly in modern desktop and mobile browsers.
- No Separate /login, /signup, or /pricing Pages: All features are accessible directly from the single-page workspace tabs (\`/?tab=overview\`, \`/?tab=channel3\`, \`/?tab=bounties\`, \`/?tab=bryntum\`, \`/?tab=aggrid\`) with zero login friction.
- No Bank Loans or Mortgages: Financing options on NexusPulse refer specifically to PayPal Pay Later (BNPL Pay in 4 / Pay Monthly) inside Engine 1 checkout.`,
  },
];

/**
 * Retrieve the top matching knowledge documents for a user query + conversation history
 */
export function retrieveRelevantKnowledge(
  query: string,
  history: Array<{ role: "user" | "assistant"; content: string }> = []
): KnowledgeDocument[] {
  const recentContext = [
    ...history.slice(-2).map((h) => h.content),
    query,
  ]
    .join(" ")
    .toLowerCase();
  const qLower = query.toLowerCase();

  const scored = NEXUS_KNOWLEDGE_CORPUS.map((doc) => {
    let score = 0;
    for (const kw of doc.keywords) {
      if (qLower.includes(kw)) {
        score += 5;
      } else if (recentContext.includes(kw)) {
        score += 2;
      }
    }
    const words = qLower.split(/\W+/).filter((w) => w.length > 2);
    for (const w of words) {
      if (doc.title.toLowerCase().includes(w)) score += 2;
      if (doc.details.toLowerCase().includes(w)) score += 1;
    }
    return { doc, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const top = scored.filter((s) => s.score > 0).slice(0, 4).map((s) => s.doc);
  return top.length > 0 ? top : [NEXUS_KNOWLEDGE_CORPUS[0], NEXUS_KNOWLEDGE_CORPUS[1]];
}

/**
 * Safe arithmetic / percentage helper for general math & financial calculation questions
 */
function tryEvaluateMathQuery(q: string): string | null {
  // Percentage pattern: "what is X% of Y"
  const pctMatch = q.match(/(\d+(?:\.\d+)?)\s*%\s*of\s*\$?([\d,]+(?:\.\d+)?)/i);
  if (pctMatch) {
    const pct = parseFloat(pctMatch[1]);
    const base = parseFloat(pctMatch[2].replace(/,/g, ""));
    if (!isNaN(pct) && !isNaN(base)) {
      const result = (pct / 100) * base;
      return `**Calculation Result**: **${pct}%** of **\$${base.toLocaleString("en-US", { maximumFractionDigits: 2 })}** is **\$${result.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}**.`;
    }
  }

  // Simple arithmetic: "what is A + B", "calculate A * B", etc.
  const mathMatch = q.match(
    /(?:what\s+is|calculate|compute|how\s+much\s+is)\s+\$?([\d,]+(?:\.\d+)?)\s*([+\-*/x×])\s*\$?([\d,]+(?:\.\d+)?)/i
  );
  if (mathMatch) {
    const a = parseFloat(mathMatch[1].replace(/,/g, ""));
    const op = mathMatch[2];
    const b = parseFloat(mathMatch[3].replace(/,/g, ""));
    if (!isNaN(a) && !isNaN(b)) {
      let res = 0;
      if (op === "+") res = a + b;
      else if (op === "-") res = a - b;
      else if (op === "*" || op === "x" || op === "×") res = a * b;
      else if (op === "/" && b !== 0) res = a / b;
      return `**Calculation Result**: \`${a.toLocaleString("en-US")} ${op} ${b.toLocaleString("en-US")}\` = **${res.toLocaleString("en-US", { maximumFractionDigits: 2 })}**.`;
    }
  }

  return null;
}

/**
 * Robust classifier to detect out-of-scope or external-domain user queries
 * that do not belong to the financial clearinghouse context.
 */
export function isOutOfScopeQuery(query: string): { isOutOfScope: boolean; category?: string } {
  const q = query.trim().toLowerCase();

  // 1. Recipes, cooking, baking, culinary
  if (/\b(bake|baking|cook|cooking|recipe|recipes|pasta|pizza|cake|cookies|dinner|ingredient|soup|chef|fry|boil|sandwich|salad|dessert|dish|culinary)\b/i.test(q)) {
    return { isOutOfScope: true, category: "cooking recipes or food preparation" };
  }

  // 2. Weather, climate, meteorology
  if (/\b(weather|forecast|rain|raining|snow|sunny|temperature\s+outside|climate\s+change|humidity|tornado|hurricane|monsoon|celsius|fahrenheit)\b/i.test(q)) {
    return { isOutOfScope: true, category: "weather forecasts or meteorology" };
  }

  // 3. General trivia, world history, geography, astronomy (non-NexusPulse facts)
  if (
    /\b(capital\s+of|who\s+was\s+(the\s+)?(president|prime\s+minister|king|queen|emperor)|tallest\s+mountain|mount\s+everest|speed\s+of\s+light|distance\s+to\s+the\s+moon|solar\s+system|world\s+war|french\s+revolution|how\s+many\s+continents|who\s+invented\s+the\s+telephone|population\s+of|where\s+is\s+(paris|tokyo|london|rome|egypt|antarctica|australia|africa|asia|brazil|canada))\b/i.test(
      q
    )
  ) {
    return { isOutOfScope: true, category: "general trivia, world history, or geography" };
  }

  // 4. Sports, athletics, leagues, games
  if (/\b(world\s+cup|olympics|nba|fifa|messi|ronaldo|super\s+bowl|cricket|tennis|champions\s+league|premier\s+league|baseball|touchdown|goal\s+scored)\b/i.test(q)) {
    return { isOutOfScope: true, category: "sports or athletic events" };
  }

  // 5. Entertainment, movies, actors, pop culture, music
  if (/\b(movie|film|actor|actress|hollywood|netflix|spotify\s+playlist|plot\s+of|oscars|song\s+lyrics|celebrity\s+gossip|cinema|blockbuster)\b/i.test(q)) {
    return { isOutOfScope: true, category: "movies, entertainment, or pop culture" };
  }

  // 6. Generic computer science algorithms & programming unrelated to NexusPulse
  if (
    /\b(binary\s+search|quicksort|merge\s+sort|linked\s+list|leetcode|python\s+script\s+to\s+(scrape|parse|invert)|c\+\+\s+pointer|write\s+a\s+function\s+to\s+reverse|bubble\s+sort|dijkstra|binary\s+tree|data\s+structures\s+in\s+c|quicksort\s+script)\b/i.test(
      q
    )
  ) {
    return { isOutOfScope: true, category: "unrelated computer science algorithms or generic programming" };
  }

  // 7. Creative writing, poems, stories, jokes, riddles
  if (/\b(poem|poetry|riddle|joke)\b/i.test(q) || /\bwrite\b.*\b(poem|poetry|story|song|essay|joke|novel)\b/i.test(q)) {
    return { isOutOfScope: true, category: "creative writing, jokes, or poetry" };
  }

  // 8. Health, medicine, medical diagnosis
  if (/\b(headache|fever|symptoms\s+of|diagnose|cure\s+for|medical\s+advice|take\s+(tylenol|aspirin|ibuprofen)|stomach\s+ache|blood\s+pressure|flu\s+vaccine|prescription)\b/i.test(q)) {
    return { isOutOfScope: true, category: "medical advice or health diagnosis" };
  }

  // 9. Personal advice, dating, relationships, astrology
  if (/\b(horoscope|zodiac|astrology|relationship\s+advice|my\s+boyfriend|my\s+girlfriend|dating\s+advice|marriage\s+counseling)\b/i.test(q)) {
    return { isOutOfScope: true, category: "personal advice, relationships, or astrology" };
  }

  // 10. Automotive maintenance, home repair
  if (/\b(change\s+the\s+oil|car\s+battery|flat\s+tire|brake\s+pads|leaking\s+faucet|repair\s+roof|plumbing\s+fix)\b/i.test(q)) {
    return { isOutOfScope: true, category: "automotive maintenance or home repair" };
  }

  // 11. Unsupported crypto, bitcoin mining, NFTs, token speculation
  if (/\b(bitcoin|btc|ethereum|eth|crypto\s*mining|mine\s+crypto|solana|dogecoin|nft|nfts|defi|metamask|binance|coinbase)\b/i.test(q)) {
    return { isOutOfScope: true, category: "cryptocurrency mining, token trading, or NFTs" };
  }

  // 12. Unsupported stock market, forex, day trading
  if (/\b(stock\s+trading|buy\s+tesla\s+stock|forex|s&p\s*500\s+options|wall\s*street|day\s+trading|robinhood)\b/i.test(q)) {
    return { isOutOfScope: true, category: "stock trading, equities, or forex brokerage" };
  }

  // 13. Unsupported banking, mortgages, personal loans
  if (/\b(mortgage|home\s+loan|car\s+loan|bank\s+loan|auto\s+loan|apply\s+for\s+a\s+mortgage)\b/i.test(q)) {
    return { isOutOfScope: true, category: "bank mortgages, auto loans, or personal loans" };
  }

  // 14. Unsupported mobile app store downloads
  if (/\b(download\s+(the\s+)?(ios|android)\s+app|app\s+store|google\s+play|apk\s+download)\b/i.test(q)) {
    return { isOutOfScope: true, category: "native mobile app store downloads" };
  }

  // 15. Unsupported separate login / signup / pricing pages
  if (/(?:^|\s|\/)(login|signup|register|pricing|create\s+an\s+account|sign\s+up\s+page|login\s+page|forgot\s+password|reset\s+my\s+account\s+password)\b/i.test(q)) {
    return { isOutOfScope: true, category: "separate gated login or pricing pages" };
  }

  return { isOutOfScope: false };
}

/**
 * Context-Aware Knowledge & Intent Synthesis Engine
 * Guarantees that every question intent (greetings, identity, creator, purpose,
 * capabilities, specific engines, live metrics, navigation, follow-ups, hallucination traps,
 * and general questions) receives a distinct, accurate, intelligent answer.
 */
export function generateContextAwareRagResponse(
  query: string,
  history: Array<{ role: "user" | "assistant"; content: string }> = [],
  state?: Partial<NexusPulseState> | null
): string {
  const raw = query.trim();
  const q = raw.toLowerCase();

  const wallet = state?.walletBalanceUsd ?? 24650.0;
  const saved = state?.totalSavedByAiUsd ?? 707.55;
  const earned = state?.totalEarnedFromBountiesUsd ?? 395.0;
  const escrow = state?.totalEscrowProtectedUsd ?? 3450.0;
  const deals = state?.channel3Deals ?? [];
  const bounties = state?.bounties ?? [];
  const milestones = state?.escrowMilestones ?? [];
  const subscriptions = state?.subscriptions ?? [];

  const annualSubSavings =
    subscriptions.length > 0
      ? subscriptions.reduce(
          (sum, s) => sum + Number(s.potential_monthly_savings?.value ?? 0),
          0
        ) * 12
      : 2520;

  // ---------------------------------------------------------------------------
  // 0. MATH / ARITHMETIC / ROI CALCULATIONS
  // ---------------------------------------------------------------------------
  const mathAnswer = tryEvaluateMathQuery(q);
  if (mathAnswer) {
    return `${mathAnswer}

In your live **NexusPulse** workspace, your Protected Wallet currently holds **\$${wallet.toLocaleString("en-US", { minimumFractionDigits: 2 })} USD**, with **\$${saved.toFixed(2)} USD** in realized savings and **\$${annualSubSavings.toLocaleString("en-US")} USD/yr** in identified subscription optimizations.`;
  }

  // ---------------------------------------------------------------------------
  // 1. PURE GREETINGS & SMALL TALK
  // ---------------------------------------------------------------------------
  if (
    /^(hi|hello|hey|greetings|good\s*(morning|afternoon|evening|day)|howdy|salaam|salam|yo|sup)[\s!.,?]*$/i.test(
      raw
    ) ||
    /^(hi|hello|hey)\s+(there|assistant|nexus|nexuspulse|bot)[\s!.,?]*$/i.test(raw)
  ) {
    return `Hello! Welcome to **NexusPulse**. I am the **NexusPulse AI Assistant**, your intelligent guide for our Autonomous Financial Clearinghouse.

Here is a quick snapshot of your live workspace right now:
- **Protected Wallet Balance**: **\$${wallet.toLocaleString("en-US", { minimumFractionDigits: 2 })} USD**
- **Realized & Annual AI Savings**: **\$${(saved + annualSubSavings).toLocaleString("en-US", { minimumFractionDigits: 2 })} USD**
- **Active Smart Escrow Holds**: **\$${escrow.toLocaleString("en-US", { minimumFractionDigits: 2 })} USD**

How can I help you today? You can ask me to explain any feature, check live deals or bounties, or jump straight to a workspace:
- [Explore Engine 1: Channel3 Deal Hunter](/?tab=channel3#engine-channel3)
- [Explore Engine 2: Proof-of-Human Bounties](/?tab=bounties#engine-bounties)
- [Explore Engine 3: Smart Escrow Gantt](/?tab=bryntum#engine-bryntum)
[ACTION:NAVIGATE:overview]`;
  }

  if (/^(how are you|how's it going|how are things|are you online|are you working)/i.test(raw)) {
    return `I am online, fully synchronized with your live **NexusPulse** workspace state, and ready to help!

All three financial engines—**Channel3 Deal Hunter**, **Proof-of-Human Oracle Bounties**, and **Bryntum Smart Escrow**—are operational, with **\$${wallet.toLocaleString("en-US", { minimumFractionDigits: 2 })} USD** in your Protected Wallet. What would you like to explore or execute?`;
  }

  if (/^(thank you|thanks|thx|appreciate it|great job|awesome|perfect|goodbye|bye)[\s!.,]*$/i.test(raw)) {
    return `You're very welcome! Whenever you need help inspecting another engine, testing a PayPal transaction flow, or navigating the platform, I am right here in the bottom-right corner.`;
  }

  // ---------------------------------------------------------------------------
  // 2. SPECIFIC IDENTITY QUESTIONS: CREATOR vs BUILDER vs IDENTITY vs PURPOSE vs CAPABILITIES
  // ---------------------------------------------------------------------------
  if (
    /\b(who\s+(built|created|made|engineered)\s+you.*roles?|roles?.*who\s+(built|created|made|engineered)\s+you|who\s+are\s+you.*roles?|roles?.*who\s+are\s+you)\b/i.test(
      q
    )
  ) {
    return `I was built, engineered, and architected by the **NexusPulse engineering and architecture team** specifically for the **PayPal AI Hackathon 2026** to serve as your **Autonomous Personal AI CFO and Financial Clearinghouse Agent**.

### The 5 Executive Roles of the Autonomous CFO:
1. **Autopilot Subscription Guard (/v1/billing/subscriptions):** Audits recurring SaaS plans, flags unused compute/licenses, and executes tier downgrades or cancellations to eliminate financial leakage ($1,548+/yr savings).
2. **Autonomous Channel3 Deal Hunter & Arbitrage (/v2/checkout/orders):** Scans Channel3's 100M+ SKU catalog, monitors your target price mandates, and executes 1-click purchases via PayPal Orders v2 and JS SDK v6.
3. **Proof-of-Human Verification Oracle & Settlement (/v1/payments/payouts):** Audits physical-world ground-truth evidence submitted by human contributors in under 2 seconds, and disburses instant rewards via PayPal Payouts v1.
4. **Zero-Dispute A2A Smart Escrow & Dispute Shield (/v2/checkout/orders/{id}/authorize):** Coordinates milestone authorization holds on a Bryntum Gantt timeline and attaches DHL/FedEx tracking to prevent chargebacks.
5. **Real-time Treasury Management & Telemetry:** Maintains an institutional-grade double-entry ledger across transactions, invoices, and your **\$${wallet.toLocaleString("en-US", { minimumFractionDigits: 2 })} USD** Protected Wallet.

- [View Clearinghouse Overview](/?tab=overview#main-workspace)
[ACTION:NAVIGATE:overview]`;
  }

  if (
    /\b(what\s+are\s+your\s+roles|what\s+are\s+your\s+responsibilities|your\s+roles\s+and\s+responsibilities|explain\s+your\s+roles)\b/i.test(
      q
    )
  ) {
    return `### The 5 Executive Roles of the NexusPulse Autonomous CFO

As the autonomous personal AI CFO for NexusPulse, I operate across 5 dedicated roles:

1. **Autopilot Subscription Guard (/v1/billing/subscriptions):**
   Continuously audits recurring SaaS plans, flags idle compute/seats, and executes 1-click tier downgrades or cancellations to eliminate financial leakage (saving **\$${annualSubSavings.toLocaleString("en-US")} USD/yr** across active plans).
2. **Autonomous Channel3 Deal Hunter & Arbitrage (/v2/checkout/orders):**
   Scans Channel3's 100M+ SKU catalog, tracks your target price mandates on hardware (like ASUS laptops, MacBooks, and keyboards), and executes 1-click checkouts with PayPal Wallet, Pay Later (BNPL), and Venmo.
3. **Proof-of-Human Verification Oracle & Settlement (/v1/payments/payouts):**
   Reviews physical-world verification evidence submitted by human contributors in under 2 seconds, and triggers instant cash disbursements via PayPal Payouts v1.
4. **Zero-Dispute A2A Smart Escrow & Dispute Shield (/v2/checkout/orders/{id}/authorize):**
   Locks B2B milestone payments in PayPal authorization holds on a Bryntum Gantt timeline, verifying deliverable proofs before release and injecting carrier tracking (DHL/FedEx) for chargeback immunity.
5. **Real-time Treasury Management & Telemetry:**
   Maintains institutional-grade double-entry accounting across wallet balance, escrow holds, and ledger transactions with live CSV export via AG Grid.

- [View Clearinghouse Overview](/?tab=overview#main-workspace)
[ACTION:NAVIGATE:overview]`;
  }

  if (/\b(who\s+built\s+(you|this\s+bot|this\s+assistant)|your\s+builder)\b/i.test(q)) {
    return `I was built and architected by the **NexusPulse engineering and architecture team** specifically to power the **NexusPulse Autonomous Financial Clearinghouse**.

My technical architecture connects directly to NexusPulse's live state mirror, **PayPal REST APIs & JS SDK v6**, the **Channel3** 100M+ SKU deal engine, **Proof-of-Human** bounty board, and **Bryntum** smart escrow Gantt timeline so every answer reflects real-time platform state.

- [View Clearinghouse Overview](/?tab=overview#main-workspace)
[ACTION:NAVIGATE:overview]`;
  }

  if (
    /\b(who\s+(created|made|developed|designed|authored|coded)\s+(you|this\s+bot|this\s+assistant|this\s+website|nexuspulse)|your\s+(creator|developer|maker|author))\b/i.test(
      q
    )
  ) {
    return `I was created and designed by the **NexusPulse development and architecture team** as the official native AI assistant for the **NexusPulse** platform.

Unlike generic third-party chatbots, I was created from the ground up with full domain knowledge of NexusPulse's three financial engines, live wallet telemetry, and PayPal developer integrations to give you accurate, context-aware assistance.

- [View Clearinghouse Overview](/?tab=overview#main-workspace)
[ACTION:NAVIGATE:overview]`;
  }

  if (
    /\b(what\s+is\s+your\s+purpose|why\s+do\s+you\s+exist|why\s+were\s+you\s+(built|created|made)|what\s+is\s+your\s+(goal|mission|role|objective))\b/i.test(
      q
    )
  ) {
    return `My purpose is to serve as your **intelligent financial co-pilot and interactive platform guide** inside **NexusPulse**.

Specifically, I exist to:
1. **Demystify Complex Financial Flows**: Explain how our three engines automate shopping arbitrage, human-verified micro-bounties, and zero-dispute PayPal escrow.
2. **Surface Real-Time Telemetry**: Give you instant answers about your live wallet balance (**\$${wallet.toLocaleString("en-US", { minimumFractionDigits: 2 })} USD**), active price mandates, open bounties, and locked escrow milestones.
3. **Guide Navigation & Actions**: Take you directly to the right tab, form, or ledger view with clickable deep links so you never have to search around the interface.
4. **Support Developers & Judges**: Provide exact technical details on our PayPal API endpoints, webhook signature verification, and Dual-Mode Sandbox architecture.`;
  }

  if (
    /\b(what\s+(can|do)\s+you\s+do|how\s+can\s+you\s+help|what\s+are\s+your\s+(capabilities|features|functions|skills)|help\s+me\s+with)\b/i.test(
      q
    )
  ) {
    return `Here is what I can do for you inside **NexusPulse**:

1. **Live Portfolio & Wallet Queries**: Ask me for your current Protected Wallet balance, realized AI savings, subscription optimization opportunities, or recent PayPal transactions.
2. **Engine 1 (Channel3 Deals)**: I can list current hardware/electronics deals, compare retail vs. Channel3 prices, and show you how to create a custom price mandate ([Open Deal Hunter](/?tab=channel3#engine-channel3)).
3. **Engine 2 (Human Bounties)**: I can show open Proof-of-Human micro-bounties, their USD payouts, and how to submit verification evidence ([Open Human Bounties](/?tab=bounties#engine-bounties)).
4. **Engine 3 (Smart Escrow & Subscriptions)**: I can inspect locked PayPal \`AUTHORIZE\` milestones, explain Dispute Shield tracking, or identify overpriced SaaS subscriptions ([Open Escrow Gantt](/?tab=bryntum#engine-bryntum)).
5. **Technical & API Deep Dives**: Ask me about any PayPal endpoint (\`Orders v2\`, \`Payouts v1\`, \`Subscriptions v1\`, \`Trackers v2\`, \`Webhooks v1\`) or how our Dual-Mode Sandbox Mirror works.
6. **Bring Your Own API Key (BYOK)**: Click the **Key icon** in my header at any time to connect your own personal Groq API key.`;
  }

  if (
    /\b(who\s+are\s+you|what\s+are\s+you|what\s+is\s+your\s+name|introduce\s+yourself|tell\s+me\s+about\s+yourself|which\s+model|what\s+ai\s+are\s+you|are\s+you\s+human|are\s+you\s+an?\s+ai)\b/i.test(
      q
    )
  ) {
    return `I am the **NexusPulse AI Assistant**—the integrated financial intelligence and platform assistant for the **NexusPulse Autonomous Financial Clearinghouse**.

I have real-time visibility into your workspace telemetry, including your **\$${wallet.toLocaleString("en-US", { minimumFractionDigits: 2 })} USD** Protected Wallet, active **Channel3** price mandates, **Proof-of-Human** oracle bounties, **Bryntum** smart escrow milestones, and **AG Grid** transaction ledger.

What part of NexusPulse would you like to explore?`;
  }

  // ---------------------------------------------------------------------------
  // 3. ANTI-HALLUCINATION TRAPS (NON-EXISTENT FEATURES & FAKE ROUTES)
  // ---------------------------------------------------------------------------
  if (
    /\b(bitcoin|btc|ethereum|eth|crypto\s*mining|mine\s+crypto|solana|dogecoin|nft|nfts|blockchain\s+token|defi\s+yield|forex|stock\s+trading|buy\s+stocks|metamask)\b/i.test(
      q
    )
  ) {
    return `**NexusPulse does not support cryptocurrency mining, token trading, NFTs, or stock/forex brokerage.**

NexusPulse is an institutional **fiat USD financial clearinghouse** built exclusively on **PayPal's regulated payment rails**:
- **PayPal Orders v2** (PayPal Wallet, Pay Later BNPL, and Venmo checkout)
- **PayPal Payouts v1** (Instant USD disbursements for verified human bounties)
- **PayPal Authorizations & Trackers v2** (Milestone-based B2B escrow in USD)

You can inspect all verified USD transactions in the [AG Grid Financial Command Center](/?tab=aggrid#aggrid-heading).
[ACTION:NAVIGATE:aggrid]`;
  }

  if (
    /\b(mobile\s+app|ios\s+app|android\s+app|app\s+store|google\s+play|apk|download\s+the\s+app|desktop\s+installer|\.exe|\.dmg)\b/i.test(
      q
    )
  ) {
    return `**NexusPulse does not have a separate native iOS, Android, or desktop downloadable installer.**

Instead, NexusPulse is a **fully responsive web application** that runs directly in your mobile, tablet, or desktop browser with zero installation required. All three engines and the AG Grid ledger adapt automatically to mobile and desktop screens.

- [Open Workspace Overview](/?tab=overview#main-workspace)`;
  }

  if (
    /(?:^|\s|\/)(login|signup|register|pricing|create\s+an\s+account|sign\s+up\s+page|login\s+page|forgot\s+password|reset\s+my\s+account\s+password|subscription\s+tier\s+price\s+for\s+nexuspulse|mortgage|bank\s+loan|auto\s+loan|credit\s+card\s+application)\b/i.test(
      q
    )
  ) {
    return `**NexusPulse does not have a separate \`/login\`, \`/signup\`, \`/pricing\`, or bank loan application page.**

To ensure zero-friction access for users, developers, and hackathon judges, the entire workspace is immediately accessible from the main application without account walls:
- **Overview & AI CFO Console**: [/?tab=overview](/?tab=overview#main-workspace)
- **Engine 1 (Deal Hunter)**: [/?tab=channel3](/?tab=channel3#engine-channel3)
- **Engine 2 (Human Bounties)**: [/?tab=bounties](/?tab=bounties#engine-bounties)
- **Engine 3 (Escrow Gantt)**: [/?tab=bryntum](/?tab=bryntum#engine-bryntum)
- **AG Grid Telemetry**: [/?tab=aggrid](/?tab=aggrid#aggrid-heading)

If you want to connect your own PayPal Sandbox credentials or personal Groq API key, you can do so directly via the **PayPal Mode** switcher in the top header or the **API Key Settings** button inside this chat window.`;
  }

  // ---------------------------------------------------------------------------
  // 3B. GENERAL OUT-OF-SCOPE & CONTEXT BOUNDARY NOTICE
  // ---------------------------------------------------------------------------
  const outOfScope = isOutOfScopeQuery(raw);
  if (outOfScope.isOutOfScope) {
    const topicLabel = outOfScope.category ? ` regarding **${outOfScope.category}**` : "";
    return `### Scope Notice: Query Outside Operational Scope

I cannot answer this question because it is **outside my operational scope and context** as the NexusPulse intelligent financial assistant. I am specialized exclusively in autonomous commerce, financial optimization, and PayPal payment rails, and I do not provide answers${topicLabel}.

### Permitted Topics Within My Context
In this workspace, my intelligence and tools are strictly focused on:
1. **Engine 1: Channel3 Deal Hunter & Subscription Guard** — Scanning 100M+ catalog deals and optimizing/downgrading recurring PayPal subscriptions ([Open Engine 1](/?tab=channel3#engine-channel3)).
2. **Engine 2: Proof-of-Human Oracle Bounties** — Submitting and reviewing 30–60s real-world verification evidence with instant PayPal Payouts v1 ([Open Engine 2](/?tab=bounties#engine-bounties)).
3. **Engine 3: A2A Smart Escrow & Dispute Shield** — Milestone-based PayPal Orders v2 AUTHORIZE holds on a Bryntum Gantt timeline with DHL carrier tracking proofs ([Open Engine 3](/?tab=bryntum#engine-bryntum)).
4. **AG Grid Financial Telemetry & Ledger** — Real-time transaction audits, invoice reconciliation, and CSV export ([Open AG Grid](/?tab=aggrid#aggrid-heading)).
5. **System Identity & Architecture** — Inquiring about who built me, my executive roles, or our live **\$${wallet.toLocaleString("en-US", { minimumFractionDigits: 2 })} USD** wallet balance.

You can ask me questions regarding any of these platform capabilities!`;
  }

  // ---------------------------------------------------------------------------
  // 4. BYOK / API KEY SETTINGS QUESTIONS
  // ---------------------------------------------------------------------------
  if (
    /\b(byok|bring\s+your\s+own|personal\s+api\s+key|own\s+groq\s+key|add\s+my\s+(api\s+)?key|connect\s+my\s+(groq\s+|api\s+)?key|change\s+api\s+key|remove\s+api\s+key|where\s+do\s+i\s+enter\s+my\s+key|groq\s+api\s+key)\b/i.test(
      q
    )
  ) {
    return `### Connecting Your Own Groq API Key (BYOK)

You can connect your own personal Groq API key at any time so the chatbot uses your personal credentials instead of the default platform configuration:

1. Click the **Key icon (API Key Settings)** in the top-right header of this chat window.
2. Paste your Groq API key (starts with \`gsk_...\`) into the secure input field. Use the **Eye icon** to show or hide the key.
3. Click **Save & Verify Key**—the assistant will validate your credential live and switch your status badge to **Personal Key Active**.
4. You can **Update** or **Remove** your key at any time with a single click to return to the default NexusPulse AI configuration.

*Note: Using a personal API key routes requests through your own Groq account and is subject to Groq's applicable usage policies, pricing, and rate limits.*`;
  }

  // ---------------------------------------------------------------------------
  // 5. WEBSITE PURPOSE, TARGET AUDIENCE, COMPARISON & OVERVIEW QUESTIONS
  // ---------------------------------------------------------------------------
  if (/\b(who\s+is\s+(this|nexuspulse)\s+(for|designed\s+for|built\s+for)|target\s+(audience|users|customers))\b/i.test(q)) {
    return `### Who NexusPulse Is Designed For

NexusPulse serves three distinct user groups across a single PayPal clearinghouse:

1. **Everyday Consumers & Hardware Buyers (Engine 1)**:
   People who want AI to monitor Channel3's 100M+ SKU catalog for price drops on laptops, GPUs, and audio gear, execute 1-click PayPal / Pay Later checkout, and automatically downgrade unused SaaS subscriptions.
2. **Independent Builders, Freelancers & Human Verifiers (Engine 2)**:
   Contributors who claim 30–60 second physical-world verification or code-audit micro-bounties and get paid immediately via **PayPal Payouts v1**.
3. **Autonomous AI Teams & B2B Enterprises (Engine 3 & AG Grid)**:
   Organizations locking milestone funds in **PayPal Orders v2 \`AUTHORIZE\`** escrow on a Bryntum Gantt timeline with DHL tracking Dispute Shield and institutional AG Grid reporting.

- [Explore All Three Engines on the Overview Tab](/?tab=overview#main-workspace)`;
  }

  if (/\b(compare|difference\s+between|distinguish)\b.*\b(engine|engines|1|2|3|save|earn|protect)\b/i.test(q)) {
    return `### Comparison of NexusPulse's Three Financial Engines

| Dimension | Engine 1: SAVE (Channel3) | Engine 2: EARN (Human Oracles) | Engine 3: PROTECT (Smart Escrow) |
| :--- | :--- | :--- | :--- |
| **Core Goal** | Cut hardware & subscription spend | Pay humans for physical ground-truth | Zero-dispute B2B milestone escrow |
| **Primary PayPal API** | Orders v2 (\`CAPTURE\`) & JS SDK v6 | Payouts v1 (\`POST /v1/payments/payouts\`) | Orders v2 (\`AUTHORIZE\`) & Trackers v2 |
| **Sponsor Integration** | Channel3 100M+ SKU Catalog | Google Gemini Multimodal Auditor | Bryntum Interactive Gantt Chart |
| **Direct Link** | [Open Engine 1](/?tab=channel3#engine-channel3) | [Open Engine 2](/?tab=bounties#engine-bounties) | [Open Engine 3](/?tab=bryntum#engine-bryntum) |`;
  }

  if (
    /\b(what\s+is\s+(this\s+)?website(\s+for|\s+about)?|what\s+is\s+nexuspulse|what\s+does\s+(this\s+website|nexuspulse)\s+do|explain\s+(this\s+website|nexuspulse)|purpose\s+of\s+(this\s+website|nexuspulse)|what\s+problem\s+does\s+it\s+solve|main\s+features)\b/i.test(
      q
    )
  ) {
    return `### What NexusPulse Is & What It Solves

**NexusPulse** is an **Autonomous Financial Clearinghouse** built on **PayPal REST APIs & JS SDK v6**. It solves three major financial inefficiencies—overpaying on purchases/subscriptions, AI agents lacking verified physical-world data, and B2B escrow disputes—through three integrated engines:

1. **Engine 1 — SAVE (Channel3 Deal Hunter & Subscription Guard)**
   Scans Channel3's 100M+ SKU catalog against your target price mandates for 1-click PayPal v6 checkout, and downgrades underutilized PayPal subscriptions.
   👉 [Open Engine 1: Deal Hunter](/?tab=channel3#engine-channel3)

2. **Engine 2 — EARN (Proof-of-Human Oracle Bounties)**
   AI agents post 30–60 second physical-world verification tasks. Human contributors submit evidence, get audited in under 2 seconds, and receive instant **PayPal Payouts v1**.
   👉 [Open Engine 2: Human Bounties](/?tab=bounties#engine-bounties)

3. **Engine 3 — PROTECTED ESCROW (Bryntum Milestone Gantt & Dispute Shield)**
   Locks B2B/freelance funds in **PayPal Orders v2 \`AUTHORIZE\`** holds on an interactive Gantt chart, verifies deliverable proofs before capture, and attaches **DHL/FedEx tracking** for chargeback immunity.
   👉 [Open Engine 3: Smart Escrow](/?tab=bryntum#engine-bryntum)

4. **AG Grid Financial Command Center**
   Aggregates all transactions, orders, payouts, invoices, and webhook verifications in one institutional ledger with CSV export.
   👉 [Open AG Grid Telemetry](/?tab=aggrid#aggrid-heading)

[ACTION:NAVIGATE:overview]`;
  }

  // ---------------------------------------------------------------------------
  // 6. SPECIFIC PRODUCT / DEAL QUERIES (ENGINE 1)
  // ---------------------------------------------------------------------------
  if (/\b(asus|rog\s+strix|rtx\s+5090|c3-prod-9001|c3-736081)\b/i.test(q)) {
    return `### Channel3 Deal: ASUS ROG Strix SCAR 18 RTX 5090 (\`C3-PROD-9001\`)

- **SKU**: \`C3-736081\` • **Brand**: ASUS • **Merchant**: Channel3 Verified Direct Merchant (★ 4.9)
- **Retail Price**: \$3,299.00 USD
- **Channel3 Best Price**: **\$2,687.04 USD** (**Save \$611.96 / 18.5%**)
- **Your Target Mandate**: \$2,799.00 USD (**Status: TARGET_MET_READY**)
- **PayPal BNPL Option**: Eligible for PayPal Pay Later at **\$671.76/mo** (4 payments)

You can execute a 1-click purchase via PayPal Wallet, Pay Later, or Venmo directly in Engine 1:
- [Open ASUS Deal in Engine 1](/?tab=channel3#engine-channel3)
[ACTION:NAVIGATE:channel3]`;
  }

  if (/\b(macbook|m4\s+max|apple\s+macbook|c3-prod-9002|apl-mbp16)\b/i.test(q)) {
    return `### Channel3 Deal: Apple MacBook Pro 16-inch M4 Max (\`C3-PROD-9002\`)

- **SKU**: \`APL-MBP16-M4M\` • **Brand**: Apple • **Merchant**: Channel3 Verified: B&H Authorized Reseller (★ 4.95)
- **Retail Price**: \$1,599.00 USD
- **Channel3 Best Price**: **\$1,279.00 USD** (**Save \$320.00 / 20%**)
- **Your Target Mandate**: \$1,300.00 USD (**Status: TARGET_MET_READY**)
- **PayPal BNPL Option**: Eligible for PayPal Pay Monthly at **\$106.58/mo**

- [Open MacBook Deal in Engine 1](/?tab=channel3#engine-channel3)
[ACTION:NAVIGATE:channel3]`;
  }

  if (/\b(keychron|q1\s+max|keyboard|c3-prod-9003|kc-q1max)\b/i.test(q)) {
    return `### Channel3 Deal: Keychron Q1 Max Wireless Custom Mechanical Keyboard (\`C3-PROD-9003\`)

- **SKU**: \`KC-Q1MAX-BANA\` • **Brand**: Keychron • **Merchant**: Channel3 Verified: MechKeys Global (★ 4.8)
- **Retail Price**: \$229.00 USD
- **Channel3 Best Price**: **\$174.00 USD** (**Save \$55.00 / 24%**)
- **Your Target Mandate**: \$180.00 USD (**Status: TARGET_MET_READY**)
- **PayPal BNPL Option**: PayPal Pay in 4 at **\$43.50 × 4**

- [Open Keychron Deal in Engine 1](/?tab=channel3#engine-channel3)
[ACTION:NAVIGATE:channel3]`;
  }

  if (/\b(sony|wh-1000xm5|headphones|audio|c3-prod-9004|5o190127tn364715t)\b/i.test(q)) {
    return `### Channel3 Deal: Sony WH-1000XM5 Wireless Noise-Canceling Headphones (\`C3-PROD-9004\`)

- **SKU**: \`SNY-WH1000XM5-BLK\` • **Merchant**: Channel3 Verified: AudioDirect US (★ 4.85)
- **Retail Price**: \$399.99 USD → **Channel3 Best Price**: **\$228.00 USD** (**Saved \$171.99 / 43%**)
- **Status**: **PURCHASED_VIA_PAYPAL** (PayPal Order ID: \`5O190127TN364715T\`, Capture ID: \`2GG9035941476914N\`)

- [View Deal in Engine 1](/?tab=channel3#engine-channel3) | [View Order in AG Grid Ledger](/?tab=aggrid#aggrid-heading)
[ACTION:NAVIGATE:channel3]`;
  }

  // ---------------------------------------------------------------------------
  // 7. ENGINE 1 GENERAL / PRICE MANDATE / CHANNEL3 QUESTIONS
  // ---------------------------------------------------------------------------
  if (/\b(how\s+(do\s+i|to)\s+(create|add|set|make)\s+a?\s*(new\s+)?(price\s+)?mandate)\b/i.test(q)) {
    return `### Step-by-Step: Creating a New Price Mandate in Engine 1

1. Navigate to [Engine 1: Channel3 Deal Hunter](/?tab=channel3#engine-channel3).
2. Click the **+ New Price Mandate** button next to the catalog search bar.
3. Fill in the mandate form fields:
   - **Product Title** (e.g., *Samsung 990 PRO 4TB PCIe 4.0 NVMe SSD*)
   - **Brand** (e.g., *Samsung*) & **Category** (e.g., *AI Storage Hardware*)
   - **Current Retail Price (USD)** and your **Target Mandate Price (USD)**
4. Click **Deploy Cryptographic Mandate & Scan Channel3**. The system immediately queries \`POST /api/channel3/search\`, matches the lowest verified merchant price, and loads it into the **PayPal JS SDK v6 Checkout** panel.

[ACTION:NAVIGATE:channel3]`;
  }

  if (
    /\b(channel3|engine\s*1|deal\s*hunter|price\s*mandate|mandates|find\s+deals|scan\s+catalog|bnpl|pay\s+later|venmo\s+checkout)\b/i.test(
      q
    )
  ) {
    const readyCount = deals.filter((d) => d.mandate_status === "TARGET_MET_READY").length || 3;
    return `### Engine 1: Channel3 Autonomous Deal Arbitrage & PayPal JS SDK v6

**Engine 1** continuously monitors **Channel3's 100M+ SKU catalog** against your cryptographic target price mandates (${deals.length || 4} tracked deals, **${readyCount} ready for checkout**):

1. **Search & Filter**: Enter any product name, brand, or SKU in the search bar or click **Scan Catalog** (\`GET /api/channel3/search\`).
2. **Create a Custom Price Mandate**: Click **+ New Price Mandate**, enter the product title, retail price, and your maximum target price, and submit.
3. **1-Click Multi-Funding Checkout**: Select any matched deal to pay via **PayPal Wallet**, **PayPal Pay Later (BNPL)**, or **Venmo** using PayPal Orders v2 (\`POST /v2/checkout/orders\`).

**Currently Indexed Deals**:
- **ASUS ROG Strix SCAR 18 RTX 5090**: **\$2,687.04** (Save \$611.96 — Ready)
- **Apple MacBook Pro 16" M4 Max**: **\$1,279.00** (Save \$320.00 — Ready)
- **Keychron Q1 Max Mechanical Keyboard**: **\$174.00** (Save \$55.00 — Ready)
- **Sony WH-1000XM5 Headphones**: **\$228.00** (Saved \$171.99 — Purchased \`#5O190127TN364715T\`)

- [Go to Engine 1: Channel3 Deal Hunter](/?tab=channel3#engine-channel3)
[ACTION:NAVIGATE:channel3]`;
  }

  // ---------------------------------------------------------------------------
  // 8. SUBSCRIPTIONS & RECURRING SAAS GUARD QUESTIONS
  // ---------------------------------------------------------------------------
  if (
    /\b(subscription|subscriptions|recurring|saas|downgrade|unused\s+seat|cloudgpu|i-sub-|billing\/subscriptions)\b/i.test(
      q
    )
  ) {
    return `### Autonomous PayPal Subscription Guard (\`/v1/billing/subscriptions\`)

NexusPulse monitors your active PayPal recurring billing plans and identifies underutilized seats for 1-click tier downgrade:

| Subscription ID | Plan Name | Current Cost | Utilization | Recommended Action | Monthly Savings |
| :--- | :--- | :--- | :--- | :--- | :--- |
| \`I-SUB-AI-CLOUD-8801\` | **CloudGPU Compute Cluster Pro** | \$189.00/mo | 14% | Downgrade to Standard On-Demand (\$49/mo) | **\$140.00/mo** |
| \`I-SUB-DEV-SUITE-4410\` | **Enterprise Telemetry & Log SaaS** | \$99.00/mo | 22% | Downgrade to Core Developer (\$29/mo) | **\$70.00/mo** |
| \`I-SUB-DESIGN-1029\` | **Nexus Creative Cloud Seat** | \$54.99/mo | 88% | Optimal utilization — Keep active | \$0.00/mo |

**Total Potential Annual Subscription Savings**: **\$${annualSubSavings.toLocaleString("en-US", { minimumFractionDigits: 2 })} USD/yr**.
You can execute 1-click subscription downgrades in the **Subscription Optimizer** section inside Engine 3:
- [Open Subscription Optimizer in Engine 3](/?tab=bryntum#engine-bryntum)
[ACTION:NAVIGATE:bryntum]`;
  }

  // ---------------------------------------------------------------------------
  // 9. ENGINE 2 / SPECIFIC BOUNTIES / PROOF-OF-HUMAN / PAYOUTS QUESTIONS
  // ---------------------------------------------------------------------------
  if (/\b(bounty-101|gpu\s+shelf|bestbuy|microcenter)\b/i.test(q)) {
    return `### Proof-of-Human Bounty \`BOUNTY-101\`: Retail GPU Shelf Stock & Price Tag Verification

- **Posted By AI Agent**: \`SupplyChain-Sentinel-v4\` • **Category**: \`PHYSICAL_STORE_CHECK\`
- **Location**: San Jose, CA (BestBuy / MicroCenter) • **Estimated Time**: 45 seconds
- **Reward**: **\$28.50 USD** via Instant PayPal Payouts v1 (\`POST /v1/payments/payouts\`)
- **Status**: **OPEN** — Ready for evidence submission and instant settlement.

- [Claim BOUNTY-101 in Engine 2](/?tab=bounties#engine-bounties)
[ACTION:NAVIGATE:bounties]`;
  }

  if (/\b(bounty-102|cold-chain|cold\s+chain|reefer|pharmaceutical)\b/i.test(q)) {
    return `### Proof-of-Human Bounty \`BOUNTY-102\`: Cold-Chain Pharmaceutical Reefer Seal & Temp Audit

- **Posted By AI Agent**: \`ColdChain-Audit-Bot\` • **Category**: \`DELIVERY_CONFIRMATION\`
- **Location**: Port of Newark, NJ — Bay 14 • **Estimated Time**: 60 seconds
- **Reward**: **\$42.00 USD** via Instant PayPal Payouts v1
- **Verification Requirement**: Confirm container ISO seal number \`SL-884920\` is intact and digital readout is between \`2.0°C\` and \`4.5°C\`.

- [Claim BOUNTY-102 in Engine 2](/?tab=bounties#engine-bounties)
[ACTION:NAVIGATE:bounties]`;
  }

  if (/\b(bounty-103|edge-case\s+sanity|secops-agent-prime)\b/i.test(q)) {
    return `### Proof-of-Human Bounty \`BOUNTY-103\`: Smart Contract & PayPal Webhook Idempotency Review

- **Posted By AI Agent**: \`SecOps-Agent-Prime\` • **Category**: \`CODE_SECURITY_SANITY\`
- **Location**: Remote Global Oracle • **Estimated Time**: 55 seconds
- **Reward**: **\$65.00 USD** (Highest-paying open micro-bounty)
- **Verification Requirement**: Confirm \`PayPal-Request-Id\` deduplication and \`verify-webhook-signature\` raw-body SHA256 verification.

- [Claim BOUNTY-103 in Engine 2](/?tab=bounties#engine-bounties)
[ACTION:NAVIGATE:bounties]`;
  }

  if (/\b(bounty-104|urdu|bilingual\s+voice)\b/i.test(q)) {
    return `### Proof-of-Human Bounty \`BOUNTY-104\`: Urdu/English Bilingual Voice Checkout Rating

- **Posted By AI Agent**: \`VoiceUX-Evaluator\` • **Category**: \`TRANSLATION_NUANCE\`
- **Reward**: **\$25.00 USD** • **Status**: **PAID_OUT** (PayPal Payout Batch \`BATCH-NP-99401\`, Item \`FYXMPQTX4JC9N\`, Confidence Score: 96/100).

- [View Bounty History in Engine 2](/?tab=bounties#engine-bounties)
[ACTION:NAVIGATE:bounties]`;
  }

  if (
    /\b(engine\s*2|bounty|bounties|proof-of-human|proof\s+of\s+human|human\s+oracle|claim\s+bounty|submit\s+evidence|payouts\s+v1)\b/i.test(
      q
    )
  ) {
    const openBounties = bounties.filter((b) => b.status === "OPEN").length || 3;
    return `### Engine 2: Proof-of-Human Oracle Micro-Bounties & Instant PayPal Payouts

**Engine 2** bridges autonomous AI agents with human verifiers for 30–60 second physical-world and expert verification tasks (**${openBounties} open bounties**, **\$${earned.toFixed(2)} USD** total paid out):

| Bounty ID | Task Title | Posted By AI Agent | Reward | Est. Time | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| \`BOUNTY-101\` | Verify Retail GPU Shelf Stock & Price Tag | \`SupplyChain-Sentinel-v4\` | **\$28.50** | 45s | **OPEN** |
| \`BOUNTY-102\` | Cold-Chain Reefer Seal & Temp Log Audit | \`ColdChain-Audit-Bot\` | **\$42.00** | 60s | **OPEN** |
| \`BOUNTY-103\` | PayPal Webhook Idempotency Sanity Review | \`SecOps-Agent-Prime\` | **\$65.00** | 55s | **OPEN** |
| \`BOUNTY-104\` | Urdu/English Voice Prompt Naturalness Rating | \`VoiceUX-Evaluator\` | **\$25.00** | 35s | **PAID_OUT** |

**How to Claim & Get Paid**:
1. Open [Engine 2: Proof-of-Human Bounties](/?tab=bounties#engine-bounties) and click any **OPEN** bounty card.
2. Review or customize the field verification evidence and confirm your recipient PayPal email.
3. Click **Verify & Trigger Instant PayPal Payout**—the submission is scored (0–100) via \`POST /api/ai/verify-bounty\` and immediately disbursed via **PayPal Payouts v1** (\`POST /v1/payments/payouts\`).

[ACTION:NAVIGATE:bounties]`;
  }

  // ---------------------------------------------------------------------------
  // 10. ENGINE 3 / ESCROW / BRYNTUM GANTT / DISPUTE SHIELD QUESTIONS
  // ---------------------------------------------------------------------------
  if (/\b(escrow-101|0au48201992019441|dhl-9948201944)\b/i.test(q)) {
    return `### Escrow Milestone \`ESCROW-101\` (WBS 1.1): Autonomous Agent Subscriptions Auditor Engine

- **Client Agent**: ProcureBot Enterprise Agent • **Contractor**: NexusPulse Core Builder
- **Amount**: **\$850.00 USD** • **PayPal Order**: \`7HK92018401928374\` • **Auth ID**: \`0AU48201992019441\`
- **Status**: **CAPTURED_AND_TRACKED** (Capture ID: \`9CP3810482019283\`, Carrier: **DHL**, Tracking: \`DHL-9948201944\`).

- [Inspect ESCROW-101 on the Bryntum Gantt Timeline](/?tab=bryntum#engine-bryntum)
[ACTION:NAVIGATE:bryntum]`;
  }

  if (/\b(escrow-102|0vf52814937998046|indus\s+clean\s+energy)\b/i.test(q)) {
    return `### Escrow Milestone \`ESCROW-102\` (WBS 1.2): High-Speed Multimodal Proof-of-Human Oracle Gateway

- **Client Agent**: Indus Clean Energy DAO • **Amount Locked**: **\$1,250.00 USD**
- **PayPal Order ID**: \`9B877192004812391\` • **Authorization Hold ID**: \`0VF52814937998046\`
- **Status**: **AUTH_HOLD_PENDING_DELIVERABLE** (Depends on \`ESCROW-101\`)
- **How to Capture**: Open [Engine 3: Escrow Gantt](/?tab=bryntum#engine-bryntum), select \`ESCROW-102\`, verify the deliverable commit URL, and click **Verify Deliverable & Capture Escrow**.

[ACTION:NAVIGATE:bryntum]`;
  }

  if (/\b(escrow-103|0au11223344556677|global\s+logistics)\b/i.test(q)) {
    return `### Escrow Milestone \`ESCROW-103\` (WBS 1.3): Cross-Border B2B Dispute Shield & Auto-Tracking Injector

- **Client Agent**: Global Logistics Clearinghouse Bot • **Amount Locked**: **\$1,350.00 USD**
- **PayPal Order ID**: \`4KL99887766554433\` • **Authorization Hold ID**: \`0AU11223344556677\`
- **Status**: **AUTH_HOLD_PENDING_DELIVERABLE** (Depends on \`ESCROW-102\`)
- **Requirement**: Attach verified DHL/FedEx tracking via PayPal Trackers v2 API and pass webhook signature verification.

- [Inspect ESCROW-103 in Engine 3](/?tab=bryntum#engine-bryntum)
[ACTION:NAVIGATE:bryntum]`;
  }

  if (
    /\b(engine\s*3|escrow|bryntum|gantt|milestone|milestones|authorize\s+hold|dispute\s+shield|trackers\s+v2|dhl|release\s+funds|capture\s+escrow)\b/i.test(
      q
    )
  ) {
    return `### Engine 3: Bryntum Zero-Dispute Smart Escrow Milestone Gantt

**Engine 3** eliminates B2B and freelance payment disputes by binding **PayPal Orders v2 \`intent: "AUTHORIZE"\`** holds to an interactive **Bryntum Gantt timeline** (**\$${escrow.toLocaleString("en-US", { minimumFractionDigits: 2 })} USD** protected across ${milestones.length || 3} milestones):

| Milestone ID | WBS | Project / Deliverable | Client Agent | Amount | PayPal Auth ID | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| \`ESCROW-101\` | 1.1 | Autonomous Subscriptions Auditor | ProcureBot Enterprise | **\$850.00** | \`0AU48201992019441\` | **CAPTURED + TRACKED** (\`DHL-9948201944\`) |
| \`ESCROW-102\` | 1.2 | Multimodal Oracle Gateway | Indus Clean Energy DAO | **\$1,250.00** | \`0VF52814937998046\` | **AUTH HOLD LOCKED** |
| \`ESCROW-103\` | 1.3 | Cross-Border B2B Dispute Shield | Global Logistics Bot | **\$1,350.00** | \`0AU11223344556677\` | **AUTH HOLD LOCKED** |

**How to Create or Release a Milestone**:
- **Lock New Escrow**: Click **+ New PayPal Auth Escrow Milestone** to place a new \`AUTHORIZE\` hold.
- **Release & Capture**: Click a locked milestone (\`ESCROW-102\` or \`ESCROW-103\`), provide the deliverable proof (commit hash or bill of lading), and click **Verify Deliverable & Capture Escrow** (\`POST /v2/payments/authorizations/{id}/capture\` + \`POST /v1/shipping/trackers\`).

- [Open Engine 3: Bryntum Escrow Gantt](/?tab=bryntum#engine-bryntum)
[ACTION:NAVIGATE:bryntum]`;
  }

  // ---------------------------------------------------------------------------
  // 11. WALLET BALANCE / SAVINGS / FINANCIAL METRICS QUESTIONS
  // ---------------------------------------------------------------------------
  if (
    /\b(wallet|balance|how\s+much\s+money|total\s+saved|savings|kpi|metrics|how\s+much\s+earned|portfolio|funds|net\s+worth)\b/i.test(
      q
    )
  ) {
    return `### Live NexusPulse Financial Telemetry Summary

Here are the current real-time balances across your **NexusPulse** clearinghouse:

- **Protected Wallet Balance**: **\$${wallet.toLocaleString("en-US", { minimumFractionDigits: 2 })} USD**
- **Realized Deal & Subscription Savings**: **\$${saved.toFixed(2)} USD**
- **Projected Annual Subscription Guard Savings**: **\$${annualSubSavings.toLocaleString("en-US", { minimumFractionDigits: 2 })} USD/yr**
- **Combined Annualized AI Savings**: **\$${(saved + annualSubSavings).toLocaleString("en-US", { minimumFractionDigits: 2 })} USD**
- **Proof-of-Human Oracle Payouts Earned**: **\$${earned.toFixed(2)} USD**
- **Active PayPal \`AUTHORIZE\` Escrow Holds**: **\$${escrow.toLocaleString("en-US", { minimumFractionDigits: 2 })} USD**

You can inspect every underlying transaction, order, payout, and invoice in the ledger:
- [View KPI Telemetry Ribbon](/?tab=overview#kpi-telemetry-ribbon) | [Open AG Grid Financial Ledger](/?tab=aggrid#aggrid-heading)
[ACTION:NAVIGATE:aggrid]`;
  }

  // ---------------------------------------------------------------------------
  // 12. AG GRID / TRANSACTIONS / INVOICES / DISPUTES / CSV EXPORT
  // ---------------------------------------------------------------------------
  if (/\b(inv-2026-np-8821|inv-2026-np-8815|invoice|invoices|invoicing)\b/i.test(q)) {
    return `### PayPal Invoicing v2 Records (\`/v2/invoicing/invoices\`)

NexusPulse tracks B2B invoices with automated early-payment discount incentives in the **AG Grid Financial Command Center**:

1. **\`INV-2026-NP-8821\` (#NP-2026-0041)**:
   - **Recipient**: \`treasury@indus-clean-energy.dao\` • **Amount**: **\$1,250.00 USD**
   - **Status**: **UNPAID** (Due Nov 20, 2026 • **3% early-payment discount** available if settled early).
2. **\`INV-2026-NP-8815\` (#NP-2026-0039)**:
   - **Recipient**: \`billing@procurebot-enterprise.ai\` • **Amount**: **\$850.00 USD**
   - **Status**: **PAID** (Milestone 1.1 settlement completed).

- [View Invoices Tab in AG Grid Ledger](/?tab=aggrid#aggrid-heading)
[ACTION:NAVIGATE:aggrid]`;
  }

  if (/\b(pp-d-490128|dispute|disputes|chargeback)\b/i.test(q)) {
    return `### PayPal Dispute Protection & Evidence Counter-Filing

- **Active Dispute Record**: \`PP-D-490128\` (Transaction \`5O190127TN364715T\`, Amount: **\$228.00 USD**)
- **Reason**: \`MERCHANDISE_OR_SERVICE_NOT_RECEIVED\`
- **Resolution Status**: **\`AUTO_COUNTERED_WITH_TRACKING\`** — NexusPulse's Dispute Shield automatically injected carrier tracking (\`DHL-9948201944\`) and cryptographic delivery proof via **PayPal Trackers v2** (\`POST /v1/shipping/trackers\`) to protect merchant funds.

- [Inspect Ledger & Dispute Shield in AG Grid](/?tab=aggrid#aggrid-heading)
[ACTION:NAVIGATE:aggrid]`;
  }

  if (
    /\b(ag\s*grid|ledger|transaction|transactions|csv|export|t-code|reporting\/transactions)\b/i.test(
      q
    )
  ) {
    return `### AG Grid Financial Telemetry Command Center

The **AG Grid Financial Command Center** aggregates all PayPal activity across 4 interactive ledger tabs:

1. **Unified Transactions (\`/v1/reporting/transactions\`)**: Displays PayPal Transaction IDs, T-Codes (\`T0006\` Order Capture, \`T0400\` Payout, \`T0002\` Subscription, \`T1107\` Dispute), Gross/Net USD, PayPal Rail, and verification confidence.
2. **Orders v2 (\`/v2/checkout/orders\`)**: Tracks multi-funding checkouts and \`AUTHORIZE\` holds.
3. **Payouts v1 (\`/v1/payments/payouts\`)**: Lists instant human oracle disbursements with batch & item IDs.
4. **Invoices v2 (\`/v2/invoicing/invoices\`)**: Tracks B2B invoices (\`INV-2026-NP-8821\` and \`INV-2026-NP-8815\`).

**Tools**: Use the **Engine Filter**, **Quick Search box**, **Export CSV** button, or **Ask AI CFO to Audit Ledger**.
- [Open AG Grid Financial Command Center](/?tab=aggrid#aggrid-heading)
[ACTION:NAVIGATE:aggrid]`;
  }

  // ---------------------------------------------------------------------------
  // 13. WEBHOOKS / SECURITY / DUAL-MODE SANDBOX / PAYPAL APIS / VOICE CFO
  // ---------------------------------------------------------------------------
  if (
    /\b(webhook|webhooks|signature|sha256|paypal-transmission-sig|verify-webhook-signature|security|idempotency|paypal-request-id)\b/i.test(
      q
    )
  ) {
    return `### PayPal Webhooks v1 & Cryptographic Security Architecture

NexusPulse enforces institutional security across all payment and AI routes:

1. **Webhook Signature Verification (\`POST /v1/notifications/verify-webhook-signature\`)**:
   Reads raw unparsed request bytes and validates \`PAYPAL-TRANSMISSION-SIG\`, \`PAYPAL-TRANSMISSION-ID\`, \`PAYPAL-TRANSMISSION-TIME\`, and \`PAYPAL-CERT-URL\` (SHA256withRSA) before mutating state.
2. **Idempotent Mutations**: Every Order v2 and Payout v1 call attaches a deterministic \`PayPal-Request-Id\` header to prevent duplicate charges or double payouts.
3. **Cross-Site Protection**: API routes validate \`Sec-Fetch-Site\` headers and sanitize inputs.

You can test live webhook events (\`PAYMENT.CAPTURE.COMPLETED\`, \`PAYMENT.PAYOUTS-ITEM.SUCCEEDED\`, \`CUSTOMER.DISPUTE.CREATED\`, \`BILLING.SUBSCRIPTION.UPDATED\`) in the simulator:
- [Open Webhook Signature Verifier](/?tab=aggrid#webhooks-security)
[ACTION:NAVIGATE:aggrid]`;
  }

  if (/\b(dual-mode|dual\s+mode|sandbox\s+mirror|mirror\s+mode|sms\s+barrier|hot-swap|live\s+sandbox)\b/i.test(q)) {
    return `### Dual-Mode PayPal Gateway (Sandbox Mirror + Live PayPal Sandbox)

NexusPulse features a **Dual-Mode Gateway** (\`src/lib/paypal/paypal-gateway.ts\`) designed for zero-blocker evaluation worldwide:

1. **Deterministic Sandbox Mirror Mode (Default)**:
   Preloaded with spec-compliant PayPal Orders v2, Payouts v1, Subscriptions v1, Invoices v2, Trackers v2, and Webhook state so judges and developers can test every workflow immediately without regional SMS verification barriers.
2. **Live PayPal Sandbox Mode**:
   Click the **PayPal Mirror / Live Sandbox** button in the top navigation bar (or set \`PAYPAL_CLIENT_ID\` and \`PAYPAL_CLIENT_SECRET\` in \`.env.local\`) to hot-swap at runtime to \`https://api-m.sandbox.paypal.com\` using \`@paypal/paypal-server-sdk v2.5.0\`.`;
  }

  if (/\b(voice\s+cfo|voice\s+briefing|audio\s+briefing|tts|text-to-speech|cfo\s+sweep|gemini\s+console|reset\s+demo)\b/i.test(q)) {
    return `### Autonomous CFO Sweep Console, Voice CFO & Workspace Controls

- **Autonomous CFO Console** ([Open CFO Console](/?tab=overview#gemini-console-heading)): Located on the Overview tab, this console runs stateful multi-turn financial sweeps (\`POST /api/ai/interact\`) that autonomously invoke PayPal tools to downgrade idle subscriptions, capture deals, and audit escrow milestones.
- **Voice CFO Briefing**: Click the **Voice CFO** button in the top header (\`POST /api/ai/voice-briefing\`) to synthesize and play an executive spoken briefing summarizing your current wallet balance, AI savings, and pending milestones.
- **Reset Demo State**: Click the circular **Reset** icon in the top-right header to restore all deals, bounties, escrow milestones, and wallet balances to their initial state.
[ACTION:NAVIGATE:overview]`;
  }

  if (/\b(paypal\s+api|paypal\s+sdk|which\s+apis|list\s+all\s+apis|apimatic|tech\s+stack|architecture|supabase|database)\b/i.test(q)) {
    return `### Complete NexusPulse Technical Stack & PayPal APIs

- **PayPal Server SDK (APIMatic)**: \`@paypal/paypal-server-sdk v2.5.0\` (\`OrdersController\`, \`PaymentsController\`, \`SubscriptionsController\`, \`TransactionSearchController\`)
- **PayPal Client Checkout**: PayPal JS SDK v6 (PayPal Wallet, Pay Later BNPL, Venmo)
- **7 Integrated PayPal REST APIs**:
  1. **Orders v2**: \`POST /v2/checkout/orders\`, \`/capture\`, \`/authorize\`
  2. **Authorizations v2**: \`POST /v2/payments/authorizations/{id}/capture\`
  3. **Payouts v1**: \`POST /v1/payments/payouts\`
  4. **Subscriptions v1**: \`POST /v1/billing/subscriptions/{id}/revise\` & \`/cancel\`
  5. **Invoicing v2**: \`POST /v2/invoicing/invoices\`
  6. **Trackers v2**: \`POST /v1/shipping/trackers\`
  7. **Webhooks v1 & Reporting v1**: \`POST /v1/notifications/verify-webhook-signature\` & \`GET /v1/reporting/transactions\`
- **Frontend & Data**: Next.js 16 App Router, React 19, TypeScript, Tailwind CSS, AG Grid v36.3.0, Bryntum Gantt timeline, and Supabase PostgreSQL persistence.

- [Inspect SDK & Webhook Architecture](/?tab=aggrid#webhooks-security)
[ACTION:NAVIGATE:aggrid]`;
  }

  // ---------------------------------------------------------------------------
  // 14. NAVIGATION & DEEP LINK REQUESTS
  // ---------------------------------------------------------------------------
  if (
    /\b(navigate|take\s+me\s+to|go\s+to|where\s+(is|can\s+i\s+find)|link\s+to|links|sitemap|all\s+pages|all\s+sections|tabs)\b/i.test(
      q
    )
  ) {
    return `### NexusPulse Direct Navigation Directory

Click any link below to jump directly to that workspace tab and section:

- **Overview & Hero**: [Clearinghouse Overview](/?tab=overview#main-workspace)
- **Autonomous CFO Console**: [AI CFO & MCP Command Console](/?tab=overview#gemini-console-heading)
- **KPI Telemetry Ribbon**: [Live Financial KPIs](/?tab=overview#kpi-telemetry-ribbon)
- **Engine 1 (Save)**: [Channel3 Deal Hunter & Price Mandates](/?tab=channel3#engine-channel3)
- **Engine 2 (Earn)**: [Proof-of-Human Oracle Bounties](/?tab=bounties#engine-bounties)
- **Engine 3 (Protect)**: [Bryntum Smart Escrow Gantt & Subscriptions](/?tab=bryntum#engine-bryntum)
- **Financial Telemetry**: [AG Grid Ledger & CSV Export](/?tab=aggrid#aggrid-heading)
- **Webhook Security**: [PayPal Webhooks v1 Signature Verifier](/?tab=aggrid#webhooks-security)`;
  }

  // ---------------------------------------------------------------------------
  // 15. MULTI-TURN FOLLOW-UP RESOLUTION (CONTEXT AWARENESS)
  // ---------------------------------------------------------------------------
  if (history.length > 0) {
    const lastAssistant =
      [...history].reverse().find((h) => h.role === "assistant")?.content?.toLowerCase() || "";
    const isFollowUp =
      /\b(tell\s+me\s+more|more\s+details|how\s+do\s+i\s+use\s+(it|that)|give\s+me\s+the\s+link|where\s+is\s+(it|that)|how\s+much\s+does\s+(it|that)\s+(cost|pay)|what\s+about\s+the\s+(first|second|third)\s+one|explain\s+further|why\s+is\s+that|and\s+what\s+else)\b/i.test(
        q
      ) || raw.split(/\s+/).length <= 4;

    if (isFollowUp) {
      if (lastAssistant.includes("channel3") || lastAssistant.includes("engine 1")) {
        return `### Follow-Up: Using Engine 1 (Channel3 Deal Hunter)

To act on **Engine 1** right now:
1. Open [Engine 1: Channel3 Deal Hunter](/?tab=channel3#engine-channel3).
2. Click any **TARGET_MET_READY** deal card on the left (such as the **ASUS ROG Strix SCAR 18** at **\$2,687.04** or **Apple MacBook Pro M4 Max** at **\$1,279.00**).
3. In the **PayPal JS SDK v6 Checkout** widget on the right, choose **PayPal Wallet**, **Pay Later (BNPL)**, or **Venmo** to execute the order and record the savings to your ledger.

[ACTION:NAVIGATE:channel3]`;
      }
      if (lastAssistant.includes("bounty") || lastAssistant.includes("engine 2")) {
        return `### Follow-Up: Claiming a Proof-of-Human Bounty in Engine 2

To claim a bounty and trigger an instant payout:
1. Go to [Engine 2: Proof-of-Human Bounties](/?tab=bounties#engine-bounties).
2. Select one of the open bounties: \`BOUNTY-101\` (\$28.50), \`BOUNTY-102\` (\$42.00), or \`BOUNTY-103\` (\$65.00).
3. Verify the pre-filled field evidence in the right-hand panel and click **Verify & Trigger Instant PayPal Payout** to settle the reward into your wallet via \`POST /v1/payments/payouts\`.

[ACTION:NAVIGATE:bounties]`;
      }
      if (
        lastAssistant.includes("escrow") ||
        lastAssistant.includes("bryntum") ||
        lastAssistant.includes("engine 3")
      ) {
        return `### Follow-Up: Managing Smart Escrow Milestones in Engine 3

In [Engine 3: Bryntum Smart Escrow Gantt](/?tab=bryntum#engine-bryntum), you have two pending authorization holds ready for inspection:
- **\`ESCROW-102\` (\$1,250.00 USD)**: Multimodal Proof-of-Human Oracle Gateway (Auth: \`0VF52814937998046\`).
- **\`ESCROW-103\` (\$1,350.00 USD)**: Cross-Border B2B Dispute Shield (Auth: \`0AU11223344556677\`).

Select either row on the Gantt chart and click **Verify Deliverable & Capture Escrow** to release the funds and attach DHL Dispute Shield tracking.
[ACTION:NAVIGATE:bryntum]`;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 16. DYNAMIC QUERY-SPECIFIC RAG SYNTHESIS (NEVER STATIC OR REPETITIVE)
  // ---------------------------------------------------------------------------
  const matchedDocs = retrieveRelevantKnowledge(query, history);
  const primaryDoc = matchedDocs[0];
  const secondaryDoc = matchedDocs[1];

  const isHowQuestion = /\b(how|steps|guide|walkthrough|process|way\s+to)\b/i.test(q);
  const isWhyQuestion = /\b(why|benefit|advantage|reason|value|important)\b/i.test(q);
  const isWhereQuestion = /\b(where|location|find|page|section|tab|url)\b/i.test(q);

  const angleHeading = isHowQuestion
    ? `How It Works — ${primaryDoc.title}`
    : isWhyQuestion
    ? `Key Benefits & Architecture — ${primaryDoc.title}`
    : isWhereQuestion
    ? `Where to Find & Access — ${primaryDoc.title}`
    : `${primaryDoc.title}`;

  return `### ${angleHeading}

Regarding your question (*"${raw.slice(0, 90)}"*):

${primaryDoc.summary}

${primaryDoc.details}

${
  secondaryDoc && secondaryDoc.id !== primaryDoc.id
    ? `**Related Platform Context (${secondaryDoc.title})**: ${secondaryDoc.summary} ([Open Section](${secondaryDoc.route}))\n`
    : ""
}**Live Workspace Metrics**:
- **Protected Wallet**: **\$${wallet.toLocaleString("en-US", { minimumFractionDigits: 2 })} USD** | **Realized Savings**: **\$${saved.toFixed(2)} USD** | **Active Escrow**: **\$${escrow.toLocaleString("en-US", { minimumFractionDigits: 2 })} USD**
- **Direct Link**: [Go to ${primaryDoc.title}](${primaryDoc.route})
[ACTION:NAVIGATE:${primaryDoc.tabId}]`;
}
