import { NextRequest, NextResponse } from "next/server";
import { generateBrowserClientToken, hasLiveSandboxCredentials } from "@/lib/paypal/paypal-client";
import { resolveActivePayPalMode, setRuntimePayPalCredentials } from "@/lib/paypal/paypal-gateway";
import { getMirrorState, hydrateMirrorState, resetMirrorState } from "@/lib/paypal/paypal-sandbox-mirror";
import { isSupabaseConfigured, loadStateFromSupabase, syncMetaToSupabase } from "@/lib/db/supabase-client";
import { isAllowedFetchSite, sanitizeText } from "@/lib/security/validation";

const VARY_HEADERS = {
  Vary: "Sec-Fetch-Dest, Sec-Fetch-Mode, Sec-Fetch-Site",
};

function maskClientId(rawId?: string): string {
  const cleaned = rawId?.trim();
  if (!cleaned) return "sb-mirror-client-id";
  if (cleaned.length <= 12) return cleaned;
  return `${cleaned.slice(0, 6)}...${cleaned.slice(-4)}`;
}

export async function GET() {
  const supabaseState = isSupabaseConfigured() ? await loadStateFromSupabase() : null;
  const state = supabaseState ? hydrateMirrorState(supabaseState) : getMirrorState();
  const activeMode = resolveActivePayPalMode();
  const hasLive = hasLiveSandboxCredentials();
  const clientToken = await generateBrowserClientToken().catch(() => "mirror_client_token");

  return NextResponse.json(
    {
      ok: true,
      activeMode,
      hasLiveCredentials: hasLive,
      preferredMode: state.preferredMode,
      paypalClientId: maskClientId(process.env.PAYPAL_CLIENT_ID),
      clientToken,
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
      supabaseConfigured: isSupabaseConfigured(),
      database: isSupabaseConfigured() ? "supabase_postgres" : "in_memory_mirror",
      state,
    },
    { headers: VARY_HEADERS }
  );
}

export async function POST(req: NextRequest) {
  if (!isAllowedFetchSite(req.headers)) {
    return NextResponse.json(
      { error: "Cross-site state mutation rejected by Sec-Fetch-Site policy" },
      { status: 403, headers: VARY_HEADERS }
    );
  }

  try {
    const body = (await req.json()) as {
      action?: "RESET_STATE" | "SET_CREDENTIALS";
      clientId?: string;
      clientSecret?: string;
      preferredMode?: "auto" | "sandbox" | "mirror";
    };

    if (body.action === "RESET_STATE") {
      const fresh = resetMirrorState();
      syncMetaToSupabase(fresh).catch(() => {});
      return NextResponse.json(
        {
          ok: true,
          activeMode: resolveActivePayPalMode(),
          hasLiveCredentials: hasLiveSandboxCredentials(),
          preferredMode: fresh.preferredMode,
          supabaseConfigured: isSupabaseConfigured(),
          database: isSupabaseConfigured() ? "supabase_postgres" : "in_memory_mirror",
          state: fresh,
        },
        { headers: VARY_HEADERS }
      );
    }

    const allowedModes = new Set(["auto", "sandbox", "mirror"]);
    const preferredMode =
      body.preferredMode && allowedModes.has(body.preferredMode) ? body.preferredMode : undefined;

    const updated = setRuntimePayPalCredentials({
      clientId: body.clientId ? sanitizeText(body.clientId, 160) : undefined,
      clientSecret: body.clientSecret ? sanitizeText(body.clientSecret, 160) : undefined,
      preferredMode,
    });

    const currentState = getMirrorState();
    syncMetaToSupabase(currentState).catch(() => {});

    return NextResponse.json(
      {
        ok: true,
        ...updated,
        supabaseConfigured: isSupabaseConfigured(),
        database: isSupabaseConfigured() ? "supabase_postgres" : "in_memory_mirror",
        state: currentState,
      },
      { headers: VARY_HEADERS }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "State update failed";
    return NextResponse.json({ error: message }, { status: 400, headers: VARY_HEADERS });
  }
}
