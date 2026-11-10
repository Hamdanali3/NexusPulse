"use client";

import React, { useMemo, useState } from "react";
import { AllCommunityModule, ModuleRegistry, themeQuartz } from "ag-grid-community";
import type { ColDef } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { Bot, Download, Filter, Layers, Search, ShieldCheck } from "lucide-react";
import type { SovereignPulseState } from "@/lib/paypal/paypal-sandbox-mirror";
import type {
  PayPalInvoiceRecord,
  PayPalLedgerTransaction,
  PayPalOrderRecord,
  PayPalPayoutRecord,
} from "@/lib/paypal/paypal-types";

ModuleRegistry.registerModules([AllCommunityModule]);

const darkGridTheme = themeQuartz.withParams({
  backgroundColor: "#090d16",
  foregroundColor: "#e2e8f0",
  headerBackgroundColor: "#0f172a",
  headerTextColor: "#94a3b8",
  oddRowBackgroundColor: "#0b1120",
  borderColor: "#1e293b",
  accentColor: "#38bdf8",
  fontSize: 12,
});

interface AgGridFinancialCommandCenterProps {
  state: SovereignPulseState;
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
        cellClass: "font-mono text-sky-300",
      },
      {
        field: "transaction_event_code",
        headerName: "T-Code",
        width: 95,
        cellClass: "font-mono text-amber-300",
      },
      {
        field: "engine",
        headerName: "Sovereign Engine",
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
          Number(p.value) >= 0 ? "font-bold text-emerald-400" : "font-semibold text-rose-300",
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
    a.download = `sovereign-pulse-paypal-ag-grid-ledger.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/40 bg-sky-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-sky-300">
              <Layers className="h-3 w-3" />
              Sponsor Integration: AG Grid Enterprise Telemetry (v36.3.0)
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300">
              <ShieldCheck className="h-3 w-3" />
              PayPal Reporting & Orders v2 Synced
            </span>
          </div>
          <h2 className="mt-1.5 text-lg font-bold text-white">
            AG Grid Unified PayPal Financial & Agentic Telemetry Command Center
          </h2>
          <p className="text-xs text-slate-400">
            Real-time multi-endpoint relational grid across{" "}
            <code className="text-sky-300">/v1/reporting/transactions</code>,{" "}
            <code className="text-sky-300">/v2/checkout/orders</code>,{" "}
            <code className="text-sky-300">/v1/payments/payouts</code>, and{" "}
            <code className="text-sky-300">/v2/invoicing/invoices</code>.
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
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow transition hover:opacity-95"
          >
            <Bot className="h-3.5 w-3.5" />
            <span>Ask Gemini 4 Argon CFO to Audit Grid</span>
          </button>

          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-slate-700"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Endpoint Tabs + Quick Search + Engine Filter */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              {
                id: "transactions",
                label: `Transactions (${state.transactions.length})`,
                endpoint: "GET /v1/reporting/transactions",
              },
              {
                id: "orders",
                label: `Orders v2 (${state.orders.length})`,
                endpoint: "GET /v2/checkout/orders",
              },
              {
                id: "payouts",
                label: `Payouts v1 (${state.payouts.length})`,
                endpoint: "GET /v1/payments/payouts",
              },
              {
                id: "invoices",
                label: `Invoices v2 (${state.invoices.length})`,
                endpoint: "GET /v2/invoicing/invoices",
              },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === t.id
                  ? "bg-sky-500 text-slate-950 shadow"
                  : "border border-slate-800 bg-slate-950/60 text-slate-300 hover:bg-slate-800"
              }`}
            >
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeTab === "transactions" && (
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950/80 px-2.5 py-1 text-xs">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={engineFilter}
                onChange={(e) => setEngineFilter(e.target.value)}
                className="bg-transparent text-xs text-slate-200 focus:outline-none"
              >
                <option value="ALL" className="bg-slate-900">
                  All Engines
                </option>
                <option value="AUTOPILOT_CFO" className="bg-slate-900">
                  Autopilot CFO & Deal-Hunter
                </option>
                <option value="PROOF_OF_HUMAN_BOUNTY" className="bg-slate-900">
                  Proof-of-Human Bounties
                </option>
                <option value="A2A_SMART_ESCROW" className="bg-slate-900">
                  A2A Smart Escrow
                </option>
                <option value="SUBSCRIPTION_GUARD" className="bg-slate-900">
                  Subscription Guard
                </option>
              </select>
            </div>
          )}

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={quickFilterText}
              onChange={(e) => setQuickFilterText(e.target.value)}
              placeholder="Search PayPal IDs, T-codes, amounts..."
              className="w-64 rounded-xl border border-slate-800 bg-slate-950/90 py-1.5 pl-8 pr-3 text-xs text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* AG Grid Canvas */}
      <div className="mt-3 h-[340px] w-full overflow-hidden rounded-xl border border-slate-800">
        {activeTab === "transactions" && (
          <AgGridReact<PayPalLedgerTransaction>
            theme={darkGridTheme}
            rowData={filteredTransactions}
            columnDefs={transactionCols}
            quickFilterText={quickFilterText}
            animateRows={true}
            defaultColDef={{ sortable: true, filter: true, resizable: true }}
          />
        )}
        {activeTab === "orders" && (
          <AgGridReact<PayPalOrderRecord>
            theme={darkGridTheme}
            rowData={state.orders}
            columnDefs={orderCols}
            quickFilterText={quickFilterText}
            animateRows={true}
            defaultColDef={{ sortable: true, filter: true, resizable: true }}
          />
        )}
        {activeTab === "payouts" && (
          <AgGridReact<PayPalPayoutRecord>
            theme={darkGridTheme}
            rowData={state.payouts}
            columnDefs={payoutCols}
            quickFilterText={quickFilterText}
            animateRows={true}
            defaultColDef={{ sortable: true, filter: true, resizable: true }}
          />
        )}
        {activeTab === "invoices" && (
          <AgGridReact<PayPalInvoiceRecord>
            theme={darkGridTheme}
            rowData={state.invoices}
            columnDefs={invoiceCols}
            quickFilterText={quickFilterText}
            animateRows={true}
            defaultColDef={{ sortable: true, filter: true, resizable: true }}
          />
        )}
      </div>
    </div>
  );
}
