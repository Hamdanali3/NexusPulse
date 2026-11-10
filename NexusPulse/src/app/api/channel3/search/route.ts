import { NextRequest, NextResponse } from "next/server";
import { getMirrorState } from "@/lib/paypal/paypal-sandbox-mirror";
import { syncChannel3DealToSupabase } from "@/lib/db/supabase-client";
import { isAllowedFetchSite, sanitizeText, validateUsdAmount } from "@/lib/security/validation";

const VARY_HEADERS = {
  Vary: "Sec-Fetch-Dest, Sec-Fetch-Mode, Sec-Fetch-Site",
};

export async function GET(req: NextRequest) {
  const q = sanitizeText(req.nextUrl.searchParams.get("q") ?? "", 120).toLowerCase();
  const state = getMirrorState();

  const deals = state.channel3Deals.filter((d) => {
    if (!q) return true;
    return (
      d.title.toLowerCase().includes(q) ||
      d.brand.toLowerCase().includes(q) ||
      d.category.toLowerCase().includes(q) ||
      d.sku.toLowerCase().includes(q)
    );
  });

  return NextResponse.json(
    {
      provider: "Channel3 Unified Product Data API (100M+ SKU Index)",
      count: deals.length,
      deals,
    },
    { headers: VARY_HEADERS }
  );
}

export async function POST(req: NextRequest) {
  if (!isAllowedFetchSite(req.headers)) {
    return NextResponse.json(
      { error: "Cross-site mandate creation rejected by Sec-Fetch-Site policy" },
      { status: 403, headers: VARY_HEADERS }
    );
  }

  try {
    const body = (await req.json()) as {
      title: string;
      brand?: string;
      category?: string;
      retailPrice: number | string;
      targetMandatePrice: number | string;
    };

    const cleanTitle = sanitizeText(body.title, 140);
    if (!cleanTitle) {
      return NextResponse.json(
        { error: "Product title is required for a Channel3 price mandate" },
        { status: 400, headers: VARY_HEADERS }
      );
    }

    const retailCheck = validateUsdAmount(body.retailPrice, { min: 5, max: 50000 });
    const mandateCheck = validateUsdAmount(body.targetMandatePrice, { min: 1, max: 50000 });
    if (!retailCheck.valid || !mandateCheck.valid || !retailCheck.value || !mandateCheck.value) {
      return NextResponse.json(
        { error: retailCheck.error ?? mandateCheck.error ?? "Invalid price parameters" },
        { status: 400, headers: VARY_HEADERS }
      );
    }

    if (mandateCheck.value >= retailCheck.value) {
      return NextResponse.json(
        { error: "Target mandate price must be lower than retail price" },
        { status: 400, headers: VARY_HEADERS }
      );
    }

    const state = getMirrorState();
    const bestPrice = Number((mandateCheck.value * 0.96).toFixed(2));
    const savings = Number((retailCheck.value - bestPrice).toFixed(2));
    const newDeal = {
      id: `C3-PROD-${9000 + state.channel3Deals.length + 1}`,
      title: cleanTitle,
      brand: sanitizeText(body.brand, 60) || "Verified Brand",
      category: sanitizeText(body.category, 60) || "Agentic Commerce",
      sku: `C3-${Date.now().toString().slice(-6)}`,
      retail_price: retailCheck.value,
      channel3_best_price: bestPrice,
      target_mandate_price: mandateCheck.value,
      savings_amount: savings,
      savings_percent: Number(((savings / retailCheck.value) * 100).toFixed(1)),
      currency: "USD",
      merchant_name: "Channel3 Verified Direct Merchant",
      in_stock: true,
      rating: 4.9,
      review_count: 310,
      bnpl_eligible: bestPrice >= 30,
      bnpl_installment_monthly: Number((bestPrice / 4).toFixed(2)),
      mandate_status: "TARGET_MET_READY" as const,
      ai_price_prediction: `Channel3 found an instant match at $${bestPrice.toFixed(2)} ($${savings.toFixed(2)} below retail) satisfying your $${mandateCheck.value.toFixed(2)} cryptographic mandate.`,
    };

    state.channel3Deals.unshift(newDeal);
    syncChannel3DealToSupabase(newDeal).catch(() => {});

    return NextResponse.json(
      {
        ok: true,
        deal: newDeal,
        state,
      },
      { headers: VARY_HEADERS }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create Channel3 mandate";
    return NextResponse.json({ error: message }, { status: 500, headers: VARY_HEADERS });
  }
}
