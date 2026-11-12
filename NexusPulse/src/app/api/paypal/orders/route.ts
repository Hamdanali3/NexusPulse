import { NextRequest, NextResponse } from "next/server";
import {
  gatewayCaptureOrAuthorizeOrder,
  gatewayCreateOrder,
} from "@/lib/paypal/paypal-gateway";
import { PayPalIntegrationError } from "@/lib/paypal/paypal-client";
import { getMirrorState } from "@/lib/paypal/paypal-sandbox-mirror";
import { syncMetaToSupabase } from "@/lib/db/supabase-client";
import type { PayPalOrderRecord } from "@/lib/paypal/paypal-types";
import { isAllowedFetchSite, sanitizeText, validateUsdAmount } from "@/lib/security/validation";

const VARY_HEADERS = {
  Vary: "Sec-Fetch-Dest, Sec-Fetch-Mode, Sec-Fetch-Site",
};

export async function POST(req: NextRequest) {
  if (!isAllowedFetchSite(req.headers)) {
    return NextResponse.json(
      { error: "Cross-site order mutation rejected by Sec-Fetch-Site policy" },
      { status: 403, headers: VARY_HEADERS }
    );
  }

  try {
    const body = (await req.json()) as {
      operation: "CREATE" | "CAPTURE" | "AUTHORIZE";
      orderId?: string;
      amountValue?: string;
      currencyCode?: string;
      intent?: "CAPTURE" | "AUTHORIZE";
      description?: string;
      category?: PayPalOrderRecord["category"];
      fundingSource?: PayPalOrderRecord["funding_source"];
      channel3DealId?: string;
      escrowMilestoneId?: string;
      trackingNumber?: string;
      carrier?: string;
      returnUrl?: string;
      cancelUrl?: string;
    };

    const origin = req.nextUrl.origin;

    if (body.operation === "CREATE") {
      const amountCheck = validateUsdAmount(body.amountValue ?? "189.00", { min: 0.5, max: 50000 });
      if (!amountCheck.valid || !amountCheck.formatted) {
        return NextResponse.json(
          { error: amountCheck.error ?? "Invalid order amount" },
          { status: 400, headers: VARY_HEADERS }
        );
      }

      const description =
        sanitizeText(body.description, 200) || "NexusPulse Autonomous PayPal Order";

      const dealParam = body.channel3DealId
        ? `&dealId=${encodeURIComponent(sanitizeText(body.channel3DealId, 64))}`
        : "";
      const defaultReturn = `${origin}/?paypal_return=approved&paypalAction=${body.intent === "AUTHORIZE" ? "authorize" : "capture"}${dealParam}`;
      const defaultCancel = `${origin}/?paypal_return=cancelled`;

      const order = await gatewayCreateOrder({
        amountValue: amountCheck.formatted,
        currencyCode: sanitizeText(body.currencyCode, 3).toUpperCase() || "USD",
        intent: body.intent === "AUTHORIZE" ? "AUTHORIZE" : "CAPTURE",
        description,
        category: body.category ?? "CHANNEL3_DEAL",
        fundingSource: body.fundingSource ?? "paypal",
        returnUrl: body.returnUrl || defaultReturn,
        cancelUrl: body.cancelUrl || defaultCancel,
      });

      // PayPal JS SDK v6 requires { orderId: "..." } shape
      return NextResponse.json(
        {
          orderId: order.id,
          approveUrl: order.approve_url,
          requiresBuyerApproval: order.requires_buyer_approval ?? false,
          order,
          state: getMirrorState(),
        },
        { headers: VARY_HEADERS }
      );
    }

    const cleanOrderId = sanitizeText(body.orderId, 64);
    if (!cleanOrderId) {
      return NextResponse.json(
        { error: "orderId is required for CAPTURE/AUTHORIZE" },
        { status: 400, headers: VARY_HEADERS }
      );
    }

    const updatedOrder = await gatewayCaptureOrAuthorizeOrder({
      orderId: cleanOrderId,
      action: body.operation === "AUTHORIZE" ? "AUTHORIZE" : "CAPTURE",
      fundingSource: body.fundingSource,
      channel3DealId: body.channel3DealId ? sanitizeText(body.channel3DealId, 64) : undefined,
      escrowMilestoneId: body.escrowMilestoneId ? sanitizeText(body.escrowMilestoneId, 64) : undefined,
      trackingNumber: body.trackingNumber ? sanitizeText(body.trackingNumber, 64) : undefined,
      carrier: body.carrier ? sanitizeText(body.carrier, 32) : undefined,
    });

    const state = getMirrorState();
    syncMetaToSupabase(state).catch(() => {});

    return NextResponse.json(
      {
        orderId: updatedOrder.id,
        order: updatedOrder,
        capturedOrder: updatedOrder,
        state,
      },
      { headers: VARY_HEADERS }
    );
  } catch (err) {
    if (err instanceof PayPalIntegrationError) {
      return NextResponse.json(
        {
          error: err.message,
          code: err.errorCode,
          debugId: err.debugId,
          requiresBuyerApproval: err.errorCode === "ORDER_NOT_APPROVED",
        },
        { status: err.statusCode, headers: VARY_HEADERS }
      );
    }
    const message = err instanceof Error ? err.message : "Order operation failed";
    return NextResponse.json({ error: message }, { status: 500, headers: VARY_HEADERS });
  }
}
