import { NextRequest, NextResponse } from "next/server";
import { getSandboxAccountsConfig, PayPalIntegrationError } from "@/lib/paypal/paypal-client";
import { gatewayCreateLiveSandboxInvoice } from "@/lib/paypal/paypal-gateway";
import { getMirrorState } from "@/lib/paypal/paypal-sandbox-mirror";
import { isSupabaseConfigured, syncMetaToSupabase } from "@/lib/db/supabase-client";
import {
  isAllowedFetchSite,
  sanitizeText,
  validateRecipientAccount,
  validateUsdAmount,
} from "@/lib/security/validation";

const VARY_HEADERS = {
  Vary: "Sec-Fetch-Dest, Sec-Fetch-Mode, Sec-Fetch-Site",
};

export async function POST(req: NextRequest) {
  if (!isAllowedFetchSite(req.headers)) {
    return NextResponse.json(
      { error: "Cross-site invoice action blocked by Sec-Fetch-Site policy" },
      { status: 403, headers: VARY_HEADERS }
    );
  }

  try {
    const body = (await req.json()) as {
      amountValue?: string | number;
      itemName?: string;
      recipientEmail?: string;
      recipientName?: string;
      note?: string;
    };

    const amountCheck = validateUsdAmount(body.amountValue ?? "");
    if (!amountCheck.valid || !amountCheck.formatted) {
      return NextResponse.json(
        { error: amountCheck.error ?? "Invalid invoice amount" },
        { status: 400, headers: VARY_HEADERS }
      );
    }

    const defaultBuyerEmail = getSandboxAccountsConfig().buyerEmail;
    const rawRecipient = body.recipientEmail ? sanitizeText(body.recipientEmail, 120) : defaultBuyerEmail;
    const recipientCheck = validateRecipientAccount(rawRecipient);
    if (!recipientCheck.valid || !recipientCheck.cleaned) {
      return NextResponse.json(
        { error: recipientCheck.error ?? "Invalid recipient email" },
        { status: 400, headers: VARY_HEADERS }
      );
    }

    const itemName = sanitizeText(body.itemName ?? "NexusPulse Autonomous Commerce Settlement", 140);
    if (itemName.length < 3) {
      return NextResponse.json(
        { error: "Invoice item description must be at least 3 characters" },
        { status: 400, headers: VARY_HEADERS }
      );
    }

    const result = await gatewayCreateLiveSandboxInvoice({
      recipientEmail: recipientCheck.cleaned,
      recipientName: body.recipientName ? sanitizeText(body.recipientName, 80) : undefined,
      amountValue: amountCheck.formatted,
      itemName,
      note: body.note ? sanitizeText(body.note, 200) : undefined,
    });

    const state = getMirrorState();
    if (isSupabaseConfigured()) {
      syncMetaToSupabase(state).catch(() => {});
    }

    return NextResponse.json(
      {
        ok: true,
        invoice: result.invoice,
        viewUrl: result.viewUrl,
        mode: result.mode,
        state,
      },
      { headers: VARY_HEADERS }
    );
  } catch (err) {
    if (err instanceof PayPalIntegrationError) {
      return NextResponse.json(
        { error: err.message, code: err.errorCode },
        { status: err.statusCode, headers: VARY_HEADERS }
      );
    }
    const message = err instanceof Error ? err.message : "Failed to create PayPal Sandbox invoice";
    return NextResponse.json({ error: message }, { status: 500, headers: VARY_HEADERS });
  }
}
