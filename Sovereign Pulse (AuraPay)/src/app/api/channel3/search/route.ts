import { NextRequest, NextResponse } from "next/server";
import { getMirrorState } from "@/lib/paypal/paypal-sandbox-mirror";

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").toLowerCase().trim();
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

  return NextResponse.json({
    provider: "Channel3 Unified Product Data API (100M+ SKU Index)",
    count: deals.length,
    deals,
  });
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    title: string;
    brand?: string;
    category?: string;
    retailPrice: number;
    targetMandatePrice: number;
  };

  const state = getMirrorState();
  const bestPrice = Number((body.targetMandatePrice * 0.96).toFixed(2));
  const savings = Number((body.retailPrice - bestPrice).toFixed(2));
  const newDeal = {
    id: `C3-PROD-${9000 + state.channel3Deals.length + 1}`,
    title: body.title,
    brand: body.brand || "Verified Brand",
    category: body.category || "Agentic Commerce",
    sku: `C3-${Date.now().toString().slice(-6)}`,
    retail_price: Number(body.retailPrice),
    channel3_best_price: bestPrice,
    target_mandate_price: Number(body.targetMandatePrice),
    savings_amount: savings,
    savings_percent: Number(((savings / body.retailPrice) * 100).toFixed(1)),
    currency: "USD",
    merchant_name: "Channel3 Verified Direct Merchant",
    in_stock: true,
    rating: 4.9,
    review_count: 310,
    bnpl_eligible: bestPrice >= 30,
    bnpl_installment_monthly: Number((bestPrice / 4).toFixed(2)),
    mandate_status: "TARGET_MET_READY" as const,
    ai_price_prediction: `Channel3 found an instant match at $${bestPrice.toFixed(2)} ($${savings.toFixed(2)} below retail) satisfying your $${body.targetMandatePrice} cryptographic mandate.`,
  };

  state.channel3Deals.unshift(newDeal);
  return NextResponse.json({
    ok: true,
    deal: newDeal,
    state,
  });
}
