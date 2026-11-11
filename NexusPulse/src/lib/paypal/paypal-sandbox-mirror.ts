import crypto from "crypto";
import type {
  Channel3ProductDeal,
  PayPalDisputeRecord,
  PayPalExecutionMode,
  PayPalInvoiceRecord,
  PayPalLedgerTransaction,
  PayPalOrderRecord,
  PayPalPayoutRecord,
  PayPalSubscriptionRecord,
  ProofOfHumanBounty,
  SmartEscrowMilestone,
} from "./paypal-types";

export interface NexusPulseState {
  preferredMode: "auto" | "live" | "sandbox" | "mirror";
  walletBalanceUsd: number;
  totalSavedByAiUsd: number;
  totalEarnedFromBountiesUsd: number;
  totalEscrowProtectedUsd: number;
  orders: PayPalOrderRecord[];
  payouts: PayPalPayoutRecord[];
  subscriptions: PayPalSubscriptionRecord[];
  invoices: PayPalInvoiceRecord[];
  disputes: PayPalDisputeRecord[];
  transactions: PayPalLedgerTransaction[];
  bounties: ProofOfHumanBounty[];
  escrowMilestones: SmartEscrowMilestone[];
  channel3Deals: Channel3ProductDeal[];
  webhookEvents: Array<{
    id: string;
    event_type: string;
    resource_id: string;
    summary: string;
    verification_status: "SUCCESS";
    created_at: string;
  }>;
}

export type SovereignPulseState = NexusPulseState;

const INITIAL_STATE: NexusPulseState = {
  preferredMode: "auto",
  walletBalanceUsd: 4820.5,
  totalSavedByAiUsd: 412.8,
  totalEarnedFromBountiesUsd: 285.0,
  totalEscrowProtectedUsd: 3450.0,
  orders: [
    {
      id: "5O190127TN364715T",
      intent: "CAPTURE",
      status: "COMPLETED",
      amount: { currency_code: "USD", value: "228.00" },
      description: "Channel3 Autonomous Deal Arbitrage: Sony WH-1000XM5 ANC Headphones (Saved $171.99)",
      category: "CHANNEL3_DEAL",
      funding_source: "paypal",
      payer_email: "sb-buyer-nexus@personal.example.com",
      merchant_email: "sb-merchant-nexus@business.example.com",
      capture_id: "2GG9035941476914N",
      paypal_request_id: "req-ord-sony-xm5-001",
      debug_id: "f48912a8bc102",
      mode: "mirror",
      create_time: "2026-11-08T14:22:10Z",
      update_time: "2026-11-08T14:22:19Z",
      links: [
        {
          href: "https://api-m.sandbox.paypal.com/v2/checkout/orders/5O190127TN364715T",
          rel: "self",
          method: "GET",
        },
      ],
    },
    {
      id: "8HK44912PL908123B",
      intent: "AUTHORIZE",
      status: "APPROVED",
      amount: { currency_code: "USD", value: "1250.00" },
      description: "A2A Smart Escrow Milestone #2: Multimodal Rag Pipeline & Verification Benchmark",
      category: "ESCROW_MILESTONE",
      funding_source: "paypal",
      payer_email: "agent-procurement@enterprise-ai.example.com",
      merchant_email: "sb-merchant-nexus@business.example.com",
      authorization_id: "0VF52814937998046",
      paypal_request_id: "req-ord-escrow-002",
      debug_id: "a91834c7de219",
      mode: "mirror",
      create_time: "2026-11-09T09:15:00Z",
      update_time: "2026-11-09T09:16:30Z",
      links: [
        {
          href: "https://api-m.sandbox.paypal.com/v2/checkout/orders/8HK44912PL908123B",
          rel: "self",
          method: "GET",
        },
        {
          href: "https://api-m.sandbox.paypal.com/v2/checkout/orders/8HK44912PL908123B/capture",
          rel: "capture",
          method: "POST",
        },
      ],
    },
  ],
  payouts: [
    {
      payout_batch_id: "FYXMPQTX4JC9N",
      sender_batch_id: "NEXUS_BOUNTY_BATCH_101",
      sender_item_id: "BOUNTY_ITEM_901",
      batch_status: "SUCCESS",
      recipient_type: "EMAIL",
      receiver: "sb-buyer-nexus@personal.example.com",
      amount: { currency_code: "USD", value: "25.00" },
      note: "Proof-of-Human Oracle Bounty #BOUNTY-000: Clinical Dosage Hallucination Audit (Verified by Gemini 3.8 Flash)",
      bounty_id: "BOUNTY-000",
      verification_score: 98,
      paypal_request_id: "req-payout-901",
      mode: "mirror",
      time_created: "2026-11-09T16:40:00Z",
      time_completed: "2026-11-09T16:40:05Z",
    },
  ],
  subscriptions: [
    {
      id: "I-BW452GLLEP1G",
      plan_id: "P-5ML4271244454362WXNWU5NQ",
      plan_name: "Cloud GPU Dev Tier Pro (Idle 23 Days)",
      merchant_name: "NebulaCompute Cloud Inc.",
      status: "ACTIVE",
      billing_amount: { currency_code: "USD", value: "89.00" },
      market_benchmark_amount: { currency_code: "USD", value: "29.00" },
      potential_monthly_savings: { currency_code: "USD", value: "60.00" },
      interval_unit: "MONTH",
      next_billing_time: "2026-11-14T00:00:00Z",
      ai_recommendation: "REVISE_DOWNGRADE",
      ai_rationale:
        "Zero container activity detected in 23 days. Gemini CFO recommends auto-revising via POST /v1/billing/subscriptions/I-BW452GLLEP1G/revise to Serverless Flex Plan ($29/mo), saving $720/year.",
      last_used_days_ago: 23,
      mode: "mirror",
    },
    {
      id: "I-98X11KLMNO2P",
      plan_id: "P-8AB1928374655647ZXYWV1AB",
      plan_name: "DesignSuite Team Seat (Duplicate License)",
      merchant_name: "PixelFlow Creative Ltd.",
      status: "ACTIVE",
      billing_amount: { currency_code: "USD", value: "54.00" },
      market_benchmark_amount: { currency_code: "USD", value: "0.00" },
      potential_monthly_savings: { currency_code: "USD", value: "54.00" },
      interval_unit: "MONTH",
      next_billing_time: "2026-11-16T00:00:00Z",
      ai_recommendation: "CANCEL_UNUSED",
      ai_rationale:
        "Overlaps 100% with your active Student/Startup bundle. Cancelling before Nov 16 avoids an unnecessary $54.00 recurring charge.",
      last_used_days_ago: 41,
      mode: "mirror",
    },
    {
      id: "I-77C99PLMQR8T",
      plan_id: "P-2CD9182736455463QWER12TY",
      plan_name: "Global Fiber + AI Research Feed",
      merchant_name: "AetherNet Telecom",
      status: "ACTIVE",
      billing_amount: { currency_code: "USD", value: "45.00" },
      market_benchmark_amount: { currency_code: "USD", value: "32.00" },
      potential_monthly_savings: { currency_code: "USD", value: "13.00" },
      interval_unit: "MONTH",
      next_billing_time: "2026-11-22T00:00:00Z",
      ai_recommendation: "NEGOTIATE_DISCOUNT",
      ai_rationale:
        "Competitor promotional rate is $32/mo. Nexus Buyer Agent can dispatch an automated retention offer to lock a $13/mo loyalty credit.",
      last_used_days_ago: 1,
      mode: "mirror",
    },
  ],
  invoices: [
    {
      id: "INV2-Z56S-5LLA-Q52L-CPZ5",
      invoice_number: "NEX-2026-1042",
      status: "PAID",
      recipient_name: "Apex Autonomous Systems LLC",
      recipient_email: "ap-agent@apex-systems.example.com",
      item_name: "Milestone #1: Nexus Agent Protocol Integration & Security Audit",
      amount: { currency_code: "USD", value: "1400.00" },
      due_date: "2026-11-05",
      early_payment_discount_percent: 3,
      escrow_milestone_id: "ESCROW-101",
      mode: "mirror",
      create_time: "2026-11-01T10:00:00Z",
    },
    {
      id: "INV2-X91K-8MMB-R73P-WTY9",
      invoice_number: "NEX-2026-1049",
      status: "SENT",
      recipient_name: "Helios BioAI Labs",
      recipient_email: "billing-bot@helios-bio.example.com",
      item_name: "Milestone #2: Multimodal Ground-Truth Dataset Verification (500 Samples)",
      amount: { currency_code: "USD", value: "1250.00" },
      due_date: "2026-11-18",
      early_payment_discount_percent: 2,
      escrow_milestone_id: "ESCROW-102",
      mode: "mirror",
      create_time: "2026-11-09T09:20:00Z",
    },
  ],
  disputes: [
    {
      dispute_id: "PP-D-94821",
      dispute_Transaction_id: "9LK22819MN716253P",
      reason: "MERCHANDISE_OR_SERVICE_NOT_RECEIVED",
      status: "UNDER_REVIEW",
      dispute_life_cycle_stage: "INQUIRY",
      dispute_amount: { currency_code: "USD", value: "380.00" },
      seller_response_due_date: "2026-11-19T23:59:59Z",
      tracking_attached: "DHL-9928172635-PK",
      ai_evidence_summary:
        "Gemini 4 Argon Dispute Shield attached DHL tracking #DHL-9928172635-PK via POST /v2/shipping/trackers along with cryptographic SHA-256 delivery receipt.",
      mode: "mirror",
    },
  ],
  transactions: [
    {
      transaction_id: "2GG9035941476914N",
      paypal_reference_id: "5O190127TN364715T",
      transaction_event_code: "T0006",
      event_label: "PayPal Checkout API v2 (Channel3 Deal Arbitrage)",
      engine: "AUTOPILOT_CFO",
      counterparty: "Channel3 Verified Merchant — AudioDirect US",
      amount: -228.0,
      fee_amount: 0.0,
      net_amount: -228.0,
      currency: "USD",
      status: "S",
      status_label: "SUCCESS",
      funding_source: "PayPal Wallet",
      ai_verified: true,
      ai_confidence: 99,
      initiation_date: "2026-11-08T14:22:19Z",
      mode: "mirror",
    },
    {
      transaction_id: "8XY1123498765432M",
      paypal_reference_id: "FYXMPQTX4JC9N",
      transaction_event_code: "T0001",
      event_label: "PayPal Payouts API v1 (Proof-of-Human Oracle Bounty)",
      engine: "PROOF_OF_HUMAN_BOUNTY",
      counterparty: "MedVerify AI Agent Network",
      amount: 25.0,
      fee_amount: 0.25,
      net_amount: 24.75,
      currency: "USD",
      status: "S",
      status_label: "SUCCESS",
      funding_source: "PayPal Payouts v1",
      ai_verified: true,
      ai_confidence: 98,
      initiation_date: "2026-11-09T16:40:05Z",
      mode: "mirror",
    },
    {
      transaction_id: "7AB9988776655443C",
      paypal_reference_id: "INV2-Z56S-5LLA-Q52L-CPZ5",
      transaction_event_code: "T0007",
      event_label: "PayPal Invoicing v2 + Escrow Capture",
      engine: "A2A_SMART_ESCROW",
      counterparty: "Apex Autonomous Systems LLC",
      amount: 1400.0,
      fee_amount: 41.09,
      net_amount: 1358.91,
      currency: "USD",
      status: "S",
      status_label: "SUCCESS",
      funding_source: "PayPal Orders v2 Auth",
      ai_verified: true,
      ai_confidence: 100,
      initiation_date: "2026-11-05T18:10:00Z",
      mode: "mirror",
    },
    {
      transaction_id: "0VF52814937998046",
      paypal_reference_id: "8HK44912PL908123B",
      transaction_event_code: "T0006",
      event_label: "PayPal Orders v2 AUTHORIZE Lock (Milestone #2)",
      engine: "A2A_SMART_ESCROW",
      counterparty: "Helios BioAI Labs",
      amount: 1250.0,
      fee_amount: 0.0,
      net_amount: 1250.0,
      currency: "USD",
      status: "P",
      status_label: "PENDING",
      funding_source: "PayPal Orders v2 Auth",
      ai_verified: true,
      ai_confidence: 97,
      initiation_date: "2026-11-09T09:16:30Z",
      mode: "mirror",
    },
  ],
  bounties: [
    {
      id: "BOUNTY-101",
      title: "Verify Smart-Contract Escrow Clause & Liability Shift Compliance",
      requester_agent: "LexGuard-Agent-v4 (LegalTech AI)",
      requester_org: "LexGuard Autonomous Counsel",
      category: "EXPERT_AUDIT",
      reward: { currency_code: "USD", value: "18.50" },
      estimated_seconds: 45,
      location_scope: "Global (Remote Human Judgment)",
      prompt_instructions:
        "Two autonomous procurement agents disagree on whether a 3D Secure 'liability_shift: POSSIBLE' status satisfies the cross-border buyer protection clause. Provide a verified human compliance ruling.",
      verification_criteria: [
        "Confirm whether liability_shift=POSSIBLE shifts chargeback liability to the card issuer under PSD2/3DS2 rules",
        "State whether the PayPal Orders v2 capture can proceed safely",
      ],
      sample_evidence_text:
        "Verified Human Compliance Ruling: Under PayPal 3D Secure 2.0 rules, enrollment_status='Y' and authentication_status='Y' with liability_shift='POSSIBLE' shifts fraud chargeback liability from the merchant to the card-issuing bank. Approved for immediate POST /v2/checkout/orders/{id}/capture.",
      status: "OPEN",
    },
    {
      id: "BOUNTY-102",
      title: "Physical Ground-Truth Check: Cold-Chain Pharmacy Hub Generator & Stock Status",
      requester_agent: "SupplyChain-Sentinel-09",
      requester_org: "Global Relief Logistics DAO",
      category: "PHYSICAL_GROUND_TRUTH",
      reward: { currency_code: "USD", value: "32.00" },
      estimated_seconds: 60,
      location_scope: "Islamabad / Lahore / Global Urban Nodes",
      prompt_instructions:
        "Satellite & web scraping cannot confirm whether the regional cold-storage distribution depot has active backup power and refrigerated insulin stock today. Submit a timestamped human field report or inspection log.",
      verification_criteria: [
        "Confirm cold-chain temperature reading (2°C to 8°C) and backup power status",
        "Provide inspector sign-off note for Gemini 3.8 Flash multimodal verification",
      ],
      sample_evidence_text:
        "Field Inspection Log [Timestamp: 2026-11-10T01:30+05:00]: Verified on-site at Sector I-9 Cold-Chain Hub. Digital thermometer reads 4.2°C (within 2°C–8°C threshold), solar + diesel backup online at 98% capacity, 420 units of insulin verified in Bay B.",
      status: "OPEN",
    },
    {
      id: "BOUNTY-103",
      title: "Urdu / English Financial Idiom & Cultural Nuance Calibration for Voice Agent",
      requester_agent: "BabelFin-Voice-Agent",
      requester_org: "Crescent Cross-Border Remittance Lab",
      category: "MULTILINGUAL_NUANCE",
      reward: { currency_code: "USD", value: "14.00" },
      estimated_seconds: 40,
      location_scope: "Pakistan / South Asia / Global Diaspora",
      prompt_instructions:
        "LLMs mistranslate polite Urdu family remittance phrases into overly formal legal warnings. Provide a natural, culturally empathetic bilingual phrasing for a family tuition payout notification.",
      verification_criteria: [
        "Include respectful Urdu/Roman-Urdu greeting and clear USD-to-PKR tuition confirmation",
        "Ensure warm, reassuring tone suitable for parents and students",
      ],
      sample_evidence_text:
        "Assalam-o-Alaikum! Your semester tuition support of $450.00 USD has been safely verified and dispatched via NexusPulse PayPal Payouts ('Aap ki university fee ki qist bhej di gayi hai — Allah aap ko kamyab kare').",
      status: "OPEN",
    },
    {
      id: "BOUNTY-104",
      title: "Human UI/UX Aesthetic & Trust Benchmark: Checkout Flow A vs. Flow B",
      requester_agent: "DesignCritic-Agent-Pro",
      requester_org: "NorthStar Commerce Labs",
      category: "TASTE_BENCHMARK",
      reward: { currency_code: "USD", value: "12.00" },
      estimated_seconds: 30,
      location_scope: "Global",
      prompt_instructions:
        "Evaluate whether displaying transparent PayPal Pay Later (Pay in 4) messaging above the fold increases perceived buyer trust compared to hiding installment breakdowns until the final modal.",
      verification_criteria: [
        "Explain which layout feels more trustworthy to a real human shopper and why",
        "Recommend exact placement for <paypal-message> and <paypal-button>",
      ],
      sample_evidence_text:
        "Human Taste Ruling: Flow A is markedly more trustworthy. Showing the <paypal-message> ('4 interest-free payments of $57.00') directly above the gold <paypal-button> eliminates checkout surprise and increases my willingness to complete the purchase immediately.",
      status: "OPEN",
    },
  ],
  escrowMilestones: [
    {
      id: "ESCROW-101",
      project_name: "M1: Nexus Agent Protocol & MCP Auth Gateway",
      client_agent: "Apex Autonomous Systems LLC",
      provider_name: "Hamdan Ali (AI Systems Architect)",
      provider_email: "sb-merchant-nexus@business.example.com",
      amount: { currency_code: "USD", value: "1400.00" },
      start_date: "2026-11-01",
      end_date: "2026-11-05",
      progress_percent: 100,
      status: "AI_VERIFIED_CAPTURED",
      paypal_order_id: "4AB1122334455667C",
      paypal_authorization_id: "9AUTH1122334455",
      paypal_capture_id: "7AB9988776655443C",
      tracking_number: "GIT-SHA-8f92d1a4c",
      carrier: "DHL",
      deliverable_requirement: "Deliver OAuth2 token caching + PayPal-Request-Id idempotency middleware passing 100% unit tests.",
      submitted_proof: "All 18 unit tests passing; SHA-256 commit 8f92d1a4c verified by Gemini 4 Argon.",
      ai_audit_notes: "Gemini 4 Argon verified 100% compliance with PayPal Best Practices Checklist. Capture completed.",
    },
    {
      id: "ESCROW-102",
      project_name: "M2: Multimodal Ground-Truth Dataset & Benchmark",
      client_agent: "Helios BioAI Labs",
      provider_name: "Hamdan Ali (AI Systems Architect)",
      provider_email: "sb-merchant-nexus@business.example.com",
      amount: { currency_code: "USD", value: "1250.00" },
      start_date: "2026-11-06",
      end_date: "2026-11-12",
      progress_percent: 85,
      status: "AUTHORIZED_LOCKED",
      paypal_order_id: "8HK44912PL908123B",
      paypal_authorization_id: "0VF52814937998046",
      deliverable_requirement:
        "Submit 500 verified multimodal ground-truth annotations with SHA-256 provenance manifest and shipment tracker.",
      dependencies: ["ESCROW-101"],
    },
    {
      id: "ESCROW-103",
      project_name: "M3: Production Agentic Commerce Store Sync Rollout",
      client_agent: "Global Direct Brands Collective",
      provider_name: "Hamdan Ali (AI Systems Architect)",
      provider_email: "sb-merchant-nexus@business.example.com",
      amount: { currency_code: "USD", value: "800.00" },
      start_date: "2026-11-11",
      end_date: "2026-11-18",
      progress_percent: 40,
      status: "AUTHORIZED_LOCKED",
      paypal_order_id: "2XY8877665544332Z",
      paypal_authorization_id: "5AUTH9988776655",
      deliverable_requirement:
        "Deploy /checkout_sessions ACP endpoint with delegated payment token handler and PayPal webhook signature verification.",
      dependencies: ["ESCROW-102"],
    },
  ],
  channel3Deals: [
    {
      id: "C3-PROD-9001",
      title: "NVIDIA Jetson Orin Nano Super Developer Kit (8GB)",
      brand: "NVIDIA",
      category: "Edge AI Hardware",
      sku: "NV-ORIN-SUPER-8G",
      retail_price: 249.0,
      channel3_best_price: 189.0,
      target_mandate_price: 199.0,
      savings_amount: 60.0,
      savings_percent: 24.1,
      currency: "USD",
      merchant_name: "Channel3 Verified: SiliconMicro Direct",
      in_stock: true,
      rating: 4.9,
      review_count: 1420,
      bnpl_eligible: true,
      bnpl_installment_monthly: 47.25,
      mandate_status: "TARGET_MET_READY",
      ai_price_prediction:
        "Channel3 API shows price dropped $10 below your $199 mandate 14 minutes ago. Inventory is low (7 units). Gemini recommends immediate PayPal v6 checkout.",
    },
    {
      id: "C3-PROD-9002",
      title: "Apple MacBook Air 15-inch (M4 Chip, 24GB Unified Memory, 512GB SSD)",
      brand: "Apple",
      category: "Workstation Laptops",
      sku: "APL-MBA15-M4-24-512",
      retail_price: 1499.0,
      channel3_best_price: 1279.0,
      target_mandate_price: 1300.0,
      savings_amount: 220.0,
      savings_percent: 14.7,
      currency: "USD",
      merchant_name: "Channel3 Verified: B&H Authorized Reseller",
      in_stock: true,
      rating: 4.95,
      review_count: 890,
      bnpl_eligible: true,
      bnpl_installment_monthly: 106.58,
      mandate_status: "TARGET_MET_READY",
      ai_price_prediction:
        "Matches your <$1,300 budget mandate! Eligible for PayPal Pay Monthly ($106.58/mo) or instant PayPal Checkout.",
    },
    {
      id: "C3-PROD-9003",
      title: "Keychron Q1 Max QMK/VIA Wireless Custom Mechanical Keyboard",
      brand: "Keychron",
      category: "Developer Peripherals",
      sku: "KC-Q1MAX-BANA",
      retail_price: 229.0,
      channel3_best_price: 174.0,
      target_mandate_price: 180.0,
      savings_amount: 55.0,
      savings_percent: 24.0,
      currency: "USD",
      merchant_name: "Channel3 Verified: MechKeys Global",
      in_stock: true,
      rating: 4.8,
      review_count: 640,
      bnpl_eligible: true,
      bnpl_installment_monthly: 43.5,
      mandate_status: "TARGET_MET_READY",
      ai_price_prediction:
        "Lowest 90-day price across 14 merchants indexed by Channel3. Qualifies for PayPal Pay in 4 ($43.50 x 4).",
    },
    {
      id: "C3-PROD-9004",
      title: "Sony WH-1000XM5 Wireless Noise Canceling Headphones",
      brand: "Sony",
      category: "Pro Audio",
      sku: "SNY-WH1000XM5-BLK",
      retail_price: 399.99,
      channel3_best_price: 228.0,
      target_mandate_price: 250.0,
      savings_amount: 171.99,
      savings_percent: 43.0,
      currency: "USD",
      merchant_name: "Channel3 Verified: AudioDirect US",
      in_stock: true,
      rating: 4.85,
      review_count: 5310,
      bnpl_eligible: true,
      bnpl_installment_monthly: 57.0,
      mandate_status: "PURCHASED_VIA_PAYPAL",
      paypal_order_id: "5O190127TN364715T",
      ai_price_prediction: "Autonomously executed via PayPal Order #5O190127TN364715T ($171.99 saved).",
    },
  ],
  webhookEvents: [
    {
      id: "WH-2WR32451HC0233532-67976317FL4543714",
      event_type: "PAYMENT.CAPTURE.COMPLETED",
      resource_id: "2GG9035941476914N",
      summary: "Payment capture of $228.00 USD completed for Order 5O190127TN364715T",
      verification_status: "SUCCESS",
      created_at: "2026-11-08T14:22:20Z",
    },
    {
      id: "WH-9KL88123BC9911223-11223344XY9876543",
      event_type: "PAYMENT.PAYOUTS-ITEM.SUCCEEDED",
      resource_id: "FYXMPQTX4JC9N",
      summary: "Proof-of-Human Oracle Bounty payout of $25.00 USD succeeded",
      verification_status: "SUCCESS",
      created_at: "2026-11-09T16:40:06Z",
    },
  ],
};

// Keep singleton state in globalThis so Next.js hot-reloads and route handlers share live state
const globalForNexus = globalThis as unknown as {
  __nexusPulseState?: NexusPulseState;
};

export function getMirrorState(): NexusPulseState {
  if (!globalForNexus.__nexusPulseState) {
    globalForNexus.__nexusPulseState = structuredClone(INITIAL_STATE);
  }
  return globalForNexus.__nexusPulseState;
}

export function hydrateMirrorState(externalState: NexusPulseState): NexusPulseState {
  globalForNexus.__nexusPulseState = structuredClone(externalState);
  return globalForNexus.__nexusPulseState;
}

export function resetMirrorState(): NexusPulseState {
  globalForNexus.__nexusPulseState = structuredClone(INITIAL_STATE);
  return globalForNexus.__nexusPulseState;
}

export function generatePayPalId(prefix = ""): string {
  const chars = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let out = prefix;
  const targetLen = 17 - prefix.length;
  for (let i = 0; i < targetLen; i++) {
    out += chars[crypto.randomInt(0, chars.length)];
  }
  return out;
}

export function mirrorCreateOrder(params: {
  amountValue: string;
  currencyCode?: string;
  intent?: "CAPTURE" | "AUTHORIZE";
  description: string;
  category?: PayPalOrderRecord["category"];
  fundingSource?: PayPalOrderRecord["funding_source"];
  paypalRequestId?: string;
  mode?: PayPalExecutionMode;
}): PayPalOrderRecord {
  const state = getMirrorState();
  const id = generatePayPalId("9NP");
  const now = new Date().toISOString();
  const intent = params.intent ?? "CAPTURE";
  const reqId = params.paypalRequestId ?? `req-${crypto.randomUUID()}`;
  const order: PayPalOrderRecord = {
    id,
    intent,
    status: "CREATED",
    amount: {
      currency_code: params.currencyCode ?? "USD",
      value: Number(params.amountValue).toFixed(2),
    },
    description: params.description,
    category: params.category ?? "DIRECT_CHECKOUT",
    funding_source: params.fundingSource ?? "paypal",
    payer_email: process.env.PAYPAL_SANDBOX_BUYER_EMAIL ?? "sb-buyer-nexus@personal.example.com",
    merchant_email: process.env.PAYPAL_SANDBOX_MERCHANT_EMAIL ?? "sb-merchant-nexus@business.example.com",
    paypal_request_id: reqId,
    debug_id: crypto.randomBytes(6).toString("hex"),
    mode: params.mode ?? "mirror",
    create_time: now,
    update_time: now,
    links: [
      {
        href: `https://api-m.sandbox.paypal.com/v2/checkout/orders/${id}`,
        rel: "self",
        method: "GET",
      },
      {
        href: `https://www.sandbox.paypal.com/checkoutnow?token=${id}`,
        rel: "approve",
        method: "GET",
      },
      {
        href: `https://api-m.sandbox.paypal.com/v2/checkout/orders/${id}/${intent === "AUTHORIZE" ? "authorize" : "capture"}`,
        rel: intent === "AUTHORIZE" ? "authorize" : "capture",
        method: "POST",
      },
    ],
  };

  state.orders.unshift(order);
  return order;
}

export function mirrorCaptureOrAuthorizeOrder(params: {
  orderId: string;
  action?: "CAPTURE" | "AUTHORIZE";
  fundingSource?: PayPalOrderRecord["funding_source"];
  channel3DealId?: string;
  escrowMilestoneId?: string;
  trackingNumber?: string;
  carrier?: string;
  mode?: PayPalExecutionMode;
}): PayPalOrderRecord {
  const state = getMirrorState();
  let order = state.orders.find((o) => o.id === params.orderId);
  const now = new Date().toISOString();

  if (!order) {
    order = mirrorCreateOrder({
      amountValue: "99.00",
      description: `PayPal Order ${params.orderId}`,
      mode: params.mode ?? "mirror",
    });
    order.id = params.orderId;
  }

  const action = params.action ?? order.intent;
  if (params.fundingSource) {
    order.funding_source = params.fundingSource;
  }

  if (action === "AUTHORIZE" && order.status === "CREATED") {
    order.status = "APPROVED";
    order.authorization_id = generatePayPalId("0AU");
    order.update_time = now;
  } else {
    order.status = "COMPLETED";
    order.capture_id = generatePayPalId("2CP");
    order.update_time = now;
    if (params.trackingNumber) {
      order.tracking_number = params.trackingNumber;
      order.carrier = params.carrier ?? "DHL";
    }
  }

  const numericAmount = Number(order.amount.value);

  // If linked to a Channel3 deal, mark it purchased and add savings
  if (params.channel3DealId) {
    const deal = state.channel3Deals.find((d) => d.id === params.channel3DealId);
    if (deal && deal.mandate_status !== "PURCHASED_VIA_PAYPAL") {
      deal.mandate_status = "PURCHASED_VIA_PAYPAL";
      deal.paypal_order_id = order.id;
      state.totalSavedByAiUsd = Number((state.totalSavedByAiUsd + deal.savings_amount).toFixed(2));
      state.walletBalanceUsd = Number((state.walletBalanceUsd - numericAmount).toFixed(2));
    }
  }

  // If linked to an Escrow milestone, update the milestone status
  if (params.escrowMilestoneId) {
    const ms = state.escrowMilestones.find((m) => m.id === params.escrowMilestoneId);
    if (ms) {
      ms.status = "AI_VERIFIED_CAPTURED";
      ms.progress_percent = 100;
      ms.paypal_capture_id = order.capture_id;
      if (params.trackingNumber) {
        ms.tracking_number = params.trackingNumber;
        ms.carrier = params.carrier ?? "DHL";
      }
      state.walletBalanceUsd = Number((state.walletBalanceUsd + numericAmount).toFixed(2));
    }
  }

  const fundingLabel =
    order.funding_source === "venmo"
      ? "Pay with Venmo"
      : order.funding_source === "paylater"
        ? "PayPal Pay Later (BNPL)"
        : order.category === "ESCROW_MILESTONE"
          ? "PayPal Orders v2 Auth"
          : "PayPal Wallet";

  state.transactions.unshift({
    transaction_id: order.capture_id ?? order.authorization_id ?? generatePayPalId("TX"),
    paypal_reference_id: order.id,
    transaction_event_code: order.category === "ESCROW_MILESTONE" ? "T0007" : "T0006",
    event_label: `${order.description.slice(0, 68)}`,
    engine: order.category === "ESCROW_MILESTONE" ? "A2A_SMART_ESCROW" : "AUTOPILOT_CFO",
    counterparty:
      order.category === "ESCROW_MILESTONE" ? "Verified Escrow Client Agent" : "Channel3 Verified Merchant",
    amount: order.category === "ESCROW_MILESTONE" ? numericAmount : -numericAmount,
    fee_amount: order.category === "ESCROW_MILESTONE" ? Number((numericAmount * 0.029).toFixed(2)) : 0,
    net_amount:
      order.category === "ESCROW_MILESTONE"
        ? Number((numericAmount * 0.971).toFixed(2))
        : -numericAmount,
    currency: order.amount.currency_code,
    status: order.status === "COMPLETED" ? "S" : "P",
    status_label: order.status === "COMPLETED" ? "SUCCESS" : "PENDING",
    funding_source: fundingLabel,
    ai_verified: true,
    ai_confidence: 99,
    initiation_date: now,
    mode: params.mode ?? order.mode,
  });

  state.webhookEvents.unshift({
    id: `WH-${generatePayPalId("")}`,
    event_type:
      order.status === "COMPLETED" ? "PAYMENT.CAPTURE.COMPLETED" : "CHECKOUT.ORDER.APPROVED",
    resource_id: order.capture_id ?? order.id,
    summary: `${order.status === "COMPLETED" ? "Captured" : "Authorized"} $${order.amount.value} USD for Order ${order.id}`,
    verification_status: "SUCCESS",
    created_at: now,
  });

  return order;
}

export function mirrorCreatePayout(params: {
  receiver: string;
  amountValue: string;
  currencyCode?: string;
  recipientType?: "EMAIL" | "VENMO_HANDLE" | "PAYPAL_ID";
  note: string;
  bountyId?: string;
  verificationScore?: number;
  geminiReasoning?: string;
  geminiModel?: string;
  mode?: PayPalExecutionMode;
}): PayPalPayoutRecord {
  const state = getMirrorState();
  const now = new Date().toISOString();
  const batchId = generatePayPalId("PYB");
  const numericAmount = Number(params.amountValue);

  const payout: PayPalPayoutRecord = {
    payout_batch_id: batchId,
    sender_batch_id: `NEXUS_BATCH_${Date.now()}`,
    sender_item_id: `ITEM_${crypto.randomUUID().slice(0, 8)}`,
    batch_status: "SUCCESS",
    recipient_type: params.recipientType ?? "EMAIL",
    receiver: params.receiver,
    amount: {
      currency_code: params.currencyCode ?? "USD",
      value: numericAmount.toFixed(2),
    },
    note: params.note,
    bounty_id: params.bountyId,
    verification_score: params.verificationScore ?? 98,
    paypal_request_id: `req-payout-${crypto.randomUUID()}`,
    mode: params.mode ?? "mirror",
    time_created: now,
    time_completed: now,
  };

  state.payouts.unshift(payout);
  state.walletBalanceUsd = Number((state.walletBalanceUsd + numericAmount).toFixed(2));
  state.totalEarnedFromBountiesUsd = Number((state.totalEarnedFromBountiesUsd + numericAmount).toFixed(2));

  if (params.bountyId) {
    const bounty = state.bounties.find((b) => b.id === params.bountyId);
    if (bounty) {
      bounty.status = "PAID_OUT";
      bounty.payout_batch_id = batchId;
      bounty.verification_result = {
        passed: true,
        score: params.verificationScore ?? 98,
        gemini_model: params.geminiModel ?? "gemini-3.8-flash",
        reasoning:
          params.geminiReasoning ??
          "Human ground-truth submission passed multimodal authenticity and semantic verification checks.",
        verified_at: now,
      };
    }
  }

  state.transactions.unshift({
    transaction_id: generatePayPalId("0PY"),
    paypal_reference_id: batchId,
    transaction_event_code: "T0001",
    event_label: `PayPal Payouts v1: ${params.note.slice(0, 56)}`,
    engine: "PROOF_OF_HUMAN_BOUNTY",
    counterparty: params.bountyId ? `AI Bounty #${params.bountyId}` : params.receiver,
    amount: numericAmount,
    fee_amount: 0.25,
    net_amount: Number((numericAmount - 0.25).toFixed(2)),
    currency: params.currencyCode ?? "USD",
    status: "S",
    status_label: "SUCCESS",
    funding_source: "PayPal Payouts v1",
    ai_verified: true,
    ai_confidence: params.verificationScore ?? 98,
    initiation_date: now,
    mode: params.mode ?? "mirror",
  });

  state.webhookEvents.unshift({
    id: `WH-${generatePayPalId("")}`,
    event_type: "PAYMENT.PAYOUTS-ITEM.SUCCEEDED",
    resource_id: batchId,
    summary: `Dispatched instant PayPal Payout of $${numericAmount.toFixed(2)} USD to ${params.receiver}`,
    verification_status: "SUCCESS",
    created_at: now,
  });

  return payout;
}

export function mirrorOptimizeSubscription(params: {
  subscriptionId: string;
  action: "REVISE_DOWNGRADE" | "CANCEL_UNUSED" | "NEGOTIATE_DISCOUNT";
  mode?: PayPalExecutionMode;
}): { subscription: PayPalSubscriptionRecord; monthlySaved: number; annualSaved: number } {
  const state = getMirrorState();
  const sub = state.subscriptions.find((s) => s.id === params.subscriptionId);
  if (!sub) {
    throw new Error(`Subscription ${params.subscriptionId} not found`);
  }

  const savings = Number(sub.potential_monthly_savings.value);
  const now = new Date().toISOString();

  if (params.action === "CANCEL_UNUSED") {
    sub.status = "CANCELLED";
    sub.billing_amount.value = "0.00";
  } else {
    sub.billing_amount.value = sub.market_benchmark_amount.value;
    sub.potential_monthly_savings.value = "0.00";
  }

  state.totalSavedByAiUsd = Number((state.totalSavedByAiUsd + savings).toFixed(2));

  state.transactions.unshift({
    transaction_id: generatePayPalId("SUB"),
    paypal_reference_id: sub.id,
    transaction_event_code: "T0002",
    event_label: `AI Subscription Guard (${params.action}): ${sub.plan_name}`,
    engine: "SUBSCRIPTION_GUARD",
    counterparty: sub.merchant_name,
    amount: savings,
    fee_amount: 0,
    net_amount: savings,
    currency: "USD",
    status: "S",
    status_label: "SUCCESS",
    funding_source: "PayPal Wallet",
    ai_verified: true,
    ai_confidence: 99,
    initiation_date: now,
    mode: params.mode ?? "mirror",
  });

  state.webhookEvents.unshift({
    id: `WH-${generatePayPalId("")}`,
    event_type:
      params.action === "CANCEL_UNUSED"
        ? "BILLING.SUBSCRIPTION.CANCELLED"
        : "BILLING.SUBSCRIPTION.UPDATED",
    resource_id: sub.id,
    summary: `Subscription ${sub.id} (${sub.merchant_name}) optimized via ${params.action} — saving $${savings.toFixed(2)}/mo`,
    verification_status: "SUCCESS",
    created_at: now,
  });

  return {
    subscription: sub,
    monthlySaved: savings,
    annualSaved: Number((savings * 12).toFixed(2)),
  };
}
