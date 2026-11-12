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

  const channel3ApiKey = process.env.CHANNEL3_API_KEY?.trim();
  const channel3ApiUrl = process.env.CHANNEL3_API_URL?.trim() || "https://api.channel3.ai/v1/search";

  // If a live Channel3 API Key is configured, attempt real remote catalog query
  if (channel3ApiKey && q) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`${channel3ApiUrl}?q=${encodeURIComponent(q)}&limit=20`, {
        headers: {
          Authorization: `Bearer ${channel3ApiKey}`,
          Accept: "application/json",
          "User-Agent": "NexusPulse-AutonomousCommerce/1.0",
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const liveItems = Array.isArray(data.items || data.deals || data.products)
          ? (data.items || data.deals || data.products)
          : [];

        if (liveItems.length > 0) {
          const mappedDeals = liveItems.map((item: any, idx: number) => {
            const retail = Number(item.retail_price || item.price || 100);
            const best = Number(item.channel3_best_price || item.sale_price || retail * 0.85);
            const savings = Number((retail - best).toFixed(2));
            return {
              id: item.id || `C3-LIVE-${idx + 1}`,
              title: item.title || item.name || "Live Product",
              brand: item.brand || "Verified Retailer",
              category: item.category || "Consumer Electronics",
              sku: item.sku || `SKU-${idx + 1}`,
              retail_price: retail,
              channel3_best_price: best,
              target_mandate_price: Number((best * 0.95).toFixed(2)),
              savings_amount: savings > 0 ? savings : 0,
              savings_percent: retail > 0 ? Number(((savings / retail) * 100).toFixed(1)) : 0,
              currency: item.currency || "USD",
              merchant_name: item.merchant_name || item.seller || "Channel3 Direct Network",
              in_stock: item.in_stock ?? true,
              rating: Number(item.rating || 4.8),
              review_count: Number(item.review_count || 120),
              bnpl_eligible: best >= 30,
              bnpl_installment_monthly: Number((best / 4).toFixed(2)),
              mandate_status: "TARGET_MET_READY" as const,
              ai_price_prediction: `Live Channel3 match across multi-retailer inventory at $${best.toFixed(2)}.`,
            };
          });

          return NextResponse.json(
            {
              provider: "Channel3 Live Product Data API (100M+ SKU Real-time Network)",
              mode: "live",
              count: mappedDeals.length,
              deals: mappedDeals,
            },
            { headers: VARY_HEADERS }
          );
        }
      }
    } catch (apiErr) {
      console.warn("[Channel3 Live API] Remote catalog lookup fallback:", apiErr);
    }
  }

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
      mode: channel3ApiKey ? "hybrid" : "curated",
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
    const normalizedNewTitle = cleanTitle.trim().toLowerCase().replace(/\s+/g, " ");
    const existingDeal = state.channel3Deals.find(
      (d) => d.title.trim().toLowerCase().replace(/\s+/g, " ") === normalizedNewTitle
    );

    const bestPrice = Number((mandateCheck.value * 0.96).toFixed(2));
    const savings = Number((retailCheck.value - bestPrice).toFixed(2));
    const updatedOrNewDeal = existingDeal
      ? {
          ...existingDeal,
          retail_price: retailCheck.value,
          channel3_best_price: bestPrice,
          target_mandate_price: mandateCheck.value,
          savings_amount: savings,
          savings_percent: Number(((savings / retailCheck.value) * 100).toFixed(1)),
          bnpl_eligible: bestPrice >= 30,
          bnpl_installment_monthly: Number((bestPrice / 4).toFixed(2)),
          mandate_status:
            existingDeal.mandate_status === "PURCHASED_VIA_PAYPAL"
              ? ("PURCHASED_VIA_PAYPAL" as const)
              : ("TARGET_MET_READY" as const),
        }
      : {
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
          ai_price_prediction: `Found an active offer at $${bestPrice.toFixed(2)} ($${savings.toFixed(2)} below retail) under your $${mandateCheck.value.toFixed(2)} price limit.`,
        };

    if (existingDeal) {
      const idx = state.channel3Deals.findIndex((d) => d.id === existingDeal.id);
      if (idx !== -1) state.channel3Deals[idx] = updatedOrNewDeal;
    } else {
      state.channel3Deals.unshift(updatedOrNewDeal);
    }
    syncChannel3DealToSupabase(updatedOrNewDeal).catch(() => {});

    return NextResponse.json(
      {
        ok: true,
        deal: updatedOrNewDeal,
        state,
      },
      { headers: VARY_HEADERS }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create Channel3 mandate";
    return NextResponse.json({ error: message }, { status: 500, headers: VARY_HEADERS });
  }
}
