import crypto from "crypto";
import {
  createLiveSandboxOrderViaSdk,
  getApimaticPayPalSdk,
  hasLiveSandboxCredentials,
  paypalSandboxFetch,
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
  PayPalOrderRecord,
  PayPalPayoutRecord,
  PayPalSubscriptionRecord,
} from "./paypal-types";

export function resolveActivePayPalMode(): PayPalExecutionMode {
  const state = getMirrorState();
  const envPref = (process.env.PAYPAL_MODE ?? state.preferredMode ?? "auto").toLowerCase();
  if (envPref === "mirror") return "mirror";
  if (envPref === "sandbox" && hasLiveSandboxCredentials()) return "sandbox";
  return hasLiveSandboxCredentials() ? "sandbox" : "mirror";
}

export function setRuntimePayPalCredentials(params: {
  clientId?: string;
  clientSecret?: string;
  preferredMode?: "auto" | "sandbox" | "mirror";
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

/**
 * Dual-Mode Order Creation (Orders API v2 + APIMatic @paypal/paypal-server-sdk)
 */
export async function gatewayCreateOrder(params: {
  amountValue: string;
  currencyCode?: string;
  intent?: "CAPTURE" | "AUTHORIZE";
  description: string;
  category?: PayPalOrderRecord["category"];
  fundingSource?: PayPalOrderRecord["funding_source"];
}): Promise<PayPalOrderRecord> {
  const activeMode = resolveActivePayPalMode();

  if (activeMode === "sandbox") {
    try {
      const { order, paypalRequestId } = await createLiveSandboxOrderViaSdk({
        amountValue: params.amountValue,
        currencyCode: params.currencyCode,
        intent: params.intent,
        description: params.description,
      });

      const record = mirrorCreateOrder({
        ...params,
        paypalRequestId,
        mode: "sandbox",
      });
      if (order.id) {
        record.id = order.id;
      }
      syncOrderToSupabase(record).catch(() => {});
      return record;
    } catch (err) {
      console.warn("[Dual-Mode Gateway] Live Sandbox createOrder fell back to Mirror:", err);
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
 * Dual-Mode Order Capture / Authorize (Orders API v2 + APIMatic @paypal/paypal-server-sdk)
 */
export async function gatewayCaptureOrAuthorizeOrder(params: {
  orderId: string;
  action?: "CAPTURE" | "AUTHORIZE";
  fundingSource?: PayPalOrderRecord["funding_source"];
  channel3DealId?: string;
  escrowMilestoneId?: string;
  trackingNumber?: string;
  carrier?: string;
}): Promise<PayPalOrderRecord> {
  const activeMode = resolveActivePayPalMode();

  if (activeMode === "sandbox") {
    const sdk = getApimaticPayPalSdk();
    if (sdk) {
      try {
        const paypalRequestId = crypto.randomUUID();
        if (params.action === "AUTHORIZE") {
          await sdk.ordersController.authorizeOrder({
            id: params.orderId,
            paypalRequestId,
            prefer: "return=representation",
          });
        } else {
          await sdk.ordersController.captureOrder({
            id: params.orderId,
            paypalRequestId,
            prefer: "return=representation",
          });
        }
        const captured = mirrorCaptureOrAuthorizeOrder({
          ...params,
          mode: "sandbox",
        });
        syncOrderToSupabase(captured).catch(() => {});
        return captured;
      } catch (err) {
        console.warn("[Dual-Mode Gateway] Live Sandbox capture/authorize fell back to Mirror:", err);
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
 * Dual-Mode Instant Payout Dispatch (`POST /v1/payments/payouts`)
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

  if (activeMode === "sandbox") {
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

      const record = mirrorCreatePayout({
        ...params,
        mode: "sandbox",
      });
      if (data.batch_header?.payout_batch_id) {
        record.payout_batch_id = data.batch_header.payout_batch_id;
      }
      syncPayoutToSupabase(record).catch(() => {});
      return record;
    } catch (err) {
      console.warn("[Dual-Mode Gateway] Live Sandbox Payout fell back to Mirror:", err);
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
 * Dual-Mode Subscription Optimization (`POST /v1/billing/subscriptions/{id}/revise` or `/cancel`)
 */
export async function gatewayOptimizeSubscription(params: {
  subscriptionId: string;
  action: "REVISE_DOWNGRADE" | "CANCEL_UNUSED" | "NEGOTIATE_DISCOUNT";
}): Promise<{ subscription: PayPalSubscriptionRecord; monthlySaved: number; annualSaved: number }> {
  const activeMode = resolveActivePayPalMode();

  if (activeMode === "sandbox") {
    try {
      if (params.action === "CANCEL_UNUSED") {
        await paypalSandboxFetch({
          path: `/v1/billing/subscriptions/${encodeURIComponent(params.subscriptionId)}/cancel`,
          method: "POST",
          body: { reason: "Cancelled automatically by NexusPulse AI CFO (Unused >30 days)" },
        });
      }
      const result = mirrorOptimizeSubscription({ ...params, mode: "sandbox" });
      syncSubscriptionToSupabase(result.subscription).catch(() => {});
      return result;
    } catch (err) {
      console.warn("[Dual-Mode Gateway] Live Sandbox Subscription action fell back to Mirror:", err);
    }
  }

  const result = mirrorOptimizeSubscription({ ...params, mode: "mirror" });
  syncSubscriptionToSupabase(result.subscription).catch(() => {});
  return result;
}
