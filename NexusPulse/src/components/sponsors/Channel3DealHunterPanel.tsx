"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  Plus,
  Search,
  Shield,
  ShoppingBag,
  Sparkles,
  Tag,
  Zap,
} from "lucide-react";
import type {
  Channel3ProductDeal,
  PayPalExecutionMode,
} from "@/lib/paypal/paypal-types";
import PayPalV6CheckoutWidget from "@/components/paypal/PayPalV6CheckoutWidget";

interface Channel3DealHunterPanelProps {
  deals: Channel3ProductDeal[];
  activeMode: PayPalExecutionMode;
  onStateUpdated: () => void;
}

export default function Channel3DealHunterPanel({
  deals: initialDeals,
  activeMode,
  onStateUpdated,
}: Channel3DealHunterPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [filteredDeals, setFilteredDeals] = useState<Channel3ProductDeal[] | null>(
    null
  );
  const [activeCheckoutDealId, setActiveCheckoutDealId] = useState<string>(
    initialDeals.find((d) => d.mandate_status === "TARGET_MET_READY")?.id ??
      initialDeals[0]?.id ??
      "C3-PROD-9001"
  );

  // Custom Price Mandate Creation Drawer state
  const [showMandateForm, setShowMandateForm] = useState(false);
  const [newTitle, setNewTitle] = useState("Samsung 990 PRO 4TB PCIe 4.0 NVMe M.2 SSD");
  const [newBrand, setNewBrand] = useState("Samsung");
  const [newCategory, setNewCategory] = useState("AI Storage Hardware");
  const [newRetailPrice, setNewRetailPrice] = useState("349.99");
  const [newTargetPrice, setNewTargetPrice] = useState("265.00");
  const [creatingMandate, setCreatingMandate] = useState(false);
  const [mandateBanner, setMandateBanner] = useState<string | null>(null);

  const displayedDeals = filteredDeals ?? initialDeals;
  const activeDeal =
    displayedDeals.find((d) => d.id === activeCheckoutDealId) ??
    displayedDeals[0] ??
    null;

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearching(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      const res = await fetch(`/api/channel3/search?${params.toString()}`);
      const data = await res.json();
      if (Array.isArray(data.deals)) {
        setFilteredDeals(data.deals);
        if (data.deals[0]) {
          setActiveCheckoutDealId(data.deals[0].id);
        }
      }
    } finally {
      setSearching(false);
    }
  }

  function handleResetFilters() {
    setSearchQuery("");
    setFilteredDeals(null);
  }

  async function handleCreateMandate(e: React.FormEvent) {
    e.preventDefault();
    setCreatingMandate(true);
    setMandateBanner(null);
    try {
      const res = await fetch("/api/channel3/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          brand: newBrand,
          category: newCategory,
          retailPrice: Number(newRetailPrice),
          targetMandatePrice: Number(newTargetPrice),
        }),
      });
      const data = await res.json();
      if (data.ok && data.deal) {
        setFilteredDeals(null);
        setActiveCheckoutDealId(data.deal.id);
        setShowMandateForm(false);
        setMandateBanner(
          `Channel3 matched "${data.deal.title}" at $${Number(data.deal.channel3_best_price).toFixed(2)} USD (Saved $${Number(data.deal.savings_amount).toFixed(2)} below retail) — ready for PayPal v6 checkout!`
        );
        onStateUpdated();
      }
    } finally {
      setCreatingMandate(false);
    }
  }

  return (
    <section
      aria-labelledby="engine-1-heading"
      className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-5"
    >
      {mandateBanner && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-950/30 px-4 py-3 text-xs text-emerald-200"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{mandateBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setMandateBanner(null)}
            className="text-xs font-medium text-emerald-300 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-fuchsia-500/15 border border-fuchsia-500/30 px-2.5 py-0.5 text-xs font-semibold text-fuchsia-300">
              <ShoppingBag className="h-3.5 w-3.5" />
              Sponsor: Channel3 Universal Product Catalog (100M+ SKUs)
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 border border-sky-500/30 px-2.5 py-0.5 text-xs font-medium text-sky-300">
              <Shield className="h-3 w-3" />
              Cryptographic Spending Mandate + PayPal JS SDK v6
            </span>
          </div>
          <h3 id="engine-1-heading" className="mt-1.5 text-lg font-bold text-white">
            Engine 1: Channel3 Autonomous Deal Arbitrage &amp; PayPal Checkout
          </h3>
          <p className="text-xs text-slate-400">
            Gemini 4 Argon continuously scans Channel3&apos;s merchant catalog against your cryptographic target price mandate and executes instant PayPal Wallet, Venmo, or Pay Later 4-installment checkouts.
          </p>
        </div>

        {/* Search Filter Form + New Mandate Button */}
        <div className="flex flex-wrap items-center gap-2">
          <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <label htmlFor="channel3-search-input" className="visually-hidden">
                Search Channel3 SKU, brand, or product
              </label>
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="channel3-search-input"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Channel3 SKU / Brand..."
                className="rounded-xl border border-slate-700 bg-slate-950 pl-8 pr-3 py-1.5 text-xs text-white focus:border-fuchsia-500"
              />
            </div>
            <button
              type="submit"
              disabled={searching}
              className="inline-flex items-center gap-1.5 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 px-3.5 py-1.5 text-xs font-semibold text-white transition"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {searching ? "Scanning..." : "Scan Catalog"}
            </button>
            {filteredDeals && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-slate-300 hover:text-white underline px-1.5 py-1"
              >
                Reset
              </button>
            )}
          </form>

          <button
            type="button"
            onClick={() => setShowMandateForm((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-fuchsia-500/40 bg-fuchsia-500/15 hover:bg-fuchsia-500/25 px-3 py-1.5 text-xs font-semibold text-fuchsia-200 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            New Price Mandate
          </button>
        </div>
      </div>

      {/* Create Custom Channel3 Price-Drop Mandate Drawer */}
      {showMandateForm && (
        <form
          onSubmit={handleCreateMandate}
          className="rounded-xl border border-fuchsia-500/30 bg-fuchsia-950/20 p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-fuchsia-300">
              Register Autonomous Channel3 Price-Drop Mandate (Instant Catalog Match)
            </span>
            <button
              type="button"
              onClick={() => setShowMandateForm(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="sm:col-span-2">
              <label htmlFor="mandate-title-input" className="block text-xs text-slate-300 mb-1">
                Product Name / Model
              </label>
              <input
                id="mandate-title-input"
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white"
                required
              />
            </div>
            <div>
              <label htmlFor="mandate-brand-input" className="block text-xs text-slate-300 mb-1">
                Brand
              </label>
              <input
                id="mandate-brand-input"
                type="text"
                value={newBrand}
                onChange={(e) => setNewBrand(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white"
                required
              />
            </div>
            <div>
              <label htmlFor="mandate-retail-input" className="block text-xs text-slate-300 mb-1">
                Retail Price (USD)
              </label>
              <input
                id="mandate-retail-input"
                type="number"
                step="0.01"
                value={newRetailPrice}
                onChange={(e) => setNewRetailPrice(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white"
                required
              />
            </div>
            <div>
              <label htmlFor="mandate-target-input" className="block text-xs text-slate-300 mb-1">
                Target Mandate (USD)
              </label>
              <input
                id="mandate-target-input"
                type="number"
                step="0.01"
                value={newTargetPrice}
                onChange={(e) => setNewTargetPrice(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white"
                required
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={creatingMandate}
              className="inline-flex items-center gap-1.5 rounded-lg bg-fuchsia-600 hover:bg-fuchsia-500 px-4 py-1.5 text-xs font-semibold text-white transition"
            >
              <Zap className="h-3.5 w-3.5" />
              {creatingMandate ? "Scanning 100M+ SKUs..." : "Deploy Mandate & Lock Best Price"}
            </button>
          </div>
        </form>
      )}

      {/* Main Split Grid: Channel3 Catalog Cards + Live PayPal JS SDK v6 Checkout Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 space-y-3">
          {displayedDeals.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-8 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-300">
                No Channel3 deals matched &ldquo;{searchQuery}&rdquo;
              </p>
              <p className="text-xs text-slate-400">
                Try searching for NVIDIA, Apple, Sony, Keychron, or create a custom price-drop mandate above.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-white"
              >
                Show All Verified Deals
              </button>
            </div>
          ) : (
            displayedDeals.map((deal) => {
              const isSelected = activeDeal?.id === deal.id;
              const isPurchased = deal.mandate_status === "PURCHASED_VIA_PAYPAL";

              return (
                <div
                  key={deal.id}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  onClick={() => setActiveCheckoutDealId(deal.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setActiveCheckoutDealId(deal.id);
                    }
                  }}
                  className={`rounded-xl border p-4 transition cursor-pointer ${
                    isSelected
                      ? "border-fuchsia-500/60 bg-fuchsia-950/20 shadow-lg shadow-fuchsia-950/30"
                      : "border-slate-800 bg-slate-950/80 hover:border-slate-700"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-xs text-slate-300">
                          {deal.sku}
                        </span>
                        <span className="text-xs font-semibold text-fuchsia-300">
                          {deal.brand} • {deal.category}
                        </span>
                        {deal.bnpl_eligible && (
                          <span className="rounded-full bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 text-xs font-medium text-indigo-300">
                            Pay Later ${deal.bnpl_installment_monthly}/mo
                          </span>
                        )}
                      </div>
                      <h4 className="mt-1 text-sm font-bold text-white">
                        {deal.title}
                      </h4>
                    </div>

                    <div className="text-right tabular-nums">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs text-slate-400 line-through">
                          ${deal.retail_price.toFixed(2)}
                        </span>
                        <span className="text-base font-extrabold text-emerald-400">
                          ${deal.channel3_best_price.toFixed(2)}
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-500/15 px-1.5 py-0.5 text-xs font-semibold text-emerald-300">
                        <Tag className="h-3 w-3" />
                        Save ${deal.savings_amount.toFixed(2)} ({deal.savings_percent}%)
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-800/80 text-xs">
                    <div className="text-slate-400">
                      Merchant:{" "}
                      <strong className="text-slate-200">{deal.merchant_name}</strong> •{" "}
                      <span>
                        ★ {deal.rating} ({deal.review_count})
                      </span>
                    </div>

                    {isPurchased ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Purchased via PayPal ({deal.paypal_order_id})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-xs font-semibold text-amber-300">
                        <Zap className="h-3 w-3" />
                        Mandate Target (${deal.target_mandate_price}) Met — Ready
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-xs text-slate-300">
                    <strong className="text-fuchsia-300">Channel3 AI Signal:</strong>{" "}
                    {deal.ai_price_prediction}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: PayPal JS SDK v6 Multi-Funding Checkout */}
        <div className="lg:col-span-5">
          {activeDeal && (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5 space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-fuchsia-400">
                  PayPal JS SDK v6 Autonomous &amp; One-Click Checkout
                </span>
                <h4 className="mt-1 text-base font-bold text-white">
                  {activeDeal.title}
                </h4>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-xs text-slate-400">
                    Channel3 Best Verified Price:
                  </span>
                  <span className="tabular-nums text-xl font-extrabold text-emerald-400">
                    ${activeDeal.channel3_best_price.toFixed(2)} USD
                  </span>
                </div>
              </div>

              <PayPalV6CheckoutWidget
                key={activeDeal.id}
                amountValue={activeDeal.channel3_best_price.toFixed(2)}
                description={`Channel3 Deal: ${activeDeal.title} (${activeDeal.sku})`}
                channel3DealId={activeDeal.id}
                bnplInstallment={activeDeal.bnpl_installment_monthly}
                activeMode={activeMode}
                onSuccess={() => {
                  onStateUpdated();
                }}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
