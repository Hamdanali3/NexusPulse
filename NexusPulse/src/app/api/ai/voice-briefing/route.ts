import { NextResponse } from "next/server";
import { generateCfoVoiceBriefingAudio } from "@/lib/ai/gemini-agent";

export async function POST() {
  const briefing = await generateCfoVoiceBriefingAudio();
  return NextResponse.json(briefing);
}
