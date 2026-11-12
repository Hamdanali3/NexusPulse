"use client";

import React, { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Plus,
  Search,
} from "lucide-react";
import type {
  Channel3ProductDeal,
  PayPalExecutionMode,
} from "@/lib/paypal/paypal-types";
import PayPalV6CheckoutWidget from "@/components/paypal/PayPalV6CheckoutWidget";
import { Button, FormField, ListRow, ListSection, StatusDot } from "@/components/ui";
import { formatUsd, sanitizeSeedCopy } from "@/lib/format";

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
      aria-label="Price watch"
      className="space-y-6"
    >
      {mandateBanner && (
        <div
          role={mandateBanner.type === "error" ? "alert" : "status"}
          aria-live="polite"
          className={`flex items-center justify-between rounded-[12px] border px-4 py-3 text-[13px] transition-colors ${
            mandateBanner.type === "success"
              ? "border-emerald-200 bg-emerald-50/70 text-emerald-900"
              : "border-red-200 bg-red-50/70 text-red-900"
          }`}
        >
          <div className="flex items-center gap-2">
            {mandateBanner.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" strokeWidth={1.5} />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-red-700" strokeWidth={1.5} />
            )}
            <span className="font-medium">{mandateBanner.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setMandateBanner(null)}
            className="text-[12px] font-medium px-2 py-0.5 rounded-[6px] text-zinc-700 hover:text-zinc-950 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-200">
        <span className="text-[13px] text-zinc-600">
          {displayedDeals.length} active price alerts · Updated price feed
        </span>

        {/* Search Filter Form + New Price Alert Button */}
        <div className="flex flex-wrap items-center gap-2">
          <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <label htmlFor="channel3-search-input" className="visually-hidden">
                Search SKU, brand, or product
              </label>
              <Search className="h-4 w-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" strokeWidth={1.5} />
              <input
                id="channel3-search-input"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search SKU or brand"
                className="h-9 rounded-[6px] border border-zinc-200 bg-white pl-9 pr-3 text-[13px] text-zinc-900 placeholder:text-zinc-500 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <Button type="submit" variant="secondary" size="sm" loading={searching}>
              {searching ? "Searching..." : "Search"}
            </Button>
            {filteredDeals && (
              <Button type="button" variant="ghost" size="sm" onClick={handleResetFilters}>
                Reset
              </Button>
            )}
          </form>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => setShowMandateForm((v) => !v)}
          >
            <Plus className="h-4 w-4" strokeWidth={1.5} />
            Add price alert
          </Button>
        </div>
      </div>

      {/* Create Custom Price-Drop Alert Drawer */}
      {showMandateForm && (
        <form
          onSubmit={handleCreateMandate}
          className="rounded-[12px] border border-zinc-200 bg-white p-5 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
            <span className="text-[14px] font-semibold text-zinc-950">
              Add price alert
            </span>
            <button
              type="button"
              onClick={() => setShowMandateForm(false)}
              className="text-[13px] text-zinc-600 hover:text-zinc-950 font-medium"
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Dense Hairline Price Watch List */}
        <div className="lg:col-span-7 space-y-2.5">
          {displayedDeals.length === 0 ? (
            <div className="rounded-[12px] border border-zinc-200 bg-white p-8 text-center text-[13px] text-zinc-600">
              No products found matching &quot;{searchQuery}&quot;.
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-2 block mx-auto text-indigo-600 font-medium hover:underline"
              >
                Reset search
              </button>
            </div>
          ) : (
            <ListSection>
              {displayedDeals.map((deal) => {
                const isSelected = activeDeal?.id === deal.id;
                const isPurchased = deal.mandate_status === "PURCHASED_VIA_PAYPAL";
                const showBnpl =
                  deal.bnpl_eligible &&
                  deal.channel3_best_price >= 30 &&
                  deal.channel3_best_price <= 1500;

                return (
                  <ListRow
                    key={deal.id}
                    selected={isSelected}
                    onSelect={() => setActiveCheckoutDealId(deal.id)}
                    title={<span title={sanitizeSeedCopy(deal.title)}>{sanitizeSeedCopy(deal.title)}</span>}
                    subtitle={
                      <span>
                        <span className="font-mono text-zinc-700">{deal.sku}</span>
                        {" · "}
                        {deal.merchant_name}
                        {showBnpl ? ` · 4 × ${formatUsd(deal.bnpl_installment_monthly)}` : ""}
                      </span>
                    }
                    amount={
                      <div className="flex flex-col items-end gap-0.5 tabular-nums">
                        <div className="flex items-baseline justify-end gap-1.5">
                          <span className="text-[12px] text-zinc-500 line-through">
                            {formatUsd(deal.retail_price)}
                          </span>
                          <span className="text-[14px] font-semibold text-zinc-950">
                            {formatUsd(deal.channel3_best_price)}
                          </span>
                        </div>
                        <span className="text-[12px] font-medium text-emerald-700">
                          Save {formatUsd(deal.savings_amount)} ({deal.savings_percent}%)
                        </span>
                        <StatusDot
                          label={
                            isPurchased
                              ? "Purchased"
                              : `Target ${formatUsd(deal.target_mandate_price)}`
                          }
                          tone={isPurchased ? "positive" : "accent"}
                          className="mt-0.5 text-[12px]"
                        />
                      </div>
                    }
                  />
                );
              })}
            </ListSection>
          )}
        </div>

        {/* Right Column: Sticky Order Summary & PayPal Checkout */}
        <div className="lg:col-span-5">
          {activeDeal && (
            <div className="rounded-[12px] border border-zinc-200 bg-white p-5 space-y-4 lg:sticky lg:top-20">
              <div className="border-b border-zinc-200 pb-3">
                <span className="text-[12px] font-medium text-zinc-600">
                  Order summary
                </span>
                <h3
                  title={sanitizeSeedCopy(activeDeal.title)}
                  className="mt-1 text-[15px] font-semibold text-zinc-950 line-clamp-2"
                >
                  {sanitizeSeedCopy(activeDeal.title)}
                </h3>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-[13px] text-zinc-600">
                    Current price
                  </span>
                  <span className="tabular-nums text-[22px] font-semibold text-zinc-950">
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
