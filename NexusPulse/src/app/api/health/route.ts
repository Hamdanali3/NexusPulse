import { NextResponse } from "next/server";
import { hasLiveSandboxCredentials } from "@/lib/paypal/paypal-client";
import { resolveActivePayPalMode } from "@/lib/paypal/paypal-gateway";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "nexus-pulse-engine",
    timestamp: new Date().toISOString(),
    paypal: {
      activeMode: resolveActivePayPalMode(),
      hasLiveSandboxCredentials: hasLiveSandboxCredentials(),
      sdkVersion: "@paypal/paypal-server-sdk@2.5.0",
      agentToolkitVersion: "@paypal/agent-toolkit@1.11.0",
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
