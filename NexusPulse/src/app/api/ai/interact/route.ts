import { NextRequest, NextResponse } from "next/server";
import { runNexusPulseAgentInteraction } from "@/lib/ai/gemini-agent";
import { getMirrorState } from "@/lib/paypal/paypal-sandbox-mirror";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      prompt: string;
      previousInteractionId?: string;
      mode?: "fast_agent" | "deep_cfo_audit";
    };

    if (!body.prompt?.trim()) {
      return NextResponse.json({ error: "prompt is required" }, { status: 400 });
    }

    const result = await runNexusPulseAgentInteraction({
      prompt: body.prompt,
      previousInteractionId: body.previousInteractionId,
      mode: body.mode ?? "fast_agent",
    });

    return NextResponse.json({
      ...result,
      state: getMirrorState(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gemini interaction failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
