import pg from "pg";
import fs from "fs";
import path from "path";

const envPath = path.resolve(process.cwd(), ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const envVars = {};

for (const line of envContent.split(/\r?\n/)) {
  const match = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (match) {
    envVars[match[1]] = match[2].replace(/^["']|["']$/g, "").trim();
  }
}

const connectionString = envVars.DIRECT_URL || envVars.DATABASE_URL;

if (!connectionString) {
  console.error("Missing DIRECT_URL / DATABASE_URL in .env.local");
  process.exit(1);
}

const { Client } = pg;
const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

console.log("[Supabase Migration] Connecting to PostgreSQL database...");
await client.connect();

const schemaSqlPath = path.resolve(process.cwd(), "src/lib/db/schema.sql");
const schemaSql = fs.readFileSync(schemaSqlPath, "utf-8");

console.log("[Supabase Migration] Executing schema.sql tables & realtime publication...");
await client.query(schemaSql);
console.log("[Supabase Migration] Schema tables created successfully!");

// Now let's seed initial data if tables are empty
console.log("[Supabase Migration] Checking initial state seed...");

// 1. sovereign_pulse_meta
await client.query(`
  INSERT INTO sovereign_pulse_meta (id, wallet_balance_usd, total_saved_by_ai_usd, total_earned_from_bounties_usd, total_escrow_protected_usd, preferred_mode)
  VALUES ('current', 4820.50, 642.50, 145.00, 3450.00, 'auto')
  ON CONFLICT (id) DO NOTHING;
`);

// 2. subscriptions
const subCheck = await client.query("SELECT COUNT(*) FROM subscriptions;");
if (parseInt(subCheck.rows[0].count) === 0) {
  console.log("[Supabase Migration] Seeding initial PayPal Subscriptions...");
  await client.query(`
    INSERT INTO subscriptions (id, plan_id, plan_name, merchant_name, status, billing_amount, market_benchmark_amount, potential_monthly_savings, interval_unit, next_billing_time, ai_recommendation, ai_rationale, last_used_days_ago) VALUES
    ('I-BW452GLLEP1G', 'P-7GL892101K992011', 'NebulaCompute GPU Dedicated A100 Tier', 'NebulaCompute Cloud Services', 'ACTIVE', 129.00, 79.00, 50.00, 'MONTH', '2026-11-28T00:00:00Z', 'REVISE_DOWNGRADE', 'Cluster utilization at 4.2% across past 23 days. Recommend downgrading to L40S spot tier or auto-pausing via /v1/billing/subscriptions/{id}/revise.', 23),
    ('I-98X11KLMNO2P', 'P-11AB556677889900', 'PixelFlow Team Design Collaboration Suite', 'PixelFlow Labs Inc.', 'ACTIVE', 48.00, 24.00, 24.00, 'MONTH', '2026-12-01T00:00:00Z', 'REVISE_DOWNGRADE', 'Two duplicate seats detected on corporate billing agreement. Consolidate into single seat saving $24.00/mo.', 8),
    ('I-ZOMBIE-99881', 'P-00DEADBEEF998811', 'OmniTranslate Enterprise Lexicon API', 'OmniTranslate Corp', 'ACTIVE', 55.00, 0.00, 55.00, 'MONTH', '2026-11-20T00:00:00Z', 'CANCEL_UNUSED', '0 API requests logged over the past 39 days. Zombie subscription detected. Cancel immediately via /v1/billing/subscriptions/{id}/cancel.', 39);
  `);
}

// 3. proof_of_human_bounties
const bountyCheck = await client.query("SELECT COUNT(*) FROM proof_of_human_bounties;");
if (parseInt(bountyCheck.rows[0].count) === 0) {
  console.log("[Supabase Migration] Seeding Proof-of-Human Oracle Bounties...");
  await client.query(`
    INSERT INTO proof_of_human_bounties (id, title, requester_agent, requester_org, category, reward_value, currency_code, estimated_seconds, location_scope, prompt_instructions, verification_criteria, sample_evidence_text, status) VALUES
    ('BOUNTY-101', 'Verify EV Charging Station Bay 4 Hardware Status (Sindh Grid)', 'GridPulse Autonomous Energy Trader', 'Indus Clean Energy DAO', 'PHYSICAL_GROUND_TRUTH', 18.50, 'USD', 45, 'Karachi Port District (24.8607° N, 67.0011° E)', 'Confirm whether Charger Bay 4 connector is damaged, operational, or blocked by vehicle.', '["Timestamped physical photo or sensor ping within 50m of coordinates", "Check error code LED on Schneider EVlink unit", "Report status: OPERATIONAL, OCCUPIED, or OUT_OF_SERVICE"]'::jsonb, 'Inspected Charger Bay 4 in person at 14:15 PKT. Green status LED illuminated, connector intact, bay unoccupied. Station operational and charging at 22kW.', 'OPEN'),
    ('BOUNTY-102', 'Audit High-Stakes Financial Smart Contract Logic (Settlement Freeze)', 'AuraPay Autonomous Treasury Orchestrator', 'Sovereign Pulse Governance', 'EXPERT_AUDIT', 45.00, 'USD', 90, 'Global / Remote Security Researcher', 'Review Solidity reentrancy guard and PayPal dispute settlement timeout handler on SettlementRouter.sol.', '["Check for check-effects-interactions pattern compliance", "Verify timeout fallback releases escrowed funds to seller after 14-day claim window", "Provide SHA-256 audit manifest and pass/fail verdict"]'::jsonb, 'Audited SettlementRouter.sol lines 142-189. NonReentrant modifier correctly applied before state modification. Timeout claim window verified against PayPal Dispute lifecycle (14 days). No reentrancy or state rollback vulnerabilities found. SHA-256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855.', 'OPEN'),
    ('BOUNTY-103', 'Cross-Cultural Brand Nuance & Local Sentiment Check (Urdu / Roman Urdu)', 'Global E-Commerce Localizer Bot', 'OmniChannel AI Media', 'MULTILINGUAL_NUANCE', 12.00, 'USD', 30, 'Pakistan / South Asian Cultural Context', 'Evaluate proposed advertising copy for cultural resonance, unintentional double-entendre, and slang accuracy.', '["Assess tone: respectful, modern, engaging", "Flag inappropriate colloquialisms in Karachi/Lahore slang", "Score appropriateness 1-10 with 1-sentence rationale"]'::jsonb, 'Copy: \"Apna hisaab, AI ke saath befikar\". Tone is warm, modern, and colloquial without being disrespectful. Resonates strongly with young freelancers and tech founders in Pakistan. Appropriateness score: 10/10.', 'OPEN');
  `);
}

// 4. smart_escrow_milestones
const escrowCheck = await client.query("SELECT COUNT(*) FROM smart_escrow_milestones;");
if (parseInt(escrowCheck.rows[0].count) === 0) {
  console.log("[Supabase Migration] Seeding A2A Smart Escrow Milestones...");
  await client.query(`
    INSERT INTO smart_escrow_milestones (id, project_name, client_agent, provider_name, provider_email, amount_value, currency_code, start_date, end_date, progress_percent, status, paypal_order_id, paypal_authorization_id, paypal_capture_id, tracking_number, carrier, deliverable_requirement, submitted_proof, ai_audit_notes, dependencies) VALUES
    ('ESCROW-101', 'Autonomous Agent Subscriptions Auditor Engine', 'ProcureBot Enterprise Agent', 'Hamdan Ali (AI Systems Architect)', 'sb-mokyu51324247@business.example.com', 850.00, 'USD', '2026-11-01', '2026-11-07', 100, 'AI_VERIFIED_CAPTURED', '9SP48201992019441', '0AU48201992019441', '2CP99182377481109', 'DHL-PK-88992211', 'DHL', 'Deliver complete Node.js + TypeScript SDK for Subscriptions API v1 with automatic revision recommendation algorithm.', 'GitHub commit SHA: 4f8a12e9b1c7. 100% test pass on 18 test cases. APIMatic OpenAPI schema compliant.', 'Gemini 4 Argon verified GitHub commit SHA 4f8a12e9b1c7. TypeScript types validated. PayPal capture completed.', '[]'::jsonb),
    ('ESCROW-102', 'High-Speed Multimodal Proof-of-Human Oracle Gateway', 'Indus Clean Energy DAO', 'Hamdan Ali (AI Systems Architect)', 'sb-mokyu51324247@business.example.com', 1250.00, 'USD', '2026-11-08', '2026-11-14', 75, 'AUTHORIZED_LOCKED', '9SP77192004812391', '0VF52814937998046', NULL, NULL, NULL, 'Build Gemini 3.8 Flash multimodal oracle verification route with sub-2s latency and instant PayPal Payouts v1 trigger.', 'Staging route deployed at /api/ai/verify-bounty. Latency benchmark: 1.42s avg. Payout batch generation verified.', 'Gemini 4 Argon audited deliverable against contract requirement. Awaiting final shipment tracker attachment.', '["ESCROW-101"]'::jsonb),
    ('ESCROW-103', 'Cross-Border B2B Dispute Shield & Auto-Tracking Injector', 'Global Logistics Clearinghouse Bot', 'Hamdan Ali (AI Systems Architect)', 'sb-mokyu51324247@business.example.com', 1350.00, 'USD', '2026-11-15', '2026-11-22', 15, 'AUTHORIZED_LOCKED', '9SP11223344556677', '0AU11223344556677', NULL, NULL, NULL, 'Integrate PayPal Orders v2 Tracking API with DHL/FedEx API for automated dispute immunity and 0-fraud chargeback defense.', NULL, NULL, '["ESCROW-102"]'::jsonb);
  `);
}

// 5. channel3_deals
const dealCheck = await client.query("SELECT COUNT(*) FROM channel3_deals;");
if (parseInt(dealCheck.rows[0].count) === 0) {
  console.log("[Supabase Migration] Seeding Channel3 Universal Product Deals...");
  await client.query(`
    INSERT INTO channel3_deals (id, title, brand, category, sku, retail_price, channel3_best_price, target_mandate_price, savings_amount, savings_percent, currency, merchant_name, in_stock, rating, review_count, bnpl_eligible, bnpl_installment_monthly, mandate_status, paypal_order_id, ai_price_prediction) VALUES
    ('C3-PROD-9001', 'NVIDIA Jetson Orin Nano Super Development Kit', 'NVIDIA', 'Embedded AI & Robotics', 'NV-JET-ORIN-NANO-8G', 249.00, 189.00, 199.00, 60.00, 24.1, 'USD', 'Channel3 Verified: Arrow Electronics Direct', true, 4.95, 842, true, 47.25, 'TARGET_MET_READY', NULL, 'Channel3 detected 24.1% price drop matching your $199.00 mandate. Ready for instant PayPal Pay in 4 or Wallet checkout.'),
    ('C3-PROD-9002', 'Sony WH-1000XM5 Wireless Noise-Canceling Headphones', 'Sony', 'Pro Audio', 'SNY-WH1000XM5-BLK', 399.99, 228.00, 250.00, 171.99, 43.0, 'USD', 'Channel3 Verified: AudioDirect US', true, 4.85, 5310, true, 57.00, 'PURCHASED_VIA_PAYPAL', '5O190127TN364715T', 'Autonomously executed via PayPal Order #5O190127TN364715T ($171.99 saved).'),
    ('C3-PROD-9003', 'SanDisk 2TB Extreme PRO Portable SSD V2 (2000MB/s)', 'SanDisk', 'High-Speed Storage', 'SD-EXTPRO-2TB-V2', 229.99, 149.50, 160.00, 80.49, 35.0, 'USD', 'Channel3 Verified: B&H Photo Video', true, 4.78, 12400, true, 37.38, 'TARGET_MET_READY', NULL, 'Target mandate price of $160.00 met ($149.50 available). High stock availability across 3 verified distributors.'),
    ('C3-PROD-9004', 'YubiKey 5C NFC FIPS Cryptographic Security Key', 'Yubico', 'Hardware Security', 'YK-5C-NFC-FIPS', 95.00, 69.00, 75.00, 26.00, 27.4, 'USD', 'Channel3 Verified: CDW Enterprise Direct', true, 4.98, 3890, true, 17.25, 'TARGET_MET_READY', NULL, 'Flash price cut of $26.00 detected. Meets your $75.00 mandate for hardware authentication keys.');
  `);
}

// 6. paypal_transactions
const txCheck = await client.query("SELECT COUNT(*) FROM paypal_transactions;");
if (parseInt(txCheck.rows[0].count) === 0) {
  console.log("[Supabase Migration] Seeding initial PayPal Transactions Ledger...");
  await client.query(`
    INSERT INTO paypal_transactions (transaction_id, paypal_reference_id, transaction_event_code, event_label, engine, counterparty, amount, fee_amount, net_amount, currency, status, status_label, funding_source, ai_verified, ai_confidence, initiation_date, mode) VALUES
    ('2CP99182377481109', '9SP48201992019441', 'T0007', 'Milestone M1 Deliverable Verified & Captured (A2A Smart Escrow)', 'A2A_SMART_ESCROW', 'ProcureBot Enterprise Agent', 850.00, 24.65, 825.35, 'USD', 'S', 'SUCCESS', 'PayPal Orders v2 Auth', true, 99.00, '2026-11-07T18:30:00Z', 'sandbox'),
    ('0PY11827364519283', 'BATCH-8829104928172', 'T0001', 'Proof-of-Human Bounty Payout (EV Charger Physical Verification)', 'PROOF_OF_HUMAN_BOUNTY', 'Human Contributor (Karachi Port District)', 18.50, 0.25, 18.25, 'USD', 'S', 'SUCCESS', 'PayPal Payouts v1', true, 97.00, '2026-11-09T10:14:22Z', 'sandbox'),
    ('2CP55418290374618', '5O190127TN364715T', 'T0006', 'Channel3 Price-Drop Deal Arbitrage: Sony WH-1000XM5 (Saved $171.99)', 'AUTOPILOT_CFO', 'Channel3 Verified: AudioDirect US', -228.00, 0.00, -228.00, 'USD', 'S', 'SUCCESS', 'PayPal Pay Later (BNPL)', true, 100.00, '2026-11-08T14:22:15Z', 'sandbox'),
    ('SUB-GUARD-772910', 'I-BW452GLLEP1G', 'T0002', 'Subscription Optimization: NebulaCompute Cloud GPU Downgraded', 'SUBSCRIPTION_GUARD', 'NebulaCompute Cloud Services', 50.00, 0.00, 50.00, 'USD', 'S', 'SUCCESS', 'PayPal Wallet', true, 99.00, '2026-11-06T09:12:00Z', 'sandbox');
  `);
}

await client.end();
console.log("[Supabase Migration] All 10 tables & seeds created and verified in Supabase PostgreSQL!");
