import { NextRequest, NextResponse } from "next/server";
import { generateBrowserClientToken, hasLiveSandboxCredentials } from "@/lib/paypal/paypal-client";
import { resolveActivePayPalMode, setRuntimePayPalCredentials } from "@/lib/paypal/paypal-gateway";
import { getMirrorState, resetMirrorState } from "@/lib/paypal/paypal-sandbox-mirror";
import { isSupabaseConfigured, loadStateFromSupabase } from "@/lib/db/supabase-client";

export async function GET() {
  const supabaseState = isSupabaseConfigured() ? await loadStateFromSupabase() : null;
  const state = supabaseState || getMirrorState();
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
    supabaseConfigured: isSupabaseConfigured(),
    database: isSupabaseConfigured() ? "supabase_postgres" : "in_memory_mirror",
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
      supabaseConfigured: isSupabaseConfigured(),
      database: isSupabaseConfigured() ? "supabase_postgres" : "in_memory_mirror",
      state: fresh,
    });
  }

  const updated = setRuntimePayPalCredentials(body);
  const supabaseState = isSupabaseConfigured() ? await loadStateFromSupabase() : null;
  return NextResponse.json({
    ok: true,
    ...updated,
    supabaseConfigured: isSupabaseConfigured(),
    database: isSupabaseConfigured() ? "supabase_postgres" : "in_memory_mirror",
    state: supabaseState || getMirrorState(),
  });
}
