import { NextRequest, NextResponse } from "next/server";
import { verifyHumanBountySubmissionWithGemini } from "@/lib/ai/gemini-agent";
import { getMirrorState } from "@/lib/paypal/paypal-sandbox-mirror";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      bountyId: string;
      evidenceText: string;
      imageBase64?: string;
      imageMimeType?: string;
      recipientEmail?: string;
      recipientType?: "EMAIL" | "VENMO_HANDLE";
    };

    const result = await verifyHumanBountySubmissionWithGemini({
      bountyId: body.bountyId,
      evidenceText: body.evidenceText,
      imageBase64: body.imageBase64,
      imageMimeType: body.imageMimeType,
      recipientEmail:
        body.recipientEmail?.trim() || "sb-buyer-nexus@personal.example.com",
      recipientType: body.recipientType ?? "EMAIL",
    });

    return NextResponse.json({
      ok: true,
      ...result,
      state: getMirrorState(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Bounty verification failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
