import { NextResponse } from "next/server";
import {
  getBrowserClientTokenSafe,
  getPublicPayPalClientId,
  getSandboxAccountsConfig,
  hasLiveSandboxCredentials,
  isPayPalLiveEnvironment,
} from "@/lib/paypal/paypal-client";
import { resolveActivePayPalMode } from "@/lib/paypal/paypal-gateway";

export async function GET() {
  const { clientToken, isLive } = await getBrowserClientTokenSafe();
  const accounts = getSandboxAccountsConfig();

  return NextResponse.json({
    ok: true,
    activeMode: resolveActivePayPalMode(),
    environment: isPayPalLiveEnvironment() ? "live" : "sandbox",
    hasLiveCredentials: hasLiveSandboxCredentials(),
    publicPayPalClientId: getPublicPayPalClientId(),
    clientToken,
    clientTokenIsLive: isLive,
    sdkV6Url: "https://www.sandbox.paypal.com/web-sdk/v6/core",
    sandboxSlot: accounts.slot,
  });
}
