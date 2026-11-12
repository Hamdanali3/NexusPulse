"use client";

import React, { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Plus,
  Search,
  Shield,
  ShoppingBag,
  Tag,
  Zap,
} from "lucide-react";
import type {
  Channel3ProductDeal,
  PayPalExecutionMode,
} from "@/lib/paypal/paypal-types";
import PayPalV6CheckoutWidget from "@/components/paypal/PayPalV6CheckoutWidget";
import { FormField, StatusDot } from "@/components/ui";
import { formatUsd } from "@/lib/format";

interface Channel3DealHunterPanelProps {
  deals: Channel3ProductDeal[];
  activeMode: PayPalExecutionMode;
  publicPayPalClientId?: string;
  clientToken?: string;
  clientTokenIsLive?: boolean;
  sandboxBuyerEmail?: string;
  onStateUpdated: () => void;
}

export default function Channel3DealHunterPanel({
  deals: initialDeals,
  activeMode,
  publicPayPalClientId,
  clientToken,
  clientTokenIsLive,
  sandboxBuyerEmail = "sb-ifqau51324237@personal.example.com",
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

  // Custom Price Mandate Creation Drawer state (empty defaults with muted placeholders)
  const [showMandateForm, setShowMandateForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBrand, setNewBrand] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newRetailPrice, setNewRetailPrice] = useState("");
  const [newTargetPrice, setNewTargetPrice] = useState("");
  const [mandateErrors, setMandateErrors] = useState<Record<string, string>>({});
  const [creatingMandate, setCreatingMandate] = useState(false);
  const [mandateBanner, setMandateBanner] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  function validateMandateField(field: "title" | "brand" | "category" | "retail" | "target", val: string) {
    let msg = "";
    const trimmed = val.trim();
    if (field === "title" && !trimmed) msg = "Enter an item name.";
    if (field === "brand" && !trimmed) msg = "Enter a brand.";
    if (field === "category" && !trimmed) msg = "Enter a category.";
    if (field === "retail") {
      const n = Number(val);
      if (!val || Number.isNaN(n) || n <= 0) msg = "Enter a price above $0.00.";
    }
    if (field === "target") {
      const n = Number(val);
      const retail = Number(newRetailPrice);
      if (!val || Number.isNaN(n) || n <= 0) {
        msg = "Enter a target price above $0.00.";
      } else if (retail > 0 && n > retail) {
        msg = "Target price must be at or below list price.";
      }
    }
    setMandateErrors((prev) => ({ ...prev, [field]: msg }));
    return !msg;
  }

  const displayedDeals = useMemo(() => {
    const raw = filteredDeals ?? initialDeals;
    const seen = new Set<string>();
    return raw.filter((deal) => {
      const key = deal.title.trim().toLowerCase().replace(/\s+/g, " ");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [filteredDeals, initialDeals]);
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
          text: `Matched "${data.deal.title}" at ${formatUsd(data.deal.channel3_best_price)} (${formatUsd(data.deal.savings_amount)} below retail). Ready for PayPal checkout.`,
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
              <Search className="h-3.5 w-3.5 text-zinc-300" />
              {searching ? "Searching..." : "Search"}
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
              <FormField
                id="mandate-title-input"
                label="Item name"
                error={mandateErrors.title}
                required
              >
                <input
                  id="mandate-title-input"
                  type="text"
                  placeholder="e.g. Samsung 990 PRO 4TB NVMe SSD"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onBlur={(e) => validateMandateField("title", e.target.value)}
                  aria-invalid={Boolean(mandateErrors.title)}
                  className="w-full h-9 rounded-[6px] border border-zinc-200 bg-white px-2.5 text-[13px] text-zinc-900 placeholder:text-zinc-500 transition focus:border-indigo-500 focus:outline-none"
                  required
                />
              </FormField>
            </div>
            <FormField id="mandate-brand-input" label="Brand" error={mandateErrors.brand} required>
              <input
                id="mandate-brand-input"
                type="text"
                placeholder="e.g. Samsung"
                value={newBrand}
                onChange={(e) => setNewBrand(e.target.value)}
                onBlur={(e) => validateMandateField("brand", e.target.value)}
                aria-invalid={Boolean(mandateErrors.brand)}
                className="w-full h-9 rounded-[6px] border border-zinc-200 bg-white px-2.5 text-[13px] text-zinc-900 placeholder:text-zinc-500 transition focus:border-indigo-500 focus:outline-none"
                required
              />
            </FormField>
            <FormField
              id="mandate-category-input"
              label="Category"
              error={mandateErrors.category}
              required
            >
              <input
                id="mandate-category-input"
                type="text"
                placeholder="e.g. Storage"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onBlur={(e) => validateMandateField("category", e.target.value)}
                aria-invalid={Boolean(mandateErrors.category)}
                className="w-full h-9 rounded-[6px] border border-zinc-200 bg-white px-2.5 text-[13px] text-zinc-900 placeholder:text-zinc-500 transition focus:border-indigo-500 focus:outline-none"
                required
              />
            </FormField>
            <FormField
              id="mandate-retail-input"
              label="List price (USD)"
              error={mandateErrors.retail}
              required
            >
              <input
                id="mandate-retail-input"
                type="number"
                step="0.01"
                placeholder="349.99"
                value={newRetailPrice}
                onChange={(e) => setNewRetailPrice(e.target.value)}
                onBlur={(e) => validateMandateField("retail", e.target.value)}
                aria-invalid={Boolean(mandateErrors.retail)}
                className="w-full h-9 rounded-[6px] border border-zinc-200 bg-white px-2.5 text-[13px] text-zinc-900 placeholder:text-zinc-500 tabular-nums transition focus:border-indigo-500 focus:outline-none"
                required
              />
            </FormField>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-3 pt-2">
            <FormField
              id="mandate-target-input"
              label="Target price (USD)"
              helperText="We only alert or prepare checkout at or below this price."
              error={mandateErrors.target}
              required
            >
              <div className="flex items-center">
                <span className="text-[13px] text-zinc-600 mr-1.5">$</span>
                <input
                  id="mandate-target-input"
                  type="number"
                  step="0.01"
                  placeholder="265.00"
                  value={newTargetPrice}
                  onChange={(e) => setNewTargetPrice(e.target.value)}
                  onBlur={(e) => validateMandateField("target", e.target.value)}
                  aria-invalid={Boolean(mandateErrors.target)}
                  className="w-32 h-9 rounded-[6px] border border-zinc-200 bg-white px-2.5 text-[13px] font-medium text-zinc-900 placeholder:text-zinc-500 tabular-nums transition focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>
            </FormField>

            <button
              type="submit"
              disabled={creatingMandate}
              className="inline-flex h-9 items-center gap-1.5 rounded-[6px] bg-zinc-950 hover:bg-zinc-800 px-3.5 text-[13px] font-medium text-white transition disabled:opacity-50"
            >
              {creatingMandate ? "Saving alert..." : "Save price alert"}
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
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[11px] font-medium text-zinc-700 whitespace-nowrap">
                          {deal.sku}
                        </span>
                        <span className="text-[11px] text-zinc-600">
                          {deal.brand} · {deal.category}
                        </span>
                      </div>
                      <h4
                        title={deal.title}
                        className="text-sm font-semibold text-zinc-900 leading-snug line-clamp-2"
                      >
                        {deal.title}
                      </h4>
                    </div>

                    <div className="text-right tabular-nums shrink-0">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="text-xs text-zinc-500 line-through">
                          {formatUsd(deal.retail_price)}
                        </span>
                        <span className="text-base font-bold text-zinc-900">
                          {formatUsd(deal.channel3_best_price)}
                        </span>
                      </div>
                      <span className="text-[12px] font-medium text-emerald-700 tabular-nums">
                        Save {formatUsd(deal.savings_amount)} ({deal.savings_percent}%)
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-100 text-[12px] text-zinc-600">
                    <div>
                      {deal.merchant_name}
                      {deal.bnpl_eligible &&
                      deal.channel3_best_price >= 30 &&
                      deal.channel3_best_price <= 1500
                        ? ` · 4 × ${formatUsd(deal.bnpl_installment_monthly)}`
                        : ""}
                    </div>

                    <StatusDot
                      label={
                        isPurchased
                          ? "Purchased"
                          : `Target met (${formatUsd(deal.target_mandate_price)})`
                      }
                      tone={isPurchased ? "positive" : "accent"}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Order Summary & PayPal Checkout */}
        <div className="lg:col-span-5">
          {activeDeal && (
            <div className="rounded-xl border border-zinc-200 bg-white p-5 space-y-4 sticky top-20">
              <div className="border-b border-zinc-100 pb-3">
                <span className="text-[12px] font-medium text-zinc-600">
                  Order summary
                </span>
                <h4
                  title={activeDeal.title}
                  className="mt-1 text-sm font-semibold text-zinc-900 line-clamp-2"
                >
                  {activeDeal.title}
                </h4>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-xs text-zinc-600">
                    Current price
                  </span>
                  <span className="tabular-nums text-xl font-semibold text-zinc-950">
                    {formatUsd(activeDeal.channel3_best_price)}
                  </span>
                </div>
              </div>

              <PayPalV6CheckoutWidget
                key={activeDeal.id}
                amountValue={activeDeal.channel3_best_price.toFixed(2)}
                description={`Price watch order: ${activeDeal.title} (${activeDeal.sku})`}
                channel3DealId={activeDeal.id}
                bnplInstallment={activeDeal.bnpl_installment_monthly}
                activeMode={activeMode}
                publicClientId={publicPayPalClientId}
                publicPayPalClientId={publicPayPalClientId}
                clientToken={clientToken}
                clientTokenIsLive={clientTokenIsLive}
                sandboxBuyerEmail={sandboxBuyerEmail}
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
