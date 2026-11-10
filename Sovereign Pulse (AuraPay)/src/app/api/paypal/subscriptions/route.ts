import { NextRequest, NextResponse } from "next/server";
import { gatewayOptimizeSubscription } from "@/lib/paypal/paypal-gateway";
import { getMirrorState } from "@/lib/paypal/paypal-sandbox-mirror";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      subscriptionId: string;
      action: "REVISE_DOWNGRADE" | "CANCEL_UNUSED" | "NEGOTIATE_DISCOUNT";
    };

    const result = await gatewayOptimizeSubscription({
      subscriptionId: body.subscriptionId,
      action: body.action,
    });

    return NextResponse.json({
      ok: true,
      ...result,
      state: getMirrorState(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Subscription optimization failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
