import crypto from "crypto";
import { ApiError } from "@paypal/paypal-server-sdk";
import {
  attachLiveOrderTrackingViaSdk,
  captureAuthorizationViaSdk,
  createAndSendLivePayPalInvoice,
  createLiveSandboxOrderViaSdk,
  createLiveSandboxSubscription,
  extractApproveUrl,
  getApimaticPayPalSdk,
  getLiveOrderViaSdk,
  getPayoutBatchStatusViaApi,
  getPublicPayPalClientId,
  getSandboxAccountsConfig,
  hasLiveSandboxCredentials,
  isPayPalLiveEnvironment,
  PayPalIntegrationError,
  paypalSandboxFetch,
  probeLiveSandboxTelemetry,
} from "./paypal-client";
import {
  getMirrorState,
  mirrorCaptureOrAuthorizeOrder,
  mirrorCreateOrder,
  mirrorCreatePayout,
  mirrorOptimizeSubscription,
} from "./paypal-sandbox-mirror";
import {
  syncOrderToSupabase,
  syncPayoutToSupabase,
  syncSubscriptionToSupabase,
} from "../db/supabase-client";
import type {
  PayPalExecutionMode,
  PayPalGatewayStatus,
  PayPalHateoasLink,
  PayPalLiveTelemetry,
  PayPalOrderRecord,
  PayPalPayoutRecord,
  PayPalSubscriptionRecord,
} from "./paypal-types";

export function resolveActivePayPalMode(): PayPalExecutionMode {
  const state = getMirrorState();
  const envPref = (process.env.PAYPAL_MODE ?? process.env.PAYPAL_ENV ?? state.preferredMode ?? "auto").toLowerCase();
  if (envPref === "mirror") return "mirror";
  if ((envPref === "live" || envPref === "production") && hasLiveSandboxCredentials()) return "live";
  if (envPref === "sandbox" && hasLiveSandboxCredentials()) return "sandbox";
  if (process.env.PAYPAL_ENV === "live" && hasLiveSandboxCredentials()) return "live";
  return hasLiveSandboxCredentials() ? "sandbox" : "mirror";
}

export function getPayPalGatewayStatus(): PayPalGatewayStatus {
  const state = getMirrorState();
  const accounts = getSandboxAccountsConfig();
  return {
    activeMode: resolveActivePayPalMode(),
    preferredMode: state.preferredMode,
    hasCredentials: hasLiveSandboxCredentials(),
    environment: isPayPalLiveEnvironment() ? "live" : "sandbox",
    publicClientId: getPublicPayPalClientId(),
    sandboxSlot: accounts.slot,
    accounts,
  };
}

export function setRuntimePayPalCredentials(params: {
  clientId?: string;
  clientSecret?: string;
  preferredMode?: "auto" | "live" | "sandbox" | "mirror";
}) {
  const state = getMirrorState();
  if (params.clientId !== undefined) {
    process.env.PAYPAL_CLIENT_ID = params.clientId.trim();
    process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID = params.clientId.trim();
  }
  if (params.clientSecret !== undefined) {
    process.env.PAYPAL_CLIENT_SECRET = params.clientSecret.trim();
  }
  if (params.preferredMode) {
    state.preferredMode = params.preferredMode;
    process.env.PAYPAL_MODE = params.preferredMode;
  }
  return {
    activeMode: resolveActivePayPalMode(),
    hasLiveCredentials: hasLiveSandboxCredentials(),
    preferredMode: state.preferredMode,
  };
}

function mapSdkLinks(
  links?: Array<{ href?: string; rel?: string; method?: string }>
): PayPalHateoasLink[] | undefined {
  if (!links?.length) return undefined;
  return links
    .filter((l): l is { href: string; rel: string; method?: string } => Boolean(l.href && l.rel))
    .map((l) => {
      const m = (l.method || "GET").toUpperCase();
      const method: PayPalHateoasLink["method"] =
        m === "POST" || m === "PATCH" || m === "DELETE" ? m : "GET";
      return { href: l.href, rel: l.rel, method };
    });
}

function isOrderNotApprovedError(err: unknown): boolean {
  const text =
    err instanceof ApiError
      ? `${err.message} ${typeof err.body === "string" ? err.body : JSON.stringify(err.body ?? "")} ${JSON.stringify(err.result ?? "")}`
      : err instanceof Error
        ? err.message
        : String(err);
  return (
    text.includes("ORDER_NOT_APPROVED") ||
    text.includes("PAYER_ACTION_REQUIRED") ||
    (err instanceof ApiError && err.statusCode === 422)
  );
}

/**
 * Credential-First Order Creation (Orders API v2 + APIMatic @paypal/paypal-server-sdk)
 */
export async function gatewayCreateOrder(params: {
  amountValue: string;
  currencyCode?: string;
  intent?: "CAPTURE" | "AUTHORIZE";
  description: string;
  category?: PayPalOrderRecord["category"];
  fundingSource?: PayPalOrderRecord["funding_source"];
  returnUrl?: string;
  cancelUrl?: string;
  payeeEmail?: string;
}): Promise<PayPalOrderRecord> {
  const activeMode = resolveActivePayPalMode();
  const accounts = getSandboxAccountsConfig();

  if (activeMode === "sandbox" || activeMode === "live") {
    try {
      const { order, paypalRequestId, approveUrl } = await createLiveSandboxOrderViaSdk({
        amountValue: params.amountValue,
        currencyCode: params.currencyCode,
        intent: params.intent,
        description: params.description,
        payeeEmail: params.payeeEmail,
        returnUrl: params.returnUrl,
        cancelUrl: params.cancelUrl,
      });

      const status =
        order.status &&
        ["CREATED", "SAVED", "APPROVED", "VOIDED", "COMPLETED", "PAYER_ACTION_REQUIRED"].includes(
          String(order.status)
        )
          ? (String(order.status) as PayPalOrderRecord["status"])
          : "CREATED";

      const record = mirrorCreateOrder({
        amountValue: params.amountValue,
        currencyCode: params.currencyCode,
        intent: params.intent,
        description: params.description,
        category: params.category,
        fundingSource: params.fundingSource,
        paypalRequestId,
        mode: activeMode,
        overrideOrderId: order.id,
        overrideStatus: status,
        overrideLinks: mapSdkLinks(order.links as Array<{ href?: string; rel?: string; method?: string }>),
        overrideApproveUrl:
          approveUrl ||
          (order.id ? `https://www.sandbox.paypal.com/checkoutnow?token=${order.id}` : undefined),
        overrideMerchantEmail: params.payeeEmail || accounts.merchantEmail,
        overridePayerEmail: accounts.buyerEmail,
      });
      syncOrderToSupabase(record).catch(() => {});
      return record;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[PayPal Gateway] Live ${activeMode} createOrder fallback:`, msg);
      const record = mirrorCreateOrder({
        ...params,
        mode: "mirror",
        fallbackReason: `Live PayPal createOrder fallback: ${msg.slice(0, 140)}`,
      });
      syncOrderToSupabase(record).catch(() => {});
      return record;
    }
  }

  const record = mirrorCreateOrder({
    ...params,
    mode: "mirror",
  });
  syncOrderToSupabase(record).catch(() => {});
  return record;
}

/**
 * Credential-First Order Capture / Authorize / Authorization-Release
 * Preserves authentic PayPal capture_id, authorization_id, payer email, and tracking proof.
 */
export async function gatewayCaptureOrAuthorizeOrder(params: {
  orderId: string;
  action?: "CAPTURE" | "AUTHORIZE";
  fundingSource?: PayPalOrderRecord["funding_source"];
  channel3DealId?: string;
  escrowMilestoneId?: string;
  trackingNumber?: string;
  carrier?: string;
  authorizationId?: string;
}): Promise<PayPalOrderRecord> {
  const activeMode = resolveActivePayPalMode();
  const state = getMirrorState();
  const existingOrder = state.orders.find((o) => o.id === params.orderId);
  const existingMilestone = params.escrowMilestoneId
    ? state.escrowMilestones.find((m) => m.id === params.escrowMilestoneId)
    : undefined;

  if (activeMode === "sandbox" || activeMode === "live") {
    const sdk = getApimaticPayPalSdk();
    if (sdk) {
      try {
        const paypalRequestId = crypto.randomUUID();
        const existingAuthId =
          params.authorizationId ||
          existingOrder?.authorization_id ||
          existingMilestone?.paypal_authorization_id;

        // Path A: Release/Capture an existing PayPal Authorization Hold (Engine 3 Escrow release)
        if (
          params.action === "CAPTURE" &&
          existingMilestone &&
          existingAuthId &&
          !existingOrder?.capture_id &&
          existingOrder?.mode === activeMode
        ) {
          const authCap = await captureAuthorizationViaSdk({
            authorizationId: existingAuthId,
            amountValue: existingMilestone.amount.value,
            currencyCode: existingMilestone.amount.currency_code,
            finalCapture: true,
            invoiceId: `${existingMilestone.id}-${Date.now()}`,
            paypalRequestId,
          });

          if (params.trackingNumber) {
            try {
              await attachLiveOrderTrackingViaSdk({
                orderId: params.orderId,
                captureId: authCap.captureId,
                trackingNumber: params.trackingNumber,
              });
            } catch (trackErr) {
              console.warn("[PayPal Gateway] Tracking attachment note:", trackErr);
            }
          }

          const captured = mirrorCaptureOrAuthorizeOrder({
            ...params,
            mode: activeMode,
            overrideStatus: "COMPLETED",
            overrideCaptureId: authCap.captureId,
            overrideAuthorizationId: existingAuthId,
          });
          syncOrderToSupabase(captured).catch(() => {});
          return captured;
        }

        // Path B: Authorize or Capture a PayPal Order v2 after buyer approval
        let sdkResultOrder;
        if (params.action === "AUTHORIZE") {
          const res = await sdk.ordersController.authorizeOrder({
            id: params.orderId,
            paypalRequestId,
            prefer: "return=representation",
          });
          sdkResultOrder = res.result;
        } else {
          // Check live order state first (might already be CAPTURED/COMPLETED or need capture)
          const liveCheck = await getLiveOrderViaSdk(params.orderId);
          if (liveCheck.status === "COMPLETED") {
            sdkResultOrder = liveCheck;
          } else {
            const res = await sdk.ordersController.captureOrder({
              id: params.orderId,
              paypalRequestId,
              prefer: "return=representation",
            });
            sdkResultOrder = res.result;
          }
        }

        const pu = sdkResultOrder.purchaseUnits?.[0];
        const realCaptureId = pu?.payments?.captures?.[0]?.id;
        const realAuthId = pu?.payments?.authorizations?.[0]?.id;
        const realPayerEmail = sdkResultOrder.payer?.emailAddress;
        const realStatus =
          String(sdkResultOrder.status || "").toUpperCase() === "COMPLETED"
            ? "COMPLETED"
            : "APPROVED";

        if (params.trackingNumber && realCaptureId) {
          try {
            await attachLiveOrderTrackingViaSdk({
              orderId: params.orderId,
              captureId: realCaptureId,
              trackingNumber: params.trackingNumber,
            });
          } catch (trackErr) {
            console.warn("[PayPal Gateway] Order tracking note:", trackErr);
          }
        }

        const captured = mirrorCaptureOrAuthorizeOrder({
          ...params,
          mode: activeMode,
          overrideStatus: realStatus,
          overrideCaptureId: realCaptureId,
          overrideAuthorizationId: realAuthId,
          overridePayerEmail: realPayerEmail,
        });
        syncOrderToSupabase(captured).catch(() => {});
        return captured;
      } catch (err) {
        if (isOrderNotApprovedError(err)) {
          const approveUrl =
            existingOrder?.approve_url ||
            `https://www.sandbox.paypal.com/checkoutnow?token=${params.orderId}`;
          throw new PayPalIntegrationError(
            422,
            "ORDER_NOT_APPROVED",
            `Order ${params.orderId} requires buyer approval on PayPal Sandbox before capture/authorization. Approve at ${approveUrl}`,
            undefined,
            false
          );
        }

        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`[PayPal Gateway] Live ${activeMode} capture/authorize fallback:`, msg);
        const captured = mirrorCaptureOrAuthorizeOrder({
          ...params,
          mode: "mirror",
          fallbackReason: `Live PayPal fallback (${msg.slice(0, 120)})`,
        });
        syncOrderToSupabase(captured).catch(() => {});
        return captured;
      }
    }
  }

  const captured = mirrorCaptureOrAuthorizeOrder({
    ...params,
    mode: "mirror",
  });
  syncOrderToSupabase(captured).catch(() => {});
  return captured;
}

/**
 * Credential-First Instant Payout Dispatch (`POST /v1/payments/payouts` + batch status check)
 * Used by Engine 2 (Proof-of-Human Oracle Bounties)
 */
export async function gatewayCreatePayout(params: {
  receiver: string;
  amountValue: string;
  currencyCode?: string;
  recipientType?: "EMAIL" | "VENMO_HANDLE" | "PAYPAL_ID";
  note: string;
  bountyId?: string;
  verificationScore?: number;
  geminiReasoning?: string;
  geminiModel?: string;
}): Promise<PayPalPayoutRecord> {
  const activeMode = resolveActivePayPalMode();

  if (activeMode === "sandbox" || activeMode === "live") {
    try {
      const senderBatchId = `NEXUS_BATCH_${Date.now()}`;
      const senderItemId = `ITEM_${crypto.randomUUID().slice(0, 8)}`;
      const { data } = await paypalSandboxFetch<{
        batch_header?: { payout_batch_id?: string; batch_status?: string };
      }>({
        path: "/v1/payments/payouts",
        method: "POST",
        body: {
          sender_batch_header: {
            sender_batch_id: senderBatchId,
            email_subject: "NexusPulse — Instant Proof-of-Human Oracle Bounty Payout!",
            email_message: params.note,
          },
          items: [
            {
              recipient_type: params.recipientType ?? "EMAIL",
              amount: {
                value: Number(params.amountValue).toFixed(2),
                currency: params.currencyCode ?? "USD",
              },
              note: params.note,
              sender_item_id: senderItemId,
              receiver: params.receiver,
            },
          ],
        },
      });

      const realBatchId = data.batch_header?.payout_batch_id;
      let batchStatus: PayPalPayoutRecord["batch_status"] =
        (data.batch_header?.batch_status as PayPalPayoutRecord["batch_status"]) || "PENDING";
      let resolvedItemId = senderItemId;

      if (realBatchId) {
        try {
          const polled = await getPayoutBatchStatusViaApi(realBatchId);
          batchStatus = polled.batchStatus;
          if (polled.payoutItemId) resolvedItemId = polled.payoutItemId;
        } catch {
          // Payout remains PENDING/PROCESSING while PayPal clears batch asynchronously
        }
      }

      const record = mirrorCreatePayout({
        ...params,
        mode: activeMode,
        overrideBatchId: realBatchId,
        overrideBatchStatus: batchStatus,
        overrideSenderBatchId: senderBatchId,
        overrideSenderItemId: resolvedItemId,
      });
      syncPayoutToSupabase(record).catch(() => {});
      return record;
    } catch (err) {
      console.warn(`[PayPal Gateway] Live ${activeMode} Payout fallback:`, err);
    }
  }

  const record = mirrorCreatePayout({
    ...params,
    mode: "mirror",
  });
  syncPayoutToSupabase(record).catch(() => {});
  return record;
}

/**
 * Credential-First Subscription Optimization (`POST /v1/billing/subscriptions/{id}/revise` or `/cancel`)
 */
export async function gatewayOptimizeSubscription(params: {
  subscriptionId: string;
  action: "REVISE_DOWNGRADE" | "CANCEL_UNUSED" | "NEGOTIATE_DISCOUNT";
  targetPlanId?: string;
}): Promise<{
  subscription: PayPalSubscriptionRecord;
  monthlySaved: number;
  annualSaved: number;
  fallbackReason?: string;
}> {
  const activeMode = resolveActivePayPalMode();

  if (activeMode === "sandbox" || activeMode === "live") {
    try {
      if (params.action === "CANCEL_UNUSED") {
        await paypalSandboxFetch({
          path: `/v1/billing/subscriptions/${encodeURIComponent(params.subscriptionId)}/cancel`,
          method: "POST",
          body: { reason: "Cancelled automatically by NexusPulse AI CFO (Unused >30 days)" },
        });
      } else if (params.targetPlanId) {
        await paypalSandboxFetch({
          path: `/v1/billing/subscriptions/${encodeURIComponent(params.subscriptionId)}/revise`,
          method: "POST",
          body: { plan_id: params.targetPlanId },
        });
      } else {
        // Verify subscription existence in live Sandbox before applying change
        await paypalSandboxFetch({
          path: `/v1/billing/subscriptions/${encodeURIComponent(params.subscriptionId)}`,
          method: "GET",
        });
      }
      const result = mirrorOptimizeSubscription({ ...params, mode: activeMode });
      syncSubscriptionToSupabase(result.subscription).catch(() => {});
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn("[PayPal Gateway] Live Sandbox Subscription action fallback:", msg);
      const result = mirrorOptimizeSubscription({ ...params, mode: "mirror" });
      syncSubscriptionToSupabase(result.subscription).catch(() => {});
      return {
        ...result,
        fallbackReason: `Pre-seeded subscription fixture; ${msg.slice(0, 120)}`,
      };
    }
  }

  const result = mirrorOptimizeSubscription({ ...params, mode: "mirror" });
  syncSubscriptionToSupabase(result.subscription).catch(() => {});
  return result;
}

/**
 * Creates a live PayPal Sandbox Catalog Product + Billing Plan + Subscription & adds to state.
 */
export async function gatewayCreateLiveSandboxSubscription(params: {
  planName: string;
  merchantName?: string;
  amountValue: string;
  marketBenchmarkValue?: string;
  returnUrl?: string;
  cancelUrl?: string;
}) {
  const activeMode = resolveActivePayPalMode();
  const state = getMirrorState();
  const amountNum = Number(params.amountValue);
  const benchmarkNum = Number(params.marketBenchmarkValue ?? (amountNum * 0.6).toFixed(2));
  const savings = Math.max(0, Number((amountNum - benchmarkNum).toFixed(2)));

  if (activeMode !== "sandbox" && activeMode !== "live") {
    throw new PayPalIntegrationError(
      400,
      "SANDBOX_MODE_REQUIRED",
      "Switch PayPal Mode to Sandbox with valid credentials to provision a live Billing Plan."
    );
  }

  const live = await createLiveSandboxSubscription({
    planName: params.planName,
    description: `${params.merchantName || "NexusPulse"} live PayPal Sandbox billing plan`,
    amountValue: amountNum.toFixed(2),
    returnUrl: params.returnUrl,
    cancelUrl: params.cancelUrl,
  });

  const subRecord: PayPalSubscriptionRecord = {
    id: live.subscriptionId,
    plan_id: live.planId,
    plan_name: params.planName,
    merchant_name: params.merchantName || "PayPal Sandbox Merchant (Slot 013)",
    status: live.status === "ACTIVE" ? "ACTIVE" : "SUSPENDED",
    billing_amount: { currency_code: "USD", value: amountNum.toFixed(2) },
    market_benchmark_amount: { currency_code: "USD", value: benchmarkNum.toFixed(2) },
    potential_monthly_savings: { currency_code: "USD", value: savings.toFixed(2) },
    interval_unit: "MONTH",
    next_billing_time: new Date(Date.now() + 30 * 86400 * 1000).toISOString(),
    ai_recommendation: savings > 0 ? "REVISE_DOWNGRADE" : "KEEP",
    ai_rationale: `Live PayPal Sandbox Subscription (${live.subscriptionId}) under Plan ${live.planId}. Approve URL ready.`,
    last_used_days_ago: 0,
    mode: activeMode,
  };

  state.subscriptions.unshift(subRecord);
  syncSubscriptionToSupabase(subRecord).catch(() => {});

  return {
    ...live,
    subscription: subRecord,
  };
}

/**
 * Creates & sends a live PayPal Invoicing v2 invoice to Slot 013 Buyer account and logs to state.
 */
export async function gatewayCreateLiveSandboxInvoice(params: {
  recipientEmail?: string;
  recipientName?: string;
  amountValue: string;
  itemName: string;
  note?: string;
}) {
  const activeMode = resolveActivePayPalMode();
  const accounts = getSandboxAccountsConfig();
  const state = getMirrorState();
  const recipientEmail = params.recipientEmail || accounts.buyerEmail;
  const amount = Number(params.amountValue).toFixed(2);

  if (activeMode !== "sandbox" && activeMode !== "live") {
    const id = `INV-MIRROR-${Date.now().toString().slice(-6)}`;
    const inv = {
      id,
      invoice_number: `#NP-${Date.now().toString().slice(-4)}`,
      status: "SENT" as const,
      recipient_name: params.recipientName || "John Doe (Slot 013 Buyer)",
      recipient_email: recipientEmail,
      item_name: params.itemName,
      amount: { currency_code: "USD", value: amount },
      due_date: new Date(Date.now() + 10 * 86400 * 1000).toISOString().slice(0, 10),
      early_payment_discount_percent: 3,
      mode: "mirror" as const,
      create_time: new Date().toISOString(),
    };
    state.invoices.unshift(inv);
    return { invoice: inv, viewUrl: undefined, mode: "mirror" as const };
  }

  const live = await createAndSendLivePayPalInvoice({
    recipientEmail,
    recipientName: params.recipientName,
    amountValue: amount,
    itemName: params.itemName,
    note: params.note,
  });

  const inv = {
    id: live.invoiceId,
    invoice_number: live.invoiceNumber,
    status: live.status === "PAID" ? ("PAID" as const) : ("SENT" as const),
    recipient_name: params.recipientName || "John Doe (Slot 013 Buyer)",
    recipient_email: recipientEmail,
    item_name: params.itemName,
    amount: { currency_code: "USD", value: amount },
    due_date: new Date(Date.now() + 10 * 86400 * 1000).toISOString().slice(0, 10),
    early_payment_discount_percent: 3,
    mode: activeMode,
    create_time: new Date().toISOString(),
  };
  state.invoices.unshift(inv);

  state.webhookEvents.unshift({
    id: `WH-${crypto.randomUUID().slice(0, 8)}`,
    event_type: "INVOICING.INVOICE.CREATED",
    resource_id: live.invoiceId,
    summary: `Issued live PayPal Invoice ${live.invoiceNumber} ($${amount} USD) to ${recipientEmail}`,
    verification_status: "SUCCESS",
    created_at: new Date().toISOString(),
  });

  return { invoice: inv, viewUrl: live.viewUrl, mode: activeMode };
}

/**
 * Syncs live PayPal Sandbox REST telemetry (Webhooks, Disputes, Invoices, Catalog Plans, SDK Token).
 */
export async function gatewaySyncSandboxTelemetry(): Promise<PayPalLiveTelemetry> {
  const telemetry = await probeLiveSandboxTelemetry();
  const state = getMirrorState();

  if (telemetry.connected && telemetry.recentInvoices?.length) {
    for (const liveInv of telemetry.recentInvoices) {
      if (!state.invoices.some((i) => i.id === liveInv.id)) {
        state.invoices.unshift({
          id: liveInv.id,
          invoice_number: liveInv.invoice_number || liveInv.id.slice(0, 14),
          status:
            liveInv.status === "PAID"
              ? "PAID"
              : liveInv.status === "SENT"
                ? "SENT"
                : "DRAFT",
          recipient_name: "John Doe (Slot 013 Buyer)",
          recipient_email: liveInv.recipient_email || getSandboxAccountsConfig().buyerEmail,
          item_name: "Synced Live PayPal Sandbox Invoice",
          amount: {
            currency_code: liveInv.currency_code || "USD",
            value: liveInv.amount_value || "0.00",
          },
          due_date: new Date().toISOString().slice(0, 10),
          mode: "sandbox",
          create_time: new Date().toISOString(),
        });
      }
    }
  }

  return telemetry;
}
