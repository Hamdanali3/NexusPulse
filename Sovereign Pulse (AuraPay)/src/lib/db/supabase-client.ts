import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { SovereignPulseState } from "../paypal/paypal-sandbox-mirror";
import type {
  Channel3ProductDeal,
  PayPalInvoiceRecord,
  PayPalLedgerTransaction,
  PayPalOrderRecord,
  PayPalPayoutRecord,
  PayPalSubscriptionRecord,
  ProofOfHumanBounty,
  SmartEscrowMilestone,
} from "../paypal/paypal-types";

let cachedSupabase: SupabaseClient | null = null;

export function getSupabaseUrl(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim()
  );
}

export function getSupabaseKey(): string | undefined {
  return (
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  );
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseKey());
}

export function getSupabaseClient(): SupabaseClient | null {
  if (cachedSupabase) return cachedSupabase;
  const url = getSupabaseUrl();
  const key = getSupabaseKey();
  if (!url || !key) return null;

  cachedSupabase = createClient(url, key, {
    auth: { persistSession: false },
  });
  return cachedSupabase;
}

/**
 * Loads the complete Sovereign Pulse state from Supabase PostgreSQL.
 * If Supabase is unavailable, returns null (caller will fall back to mirror store).
 */
export async function loadStateFromSupabase(): Promise<SovereignPulseState | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const [
      metaRes,
      transRes,
      ordersRes,
      payoutsRes,
      subsRes,
      bountiesRes,
      escrowRes,
      dealsRes,
      invoicesRes,
      webhooksRes,
    ] = await Promise.all([
      supabase.from("sovereign_pulse_meta").select("*").eq("id", "current").maybeSingle(),
      supabase.from("paypal_transactions").select("*").order("initiation_date", { ascending: false }),
      supabase.from("paypal_orders").select("*").order("create_time", { ascending: false }),
      supabase.from("paypal_payouts").select("*").order("time_created", { ascending: false }),
      supabase.from("subscriptions").select("*").order("billing_amount", { ascending: false }),
      supabase.from("proof_of_human_bounties").select("*").order("reward_value", { ascending: false }),
      supabase.from("smart_escrow_milestones").select("*").order("start_date", { ascending: true }),
      supabase.from("channel3_deals").select("*").order("savings_amount", { ascending: false }),
      supabase.from("paypal_invoices").select("*").order("create_time", { ascending: false }),
      supabase.from("webhook_events").select("*").order("created_at", { ascending: false }),
    ]);

    if (!metaRes.data && !transRes.data && !subsRes.data) {
      return null;
    }

    const meta = metaRes.data || {
      wallet_balance_usd: 4820.50,
      total_saved_by_ai_usd: 642.50,
      total_earned_from_bounties_usd: 145.00,
      total_escrow_protected_usd: 3450.00,
      preferred_mode: "auto",
    };

    const subscriptions: PayPalSubscriptionRecord[] = (subsRes.data || []).map((s: Record<string, unknown>) => ({
      id: String(s.id),
      plan_id: String(s.plan_id),
      plan_name: String(s.plan_name),
      merchant_name: String(s.merchant_name),
      status: s.status as PayPalSubscriptionRecord["status"],
      billing_amount: { currency_code: "USD", value: Number(s.billing_amount).toFixed(2) },
      market_benchmark_amount: { currency_code: "USD", value: Number(s.market_benchmark_amount).toFixed(2) },
      potential_monthly_savings: { currency_code: "USD", value: Number(s.potential_monthly_savings).toFixed(2) },
      interval_unit: (s.interval_unit as "MONTH" | "YEAR") || "MONTH",
      next_billing_time: String(s.next_billing_time),
      ai_recommendation: s.ai_recommendation as PayPalSubscriptionRecord["ai_recommendation"],
      ai_rationale: String(s.ai_rationale),
      last_used_days_ago: Number(s.last_used_days_ago || 0),
      mode: (s.mode as "sandbox" | "mirror") || "sandbox",
    }));

    const bounties: ProofOfHumanBounty[] = (bountiesRes.data || []).map((b: Record<string, unknown>) => ({
      id: String(b.id),
      title: String(b.title),
      requester_agent: String(b.requester_agent),
      requester_org: String(b.requester_org),
      category: b.category as ProofOfHumanBounty["category"],
      reward: { currency_code: String(b.currency_code || "USD"), value: Number(b.reward_value).toFixed(2) },
      estimated_seconds: Number(b.estimated_seconds || 45),
      location_scope: String(b.location_scope),
      prompt_instructions: String(b.prompt_instructions),
      verification_criteria: (b.verification_criteria as string[]) || [],
      sample_evidence_text: String(b.sample_evidence_text || ""),
      status: b.status as ProofOfHumanBounty["status"],
      payout_batch_id: b.payout_batch_id ? String(b.payout_batch_id) : undefined,
      verification_result: b.verification_result as ProofOfHumanBounty["verification_result"],
    }));

    const escrowMilestones: SmartEscrowMilestone[] = (escrowRes.data || []).map((m: Record<string, unknown>) => ({
      id: String(m.id),
      project_name: String(m.project_name),
      client_agent: String(m.client_agent),
      provider_name: String(m.provider_name),
      provider_email: String(m.provider_email),
      amount: { currency_code: String(m.currency_code || "USD"), value: Number(m.amount_value).toFixed(2) },
      start_date: String(m.start_date),
      end_date: String(m.end_date),
      progress_percent: Number(m.progress_percent || 0),
      status: m.status as SmartEscrowMilestone["status"],
      paypal_order_id: String(m.paypal_order_id),
      paypal_authorization_id: String(m.paypal_authorization_id),
      paypal_capture_id: m.paypal_capture_id ? String(m.paypal_capture_id) : undefined,
      tracking_number: m.tracking_number ? String(m.tracking_number) : undefined,
      carrier: m.carrier ? String(m.carrier) : undefined,
      deliverable_requirement: String(m.deliverable_requirement),
      submitted_proof: m.submitted_proof ? String(m.submitted_proof) : undefined,
      ai_audit_notes: m.ai_audit_notes ? String(m.ai_audit_notes) : undefined,
      dependencies: (m.dependencies as string[]) || [],
    }));

    const channel3Deals: Channel3ProductDeal[] = (dealsRes.data || []).map((d: Record<string, unknown>) => ({
      id: String(d.id),
      title: String(d.title),
      brand: String(d.brand),
      category: String(d.category),
      sku: String(d.sku),
      retail_price: Number(d.retail_price),
      channel3_best_price: Number(d.channel3_best_price),
      target_mandate_price: Number(d.target_mandate_price),
      savings_amount: Number(d.savings_amount),
      savings_percent: Number(d.savings_percent),
      currency: String(d.currency || "USD"),
      merchant_name: String(d.merchant_name),
      in_stock: Boolean(d.in_stock),
      rating: Number(d.rating || 4.9),
      review_count: Number(d.review_count || 100),
      bnpl_eligible: Boolean(d.bnpl_eligible),
      bnpl_installment_monthly: Number(d.bnpl_installment_monthly || 0),
      mandate_status: d.mandate_status as Channel3ProductDeal["mandate_status"],
      paypal_order_id: d.paypal_order_id ? String(d.paypal_order_id) : undefined,
      ai_price_prediction: String(d.ai_price_prediction),
    }));

    const transactions: PayPalLedgerTransaction[] = (transRes.data || []).map((t: Record<string, unknown>) => ({
      transaction_id: String(t.transaction_id),
      paypal_reference_id: String(t.paypal_reference_id || ""),
      transaction_event_code: t.transaction_event_code as PayPalLedgerTransaction["transaction_event_code"],
      event_label: String(t.event_label),
      engine: t.engine as PayPalLedgerTransaction["engine"],
      counterparty: String(t.counterparty),
      amount: Number(t.amount),
      fee_amount: Number(t.fee_amount || 0),
      net_amount: Number(t.net_amount),
      currency: String(t.currency || "USD"),
      status: (t.status as PayPalLedgerTransaction["status"]) || "S",
      status_label: (t.status_label as PayPalLedgerTransaction["status_label"]) || "SUCCESS",
      funding_source: t.funding_source as PayPalLedgerTransaction["funding_source"],
      ai_verified: Boolean(t.ai_verified),
      ai_confidence: Number(t.ai_confidence || 98),
      initiation_date: String(t.initiation_date),
      mode: (t.mode as "sandbox" | "mirror") || "sandbox",
    }));

    const orders: PayPalOrderRecord[] = (ordersRes.data || []).map((o: Record<string, unknown>) => ({
      id: String(o.id),
      intent: o.intent as PayPalOrderRecord["intent"],
      status: o.status as PayPalOrderRecord["status"],
      amount: { currency_code: String(o.currency_code || "USD"), value: Number(o.amount_value).toFixed(2) },
      description: String(o.description),
      category: o.category as PayPalOrderRecord["category"],
      funding_source: o.funding_source as PayPalOrderRecord["funding_source"],
      payer_email: o.payer_email ? String(o.payer_email) : undefined,
      merchant_email: o.merchant_email ? String(o.merchant_email) : undefined,
      authorization_id: o.authorization_id ? String(o.authorization_id) : undefined,
      capture_id: o.capture_id ? String(o.capture_id) : undefined,
      tracking_number: o.tracking_number ? String(o.tracking_number) : undefined,
      carrier: o.carrier ? String(o.carrier) : undefined,
      paypal_request_id: String(o.paypal_request_id),
      debug_id: o.debug_id ? String(o.debug_id) : undefined,
      mode: (o.mode as "sandbox" | "mirror") || "sandbox",
      create_time: String(o.create_time),
      update_time: String(o.update_time),
      links: [],
    }));

    const payouts: PayPalPayoutRecord[] = (payoutsRes.data || []).map((p: Record<string, unknown>) => ({
      payout_batch_id: String(p.payout_batch_id),
      sender_batch_id: String(p.sender_batch_id),
      sender_item_id: String(p.sender_item_id),
      batch_status: p.batch_status as PayPalPayoutRecord["batch_status"],
      recipient_type: p.recipient_type as PayPalPayoutRecord["recipient_type"],
      receiver: String(p.receiver),
      amount: { currency_code: String(p.currency_code || "USD"), value: Number(p.amount_value).toFixed(2) },
      note: String(p.note),
      bounty_id: p.bounty_id ? String(p.bounty_id) : undefined,
      verification_score: p.verification_score ? Number(p.verification_score) : undefined,
      paypal_request_id: String(p.paypal_request_id),
      mode: (p.mode as "sandbox" | "mirror") || "sandbox",
      time_created: String(p.time_created),
    }));

    const invoices: PayPalInvoiceRecord[] = (invoicesRes.data || []).map((i: Record<string, unknown>) => ({
      id: String(i.id),
      invoice_number: String(i.invoice_number),
      status: i.status as PayPalInvoiceRecord["status"],
      recipient_name: String(i.recipient_name),
      recipient_email: String(i.recipient_email),
      item_name: String(i.item_name),
      amount: { currency_code: String(i.currency_code || "USD"), value: Number(i.amount_value).toFixed(2) },
      due_date: String(i.due_date),
      early_payment_discount_percent: i.early_payment_discount_percent ? Number(i.early_payment_discount_percent) : undefined,
      escrow_milestone_id: i.escrow_milestone_id ? String(i.escrow_milestone_id) : undefined,
      mode: (i.mode as "sandbox" | "mirror") || "sandbox",
      create_time: String(i.create_time),
    }));

    const webhookEvents = (webhooksRes.data || []).map((w: Record<string, unknown>) => ({
      id: String(w.id),
      event_type: String(w.event_type),
      resource_id: String(w.resource_id || ""),
      summary: String(w.summary),
      verification_status: "SUCCESS" as const,
      created_at: String(w.created_at),
    }));

    return {
      walletBalanceUsd: Number(meta.wallet_balance_usd),
      totalSavedByAiUsd: Number(meta.total_saved_by_ai_usd),
      totalEarnedFromBountiesUsd: Number(meta.total_earned_from_bounties_usd),
      totalEscrowProtectedUsd: Number(meta.total_escrow_protected_usd),
      preferredMode: (meta.preferred_mode as "auto" | "sandbox" | "mirror") || "auto",
      transactions,
      orders,
      payouts,
      subscriptions,
      invoices,
      disputes: [
        {
          dispute_id: "PP-D-8829104",
          dispute_Transaction_id: "2CP99182377481109",
          reason: "MERCHANDISE_OR_SERVICE_NOT_RECEIVED",
          status: "RESOLVED",
          dispute_life_cycle_stage: "INQUIRY",
          dispute_amount: { currency_code: "USD", value: "850.00" },
          seller_response_due_date: "2026-11-20T00:00:00Z",
          tracking_attached: "DHL-PK-88992211",
          ai_evidence_summary:
            "Dispute shield auto-injected DHL tracker proof (DHL-PK-88992211) and GitHub commit SHA. Seller protection confirmed. Dispute resolved.",
          mode: "sandbox",
        },
      ],
      bounties,
      escrowMilestones,
      channel3Deals,
      webhookEvents,
    };
  } catch (err) {
    console.warn("[Supabase Load] Error loading state from Supabase, falling back to mirror:", err);
    return null;
  }
}

/**
 * Persists an order creation or capture into Supabase PostgreSQL.
 */
export async function syncOrderToSupabase(order: PayPalOrderRecord) {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    await supabase.from("paypal_orders").upsert({
      id: order.id,
      intent: order.intent,
      status: order.status,
      amount_value: Number(order.amount.value),
      currency_code: order.amount.currency_code,
      description: order.description,
      category: order.category,
      funding_source: order.funding_source || "paypal",
      payer_email: order.payer_email,
      merchant_email: order.merchant_email,
      authorization_id: order.authorization_id,
      capture_id: order.capture_id,
      tracking_number: order.tracking_number,
      carrier: order.carrier,
      paypal_request_id: order.paypal_request_id,
      debug_id: order.debug_id,
      mode: order.mode,
      update_time: order.update_time,
    });
  } catch (err) {
    console.warn("[Supabase Sync] Error syncing order:", err);
  }
}

/**
 * Persists a payout into Supabase PostgreSQL.
 */
export async function syncPayoutToSupabase(payout: PayPalPayoutRecord) {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    await supabase.from("paypal_payouts").upsert({
      payout_batch_id: payout.payout_batch_id,
      sender_batch_id: payout.sender_batch_id,
      sender_item_id: payout.sender_item_id,
      batch_status: payout.batch_status,
      recipient_type: payout.recipient_type,
      receiver: payout.receiver,
      amount_value: Number(payout.amount.value),
      currency_code: payout.amount.currency_code,
      note: payout.note,
      bounty_id: payout.bounty_id,
      verification_score: payout.verification_score,
      paypal_request_id: payout.paypal_request_id,
      mode: payout.mode,
      time_created: payout.time_created,
    });
  } catch (err) {
    console.warn("[Supabase Sync] Error syncing payout:", err);
  }
}

/**
 * Persists an optimized subscription plan into Supabase PostgreSQL.
 */
export async function syncSubscriptionToSupabase(sub: PayPalSubscriptionRecord) {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    await supabase.from("subscriptions").upsert({
      id: sub.id,
      status: sub.status,
      billing_amount: Number(sub.billing_amount.value),
      potential_monthly_savings: Number(sub.potential_monthly_savings.value),
      ai_recommendation: sub.ai_recommendation,
      ai_rationale: sub.ai_rationale,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn("[Supabase Sync] Error syncing subscription:", err);
  }
}

/**
 * Persists updated escrow milestone into Supabase PostgreSQL.
 */
export async function syncEscrowToSupabase(milestone: SmartEscrowMilestone) {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    await supabase.from("smart_escrow_milestones").upsert({
      id: milestone.id,
      project_name: milestone.project_name,
      client_agent: milestone.client_agent,
      provider_name: milestone.provider_name,
      provider_email: milestone.provider_email,
      amount_value: Number(milestone.amount.value),
      currency_code: milestone.amount.currency_code,
      start_date: milestone.start_date,
      end_date: milestone.end_date,
      progress_percent: milestone.progress_percent,
      status: milestone.status,
      paypal_order_id: milestone.paypal_order_id,
      paypal_authorization_id: milestone.paypal_authorization_id,
      paypal_capture_id: milestone.paypal_capture_id,
      tracking_number: milestone.tracking_number,
      carrier: milestone.carrier,
      deliverable_requirement: milestone.deliverable_requirement,
      submitted_proof: milestone.submitted_proof,
      ai_audit_notes: milestone.ai_audit_notes,
      dependencies: milestone.dependencies,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn("[Supabase Sync] Error syncing escrow:", err);
  }
}
