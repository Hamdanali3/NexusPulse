"use client";

import React, { useMemo, useState } from "react";
import { AllCommunityModule, ModuleRegistry, themeQuartz } from "ag-grid-community";
import type { ColDef } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { Bot, Download, Filter, Layers, Search, ShieldCheck } from "lucide-react";
import type { NexusPulseState } from "@/lib/paypal/paypal-sandbox-mirror";
import type {
  PayPalInvoiceRecord,
  PayPalLedgerTransaction,
  PayPalOrderRecord,
  PayPalPayoutRecord,
} from "@/lib/paypal/paypal-types";

ModuleRegistry.registerModules([AllCommunityModule]);

const lightGridTheme = themeQuartz.withParams({
  backgroundColor: "#ffffff",
  foregroundColor: "#09090b",
  headerBackgroundColor: "#fafafa",
  headerTextColor: "#52525b",
  oddRowBackgroundColor: "#ffffff",
  borderColor: "#e4e4e7",
  accentColor: "#5258D4",
  fontSize: 12,
});

interface AgGridFinancialCommandCenterProps {
  state: NexusPulseState;
  onAskGeminiAboutLedger: (prompt: string) => void;
}

export default function AgGridFinancialCommandCenter({
  state,
  onAskGeminiAboutLedger,
}: AgGridFinancialCommandCenterProps) {
  const [activeTab, setActiveTab] = useState<"transactions" | "orders" | "payouts" | "invoices">(
    "transactions"
  );
  const [quickFilterText, setQuickFilterText] = useState("");
  const [engineFilter, setEngineFilter] = useState<string>("ALL");

  const filteredTransactions = useMemo(() => {
    if (engineFilter === "ALL") return state.transactions;
    return state.transactions.filter((t) => t.engine === engineFilter);
  }, [state.transactions, engineFilter]);

  const transactionCols = useMemo<ColDef<PayPalLedgerTransaction>[]>(
    () => [
      {
        field: "transaction_id",
        headerName: "PayPal Txn ID",
        width: 155,
        cellClass: "font-mono text-sky-700 font-semibold",
      },
      {
        field: "transaction_event_code",
        headerName: "T-Code",
        width: 95,
        cellClass: "font-mono text-amber-800 font-semibold",
      },
      {
        field: "engine",
        headerName: "Nexus Engine",
        width: 175,
      },
      {
        field: "event_label",
        headerName: "PayPal API Operation & Description",
        flex: 1,
        minWidth: 250,
      },
      {
        field: "counterparty",
        headerName: "Counterparty / Agent",
        width: 210,
      },
      {
        field: "amount",
        headerName: "Gross (USD)",
        width: 125,
        valueFormatter: (p) =>
          p.value !== undefined
            ? `${p.value >= 0 ? "+" : "-"}$${Math.abs(Number(p.value)).toFixed(2)}`
            : "$0.00",
        cellClass: (p) =>
          Number(p.value) >= 0 ? "font-bold text-emerald-700" : "font-semibold text-rose-700",
      },
      {
        field: "net_amount",
        headerName: "Net (USD)",
        width: 120,
        valueFormatter: (p) =>
          p.value !== undefined
            ? `${p.value >= 0 ? "+" : "-"}$${Math.abs(Number(p.value)).toFixed(2)}`
            : "$0.00",
      },
      {
        field: "funding_source",
        headerName: "PayPal Rail",
        width: 170,
      },
      {
        field: "status_label",
        headerName: "Status",
        width: 115,
      },
      {
        field: "ai_confidence",
        headerName: "Gemini Score",
        width: 120,
        valueFormatter: (p) => `${p.value ?? 99}% Verified`,
      },
      {
        field: "initiation_date",
        headerName: "Timestamp (UTC)",
        width: 175,
        valueFormatter: (p) => (p.value ? new Date(p.value).toLocaleString() : ""),
      },
    ],
    []
  );

  const orderCols = useMemo<ColDef<PayPalOrderRecord>[]>(
    () => [
      { field: "id", headerName: "Order ID (/v2/checkout/orders)", width: 190 },
      { field: "intent", headerName: "Intent", width: 115 },
      { field: "status", headerName: "Order Status", width: 135 },
      {
        headerName: "Amount (USD)",
        width: 130,
        valueGetter: (p) => p.data?.amount.value,
        valueFormatter: (p) => `$${p.value ?? "0.00"}`,
      },
      { field: "description", headerName: "Description", flex: 1, minWidth: 260 },
      { field: "funding_source", headerName: "Funding", width: 110 },
      { field: "capture_id", headerName: "Capture ID", width: 165 },
      { field: "authorization_id", headerName: "Authorization ID", width: 165 },
      { field: "paypal_request_id", headerName: "PayPal-Request-Id (Idempotency)", width: 210 },
    ],
    []
  );

  const payoutCols = useMemo<ColDef<PayPalPayoutRecord>[]>(
    () => [
      { field: "payout_batch_id", headerName: "Batch ID (/v1/payments/payouts)", width: 190 },
      { field: "batch_status", headerName: "Batch Status", width: 125 },
      { field: "recipient_type", headerName: "Recipient Type", width: 130 },
      { field: "receiver", headerName: "Receiver Account", width: 230 },
      {
        headerName: "Payout (USD)",
        width: 130,
        valueGetter: (p) => p.data?.amount.value,
        valueFormatter: (p) => `+$${p.value ?? "0.00"}`,
      },
      { field: "bounty_id", headerName: "Bounty ID", width: 120 },
      {
        field: "verification_score",
        headerName: "Gemini Oracle Score",
        width: 155,
        valueFormatter: (p) => `${p.value ?? 98}/100`,
      },
      { field: "note", headerName: "Bounty Verification Note", flex: 1, minWidth: 260 },
    ],
    []
  );

  const invoiceCols = useMemo<ColDef<PayPalInvoiceRecord>[]>(
    () => [
      { field: "id", headerName: "Invoice ID (/v2/invoicing/invoices)", width: 210 },
      { field: "invoice_number", headerName: "Invoice #", width: 140 },
      { field: "status", headerName: "Status", width: 120 },
      { field: "recipient_name", headerName: "Client Organization", width: 200 },
      {
        headerName: "Amount (USD)",
        width: 130,
        valueGetter: (p) => p.data?.amount.value,
        valueFormatter: (p) => `$${p.value ?? "0.00"}`,
      },
      { field: "item_name", headerName: "Milestone Deliverable", flex: 1, minWidth: 250 },
      { field: "due_date", headerName: "Due Date", width: 125 },
      {
        field: "early_payment_discount_percent",
        headerName: "Early Pay Discount",
        width: 150,
        valueFormatter: (p) => `${p.value ?? 0}%`,
      },
    ],
    []
  );

  function exportCsv() {
    const rows = state.transactions.map((t) =>
      [
        t.transaction_id,
        t.transaction_event_code,
        t.engine,
        `"${t.event_label.replace(/"/g, '""')}"`,
        `"${t.counterparty.replace(/"/g, '""')}"`,
        t.amount,
        t.net_amount,
        t.funding_source,
        t.status_label,
        t.initiation_date,
      ].join(",")
    );
    const csv = [
      "transaction_id,event_code,engine,description,counterparty,gross_usd,net_usd,funding_source,status,initiation_date",
      ...rows,
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nexus-pulse-paypal-ag-grid-ledger.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section
      aria-labelledby="aggrid-heading"
      className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs space-y-5"
    >
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-100 pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700">
              <Layers className="h-3 w-3 text-zinc-500" />
              AG Grid
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700">
              <ShieldCheck className="h-3 w-3 text-zinc-500" />
              PayPal Ledger
            </span>
          </div>
          <h2 id="aggrid-heading" className="mt-1.5 text-base font-semibold text-zinc-900">
            Financial Ledger &amp; Audit Trail
          </h2>
          <p className="text-xs text-zinc-500">
            Unified audit ledger across transactions, orders, payouts, and invoices.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() =>
              onAskGeminiAboutLedger(
                "Perform a deep Gemini 4 Argon CFO audit of my AG Grid PayPal ledger, highlight my highest ROI agent actions, and recommend the next optimization."
              )
            }
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 px-3 text-xs font-medium text-white transition"
          >
            <Bot className="h-3.5 w-3.5 text-indigo-400" />
            <span>Audit with AI</span>
          </button>

          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 px-3 text-xs font-medium text-zinc-700 transition"
          >
            <Download className="h-3.5 w-3.5 text-zinc-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Endpoint Tabs + Quick Search + Engine Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="PayPal Ledger Endpoint Views"
          className="flex flex-wrap gap-1"
        >
          {(
            [
              {
                id: "transactions",
                label: `Transactions (${state.transactions.length})`,
                endpoint: "GET /v1/reporting/transactions",
              },
              {
                id: "orders",
                label: `Orders (${state.orders.length})`,
                endpoint: "GET /v2/checkout/orders",
              },
              {
                id: "payouts",
                label: `Payouts (${state.payouts.length})`,
                endpoint: "GET /v1/payments/payouts",
              },
              {
                id: "invoices",
                label: `Invoices (${state.invoices.length})`,
                endpoint: "GET /v2/invoicing/invoices",
              },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={activeTab === t.id}
              onClick={() => setActiveTab(t.id)}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                activeTab === t.id
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeTab === "transactions" && (
            <div className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 h-8 text-xs">
              <Filter className="h-3 w-3 text-zinc-400" />
              <label htmlFor="aggrid-engine-filter" className="visually-hidden">
                Filter transactions by Nexus Engine
              </label>
              <select
                id="aggrid-engine-filter"
                value={engineFilter}
                onChange={(e) => setEngineFilter(e.target.value)}
                className="bg-transparent text-xs text-zinc-800 font-medium focus:outline-none"
              >
                <option value="ALL">All Engines</option>
                <option value="AUTOPILOT_CFO">Autopilot CFO</option>
                <option value="PROOF_OF_HUMAN_BOUNTY">Bounties</option>
                <option value="A2A_SMART_ESCROW">Smart Escrow</option>
                <option value="SUBSCRIPTION_GUARD">Subscription Guard</option>
              </select>
            </div>
          )}

          <div className="relative">
            <label htmlFor="aggrid-quick-search" className="visually-hidden">
              Quick search PayPal IDs, T-codes, and amounts
            </label>
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
            <input
              id="aggrid-quick-search"
              type="search"
              value={quickFilterText}
              onChange={(e) => setQuickFilterText(e.target.value)}
              placeholder="Search ledger..."
              className="h-8 w-56 rounded-lg border border-zinc-200 bg-zinc-50/50 pl-8 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 transition focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
            />
          </div>
        </div>
      </div>

      {/* AG Grid Canvas */}
      <div className="h-[340px] w-full overflow-hidden rounded-xl border border-zinc-200">
        {activeTab === "transactions" && (
          <AgGridReact<PayPalLedgerTransaction>
            theme={lightGridTheme}
            rowData={filteredTransactions}
            columnDefs={transactionCols}
            quickFilterText={quickFilterText}
            animateRows={true}
            defaultColDef={{ sortable: true, filter: true, resizable: true }}
          />
        )}
        {activeTab === "orders" && (
          <AgGridReact<PayPalOrderRecord>
            theme={lightGridTheme}
            rowData={state.orders}
            columnDefs={orderCols}
            quickFilterText={quickFilterText}
            animateRows={true}
            defaultColDef={{ sortable: true, filter: true, resizable: true }}
          />
        )}
        {activeTab === "payouts" && (
          <AgGridReact<PayPalPayoutRecord>
            theme={lightGridTheme}
            rowData={state.payouts}
            columnDefs={payoutCols}
            quickFilterText={quickFilterText}
            animateRows={true}
            defaultColDef={{ sortable: true, filter: true, resizable: true }}
          />
        )}
        {activeTab === "invoices" && (
          <AgGridReact<PayPalInvoiceRecord>
            theme={lightGridTheme}
            rowData={state.invoices}
            columnDefs={invoiceCols}
            quickFilterText={quickFilterText}
            animateRows={true}
            defaultColDef={{ sortable: true, filter: true, resizable: true }}
          />
        )}
      </div>
    </section>
  );
}
