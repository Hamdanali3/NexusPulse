import { NextRequest, NextResponse } from "next/server";
import { generateBrowserClientToken, hasLiveSandboxCredentials } from "@/lib/paypal/paypal-client";
import { resolveActivePayPalMode, setRuntimePayPalCredentials } from "@/lib/paypal/paypal-gateway";
import { getMirrorState, resetMirrorState } from "@/lib/paypal/paypal-sandbox-mirror";

export async function GET() {
  const state = getMirrorState();
  const activeMode = resolveActivePayPalMode();
  const hasLive = hasLiveSandboxCredentials();
  const clientToken = await generateBrowserClientToken().catch(() => "mirror_client_token");

  return NextResponse.json({
    ok: true,
    activeMode,
    hasLiveCredentials: hasLive,
    preferredMode: state.preferredMode,
    paypalClientId: process.env.PAYPAL_CLIENT_ID || "sb-mirror-client-id",
    clientToken,
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    state,
  });
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    action?: "RESET_STATE" | "SET_CREDENTIALS";
    clientId?: string;
    clientSecret?: string;
    preferredMode?: "auto" | "sandbox" | "mirror";
  };

  if (body.action === "RESET_STATE") {
    const fresh = resetMirrorState();
    return NextResponse.json({
      ok: true,
      activeMode: resolveActivePayPalMode(),
      hasLiveCredentials: hasLiveSandboxCredentials(),
      preferredMode: fresh.preferredMode,
      state: fresh,
    });
  }

  const updated = setRuntimePayPalCredentials(body);
  return NextResponse.json({
    ok: true,
    ...updated,
    state: getMirrorState(),
  });
}
