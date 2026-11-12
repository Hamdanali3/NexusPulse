import { NextResponse } from "next/server";
import {
  getPublicPayPalClientId,
  getSandboxAccountsConfig,
  hasLiveSandboxCredentials,
  isPayPalLiveEnvironment,
} from "@/lib/paypal/paypal-client";
import { resolveActivePayPalMode } from "@/lib/paypal/paypal-gateway";

export async function GET() {
  const sandboxAccounts = getSandboxAccountsConfig();
  return NextResponse.json({
    status: "ok",
    service: "nexus-pulse-engine",
    timestamp: new Date().toISOString(),
    paypal: {
      activeMode: resolveActivePayPalMode(),
      environment: isPayPalLiveEnvironment() ? "live" : "sandbox",
      hasLiveSandboxCredentials: hasLiveSandboxCredentials(),
      publicClientIdConfigured: Boolean(getPublicPayPalClientId()),
      sandboxSlot: sandboxAccounts.slot,
      sdkVersion: "@paypal/paypal-server-sdk@2.5.0",
      agentToolkitVersion: "@paypal/agent-toolkit@1.11.0",
      jsSdkV6: "https://www.sandbox.paypal.com/web-sdk/v6/core",
    },
    ai: {
      sdk: "@google/genai@3.0.0",
      api: "interactions.create",
      models: [
        "gemini-4-argon",
        "gemini-3.8-flash",
        "gemini-3.8-flash-tts",
        "gemini-nano-banana-2.1",
      ],
      configured: Boolean(process.env.GEMINI_API_KEY),
    },
    sponsors: ["AG Grid", "APIMatic", "Bryntum", "Channel3", "Render"],
  });
}
