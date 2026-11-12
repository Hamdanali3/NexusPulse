import { NextRequest, NextResponse } from "next/server";
import {
  gatewayCreateLiveSandboxSubscription,
  gatewayOptimizeSubscription,
} from "@/lib/paypal/paypal-gateway";
import { PayPalIntegrationError } from "@/lib/paypal/paypal-client";
import { getMirrorState } from "@/lib/paypal/paypal-sandbox-mirror";
import { syncMetaToSupabase } from "@/lib/db/supabase-client";
import { isAllowedFetchSite, sanitizeText, validateUsdAmount } from "@/lib/security/validation";

const VARY_HEADERS = {
  Vary: "Sec-Fetch-Dest, Sec-Fetch-Mode, Sec-Fetch-Site",
};

const ALLOWED_ACTIONS = new Set([
  "REVISE_DOWNGRADE",
  "CANCEL_UNUSED",
  "NEGOTIATE_DISCOUNT",
] as const);

export async function POST(req: NextRequest) {
  if (!isAllowedFetchSite(req.headers)) {
    return NextResponse.json(
      { error: "Cross-site subscription mutation rejected by Sec-Fetch-Site policy" },
      { status: 403, headers: VARY_HEADERS }
    );
  }

  try {
    const body = (await req.json()) as {
      subscriptionId?: string;
      action:
        | "REVISE_DOWNGRADE"
        | "CANCEL_UNUSED"
        | "NEGOTIATE_DISCOUNT"
        | "CREATE_LIVE_SUBSCRIPTION";
      planName?: string;
      merchantName?: string;
      amountValue?: string;
      marketBenchmarkValue?: string;
      targetPlanId?: string;
    };

    if (body.action === "CREATE_LIVE_SUBSCRIPTION") {
      const amountCheck = validateUsdAmount(body.amountValue ?? "79.00", { min: 1, max: 5000 });
      if (!amountCheck.valid || !amountCheck.formatted) {
        return NextResponse.json(
          { error: amountCheck.error ?? "Invalid plan amount" },
          { status: 400, headers: VARY_HEADERS }
        );
      }

      const origin = req.nextUrl.origin;
      const created = await gatewayCreateLiveSandboxSubscription({
        planName:
          sanitizeText(body.planName, 120) || "NexusPulse Compute GPU Plan (Sandbox)",
        merchantName:
          sanitizeText(body.merchantName, 120) || "Slot 013 Cloud Merchant",
        amountValue: amountCheck.formatted,
        marketBenchmarkValue: body.marketBenchmarkValue,
        returnUrl: `${origin}/?tab=bryntum&paypal_sub=approved`,
        cancelUrl: `${origin}/?tab=bryntum&paypal_sub=cancelled`,
      });

      const state = getMirrorState();
      syncMetaToSupabase(state).catch(() => {});

      return NextResponse.json(
        {
          ok: true,
          ...created,
          state,
        },
        { headers: VARY_HEADERS }
      );
    }

    const subscriptionId = sanitizeText(body.subscriptionId, 64);
    if (!subscriptionId) {
      return NextResponse.json(
        { error: "subscriptionId is required" },
        { status: 400, headers: VARY_HEADERS }
      );
    }

    if (!ALLOWED_ACTIONS.has(body.action)) {
      return NextResponse.json(
        { error: "Invalid subscription optimization action" },
        { status: 400, headers: VARY_HEADERS }
      );
    }

    const result = await gatewayOptimizeSubscription({
      subscriptionId,
      action: body.action,
      targetPlanId: body.targetPlanId ? sanitizeText(body.targetPlanId, 64) : undefined,
    });

    const state = getMirrorState();
    syncMetaToSupabase(state).catch(() => {});

    return NextResponse.json(
      {
        ok: true,
        ...result,
        state,
      },
      { headers: VARY_HEADERS }
    );
  } catch (err) {
    if (err instanceof PayPalIntegrationError) {
      return NextResponse.json(
        { error: err.message, code: err.errorCode },
        { status: err.statusCode, headers: VARY_HEADERS }
      );
    }
    const message = err instanceof Error ? err.message : "Subscription optimization failed";
    return NextResponse.json({ error: message }, { status: 500, headers: VARY_HEADERS });
  }
}
