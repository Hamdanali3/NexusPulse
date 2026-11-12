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
      const captured = data.capturedOrder ?? data.order;
      if (!res.ok || !captured) {
        setErrorMessage(data.error ?? "Payment capture failed");
        return;
      }
      setCompletedOrder(captured);
      setModalOpen(false);
      onSuccess(captured, data.state);
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
        className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 text-xs shadow-2xs nexus-fade-in"
      >
        <div className="flex items-center gap-2 font-semibold text-emerald-900 text-sm">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>PayPal v6 Capture Completed (#{completedOrder.id})</span>
        </div>
        <div className="mt-1 text-xs text-emerald-800">
          Capture ID: <code className="font-mono font-medium">{completedOrder.capture_id}</code> · Mode:{" "}
          <span className="font-semibold uppercase">{completedOrder.mode}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {errorMessage && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50/80 px-3 py-2 text-xs text-rose-800"
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* PayPal JS SDK v6 <paypal-message> BNPL Messaging Banner */}
      {numericAmount >= 30 && numericAmount <= 1500 && (
        <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50/80 px-3 py-2 text-xs text-zinc-700">
          <span>
            <strong className="text-zinc-900 font-medium">Pay Later:</strong> 4 payments of{" "}
            <strong className="tabular-nums text-zinc-900 font-semibold">${installment.toFixed(2)}</strong>
          </span>
          <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500 font-medium">
            &lt;paypal-message&gt;
          </span>
        </div>
      )}

      {/* PayPal JS SDK v6 Web Component Buttons */}
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={() => initiatePayPalV6Session("paypal")}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-[#FFC439] hover:bg-[#f5b82e] px-3 py-2 text-xs font-semibold text-[#003087] transition disabled:opacity-50"
        >
          <Wallet className="h-3.5 w-3.5" />
          <span>PayPal</span>
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() => initiatePayPalV6Session("paylater")}
          className="flex items-center justify-center gap-1 rounded-lg bg-[#0070BA] hover:bg-[#005ea6] px-2.5 py-2 text-xs font-semibold text-white transition disabled:opacity-50"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Pay in 4</span>
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() => initiatePayPalV6Session("venmo")}
          className="flex items-center justify-center gap-1 rounded-lg bg-[#008CFF] hover:bg-[#0074d4] px-2.5 py-2 text-xs font-semibold text-white transition disabled:opacity-50"
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
        className="rounded-2xl text-left shadow-2xl backdrop:bg-zinc-950/40"
      >
        {createdOrder && (
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-900 px-5 py-3.5 text-white">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-indigo-400" />
                <h3 id="paypal-v6-dialog-title" className="text-sm font-semibold tracking-tight">
                  PayPal Checkout Session
                </h3>
              </div>
              <button
                type="button"
                aria-label="Close checkout dialog"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-zinc-400 hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-5 text-xs text-zinc-800">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3.5 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span>Order ID</span>
                  <code className="font-mono font-medium text-zinc-900">{createdOrder.id}</code>
                </div>
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span>Idempotency</span>
                  <code className="font-mono text-zinc-500">
                    {createdOrder.paypal_request_id.slice(0, 18)}...
                  </code>
                </div>
                <div className="border-t border-zinc-200 pt-2 text-xs font-semibold text-zinc-900">
                  {description}
                </div>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-zinc-500">Total</span>
                  <span className="tabular-nums text-lg font-bold text-zinc-900">
                    ${createdOrder.amount.value}{" "}
                    <span className="text-xs font-normal text-zinc-500">USD</span>
                  </span>
                </div>
              </div>

              <div className="space-y-2 rounded-xl border border-zinc-200 bg-zinc-50/70 p-3.5">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  Account &amp; Funding
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">Buyer:</span>
                  <code className="font-mono text-zinc-800 bg-white px-1.5 py-0.5 rounded border border-zinc-200">{createdOrder.payer_email}</code>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">Method:</span>
                  <span className="rounded bg-zinc-100 px-2 py-0.5 font-medium text-zinc-800">
                    {selectedFunding === "paylater"
                      ? `Pay in 4 (${installment.toFixed(2)}/ea)`
                      : selectedFunding === "venmo"
                        ? "Venmo"
                        : "PayPal"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">Mode:</span>
                  <span className="font-mono font-medium uppercase text-indigo-600">{activeMode}</span>
                </div>
              </div>

              {errorMessage && (
                <div
                  role="alert"
                  className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="button"
                disabled={loading}
                onClick={approveAndCaptureOrder}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 px-4 py-2.5 text-xs font-semibold text-white transition disabled:opacity-50"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>
                  {loading
                    ? "Capturing payment..."
                    : `Approve & Capture $${createdOrder.amount.value} USD`}
                </span>
              </button>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}
