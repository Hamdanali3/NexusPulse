import { NextRequest, NextResponse } from "next/server";
import { verifyHumanBountySubmissionWithGemini } from "@/lib/ai/gemini-agent";
import { getSandboxAccountsConfig } from "@/lib/paypal/paypal-client";
import { getMirrorState } from "@/lib/paypal/paypal-sandbox-mirror";
import { syncMetaToSupabase } from "@/lib/db/supabase-client";
import {
  isAllowedFetchSite,
  sanitizeText,
  validateRecipientAccount,
} from "@/lib/security/validation";

const VARY_HEADERS = {
  Vary: "Sec-Fetch-Dest, Sec-Fetch-Mode, Sec-Fetch-Site",
};

export async function POST(req: NextRequest) {
  if (!isAllowedFetchSite(req.headers)) {
    return NextResponse.json(
      { error: "Cross-site bounty verification rejected by Sec-Fetch-Site policy" },
      { status: 403, headers: VARY_HEADERS }
    );
  }

  try {
    const body = (await req.json()) as {
      bountyId: string;
      evidenceText: string;
      imageBase64?: string;
      imageMimeType?: string;
      recipientEmail?: string;
      recipientType?: "EMAIL" | "VENMO_HANDLE";
    };

    const bountyId = sanitizeText(body.bountyId, 64);
    const evidenceText = sanitizeText(body.evidenceText, 2000);
    if (!bountyId || evidenceText.length < 10) {
      return NextResponse.json(
        { error: "Valid bountyId and human ground-truth evidence (min 10 chars) are required" },
        { status: 400, headers: VARY_HEADERS }
      );
    }

    const rawRecipient =
      sanitizeText(body.recipientEmail, 128) || getSandboxAccountsConfig().buyerEmail;
    const recipientCheck = validateRecipientAccount(rawRecipient);
    if (!recipientCheck.valid || !recipientCheck.cleaned) {
      return NextResponse.json(
        { error: recipientCheck.error ?? "Invalid payout recipient account" },
        { status: 400, headers: VARY_HEADERS }
      );
    }

    const result = await verifyHumanBountySubmissionWithGemini({
      bountyId,
      evidenceText,
      imageBase64: body.imageBase64,
      imageMimeType: body.imageMimeType ? sanitizeText(body.imageMimeType, 32) : undefined,
      recipientEmail: recipientCheck.cleaned,
      recipientType: body.recipientType === "VENMO_HANDLE" ? "VENMO_HANDLE" : "EMAIL",
    });

    const state = getMirrorState();
    syncMetaToSupabase(state).catch(() => {});

    return NextResponse.json(
      {
        ok: true,
        success: true,
        audit: {
          passed: result.verification.passed,
          score: result.verification.score,
          gemini_model: result.verification.model,
          reasoning: result.verification.reasoning,
        },
        verification: result.verification,
        payout_batch_id: result.payout?.payout_batch_id,
        payout: result.payout,
        bounty: result.bounty,
        state,
      },
      { headers: VARY_HEADERS }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Bounty verification failed";
    return NextResponse.json({ error: message }, { status: 500, headers: VARY_HEADERS });
  }
}
