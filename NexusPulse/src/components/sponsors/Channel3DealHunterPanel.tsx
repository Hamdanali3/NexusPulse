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
      const res = await fetch(
        `/api/channel3/search?q=${encodeURIComponent(searchQuery)}`
      );
      const data = await res.json();
      if (data.deals) {
        setFilteredDeals(data.deals);
        if (data.deals.length > 0) {
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
    if (initialDeals.length > 0) {
      setActiveCheckoutDealId(initialDeals[0].id);
    }
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
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-5"
    >
      {mandateBanner && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center justify-between rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs text-emerald-800 shadow-xs animate-bounce"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span className="font-semibold">{mandateBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setMandateBanner(null)}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-950"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-fuchsia-50 border border-fuchsia-200 px-2.5 py-0.5 text-xs font-semibold text-fuchsia-800">
              <ShoppingBag className="h-3.5 w-3.5 text-fuchsia-600" />
              Channel3 100M+ Catalog
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 border border-sky-200 px-2.5 py-0.5 text-xs font-semibold text-sky-800">
              <Shield className="h-3 w-3 text-sky-600" />
              PayPal Orders v2 &amp; JS SDK v6
            </span>
          </div>
          <h3 id="engine-1-heading" className="mt-1.5 text-lg font-bold text-slate-950">
            Engine 1: Deal Arbitrage &amp; 1-Click Checkout
          </h3>
          <p className="text-xs text-slate-600">
            Automated catalog matching against your price mandates, payable instantly via PayPal.
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
                className="rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 shadow-xs focus:border-fuchsia-500"
              />
            </div>
            <button
              type="submit"
              disabled={searching}
              className="inline-flex items-center gap-1.5 rounded-lg bg-fuchsia-600 hover:bg-fuchsia-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:scale-105 active:scale-95"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {searching ? "Scanning..." : "Scan Catalog"}
            </button>
            {filteredDeals && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-slate-600 hover:text-slate-900 underline px-1.5 py-1 font-medium"
              >
                Reset
              </button>
            )}
          </form>

          <button
            type="button"
            onClick={() => setShowMandateForm((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-fuchsia-200 bg-fuchsia-50 hover:bg-fuchsia-100 px-3 py-1.5 text-xs font-bold text-fuchsia-800 shadow-xs transition hover:scale-105 active:scale-95"
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
          className="rounded-xl border border-fuchsia-200 bg-fuchsia-50/50 p-4 space-y-3 nexus-fade-in"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-fuchsia-900">
              Register Autonomous Channel3 Price-Drop Mandate (Instant Catalog Match)
            </span>
            <button
              type="button"
              onClick={() => setShowMandateForm(false)}
              className="text-xs text-slate-500 hover:text-slate-800 font-medium"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="sm:col-span-2">
              <label htmlFor="mandate-title-input" className="block text-xs font-semibold text-slate-700 mb-1">
                Product Name / Model
              </label>
              <input
                id="mandate-title-input"
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 shadow-xs focus:border-fuchsia-500"
                required
              />
            </div>
            <div>
              <label htmlFor="mandate-brand-input" className="block text-xs font-semibold text-slate-700 mb-1">
                Brand
              </label>
              <input
                id="mandate-brand-input"
                type="text"
                value={newBrand}
                onChange={(e) => setNewBrand(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 shadow-xs focus:border-fuchsia-500"
                required
              />
            </div>
            <div>
              <label htmlFor="mandate-category-input" className="block text-xs font-semibold text-slate-700 mb-1">
                Category
              </label>
              <input
                id="mandate-category-input"
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 shadow-xs focus:border-fuchsia-500"
                required
              />
            </div>
            <div>
              <label htmlFor="mandate-retail-input" className="block text-xs font-semibold text-slate-700 mb-1">
                Retail Price ($)
              </label>
              <input
                id="mandate-retail-input"
                type="number"
                step="0.01"
                value={newRetailPrice}
                onChange={(e) => setNewRetailPrice(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 shadow-xs focus:border-fuchsia-500"
                required
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <label htmlFor="mandate-target-input" className="text-xs font-bold text-slate-800">
                Your Maximum Target Price:
              </label>
              <div className="flex items-center">
                <span className="text-xs font-bold text-slate-500 mr-1">$</span>
                <input
                  id="mandate-target-input"
                  type="number"
                  step="0.01"
                  value={newTargetPrice}
                  onChange={(e) => setNewTargetPrice(e.target.value)}
                  className="w-28 rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-bold text-slate-900 shadow-xs focus:border-fuchsia-500"
                  required
                />
                <span className="text-xs font-bold text-slate-500 ml-1">USD</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={creatingMandate}
              className="inline-flex items-center gap-1.5 rounded-lg bg-fuchsia-600 hover:bg-fuchsia-700 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:scale-105 active:scale-95"
            >
              <Zap className="h-3.5 w-3.5" />
              {creatingMandate ? "Scanning 100M+ SKUs..." : "Deploy Mandate & Lock Best Price"}
            </button>
          </div>
        </form>
      )}

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Deal Catalog Cards */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
            <span>
              Showing <strong>{displayedDeals.length}</strong> active Channel3 product mandates
            </span>
            <span className="font-mono text-[11px] text-fuchsia-700 font-semibold">
              Live Channel3 Price Feeds Active
            </span>
          </div>

          {displayedDeals.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-xs text-slate-500">
              No products found matching &quot;{searchQuery}&quot;.
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-2 block mx-auto text-sky-600 font-bold hover:underline"
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
                  className={`rounded-xl border p-4 transition-all duration-200 cursor-pointer shadow-xs hover:scale-[1.01] ${
                    isSelected
                      ? "border-sky-500 bg-sky-50/50 shadow-md ring-2 ring-sky-500/20"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        {/* High-Contrast SKU Badge (Fixed black-on-black) */}
                        <span className="rounded-md bg-slate-100 border border-slate-300 px-2 py-0.5 font-mono text-xs font-bold text-slate-900 shadow-2xs">
                          {deal.sku}
                        </span>
                        <span className="text-xs font-bold text-fuchsia-700">
                          {deal.brand} • {deal.category}
                        </span>
                        {deal.bnpl_eligible && (
                          <span className="rounded-full bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                            Pay Later ${deal.bnpl_installment_monthly}/mo
                          </span>
                        )}
                      </div>
                      <h4 className="mt-1.5 text-sm font-bold text-slate-950">
                        {deal.title}
                      </h4>
                    </div>

                    <div className="text-right tabular-nums">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs text-slate-400 line-through">
                          ${deal.retail_price.toFixed(2)}
                        </span>
                        <span className="text-base font-extrabold text-emerald-600">
                          ${deal.channel3_best_price.toFixed(2)}
                        </span>
                      </div>
                      {/* High-Contrast Save Badge */}
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-bold text-emerald-800 shadow-2xs">
                        <Tag className="h-3 w-3 text-emerald-600" />
                        Save ${deal.savings_amount.toFixed(2)} ({deal.savings_percent}%)
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-100 text-xs">
                    <div className="text-slate-600 font-medium">
                      Merchant:{" "}
                      <strong className="text-slate-900 font-semibold">{deal.merchant_name}</strong> •{" "}
                      <span className="text-amber-800 font-semibold">
                        ★ {deal.rating} ({deal.review_count})
                      </span>
                    </div>

                    {isPurchased ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        Purchased via PayPal
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                        <Zap className="h-3 w-3 text-emerald-600" />
                        Mandate Met (${deal.target_mandate_price})
                      </span>
                    )}
                  </div>

                  {/* Visual Savings Bar */}
                  <div className="mt-2.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                      <span>Savings Advantage</span>
                      <span className="font-semibold text-emerald-700">{deal.savings_percent}% below retail</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                        style={{ width: `${Math.min(100, Math.max(15, deal.savings_percent * 2))}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: PayPal JS SDK v6 Multi-Funding Checkout */}
        <div className="lg:col-span-5">
          {activeDeal && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-xs sticky top-20">
              <div className="border-b border-slate-200 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-fuchsia-700">
                  PayPal JS SDK v6 Autonomous &amp; One-Click Checkout
                </span>
                <h4 className="mt-1 text-base font-bold text-slate-950">
                  {activeDeal.title}
                </h4>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-xs text-slate-500 font-medium">
                    Channel3 Best Verified Price:
                  </span>
                  <span className="tabular-nums text-xl font-extrabold text-emerald-600">
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
