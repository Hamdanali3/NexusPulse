"use client";

import React, { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Lock, ShieldCheck, Sparkles, Wallet, X } from "lucide-react";
import type { PayPalExecutionMode, PayPalOrderRecord } from "@/lib/paypal/paypal-types";
import type { NexusPulseState } from "@/lib/paypal/paypal-sandbox-mirror";

interface PayPalV6CheckoutWidgetProps {
  amountValue: string;
  description: string;
  channel3DealId?: string;
  bnplInstallment?: number;
  activeMode: PayPalExecutionMode;
  onSuccess: (order: PayPalOrderRecord, updatedState: NexusPulseState) => void;
}

export default function PayPalV6CheckoutWidget({
  amountValue,
  description,
  channel3DealId,
  bnplInstallment,
  activeMode,
  onSuccess,
}: PayPalV6CheckoutWidgetProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFunding, setSelectedFunding] = useState<"paypal" | "paylater" | "venmo">("paypal");
  const [createdOrder, setCreatedOrder] = useState<PayPalOrderRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<PayPalOrderRecord | null>(null);

  const numericAmount = Number(amountValue);
  const installment = bnplInstallment ?? Number((numericAmount / 4).toFixed(2));

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (modalOpen && createdOrder) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [modalOpen, createdOrder]);

  async function initiatePayPalV6Session(funding: "paypal" | "paylater" | "venmo") {
    setSelectedFunding(funding);
    setLoading(true);
    setErrorMessage(null);
    try {
      // Step 1: Server-side Order Creation (POST /v2/checkout/orders via APIMatic @paypal/paypal-server-sdk)
      // Returns { orderId: "..." } per PayPal JS SDK v6 specification
      const res = await fetch("/api/paypal/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "CREATE",
          amountValue,
          currencyCode: "USD",
          intent: "CAPTURE",
          description,
          category: "CHANNEL3_DEAL",
          fundingSource: funding,
        }),
      });
      const data = (await res.json()) as {
        orderId?: string;
        order?: PayPalOrderRecord;
        error?: string;
      };
      if (!res.ok || !data.order) {
        setErrorMessage(data.error ?? "Failed to initialize PayPal v6 checkout session");
        return;
      }
      setCreatedOrder(data.order);
      setModalOpen(true);
    } catch {
      setErrorMessage("Network error while connecting to PayPal Orders v2 endpoint");
    } finally {
      setLoading(false);
    }
  }

  async function approveAndCaptureOrder() {
    if (!createdOrder) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      // Step 2: Server-side Order Capture (POST /v2/checkout/orders/{orderId}/capture)
      // Uses lowercase `orderId` per PayPal JS SDK v6 specification
      const res = await fetch("/api/paypal/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "CAPTURE",
          orderId: createdOrder.id,
          fundingSource: selectedFunding,
          channel3DealId,
        }),
      });
      const data = (await res.json()) as {
        orderId?: string;
        order?: PayPalOrderRecord;
        state?: NexusPulseState;
        error?: string;
      };
      if (!res.ok || !data.order || !data.state) {
        setErrorMessage(data.error ?? "Failed to capture PayPal order");
        return;
      }
      setCompletedOrder(data.order);
      onSuccess(data.order, data.state);
      setModalOpen(false);
    } catch {
      setErrorMessage("Network error while capturing PayPal order");
    } finally {
      setLoading(false);
    }
  }

  if (completedOrder) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-3.5 text-xs text-emerald-200"
      >
        <div className="flex items-center gap-2 font-semibold text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>PayPal v6 Capture Completed (#{completedOrder.id})</span>
        </div>
        <div className="mt-1 text-xs text-emerald-300/80">
          Capture ID: <code className="font-mono">{completedOrder.capture_id}</code> • Mode:{" "}
          <span className="uppercase">{completedOrder.mode}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {errorMessage && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-rose-500/40 bg-rose-950/40 px-3 py-2 text-xs text-rose-200"
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* PayPal JS SDK v6 <paypal-message> BNPL Messaging Banner */}
      {numericAmount >= 30 && numericAmount <= 1500 && (
        <div className="flex items-center justify-between rounded-lg border border-blue-500/25 bg-blue-950/30 px-3 py-2 text-xs text-blue-200">
          <span>
            <strong className="text-blue-300">PayPal Pay Later:</strong> 4 interest-free payments of{" "}
            <strong className="tabular-nums text-white">${installment.toFixed(2)}</strong>
          </span>
          <span className="rounded bg-blue-500/20 px-1.5 py-0.5 font-mono text-[11px] text-blue-300">
            &lt;paypal-message&gt; v6
          </span>
        </div>
      )}

      {/* PayPal JS SDK v6 Web Component Buttons (<paypal-button>, <paylater-button>, <venmo-button>) */}
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={() => initiatePayPalV6Session("paypal")}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-[#FFC439] px-3 py-2.5 text-xs font-bold text-[#003087] shadow transition hover:bg-[#f5b82e] disabled:opacity-50"
        >
          <Wallet className="h-3.5 w-3.5" />
          <span>PayPal</span>
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() => initiatePayPalV6Session("paylater")}
          className="flex items-center justify-center gap-1 rounded-lg bg-[#0070BA] px-2.5 py-2.5 text-xs font-semibold text-white shadow transition hover:bg-[#005ea6] disabled:opacity-50"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Pay in 4</span>
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() => initiatePayPalV6Session("venmo")}
          className="flex items-center justify-center gap-1 rounded-lg bg-[#008CFF] px-2.5 py-2.5 text-xs font-semibold text-white shadow transition hover:bg-[#0074d4] disabled:opacity-50"
        >
          <span>Venmo</span>
        </button>
      </div>

      {/* Native <dialog> Modal opened via .showModal() (modern-web-guidance: dialog) */}
      <dialog
        ref={dialogRef}
        aria-labelledby="paypal-v6-dialog-title"
        onClose={() => setModalOpen(false)}
        onClick={(e) => {
          if (e.target === dialogRef.current) {
            setModalOpen(false);
          }
        }}
        className="rounded-2xl text-left"
      >
        {createdOrder && (
          <div className="w-full overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 bg-[#003087] px-5 py-3.5 text-white">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-[#FFC439]" />
                <h3 id="paypal-v6-dialog-title" className="text-sm font-bold tracking-tight">
                  PayPal Sandbox Checkout (JS SDK v6 Session)
                </h3>
              </div>
              <button
                type="button"
                aria-label="Close checkout dialog"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-slate-200 hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-5 text-xs text-slate-300">
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Order ID (`data.orderId`)</span>
                  <code className="font-mono text-amber-300">{createdOrder.id}</code>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-xs text-slate-400">
                  <span>Idempotency (`PayPal-Request-Id`)</span>
                  <code className="font-mono text-slate-300">
                    {createdOrder.paypal_request_id.slice(0, 22)}...
                  </code>
                </div>
                <div className="mt-2 border-t border-slate-800 pt-2 text-sm font-semibold text-white">
                  {description}
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-slate-400">Total Amount (USD)</span>
                  <span className="tabular-nums text-lg font-bold text-[#FFC439]">
                    ${createdOrder.amount.value} USD
                  </span>
                </div>
              </div>

              <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/50 p-3.5">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Sandbox Buyer Account &amp; Funding Source
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Buyer Login:</span>
                  <code className="font-mono text-cyan-300">{createdOrder.payer_email}</code>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Selected Method:</span>
                  <span className="rounded bg-blue-500/20 px-2 py-0.5 font-semibold uppercase text-blue-300">
                    {selectedFunding === "paylater"
                      ? `PayPal Pay in 4 (4x $${installment.toFixed(2)})`
                      : selectedFunding === "venmo"
                        ? "Pay with Venmo (USD)"
                        : "PayPal Sandbox Wallet"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Gateway Mode:</span>
                  <span className="font-mono uppercase text-emerald-400">{activeMode}</span>
                </div>
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={approveAndCaptureOrder}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FFC439] px-4 py-3 text-sm font-bold text-[#003087] shadow-lg transition hover:bg-[#f5b82e] disabled:opacity-50"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>
                  {loading
                    ? "Capturing via POST /v2/checkout/orders/{id}/capture..."
                    : `Approve & Capture $${createdOrder.amount.value} USD Now`}
                </span>
              </button>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}
