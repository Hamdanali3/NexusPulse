import { NextRequest, NextResponse } from "next/server";
import { generateCfoVoiceBriefingAudio } from "@/lib/ai/gemini-agent";
import { isAllowedFetchSite } from "@/lib/security/validation";

const VARY_HEADERS = {
  Vary: "Sec-Fetch-Dest, Sec-Fetch-Mode, Sec-Fetch-Site",
};

export async function POST(req: NextRequest) {
  if (!isAllowedFetchSite(req.headers)) {
    return NextResponse.json(
      { error: "Cross-site voice briefing request rejected by Sec-Fetch-Site policy" },
      { status: 403, headers: VARY_HEADERS }
    );
  }

  try {
    const briefing = await generateCfoVoiceBriefingAudio();
    return NextResponse.json(briefing, { headers: VARY_HEADERS });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Voice briefing generation failed";
    return NextResponse.json({ error: message }, { status: 500, headers: VARY_HEADERS });
  }
}
