export type PayPalExecutionMode = "sandbox" | "mirror";

export interface PayPalMoney {
  currency_code: string;
  value: string;
}

export interface PayPalHateoasLink {
  href: string;
  rel: string;
  method: "GET" | "POST" | "PATCH" | "DELETE";
}

export interface PayPalOrderRecord {
  id: string;
  intent: "CAPTURE" | "AUTHORIZE";
  status: "CREATED" | "SAVED" | "APPROVED" | "VOIDED" | "COMPLETED" | "PAYER_ACTION_REQUIRED";
  amount: PayPalMoney;
  description: string;
  category: "CHANNEL3_DEAL" | "ESCROW_MILESTONE" | "SUBSCRIPTION_OPTIMIZATION" | "DIRECT_CHECKOUT";
  funding_source?: "paypal" | "venmo" | "paylater" | "card";
  payer_email?: string;
  merchant_email?: string;
  authorization_id?: string;
  capture_id?: string;
  tracking_number?: string;
  carrier?: string;
  paypal_request_id: string;
  debug_id?: string;
  mode: PayPalExecutionMode;
  create_time: string;
  update_time: string;
  links: PayPalHateoasLink[];
}

export interface PayPalPayoutRecord {
  payout_batch_id: string;
  sender_batch_id: string;
  sender_item_id: string;
  batch_status: "PENDING" | "PROCESSING" | "SUCCESS" | "DENIED";
  recipient_type: "EMAIL" | "VENMO_HANDLE" | "PAYPAL_ID";
  receiver: string;
  amount: PayPalMoney;
  note: string;
  bounty_id?: string;
  verification_score?: number;
  paypal_request_id: string;
  mode: PayPalExecutionMode;
  time_created: string;
  time_completed?: string;
}

export interface PayPalSubscriptionRecord {
  id: string;
  plan_id: string;
  plan_name: string;
  merchant_name: string;
  status: "ACTIVE" | "SUSPENDED" | "CANCELLED" | "APPROVAL_PENDING";
  billing_amount: PayPalMoney;
  market_benchmark_amount: PayPalMoney;
  potential_monthly_savings: PayPalMoney;
  interval_unit: "MONTH" | "YEAR";
  next_billing_time: string;
  ai_recommendation: "KEEP" | "REVISE_DOWNGRADE" | "NEGOTIATE_DISCOUNT" | "CANCEL_UNUSED";
  ai_rationale: string;
  last_used_days_ago: number;
  mode: PayPalExecutionMode;
}

export interface PayPalInvoiceRecord {
  id: string;
  invoice_number: string;
  status: "DRAFT" | "SENT" | "SCHEDULED" | "PAID" | "UNPAID" | "PARTIALLY_PAID" | "CANCELLED" | "REFUNDED";
  recipient_name: string;
  recipient_email: string;
  item_name: string;
  amount: PayPalMoney;
  due_date: string;
  early_payment_discount_percent?: number;
  qr_code_svg?: string;
  escrow_milestone_id?: string;
  mode: PayPalExecutionMode;
  create_time: string;
}

export interface PayPalDisputeRecord {
  dispute_id: string;
  dispute_Transaction_id: string;
  reason: "MERCHANDISE_OR_SERVICE_NOT_RECEIVED" | "SIGNIFICANTLY_NOT_AS_DESCRIBED" | "UNAUTHORIZED";
  status: "OPEN" | "WAITING_FOR_BUYER_RESPONSE" | "WAITING_FOR_SELLER_RESPONSE" | "UNDER_REVIEW" | "RESOLVED";
  dispute_life_cycle_stage: "INQUIRY" | "CLAIM" | "CHARGEBACK" | "PRE_ARBITRATION";
  dispute_amount: PayPalMoney;
  seller_response_due_date: string;
  tracking_attached?: string;
  ai_evidence_summary?: string;
  mode: PayPalExecutionMode;
}

export interface PayPalLedgerTransaction {
  transaction_id: string;
  paypal_reference_id: string;
  transaction_event_code: "T0001" | "T0002" | "T0006" | "T0007" | "T1107";
  event_label: string;
  engine: "AUTOPILOT_CFO" | "PROOF_OF_HUMAN_BOUNTY" | "A2A_SMART_ESCROW" | "SUBSCRIPTION_GUARD";
  counterparty: string;
  amount: number;
  fee_amount: number;
  net_amount: number;
  currency: string;
  status: "S" | "P" | "V" | "D";
  status_label: "SUCCESS" | "PENDING" | "REVERSED" | "DENIED";
  funding_source: "PayPal Wallet" | "Pay with Venmo" | "PayPal Pay Later (BNPL)" | "PayPal Payouts v1" | "PayPal Orders v2 Auth";
  ai_verified: boolean;
  ai_confidence: number;
  initiation_date: string;
  mode: PayPalExecutionMode;
}

export interface ProofOfHumanBounty {
  id: string;
  title: string;
  requester_agent: string;
  requester_org: string;
  category: "PHYSICAL_GROUND_TRUTH" | "EXPERT_AUDIT" | "MULTILINGUAL_NUANCE" | "TASTE_BENCHMARK";
  reward: PayPalMoney;
  estimated_seconds: number;
  location_scope: string;
  prompt_instructions: string;
  verification_criteria: string[];
  sample_evidence_text: string;
  status: "OPEN" | "VERIFYING" | "PAID_OUT";
  payout_batch_id?: string;
  verification_result?: {
    passed: boolean;
    score: number;
    gemini_model: string;
    reasoning: string;
    verified_at: string;
  };
}

export interface SmartEscrowMilestone {
  id: string;
  project_name: string;
  client_agent: string;
  provider_name: string;
  provider_email: string;
  amount: PayPalMoney;
  start_date: string;
  end_date: string;
  progress_percent: number;
  status: "AUTHORIZED_LOCKED" | "DELIVERABLE_SUBMITTED" | "AI_VERIFIED_CAPTURED" | "DISPUTE_PROTECTED" | "AUTH_HOLD_PENDING_DELIVERABLE";
  paypal_order_id: string;
  paypal_authorization_id: string;
  paypal_capture_id?: string;
  tracking_number?: string;
  carrier?: string;
  deliverable_requirement: string;
  submitted_proof?: string;
  deliverable_proof?: string;
  ai_audit_notes?: string;
  dependencies?: string[];
}

export type PayPalEscrowMilestone = SmartEscrowMilestone;

export interface Channel3ProductDeal {
  id: string;
  title: string;
  brand: string;
  category: string;
  sku: string;
  retail_price: number;
  channel3_best_price: number;
  target_mandate_price: number;
  savings_amount: number;
  savings_percent: number;
  currency: string;
  merchant_name: string;
  in_stock: boolean;
  rating: number;
  review_count: number;
  bnpl_eligible: boolean;
  bnpl_installment_monthly: number;
  mandate_status: "TARGET_MET_READY" | "MONITORING_PRICE" | "PURCHASED_VIA_PAYPAL";
  paypal_order_id?: string;
  ai_price_prediction: string;
}
