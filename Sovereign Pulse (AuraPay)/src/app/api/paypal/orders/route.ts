import { NextRequest, NextResponse } from "next/server";
import {
  gatewayCaptureOrAuthorizeOrder,
  gatewayCreateOrder,
} from "@/lib/paypal/paypal-gateway";
import { getMirrorState } from "@/lib/paypal/paypal-sandbox-mirror";
import type { PayPalOrderRecord } from "@/lib/paypal/paypal-types";

export async function POST(req: NextRequest) {
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
    };

    if (body.operation === "CREATE") {
      const order = await gatewayCreateOrder({
        amountValue: body.amountValue ?? "189.00",
        currencyCode: body.currencyCode ?? "USD",
        intent: body.intent ?? "CAPTURE",
        description: body.description ?? "Sovereign Pulse PayPal Order",
        category: body.category ?? "CHANNEL3_DEAL",
        fundingSource: body.fundingSource ?? "paypal",
      });

      // Note: PayPal JS SDK v6 requires { orderId: "..." } shape!
      return NextResponse.json({
        orderId: order.id,
        order,
        state: getMirrorState(),
      });
    }

    if (!body.orderId) {
      return NextResponse.json({ error: "orderId is required for CAPTURE/AUTHORIZE" }, { status: 400 });
    }

    const updatedOrder = await gatewayCaptureOrAuthorizeOrder({
      orderId: body.orderId,
      action: body.operation,
      fundingSource: body.fundingSource,
      channel3DealId: body.channel3DealId,
      escrowMilestoneId: body.escrowMilestoneId,
      trackingNumber: body.trackingNumber,
      carrier: body.carrier,
    });

    return NextResponse.json({
      orderId: updatedOrder.id,
      order: updatedOrder,
      state: getMirrorState(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Order operation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
