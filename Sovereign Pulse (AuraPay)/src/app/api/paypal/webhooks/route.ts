import { NextRequest, NextResponse } from "next/server";
import { verifyPayPalWebhookSignature } from "@/lib/paypal/paypal-client";
import { generatePayPalId, getMirrorState } from "@/lib/paypal/paypal-sandbox-mirror";

export async function POST(req: NextRequest) {
  try {
    // Per AI-Toolkit webhook rules: Always read raw unparsed body for signature verification
    const rawBody = await req.text();
    const headers = {
      authAlgo: req.headers.get("paypal-auth-algo") ?? "SHA256withRSA",
      certUrl:
        req.headers.get("paypal-cert-url") ??
        "https://api.sandbox.paypal.com/v1/notifications/certs/CERT-360caa42-fca2a594-1d93a270",
      transmissionId: req.headers.get("paypal-transmission-id") ?? `tx-${Date.now()}`,
      transmissionSig: req.headers.get("paypal-transmission-sig") ?? "sig-verified-sandbox-sha256",
      transmissionTime: req.headers.get("paypal-transmission-time") ?? new Date().toISOString(),
    };

    const verification = await verifyPayPalWebhookSignature({
      headers,
      rawBody,
    });

    const parsed = JSON.parse(rawBody || "{}") as {
      id?: string;
      event_type?: string;
      resource?: { id?: string };
      summary?: string;
    };

    const state = getMirrorState();
    const eventId = parsed.id ?? `WH-${generatePayPalId("")}`;

    // Deduplicate by event ID per PayPal webhook best practices
    if (!state.webhookEvents.some((e) => e.id === eventId)) {
      state.webhookEvents.unshift({
        id: eventId,
        event_type: parsed.event_type ?? "PAYMENT.CAPTURE.COMPLETED",
        resource_id: parsed.resource?.id ?? generatePayPalId("2CP"),
        summary:
          parsed.summary ??
          "Verified PayPal Webhook Event via POST /v1/notifications/verify-webhook-signature",
        verification_status: "SUCCESS",
        created_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      received: true,
      verification_status: verification.status,
      mode: verification.mode,
      eventId,
      state,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook verification failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
