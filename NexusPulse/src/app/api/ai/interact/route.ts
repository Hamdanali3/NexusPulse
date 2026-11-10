import { NextRequest, NextResponse } from "next/server";
import { runNexusPulseAgentInteraction } from "@/lib/ai/gemini-agent";
import { getMirrorState } from "@/lib/paypal/paypal-sandbox-mirror";
import { syncMetaToSupabase } from "@/lib/db/supabase-client";
import { isAllowedFetchSite, sanitizeText } from "@/lib/security/validation";

const VARY_HEADERS = {
  Vary: "Sec-Fetch-Dest, Sec-Fetch-Mode, Sec-Fetch-Site",
};

export async function POST(req: NextRequest) {
  if (!isAllowedFetchSite(req.headers)) {
    return NextResponse.json(
      { error: "Cross-site AI interaction rejected by Sec-Fetch-Site policy" },
      { status: 403, headers: VARY_HEADERS }
    );
  }

  try {
    const body = (await req.json()) as {
      prompt: string;
      previousInteractionId?: string;
      mode?: "fast_agent" | "deep_cfo_audit";
    };

    const cleanPrompt = sanitizeText(body.prompt, 1000);
    if (!cleanPrompt) {
      return NextResponse.json(
        { error: "A non-empty prompt is required" },
        { status: 400, headers: VARY_HEADERS }
      );
    }

    const previousInteractionId = body.previousInteractionId
      ? sanitizeText(body.previousInteractionId, 128)
      : undefined;

    const mode = body.mode === "deep_cfo_audit" ? "deep_cfo_audit" : "fast_agent";

    const result = await runNexusPulseAgentInteraction({
      prompt: cleanPrompt,
      previousInteractionId,
      mode,
    });

    const state = getMirrorState();
    if (result.toolExecutions.length > 0) {
      syncMetaToSupabase(state).catch(() => {});
    }

    return NextResponse.json(
      {
        ...result,
        state,
      },
      { headers: VARY_HEADERS }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gemini interaction failed";
    return NextResponse.json({ error: message }, { status: 500, headers: VARY_HEADERS });
  }
}
