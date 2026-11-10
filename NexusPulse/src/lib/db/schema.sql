-- ==============================================================================
-- Sovereign Pulse (AuraPay) — Supabase PostgreSQL Database Schema
-- Built for PayPal AI Hackathon ("Build What's Next with PayPal and AI")
-- ==============================================================================

-- Enable UUID and JSONB extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Sovereign Pulse Metadata & Global Telemetry
CREATE TABLE IF NOT EXISTS sovereign_pulse_meta (
    id TEXT PRIMARY KEY DEFAULT 'current',
    wallet_balance_usd NUMERIC(12,2) NOT NULL DEFAULT 4820.50,
    total_saved_by_ai_usd NUMERIC(12,2) NOT NULL DEFAULT 642.50,
    total_earned_from_bounties_usd NUMERIC(12,2) NOT NULL DEFAULT 145.00,
    total_escrow_protected_usd NUMERIC(12,2) NOT NULL DEFAULT 3450.00,
    preferred_mode TEXT NOT NULL DEFAULT 'auto',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. PayPal Transactions Ledger (Reporting API /v1/reporting/transactions)
CREATE TABLE IF NOT EXISTS paypal_transactions (
    transaction_id TEXT PRIMARY KEY,
    paypal_reference_id TEXT,
    transaction_event_code TEXT NOT NULL,
    event_label TEXT NOT NULL,
    engine TEXT NOT NULL,
    counterparty TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    fee_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    net_amount NUMERIC(12,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'S',
    status_label TEXT NOT NULL DEFAULT 'SUCCESS',
    funding_source TEXT NOT NULL,
    ai_verified BOOLEAN NOT NULL DEFAULT true,
    ai_confidence NUMERIC(5,2) NOT NULL DEFAULT 98.00,
    initiation_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    mode TEXT NOT NULL DEFAULT 'sandbox',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. PayPal Orders v2 (/v2/checkout/orders)
CREATE TABLE IF NOT EXISTS paypal_orders (
    id TEXT PRIMARY KEY,
    intent TEXT NOT NULL DEFAULT 'CAPTURE',
    status TEXT NOT NULL DEFAULT 'CREATED',
    amount_value NUMERIC(12,2) NOT NULL,
    currency_code TEXT NOT NULL DEFAULT 'USD',
    description TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'DIRECT_CHECKOUT',
    funding_source TEXT NOT NULL DEFAULT 'paypal',
    payer_email TEXT,
    merchant_email TEXT,
    authorization_id TEXT,
    capture_id TEXT,
    tracking_number TEXT,
    carrier TEXT,
    paypal_request_id TEXT NOT NULL,
    debug_id TEXT,
    mode TEXT NOT NULL DEFAULT 'sandbox',
    create_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    update_time TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. PayPal Payouts v1 (/v1/payments/payouts)
CREATE TABLE IF NOT EXISTS paypal_payouts (
    payout_batch_id TEXT PRIMARY KEY,
    sender_batch_id TEXT NOT NULL,
    sender_item_id TEXT NOT NULL,
    batch_status TEXT NOT NULL DEFAULT 'SUCCESS',
    recipient_type TEXT NOT NULL DEFAULT 'EMAIL',
    receiver TEXT NOT NULL,
    amount_value NUMERIC(12,2) NOT NULL,
    currency_code TEXT NOT NULL DEFAULT 'USD',
    note TEXT NOT NULL,
    bounty_id TEXT,
    verification_score NUMERIC(5,2),
    paypal_request_id TEXT NOT NULL,
    mode TEXT NOT NULL DEFAULT 'sandbox',
    time_created TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. PayPal Subscriptions v1 (/v1/billing/subscriptions)
CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    plan_id TEXT NOT NULL,
    plan_name TEXT NOT NULL,
    merchant_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    billing_amount NUMERIC(12,2) NOT NULL,
    market_benchmark_amount NUMERIC(12,2) NOT NULL,
    potential_monthly_savings NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    interval_unit TEXT NOT NULL DEFAULT 'MONTH',
    next_billing_time TIMESTAMPTZ NOT NULL,
    ai_recommendation TEXT NOT NULL DEFAULT 'KEEP',
    ai_rationale TEXT NOT NULL,
    last_used_days_ago INTEGER NOT NULL DEFAULT 0,
    mode TEXT NOT NULL DEFAULT 'sandbox',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Proof-of-Human Oracle Micro-Bounties
CREATE TABLE IF NOT EXISTS proof_of_human_bounties (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    requester_agent TEXT NOT NULL,
    requester_org TEXT NOT NULL,
    category TEXT NOT NULL,
    reward_value NUMERIC(12,2) NOT NULL,
    currency_code TEXT NOT NULL DEFAULT 'USD',
    estimated_seconds INTEGER NOT NULL DEFAULT 45,
    location_scope TEXT NOT NULL,
    prompt_instructions TEXT NOT NULL,
    verification_criteria JSONB NOT NULL DEFAULT '[]'::jsonb,
    sample_evidence_text TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'OPEN',
    payout_batch_id TEXT,
    verification_result JSONB,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. A2A Smart Escrow Milestones (Bryntum Gantt)
CREATE TABLE IF NOT EXISTS smart_escrow_milestones (
    id TEXT PRIMARY KEY,
    project_name TEXT NOT NULL,
    client_agent TEXT NOT NULL,
    provider_name TEXT NOT NULL,
    provider_email TEXT NOT NULL,
    amount_value NUMERIC(12,2) NOT NULL,
    currency_code TEXT NOT NULL DEFAULT 'USD',
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    progress_percent INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'AUTHORIZED_LOCKED',
    paypal_order_id TEXT NOT NULL,
    paypal_authorization_id TEXT NOT NULL,
    paypal_capture_id TEXT,
    tracking_number TEXT,
    carrier TEXT,
    deliverable_requirement TEXT NOT NULL,
    submitted_proof TEXT,
    ai_audit_notes TEXT,
    dependencies JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Channel3 100M+ Universal Product Deals & Mandates
CREATE TABLE IF NOT EXISTS channel3_deals (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    brand TEXT NOT NULL,
    category TEXT NOT NULL,
    sku TEXT NOT NULL,
    retail_price NUMERIC(12,2) NOT NULL,
    channel3_best_price NUMERIC(12,2) NOT NULL,
    target_mandate_price NUMERIC(12,2) NOT NULL,
    savings_amount NUMERIC(12,2) NOT NULL,
    savings_percent NUMERIC(5,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    merchant_name TEXT NOT NULL,
    in_stock BOOLEAN NOT NULL DEFAULT true,
    rating NUMERIC(3,2) NOT NULL DEFAULT 4.90,
    review_count INTEGER NOT NULL DEFAULT 100,
    bnpl_eligible BOOLEAN NOT NULL DEFAULT true,
    bnpl_installment_monthly NUMERIC(12,2) NOT NULL,
    mandate_status TEXT NOT NULL DEFAULT 'TARGET_MET_READY',
    paypal_order_id TEXT,
    ai_price_prediction TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. PayPal Invoices v2 (/v2/invoicing/invoices)
CREATE TABLE IF NOT EXISTS paypal_invoices (
    id TEXT PRIMARY KEY,
    invoice_number TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'SENT',
    recipient_name TEXT NOT NULL,
    recipient_email TEXT NOT NULL,
    item_name TEXT NOT NULL,
    amount_value NUMERIC(12,2) NOT NULL,
    currency_code TEXT NOT NULL DEFAULT 'USD',
    due_date TEXT NOT NULL,
    early_payment_discount_percent NUMERIC(5,2) DEFAULT 0.00,
    escrow_milestone_id TEXT,
    mode TEXT NOT NULL DEFAULT 'sandbox',
    create_time TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. PayPal Webhook Events (Deduplication & Verification)
CREATE TABLE IF NOT EXISTS webhook_events (
    id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    resource_id TEXT,
    summary TEXT NOT NULL,
    verification_status TEXT NOT NULL DEFAULT 'SUCCESS',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Realtime replication for dynamic UI listeners
ALTER PUBLICATION supabase_realtime ADD TABLE paypal_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE smart_escrow_milestones;
ALTER PUBLICATION supabase_realtime ADD TABLE proof_of_human_bounties;
ALTER PUBLICATION supabase_realtime ADD TABLE subscriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE channel3_deals;
