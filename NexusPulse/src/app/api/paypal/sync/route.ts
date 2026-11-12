import { NextRequest, NextResponse } from "next/server";
import { getSandboxAccountsConfig, registerLiveSandboxWebhook } from "@/lib/paypal/paypal-client";
import {
  getPayPalGatewayStatus,
  gatewaySyncSandboxTelemetry,
} from "@/lib/paypal/paypal-gateway";
import { getMirrorState } from "@/lib/paypal/paypal-sandbox-mirror";
import { isSupabaseConfigured, syncMetaToSupabase } from "@/lib/db/supabase-client";
import { isAllowedFetchSite, sanitizeText } from "@/lib/security/validation";

const VARY_HEADERS = {
  Vary: "Sec-Fetch-Dest, Sec-Fetch-Mode, Sec-Fetch-Site",
};

export async function GET() {
  try {
    const telemetry = await gatewaySyncSandboxTelemetry();
    const state = getMirrorState();
    return NextResponse.json(
      {
        ok: true,
        telemetry,
        accounts: getSandboxAccountsConfig(),
        gateway: getPayPalGatewayStatus(),
        state,
      },
      { headers: VARY_HEADERS }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to sync PayPal Sandbox telemetry";
    return NextResponse.json({ error: message }, { status: 500, headers: VARY_HEADERS });
  }
}

export async function POST(req: NextRequest) {
  if (!isAllowedFetchSite(req.headers)) {
    return NextResponse.json(
      { error: "Cross-site request blocked by Sec-Fetch-Site policy" },
      { status: 403, headers: VARY_HEADERS }
    );
  }

  try {
    const body = (await req.json().catch(() => ({}))) as {
      action?: "SYNC_TELEMETRY" | "REGISTER_WEBHOOK";
      webhookUrl?: string;
    };

    let registeredWebhook: { id: string; url: string } | null = null;
    if (body.action === "REGISTER_WEBHOOK" && body.webhookUrl) {
      const url = sanitizeText(body.webhookUrl, 240);
      if (!url.startsWith("https://")) {
        return NextResponse.json(
          { error: "PayPal Sandbox requires an https:// public webhook URL" },
          { status: 400, headers: VARY_HEADERS }
        );
      }
      registeredWebhook = await registerLiveSandboxWebhook(url);
    }

    const telemetry = await gatewaySyncSandboxTelemetry();
    const state = getMirrorState();
    if (isSupabaseConfigured()) {
      syncMetaToSupabase(state).catch(() => {});
    }

    return NextResponse.json(
      {
        ok: true,
        telemetry,
        registeredWebhook,
        accounts: getSandboxAccountsConfig(),
        gateway: getPayPalGatewayStatus(),
        state,
      },
      { headers: VARY_HEADERS }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "PayPal Sandbox sync error";
    return NextResponse.json({ error: message }, { status: 500, headers: VARY_HEADERS });
  }
}
