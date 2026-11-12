"use client";

import React, { useMemo, useRef, useState } from "react";
import { AllCommunityModule, ModuleRegistry, themeQuartz } from "ag-grid-community";
import type { ColDef } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { Columns3, Download, ExternalLink, FilePlus2, Filter, RefreshCw, Search } from "lucide-react";
import type { NexusPulseState } from "@/lib/paypal/paypal-sandbox-mirror";
import type {
  PayPalExecutionMode,
  PayPalInvoiceRecord,
  PayPalLedgerTransaction,
  PayPalLiveTelemetry,
  PayPalOrderRecord,
  PayPalPayoutRecord,
} from "@/lib/paypal/paypal-types";
import {
  formatShortDate,
  formatSignedUsd,
  formatUsd,
  humanizeEngine,
  humanizeTransactionStatus,
  sanitizeDisplayEmail,
  sanitizeSeedCopy,
} from "@/lib/format";

ModuleRegistry.registerModules([AllCommunityModule]);

const lightGridTheme = themeQuartz.withParams({
  backgroundColor: "#ffffff",
  foregroundColor: "#09090b",
  headerBackgroundColor: "#fafafa",
  headerTextColor: "#52525b",
  oddRowBackgroundColor: "#ffffff",
  rowHoverColor: "#f4f4f5",
  selectedRowBackgroundColor: "#eef2ff",
  borderColor: "#e4e4e7",
  accentColor: "#4f46e5",
  fontFamily: "var(--np-font-sans), ui-sans-serif, system-ui, sans-serif",
  fontSize: 13,
  headerFontSize: 12,
  headerFontWeight: 500,
  wrapperBorderRadius: 12,
  borderRadius: 6,
  cellHorizontalPadding: 14,
  rowHeight: 44,
  headerHeight: 38,
});

const SECONDARY_TX_COLUMNS = [
  { key: "transaction_event_code", label: "Event code" },
  { key: "net_amount", label: "Net amount" },
  { key: "funding_source", label: "Method" },
  { key: "ai_confidence", label: "Confidence" },
  { key: "initiation_date", label: "Date" },
] as const;

type SecondaryTxKey = (typeof SECONDARY_TX_COLUMNS)[number]["key"];

interface AgGridFinancialCommandCenterProps {
  state: NexusPulseState;
  activeMode?: PayPalExecutionMode;
  liveTelemetry?: PayPalLiveTelemetry | null;
  syncingTelemetry?: boolean;
  sandboxBuyerEmail?: string;
  onSyncSandbox?: () => void;
  onCreateLiveInvoice?: (payload: {
    amountValue: string;
    itemName: string;
    recipientEmail?: string;
  }) => Promise<{ viewUrl?: string; invoiceId?: string } | null>;
  onAskGeminiAboutLedger: (prompt: string) => void;
}

function StatusCellRenderer({ value, data }: { value?: string; data?: { status?: string } }) {
  const label = humanizeTransactionStatus(data?.status, value);
  const dotColor =
    label === "Completed"
      ? "bg-emerald-600"
      : label === "Failed"
        ? "bg-red-600"
        : label === "Authorized"
          ? "bg-indigo-600"
          : "bg-zinc-400";

  return (
    <span
      title={value || data?.status || label}
      className="inline-flex items-center gap-1.5 text-[13px] font-medium text-zinc-800"
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

export default function AgGridFinancialCommandCenter({
  state,
  activeMode = "sandbox",
  liveTelemetry,
  syncingTelemetry = false,
  sandboxBuyerEmail = "sb-ifqau51324237@personal.example.com",
  onSyncSandbox,
  onCreateLiveInvoice,
  onAskGeminiAboutLedger,
}: AgGridFinancialCommandCenterProps) {
  const [activeTab, setActiveTab] = useState<"transactions" | "orders" | "payouts" | "invoices">(
    "transactions"
  );
  const [quickFilterText, setQuickFilterText] = useState("");
  const [engineFilter, setEngineFilter] = useState<string>("ALL");
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);
  const [visibleExtraCols, setVisibleExtraCols] = useState<SecondaryTxKey[]>([]);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [invoiceAmount, setInvoiceAmount] = useState("49.00");
  const [invoiceItem, setInvoiceItem] = useState("Milestone settlement invoice");
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [createdInvoiceUrl, setCreatedInvoiceUrl] = useState<string | null>(null);
  const columnsMenuRef = useRef<HTMLDivElement | null>(null);

  function toggleExtraCol(key: SecondaryTxKey) {
    setVisibleExtraCols((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  const sanitizedTransactions = useMemo(
    () =>
      state.transactions.map((t) => ({
        ...t,
        event_label: sanitizeSeedCopy(t.event_label),
        counterparty: sanitizeSeedCopy(t.counterparty),
      })),
    [state.transactions]
  );

  const filteredTransactions = useMemo(() => {
    if (engineFilter === "ALL") return sanitizedTransactions;
    return sanitizedTransactions.filter((t) => t.engine === engineFilter);
  }, [sanitizedTransactions, engineFilter]);

  const sanitizedOrders = useMemo(
    () =>
      state.orders.map((o) => ({
        ...o,
        description: sanitizeSeedCopy(o.description),
      })),
    [state.orders]
  );

  const sanitizedPayouts = useMemo(
    () =>
      state.payouts.map((p) => ({
        ...p,
        receiver: sanitizeDisplayEmail(p.receiver),
        note: sanitizeSeedCopy(p.note),
      })),
    [state.payouts]
  );

  const sanitizedInvoices = useMemo(
    () =>
      state.invoices.map((inv) => ({
        ...inv,
        recipient_name: sanitizeSeedCopy(inv.recipient_name),
        item_name: sanitizeSeedCopy(inv.item_name),
      })),
    [state.invoices]
  );

  const transactionCols = useMemo<ColDef<PayPalLedgerTransaction>[]>(
    () => [
      {
        field: "transaction_id",
        headerName: "Txn ID",
        pinned: "left",
        width: 175,
        suppressSizeToFit: true,
        cellClass: "font-mono text-xs text-zinc-900",
        tooltipField: "transaction_id",
      },
      {
        field: "engine",
        headerName: "Category",
        width: 145,
        valueFormatter: (p) => humanizeEngine(p.value),
        tooltipValueGetter: (p) => (p.value ? `Code: ${p.value}` : ""),
      },
      {
        field: "event_label",
        headerName: "Description",
        flex: 1,
        minWidth: 210,
        tooltipField: "event_label",
      },
      {
        field: "counterparty",
        headerName: "Counterparty",
        width: 195,
        tooltipField: "counterparty",
      },
      {
        field: "status_label",
        headerName: "Status",
        width: 120,
        cellRenderer: StatusCellRenderer,
      },
      {
        field: "transaction_event_code",
        headerName: "T-Code",
        width: 95,
        hide: !visibleExtraCols.includes("transaction_event_code"),
        cellClass: "font-mono text-xs text-zinc-700",
      },
      {
        field: "net_amount",
        headerName: "Net",
        width: 120,
        hide: !visibleExtraCols.includes("net_amount"),
        type: "rightAligned",
        headerClass: "ag-right-aligned-header",
        cellClass: "tabular-nums text-right text-zinc-800",
        valueFormatter: (p) => formatSignedUsd(p.value),
      },
      {
        field: "funding_source",
        headerName: "Method",
        width: 165,
        hide: !visibleExtraCols.includes("funding_source"),
        valueFormatter: (p) => sanitizeSeedCopy(p.value),
        tooltipField: "funding_source",
      },
      {
        field: "ai_confidence",
        headerName: "Confidence",
        width: 115,
        hide: !visibleExtraCols.includes("ai_confidence"),
        type: "rightAligned",
        headerClass: "ag-right-aligned-header",
        cellClass: "tabular-nums text-right text-zinc-700",
        valueFormatter: (p) => `${p.value ?? 99}%`,
      },
      {
        field: "initiation_date",
        headerName: "Date",
        width: 120,
        hide: !visibleExtraCols.includes("initiation_date"),
        valueFormatter: (p) => (p.value ? formatShortDate(p.value, true) : ""),
        tooltipField: "initiation_date",
      },
      {
        field: "amount",
        headerName: "Amount",
        pinned: "right",
        width: 125,
        suppressSizeToFit: true,
        type: "rightAligned",
        headerClass: "ag-right-aligned-header",
        valueFormatter: (p) => formatSignedUsd(p.value),
        cellClass: (p) =>
          `tabular-nums text-right font-medium ${
            Number(p.value) >= 0 ? "text-emerald-700" : "text-red-700"
          }`,
      },
    ],
    [visibleExtraCols]
  );

  const orderCols = useMemo<ColDef<PayPalOrderRecord>[]>(
    () => [
      {
        field: "id",
        headerName: "Order ID",
        pinned: "left",
        width: 185,
        cellClass: "font-mono text-xs text-zinc-900",
        tooltipField: "id",
      },
      {
        field: "description",
        headerName: "Description",
        flex: 1,
        minWidth: 230,
        tooltipField: "description",
      },
      {
        field: "funding_source",
        headerName: "Method",
        width: 110,
      },
      {
        field: "status",
        headerName: "Status",
        width: 125,
        cellRenderer: StatusCellRenderer,
      },
      {
        field: "capture_id",
        headerName: "Capture ID",
        width: 165,
        hide: !visibleExtraCols.includes("transaction_event_code"),
        cellClass: "font-mono text-xs text-zinc-700",
      },
      {
        field: "paypal_request_id",
        headerName: "Request ID",
        width: 190,
        hide: !visibleExtraCols.includes("initiation_date"),
        cellClass: "font-mono text-xs text-zinc-600",
      },
      {
        headerName: "Amount",
        pinned: "right",
        width: 120,
        type: "rightAligned",
        headerClass: "ag-right-aligned-header",
        cellClass: "tabular-nums text-right font-medium text-zinc-900",
        valueGetter: (p) => p.data?.amount.value,
        valueFormatter: (p) => formatUsd(p.value),
      },
    ],
    [visibleExtraCols]
  );

  const payoutCols = useMemo<ColDef<PayPalPayoutRecord>[]>(
    () => [
      {
        field: "payout_batch_id",
        headerName: "Payout ID",
        pinned: "left",
        width: 185,
        cellClass: "font-mono text-xs text-zinc-900",
        tooltipField: "payout_batch_id",
      },
      {
        field: "receiver",
        headerName: "Recipient",
        width: 220,
        tooltipField: "receiver",
      },
      {
        field: "note",
        headerName: "Note",
        flex: 1,
        minWidth: 220,
        tooltipField: "note",
      },
      {
        field: "batch_status",
        headerName: "Status",
        width: 120,
        cellRenderer: StatusCellRenderer,
      },
      {
        headerName: "Amount",
        pinned: "right",
        width: 120,
        type: "rightAligned",
        headerClass: "ag-right-aligned-header",
        cellClass: "tabular-nums text-right font-medium text-emerald-700",
        valueGetter: (p) => p.data?.amount.value,
        valueFormatter: (p) => formatSignedUsd(p.value),
      },
    ],
    []
  );

  const invoiceCols = useMemo<ColDef<PayPalInvoiceRecord>[]>(
    () => [
      {
        field: "invoice_number",
        headerName: "Invoice #",
        pinned: "left",
        width: 145,
        cellClass: "font-mono text-xs text-zinc-900",
      },
      {
        field: "recipient_name",
        headerName: "Recipient",
        width: 200,
        tooltipField: "recipient_name",
      },
      {
        field: "item_name",
        headerName: "Item",
        flex: 1,
        minWidth: 220,
        tooltipField: "item_name",
      },
      {
        field: "status",
        headerName: "Status",
        width: 120,
        cellRenderer: StatusCellRenderer,
      },
      {
        field: "due_date",
        headerName: "Due date",
        width: 120,
        valueFormatter: (p) => (p.value ? formatShortDate(p.value, true) : ""),
      },
      {
        headerName: "Amount",
        pinned: "right",
        width: 120,
        type: "rightAligned",
        headerClass: "ag-right-aligned-header",
        cellClass: "tabular-nums text-right font-medium text-zinc-900",
        valueGetter: (p) => p.data?.amount.value,
        valueFormatter: (p) => formatUsd(p.value),
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
        humanizeEngine(t.engine),
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
      "transaction_id,event_code,engine_raw,category,description,counterparty,gross_usd,net_usd,funding_source,status,initiation_date",
      ...rows,
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nexuspulse-ledger.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const defaultColDef = useMemo<ColDef>(
    () => ({
      sortable: true,
      filter: false,
      resizable: true,
    }),
    []
  );

  return (
    <section
      aria-labelledby="aggrid-heading"
      className="rounded-[12px] border border-zinc-200 bg-white p-6 space-y-5"
    >
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-100 pb-4">
        <div>
          <h2 id="aggrid-heading" className="text-base font-semibold text-zinc-950">
            Transaction ledger
          </h2>
          <p className="text-xs text-zinc-600 mt-0.5">
            Payments, escrow holds, payouts, and invoices in one searchable view.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onSyncSandbox && (
            <button
              type="button"
              disabled={syncingTelemetry}
              onClick={onSyncSandbox}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 px-3 text-xs font-medium text-zinc-800 transition disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-zinc-600 ${syncingTelemetry ? "animate-spin" : ""}`} />
              <span>{syncingTelemetry ? "Syncing..." : "Sync PayPal"}</span>
            </button>
          )}

          {onCreateLiveInvoice && (
            <button
              type="button"
              onClick={() => setShowInvoiceForm((v) => !v)}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 px-3 text-xs font-medium text-zinc-800 transition"
            >
              <FilePlus2 className="h-3.5 w-3.5 text-zinc-600" />
              <span>Issue invoice</span>
            </button>
          )}

          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 px-3 text-xs font-medium text-zinc-800 transition"
          >
            <Download className="h-3.5 w-3.5 text-zinc-600" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() =>
              onAskGeminiAboutLedger(
                "Review my ledger transactions, highlight the biggest savings or unusual charges, and recommend next steps."
              )
            }
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-zinc-950 hover:bg-zinc-800 px-3 text-xs font-medium text-white transition"
          >
            <span>Review ledger</span>
          </button>
        </div>
      </div>

      {/* Status Telemetry & Invoice Form */}
      {(liveTelemetry || createdInvoiceUrl || showInvoiceForm) && (
        <div className="space-y-3">
          {liveTelemetry && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs text-zinc-700">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 font-medium text-zinc-900">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      liveTelemetry.connected ? "bg-emerald-600" : "bg-zinc-400"
                    }`}
                    aria-hidden="true"
                  />
                  {liveTelemetry.connected ? "PayPal connected" : "Demo data"}
                </span>
                <span>Webhooks: {liveTelemetry.webhookCount}</span>
                <span>Disputes: {liveTelemetry.disputesCount}</span>
                <span>Invoices: {liveTelemetry.liveInvoicesCount}</span>
                <span>Plans: {liveTelemetry.catalogPlansCount}</span>
              </div>
            </div>
          )}

          {showInvoiceForm && onCreateLiveInvoice && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setCreatingInvoice(true);
                try {
                  const res = await onCreateLiveInvoice({
                    amountValue: invoiceAmount,
                    itemName: invoiceItem,
                    recipientEmail: sandboxBuyerEmail,
                  });
                  if (res?.viewUrl) {
                    setCreatedInvoiceUrl(res.viewUrl);
                  }
                  setActiveTab("invoices");
                  setShowInvoiceForm(false);
                } finally {
                  setCreatingInvoice(false);
                }
              }}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs"
            >
              <span className="font-medium text-zinc-900 shrink-0">
                New invoice ({activeMode}):
              </span>
              <input
                type="text"
                aria-label="Invoice description"
                value={invoiceItem}
                onChange={(e) => setInvoiceItem(e.target.value)}
                placeholder="Line item description"
                className="h-8 flex-1 min-w-[180px] rounded-md border border-zinc-200 bg-white px-2.5 text-xs text-zinc-900"
                required
              />
              <input
                type="number"
                aria-label="Invoice amount"
                step="0.01"
                min="1"
                value={invoiceAmount}
                onChange={(e) => setInvoiceAmount(e.target.value)}
                className="h-8 w-24 rounded-md border border-zinc-200 bg-white px-2.5 text-xs tabular-nums text-zinc-900"
                required
              />
              <button
                type="submit"
                disabled={creatingInvoice}
                className="h-8 rounded-md bg-zinc-950 hover:bg-zinc-800 px-3 text-xs font-medium text-white transition disabled:opacity-50"
              >
                {creatingInvoice ? "Sending..." : "Send invoice"}
              </button>
            </form>
          )}

          {createdInvoiceUrl && (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs text-emerald-900">
              <span>Invoice created and sent.</span>
              <a
                href={createdInvoiceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-emerald-900 underline"
              >
                <span>Open invoice</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>
      )}

      {/* Unified Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Ledger sections"
          className="flex flex-wrap gap-1"
        >
          {(
            [
              { id: "transactions", label: `Transactions (${filteredTransactions.length})` },
              { id: "orders", label: `Orders (${sanitizedOrders.length})` },
              { id: "payouts", label: `Payouts (${sanitizedPayouts.length})` },
              { id: "invoices", label: `Invoices (${sanitizedInvoices.length})` },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={activeTab === t.id}
              onClick={() => setActiveTab(t.id)}
              className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
                activeTab === t.id
                  ? "bg-zinc-950 text-white"
                  : "bg-zinc-100 text-zinc-700 hover:text-zinc-950"
              }`}
            >
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeTab === "transactions" && (
            <div className="flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 h-8 text-xs">
              <Filter className="h-3.5 w-3.5 text-zinc-500" />
              <label htmlFor="aggrid-engine-filter" className="visually-hidden">
                Filter transactions by category
              </label>
              <select
                id="aggrid-engine-filter"
                value={engineFilter}
                onChange={(e) => setEngineFilter(e.target.value)}
                className="bg-transparent text-xs text-zinc-800 font-medium focus:outline-none"
              >
                <option value="ALL">All categories</option>
                <option value="AUTOPILOT_CFO">Spending review</option>
                <option value="PROOF_OF_HUMAN_BOUNTY">Verified task</option>
                <option value="A2A_SMART_ESCROW">Escrow</option>
                <option value="SUBSCRIPTION_GUARD">Subscription check</option>
              </select>
            </div>
          )}

          <div className="relative">
            <label htmlFor="aggrid-quick-search" className="visually-hidden">
              Search ledger rows
            </label>
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
            <input
              id="aggrid-quick-search"
              type="search"
              value={quickFilterText}
              onChange={(e) => setQuickFilterText(e.target.value)}
              placeholder="Search ledger..."
              className="h-8 w-52 rounded-md border border-zinc-200 bg-white pl-8 pr-3 text-xs text-zinc-900 placeholder:text-zinc-500 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
            />
          </div>

          {/* Secondary Columns Picker */}
          <div ref={columnsMenuRef} className="relative">
            <button
              type="button"
              aria-expanded={showColumnsMenu}
              aria-haspopup="menu"
              onClick={() => setShowColumnsMenu((v) => !v)}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 px-2.5 text-xs font-medium text-zinc-800 transition"
            >
              <Columns3 className="h-3.5 w-3.5 text-zinc-600" />
              <span>Columns</span>
            </button>

            {showColumnsMenu && (
              <div
                role="menu"
                className="absolute right-0 mt-1.5 z-30 w-48 rounded-[12px] border border-zinc-200 bg-white p-2 shadow-[0_8px_24px_-4px_rgb(9_9_11/0.08),0_2px_6px_-1px_rgb(9_9_11/0.04)] space-y-1"
              >
                <div className="px-2 py-1 text-[12px] font-medium text-zinc-600">
                  Additional columns
                </div>
                {SECONDARY_TX_COLUMNS.map((col) => {
                  const checked = visibleExtraCols.includes(col.key);
                  return (
                    <label
                      key={col.key}
                      className="flex items-center gap-2 rounded-[6px] px-2 py-1.5 text-[13px] text-zinc-800 hover:bg-zinc-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleExtraCol(col.key)}
                        className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>{col.label}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AG Grid Canvas (desktop >=1024px) + AutoHeight so no empty bottom space */}
      <div className="hidden lg:block w-full overflow-hidden rounded-[12px] border border-zinc-200">
        {activeTab === "transactions" && (
          <AgGridReact<PayPalLedgerTransaction>
            theme={lightGridTheme}
            rowData={filteredTransactions}
            columnDefs={transactionCols}
            quickFilterText={quickFilterText}
            domLayout="autoHeight"
            pagination={filteredTransactions.length > 10}
            paginationPageSize={10}
            enableBrowserTooltips={true}
            suppressCellFocus={false}
            defaultColDef={defaultColDef}
          />
        )}
        {activeTab === "orders" && (
          <AgGridReact<PayPalOrderRecord>
            theme={lightGridTheme}
            rowData={sanitizedOrders}
            columnDefs={orderCols}
            quickFilterText={quickFilterText}
            domLayout="autoHeight"
            pagination={sanitizedOrders.length > 10}
            paginationPageSize={10}
            enableBrowserTooltips={true}
            defaultColDef={defaultColDef}
          />
        )}
        {activeTab === "payouts" && (
          <AgGridReact<PayPalPayoutRecord>
            theme={lightGridTheme}
            rowData={sanitizedPayouts}
            columnDefs={payoutCols}
            quickFilterText={quickFilterText}
            domLayout="autoHeight"
            pagination={sanitizedPayouts.length > 10}
            paginationPageSize={10}
            enableBrowserTooltips={true}
            defaultColDef={defaultColDef}
          />
        )}
        {activeTab === "invoices" && (
          <AgGridReact<PayPalInvoiceRecord>
            theme={lightGridTheme}
            rowData={sanitizedInvoices}
            columnDefs={invoiceCols}
            quickFilterText={quickFilterText}
            domLayout="autoHeight"
            pagination={sanitizedInvoices.length > 10}
            paginationPageSize={10}
            enableBrowserTooltips={true}
            defaultColDef={defaultColDef}
          />
        )}
      </div>

      {/* Stacked Rows (< lg): zero horizontal clipping on 375px and 768px */}
      <div className="lg:hidden divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
        {activeTab === "transactions" &&
          filteredTransactions
            .filter(
              (t) =>
                !quickFilterText.trim() ||
                `${t.transaction_id} ${t.event_label} ${t.counterparty} ${humanizeEngine(t.engine)}`
                  .toLowerCase()
                  .includes(quickFilterText.toLowerCase())
            )
            .map((t) => (
              <div key={t.transaction_id} className="p-3.5 space-y-1.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-zinc-900 line-clamp-2">
                      {t.event_label}
                    </div>
                    <div className="mt-0.5 text-xs text-zinc-600">{t.counterparty}</div>
                  </div>
                  <div
                    className={`shrink-0 text-sm font-semibold tabular-nums ${
                      t.amount >= 0 ? "text-emerald-700" : "text-red-700"
                    }`}
                  >
                    {formatSignedUsd(t.amount)}
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-600">
                  <span className="font-mono text-zinc-700">{t.transaction_id}</span>
                  <span>{humanizeEngine(t.engine)} · {humanizeTransactionStatus(t.status, t.status_label)}</span>
                </div>
              </div>
            ))}

        {activeTab === "orders" &&
          sanitizedOrders.slice(0, 15).map((o) => (
            <div key={o.id} className="p-3.5 space-y-1.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-medium text-zinc-900 line-clamp-2">{o.description}</div>
                  <div className="mt-0.5 font-mono text-xs text-zinc-600">{o.id}</div>
                </div>
                <div className="shrink-0 text-sm font-semibold tabular-nums text-zinc-900">
                  {formatUsd(o.amount.value)}
                </div>
              </div>
              <div className="text-xs text-zinc-600">{humanizeTransactionStatus(o.status)}</div>
            </div>
          ))}

        {activeTab === "payouts" &&
          sanitizedPayouts.slice(0, 15).map((p) => (
            <div key={p.payout_batch_id} className="p-3.5 space-y-1.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-medium text-zinc-900 line-clamp-2">{p.note}</div>
                  <div className="mt-0.5 text-xs text-zinc-600">{p.receiver}</div>
                </div>
                <div className="shrink-0 text-sm font-semibold tabular-nums text-emerald-700">
                  {formatSignedUsd(p.amount.value)}
                </div>
              </div>
              <div className="font-mono text-xs text-zinc-600">{p.payout_batch_id}</div>
            </div>
          ))}

        {activeTab === "invoices" &&
          (sanitizedInvoices.length === 0 ? (
            <div className="p-6 text-center text-xs text-zinc-600">No invoices yet.</div>
          ) : (
            sanitizedInvoices.map((inv) => (
              <div key={inv.id} className="p-3.5 space-y-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="text-xs font-medium text-zinc-900">{inv.item_name}</div>
                  <div className="text-sm font-semibold tabular-nums text-zinc-900">
                    {formatUsd(inv.amount.value)}
                  </div>
                </div>
                <div className="text-xs text-zinc-600">
                  {inv.invoice_number} · {inv.recipient_name}
                </div>
              </div>
            ))
          ))}
      </div>
    </section>
  );
}
