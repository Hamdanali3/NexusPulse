import { NextRequest, NextResponse } from "next/server";
import { gatewayOptimizeSubscription } from "@/lib/paypal/paypal-gateway";
import { getMirrorState } from "@/lib/paypal/paypal-sandbox-mirror";
import { syncMetaToSupabase } from "@/lib/db/supabase-client";
import { isAllowedFetchSite, sanitizeText } from "@/lib/security/validation";

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
      subscriptionId: string;
      action: "REVISE_DOWNGRADE" | "CANCEL_UNUSED" | "NEGOTIATE_DISCOUNT";
    };

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
    const message = err instanceof Error ? err.message : "Subscription optimization failed";
    return NextResponse.json({ error: message }, { status: 500, headers: VARY_HEADERS });
  }
}
