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
      const data = await res.json();
      if (!res.ok || !data.capturedOrder) {
        setErrorMessage(data.error ?? "Payment capture failed");
        return;
      }
      setCompletedOrder(data.capturedOrder);
      setModalOpen(false);
      onSuccess(data.capturedOrder, data.state);
    } catch {
      setErrorMessage("Network error during PayPal capture");
    } finally {
      setLoading(false);
    }
  }

  if (completedOrder) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-xs shadow-xs nexus-fade-in"
      >
        <div className="flex items-center gap-2 font-bold text-emerald-900 text-sm">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>PayPal v6 Capture Completed (#{completedOrder.id})</span>
        </div>
        <div className="mt-1.5 text-xs text-emerald-800 font-medium">
          Capture ID: <code className="font-mono font-bold">{completedOrder.capture_id}</code> • Mode:{" "}
          <span className="font-bold uppercase text-emerald-900">{completedOrder.mode}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {errorMessage && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-800 shadow-xs"
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* PayPal JS SDK v6 <paypal-message> BNPL Messaging Banner */}
      {numericAmount >= 30 && numericAmount <= 1500 && (
        <div className="flex items-center justify-between rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900 shadow-2xs">
          <span>
            <strong className="text-sky-800">PayPal Pay Later:</strong> 4 interest-free payments of{" "}
            <strong className="tabular-nums text-slate-950 font-bold">${installment.toFixed(2)}</strong>
          </span>
          <span className="rounded bg-sky-100 border border-sky-200 px-1.5 py-0.5 font-mono text-[11px] text-sky-800 font-bold">
            &lt;paypal-message&gt; v6
          </span>
        </div>
      )}

      {/* PayPal JS SDK v6 Web Component Buttons */}
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={() => initiatePayPalV6Session("paypal")}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-[#FFC439] px-3 py-2.5 text-xs font-bold text-[#003087] shadow-xs transition hover:bg-[#f5b82e] hover:scale-102 active:scale-98 disabled:opacity-50"
        >
          <Wallet className="h-3.5 w-3.5" />
          <span>PayPal</span>
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() => initiatePayPalV6Session("paylater")}
          className="flex items-center justify-center gap-1 rounded-lg bg-[#0070BA] px-2.5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#005ea6] hover:scale-102 active:scale-98 disabled:opacity-50"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Pay in 4</span>
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() => initiatePayPalV6Session("venmo")}
          className="flex items-center justify-center gap-1 rounded-lg bg-[#008CFF] px-2.5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#0074d4] hover:scale-102 active:scale-98 disabled:opacity-50"
        >
          <span>Venmo</span>
        </button>
      </div>

      {/* Native <dialog> Modal opened via .showModal() */}
      <dialog
        ref={dialogRef}
        aria-labelledby="paypal-v6-dialog-title"
        onClose={() => setModalOpen(false)}
        onClick={(e) => {
          if (e.target === dialogRef.current) {
            setModalOpen(false);
          }
        }}
        className="rounded-2xl text-left shadow-2xl"
      >
        {createdOrder && (
          <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 bg-[#003087] px-5 py-3.5 text-white">
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
                className="rounded-lg p-1 text-white/80 hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-5 text-xs text-slate-800">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 shadow-2xs">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-medium">Order ID (`data.orderId`)</span>
                  <code className="font-mono font-bold text-indigo-700">{createdOrder.id}</code>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-medium">Idempotency (`PayPal-Request-Id`)</span>
                  <code className="font-mono text-slate-700">
                    {createdOrder.paypal_request_id.slice(0, 22)}...
                  </code>
                </div>
                <div className="mt-2 border-t border-slate-200 pt-2 text-sm font-bold text-slate-950">
                  {description}
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-slate-500 font-medium">Total Amount (USD)</span>
                  <span className="tabular-nums text-lg font-extrabold text-emerald-700">
                    ${createdOrder.amount.value} USD
                  </span>
                </div>
              </div>

              <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Sandbox Buyer Account &amp; Funding Source
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Buyer Login:</span>
                  <code className="font-mono font-bold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">{createdOrder.payer_email}</code>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Selected Method:</span>
                  <span className="rounded bg-sky-100 border border-sky-200 px-2 py-0.5 font-bold uppercase text-sky-800">
                    {selectedFunding === "paylater"
                      ? `PayPal Pay in 4 (4x $${installment.toFixed(2)})`
                      : selectedFunding === "venmo"
                        ? "Pay with Venmo (USD)"
                        : "PayPal Sandbox Wallet"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Gateway Mode:</span>
                  <span className="font-mono font-bold uppercase text-emerald-700">{activeMode}</span>
                </div>
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={approveAndCaptureOrder}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FFC439] hover:bg-[#f5b82e] px-4 py-3 text-sm font-extrabold text-[#003087] shadow-sm transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
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
