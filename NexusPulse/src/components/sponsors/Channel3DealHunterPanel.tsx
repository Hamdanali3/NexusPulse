"use client";

import React, { useState } from "react";
import {
  AlertCircle,
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
  const [mandateBanner, setMandateBanner] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

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
      if (res.ok && data.ok && data.deal) {
        setFilteredDeals(null);
        setActiveCheckoutDealId(data.deal.id);
        setShowMandateForm(false);
        setMandateBanner({
          type: "success",
          text: `Success: Channel3 matched "${data.deal.title}" at $${Number(data.deal.channel3_best_price).toFixed(2)} USD (Saved $${Number(data.deal.savings_amount).toFixed(2)} below retail) — ready for PayPal v6 checkout!`,
        });
        onStateUpdated();
      } else {
        setMandateBanner({
          type: "error",
          text: data.error || "Failed to create price mandate. Please check your price targets.",
        });
      }
    } catch (err) {
      setMandateBanner({
        type: "error",
        text: `Network failure while creating mandate: ${err instanceof Error ? err.message : "Error"}`,
      });
    } finally {
      setCreatingMandate(false);
    }
  }

  return (
    <section
      aria-labelledby="engine-1-heading"
      className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs space-y-6"
    >
      {mandateBanner && (
        <div
          role={mandateBanner.type === "error" ? "alert" : "status"}
          aria-live="polite"
          className={`flex items-center justify-between rounded-xl border px-4 py-3 text-xs shadow-xs transition-all ${
            mandateBanner.type === "success"
              ? "border-emerald-200 bg-emerald-50/80 text-emerald-900"
              : "border-rose-200 bg-rose-50/80 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2">
            {mandateBanner.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            )}
            <span className="font-medium">{mandateBanner.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setMandateBanner(null)}
            className="text-xs font-semibold px-2 py-0.5 rounded text-zinc-600 hover:text-zinc-900 transition"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-100">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700">
              <ShoppingBag className="h-3 w-3 text-zinc-500" />
              100M+ Catalog
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700">
              <Shield className="h-3 w-3 text-zinc-500" />
              PayPal Orders v2
            </span>
          </div>
          <h3 id="engine-1-heading" className="mt-1.5 text-base font-semibold text-zinc-900">
            Deal Arbitrage &amp; 1-Click Checkout
          </h3>
          <p className="text-xs text-zinc-500">
            Catalog matching against target price mandates, payable instantly via PayPal.
          </p>
        </div>

        {/* Search Filter Form + New Mandate Button */}
        <div className="flex flex-wrap items-center gap-2">
          <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <label htmlFor="channel3-search-input" className="visually-hidden">
                Search SKU, brand, or product
              </label>
              <Search className="h-3.5 w-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="channel3-search-input"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search SKU or brand..."
                className="h-8 rounded-lg border border-zinc-200 bg-zinc-50/50 pl-8 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 transition focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
              />
            </div>
            <button
              type="submit"
              disabled={searching}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 px-3 text-xs font-medium text-white transition disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5 text-zinc-400" />
              {searching ? "Scanning..." : "Scan"}
            </button>
            {filteredDeals && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-zinc-500 hover:text-zinc-900 px-1 py-1 font-medium transition"
              >
                Reset
              </button>
            )}
          </form>

          <button
            type="button"
            onClick={() => setShowMandateForm((v) => !v)}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 px-3 text-xs font-medium text-zinc-800 shadow-2xs transition"
          >
            <Plus className="h-3.5 w-3.5 text-zinc-500" />
            New Mandate
          </button>
        </div>
      </div>

      {/* Create Custom Channel3 Price-Drop Mandate Drawer */}
      {showMandateForm && (
        <form
          onSubmit={handleCreateMandate}
          className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 space-y-3 nexus-fade-in"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-900">
              New Autonomous Price-Drop Mandate
            </span>
            <button
              type="button"
              onClick={() => setShowMandateForm(false)}
              className="text-xs text-zinc-500 hover:text-zinc-900 font-medium"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="sm:col-span-2">
              <label htmlFor="mandate-title-input" className="block text-[11px] font-medium text-zinc-700 mb-1">
                Product Name / Model
              </label>
              <input
                id="mandate-title-input"
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full h-8 rounded-lg border border-zinc-200 bg-white px-2.5 text-xs text-zinc-900 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                required
              />
            </div>
            <div>
              <label htmlFor="mandate-brand-input" className="block text-[11px] font-medium text-zinc-700 mb-1">
                Brand
              </label>
              <input
                id="mandate-brand-input"
                type="text"
                value={newBrand}
                onChange={(e) => setNewBrand(e.target.value)}
                className="w-full h-8 rounded-lg border border-zinc-200 bg-white px-2.5 text-xs text-zinc-900 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                required
              />
            </div>
            <div>
              <label htmlFor="mandate-category-input" className="block text-[11px] font-medium text-zinc-700 mb-1">
                Category
              </label>
              <input
                id="mandate-category-input"
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full h-8 rounded-lg border border-zinc-200 bg-white px-2.5 text-xs text-zinc-900 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                required
              />
            </div>
            <div>
              <label htmlFor="mandate-retail-input" className="block text-[11px] font-medium text-zinc-700 mb-1">
                Retail Price ($)
              </label>
              <input
                id="mandate-retail-input"
                type="number"
                step="0.01"
                value={newRetailPrice}
                onChange={(e) => setNewRetailPrice(e.target.value)}
                className="w-full h-8 rounded-lg border border-zinc-200 bg-white px-2.5 text-xs text-zinc-900 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                required
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <label htmlFor="mandate-target-input" className="text-xs font-medium text-zinc-700">
                Max Target Price:
              </label>
              <div className="flex items-center">
                <span className="text-xs text-zinc-400 mr-1">$</span>
                <input
                  id="mandate-target-input"
                  type="number"
                  step="0.01"
                  value={newTargetPrice}
                  onChange={(e) => setNewTargetPrice(e.target.value)}
                  className="w-24 h-8 rounded-lg border border-zinc-200 bg-white px-2.5 text-xs font-semibold text-zinc-900 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                  required
                />
                <span className="text-[11px] text-zinc-400 ml-1">USD</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={creatingMandate}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-3.5 text-xs font-medium text-white transition disabled:opacity-50"
            >
              <Zap className="h-3.5 w-3.5" />
              {creatingMandate ? "Scanning Catalog..." : "Deploy Mandate"}
            </button>
          </div>
        </form>
      )}

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Deal Catalog Cards */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-500 pb-1">
            <span>
              {displayedDeals.length} active price mandates
            </span>
            <span className="font-mono text-[11px] text-zinc-600 font-medium">
              Live Price Feed
            </span>
          </div>

          {displayedDeals.length === 0 ? (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-8 text-center text-xs text-zinc-500">
              No products found matching &quot;{searchQuery}&quot;.
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-2 block mx-auto text-indigo-600 font-medium hover:underline"
              >
                Reset Search
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
                  className={`rounded-xl border p-4 transition cursor-pointer shadow-2xs ${
                    isSelected
                      ? "border-indigo-600 bg-indigo-50/20 ring-1 ring-indigo-500/20"
                      : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/40"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[11px] font-medium text-zinc-700">
                          {deal.sku}
                        </span>
                        <span className="text-[11px] text-zinc-500">
                          {deal.brand} · {deal.category}
                        </span>
                        {deal.bnpl_eligible && (
                          <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium text-zinc-700">
                            ${deal.bnpl_installment_monthly}/mo
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-semibold text-zinc-900 leading-snug">
                        {deal.title}
                      </h4>
                    </div>

                    <div className="text-right tabular-nums shrink-0">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="text-xs text-zinc-400 line-through">
                          ${deal.retail_price.toFixed(2)}
                        </span>
                        <span className="text-base font-bold text-zinc-900">
                          ${deal.channel3_best_price.toFixed(2)}
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700">
                        <Tag className="h-3 w-3" />
                        Save ${deal.savings_amount.toFixed(2)} ({deal.savings_percent}%)
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-100 text-xs text-zinc-500">
                    <div>
                      {deal.merchant_name} · ★ {deal.rating}
                    </div>

                    {isPurchased ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" />
                        Purchased via PayPal
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700">
                        <Zap className="h-3 w-3 text-indigo-600" />
                        Mandate Met (${deal.target_mandate_price})
                      </span>
                    )}
                  </div>

                  {/* Savings Progress Bar */}
                  <div className="mt-2.5">
                    <div className="w-full h-1 bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full"
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
            <div className="rounded-xl border border-zinc-200 bg-white p-5 space-y-4 shadow-2xs sticky top-20">
              <div className="border-b border-zinc-100 pb-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  PayPal v6 One-Click Checkout
                </span>
                <h4 className="mt-1 text-sm font-semibold text-zinc-900">
                  {activeDeal.title}
                </h4>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-xs text-zinc-500">
                    Verified Best Price
                  </span>
                  <span className="tabular-nums text-xl font-bold text-zinc-900">
                    ${activeDeal.channel3_best_price.toFixed(2)}{" "}
                    <span className="text-xs font-normal text-zinc-400">USD</span>
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
