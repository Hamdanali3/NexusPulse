"use client";

import React, { Component, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, ExternalLink, Lock, ShieldCheck, X } from "lucide-react";
import {
  INSTANCE_LOADING_STATE,
  PayLaterOneTimePaymentButton,
  PayPalOneTimePaymentButton,
  PayPalProvider,
  VenmoOneTimePaymentButton,
  useEligibleMethods,
  usePayPal,
} from "@paypal/react-paypal-js/sdk-v6";
import type { PayPalExecutionMode, PayPalOrderRecord } from "@/lib/paypal/paypal-types";
import type { NexusPulseState } from "@/lib/paypal/paypal-sandbox-mirror";
import { formatUsd } from "@/lib/format";

interface PayPalV6CheckoutWidgetProps {
  amountValue: string;
  description: string;
  channel3DealId?: string;
  bnplInstallment?: number;
  activeMode: PayPalExecutionMode;
  publicClientId?: string;
  publicPayPalClientId?: string;
  clientToken?: string;
  clientTokenIsLive?: boolean;
  sandboxBuyerEmail?: string;
  onSuccess: (order: PayPalOrderRecord, updatedState: NexusPulseState) => void;
}

class PayPalSdkBoundary extends Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { fallback: React.ReactNode; children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

function PayPalWordmarkSvg() {
  return (
    <svg aria-hidden="true" viewBox="0 0 80 20" className="h-4 w-auto">
      <text
        x="4"
        y="15"
        fill="#003087"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="800"
        fontStyle="italic"
        fontSize="14"
        letterSpacing="-0.4"
      >
        Pay
      </text>
      <text
        x="30"
        y="15"
        fill="#0079C1"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="800"
        fontStyle="italic"
        fontSize="14"
        letterSpacing="-0.4"
      >
        Pal
      </text>
    </svg>
  );
}

function VenmoWordmarkSvg() {
  return (
    <svg aria-hidden="true" viewBox="0 0 68 20" className="h-3.5 w-auto">
      <text
        x="4"
        y="15"
        fill="#FFFFFF"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="800"
        fontStyle="italic"
        fontSize="14"
        letterSpacing="-0.3"
      >
        venmo
      </text>
    </svg>
  );
}

interface SdkButtonsInnerProps {
  amountValue: string;
  description: string;
  channel3DealId?: string;
  supportsPayLater: boolean;
  onCaptured: (order: PayPalOrderRecord, state: NexusPulseState) => void;
  onSdkError: (msg: string) => void;
  fallbackButtons: React.ReactNode;
}

function SdkButtonsInner({
  amountValue,
  description,
  channel3DealId,
  supportsPayLater,
  onCaptured,
  onSdkError,
  fallbackButtons,
}: SdkButtonsInnerProps) {
  const { loadingStatus } = usePayPal();
  const [sdkTimedOut, setSdkTimedOut] = useState(false);
  const eligibilityPayload = useMemo(
    () => ({
      amount: amountValue,
      currencyCode: "USD",
    }),
    [amountValue]
  );
  const { eligiblePaymentMethods, isLoading: eligibilityLoading } = useEligibleMethods({
    payload: eligibilityPayload,
  });

  const isSdkReady =
    loadingStatus === INSTANCE_LOADING_STATE.RESOLVED && !eligibilityLoading;

  useEffect(() => {
    if (isSdkReady || loadingStatus === INSTANCE_LOADING_STATE.REJECTED) {
      return;
    }
    const timer = window.setTimeout(() => {
      setSdkTimedOut(true);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [isSdkReady, loadingStatus]);

  if (loadingStatus === INSTANCE_LOADING_STATE.REJECTED || (!isSdkReady && sdkTimedOut)) {
    return <>{fallbackButtons}</>;
  }

  if (!isSdkReady) {
    return (
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="h-10 rounded-md bg-zinc-100 animate-pulse" aria-hidden="true" />
        <div className="h-10 rounded-md bg-zinc-100 animate-pulse" aria-hidden="true" />
        <div className="h-10 rounded-md bg-zinc-100 animate-pulse" aria-hidden="true" />
      </div>
    );
  }

  async function handleCreateOrder(fundingSource: "paypal" | "paylater" | "venmo") {
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
        fundingSource,
      }),
    });
    const data = (await res.json()) as { orderId?: string; order?: PayPalOrderRecord; error?: string };
    const id = data.orderId || data.order?.id;
    if (!res.ok || !id) {
      const msg = data.error ?? "Unable to start PayPal checkout.";
      onSdkError(msg);
      throw new Error(msg);
    }
    return { orderId: id };
  }

  async function handleApprove(orderId: string, fundingSource: "paypal" | "paylater" | "venmo") {
    const res = await fetch("/api/paypal/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        operation: "CAPTURE",
        orderId,
        fundingSource,
        channel3DealId,
      }),
    });
    const data = await res.json();
    const captured = data.capturedOrder ?? data.order;
    if (!res.ok || !captured) {
      onSdkError(data.error ?? "Payment capture failed.");
      return;
    }
    onCaptured(captured, data.state);
  }

  const showPayLater =
    supportsPayLater && (!eligiblePaymentMethods || eligiblePaymentMethods.isEligible("paylater"));
  const showVenmo = !eligiblePaymentMethods || eligiblePaymentMethods.isEligible("venmo");
  const colClass =
    showPayLater && showVenmo
      ? "sm:grid-cols-3"
      : showPayLater || showVenmo
        ? "sm:grid-cols-2"
        : "sm:grid-cols-1";

  return (
    <div className={`grid grid-cols-1 gap-2 ${colClass}`}>
      <div className="h-10 flex items-center [&>*]:w-full [&>*]:h-10">
        <PayPalOneTimePaymentButton
          type="checkout"
          createOrder={() => handleCreateOrder("paypal")}
          onApprove={(data) => handleApprove(data.orderId, "paypal")}
          onError={() => onSdkError("PayPal checkout encountered an issue. Try again or use fallback.")}
        />
      </div>

      {showPayLater && (
        <div className="h-10 flex items-center [&>*]:w-full [&>*]:h-10">
          <PayLaterOneTimePaymentButton
            createOrder={() => handleCreateOrder("paylater")}
            onApprove={(data) => handleApprove(data.orderId, "paylater")}
            onError={() => onSdkError("Pay Later is unavailable for this session.")}
          />
        </div>
      )}

      {showVenmo && (
        <div className="h-10 flex items-center [&>*]:w-full [&>*]:h-10">
          <VenmoOneTimePaymentButton
            type="checkout"
            createOrder={() => handleCreateOrder("venmo")}
            onApprove={(data) => handleApprove(data.orderId, "venmo")}
            onError={() => onSdkError("Venmo checkout is unavailable on this browser.")}
          />
        </div>
      )}
    </div>
  );
}

export default function PayPalV6CheckoutWidget({
  amountValue,
  description,
  channel3DealId,
  bnplInstallment,
  activeMode,
  publicClientId,
  publicPayPalClientId,
  clientToken,
  clientTokenIsLive,
  sandboxBuyerEmail = "sb-ifqau51324237@personal.example.com",
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
  const supportsPayLater = Number.isFinite(numericAmount) && numericAmount >= 30 && numericAmount <= 1500;
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

  async function initiateCheckoutDialog(funding: "paypal" | "paylater" | "venmo") {
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
        setErrorMessage(data.error ?? "Unable to initialize PayPal checkout session.");
        return;
      }
      setCreatedOrder(data.order);
      setModalOpen(true);
    } catch {
      setErrorMessage("Network error while connecting to PayPal checkout.");
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
        setErrorMessage(data.error ?? "Payment capture failed.");
        return;
      }
      setCompletedOrder(captured);
      setModalOpen(false);
      onSuccess(captured, data.state);
    } catch {
      setErrorMessage("Network error during payment capture.");
    } finally {
      setLoading(false);
    }
  }

  if (completedOrder) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs"
      >
        <div className="flex items-center gap-2 font-semibold text-emerald-900 text-sm">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>Payment completed ({completedOrder.id})</span>
        </div>
        <div className="mt-1 text-xs text-emerald-800 font-mono">
          Capture ID: {completedOrder.capture_id}
        </div>
      </div>
    );
  }

  const fallbackButtons = (
    <div className={`grid grid-cols-1 gap-2 ${supportsPayLater ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
      <button
        type="button"
        disabled={loading}
        onClick={() => initiateCheckoutDialog("paypal")}
        aria-label="Pay with PayPal"
        className="flex h-10 w-full items-center justify-center rounded-[6px] bg-[#FFC439] hover:bg-[#f2b82e] px-3 transition-colors duration-150 disabled:opacity-50"
      >
        <PayPalWordmarkSvg />
      </button>

      {supportsPayLater && (
        <button
          type="button"
          disabled={loading}
          onClick={() => initiateCheckoutDialog("paylater")}
          aria-label="Pay Later in 4 payments"
          className="flex h-10 w-full items-center justify-center rounded-[6px] bg-[#0070BA] hover:bg-[#005ea6] px-3 text-[13px] font-medium text-white transition-colors duration-150 disabled:opacity-50"
        >
          <span>Pay Later</span>
        </button>
      )}

      <button
        type="button"
        disabled={loading}
        onClick={() => initiateCheckoutDialog("venmo")}
        aria-label="Pay with Venmo"
        className="flex h-10 w-full items-center justify-center rounded-[6px] bg-[#008CFF] hover:bg-[#0074d4] px-3 transition-colors duration-150 disabled:opacity-50"
      >
        <VenmoWordmarkSvg />
      </button>
    </div>
  );

  const effectiveClientId =
    publicPayPalClientId || publicClientId || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID?.trim() || "";
  const hasRealToken = Boolean(
    clientToken &&
      !clientToken.startsWith("mock_") &&
      !clientToken.startsWith("mirror_") &&
      clientTokenIsLive !== false
  );
  const hasRealClientId = Boolean(effectiveClientId && !effectiveClientId.startsWith("sb-mirror"));
  const useLiveSdk = activeMode !== "mirror" && (hasRealToken || hasRealClientId);
  const sdkEnv = activeMode === "live" ? "production" : "sandbox";

  return (
    <div className="space-y-3">
      {errorMessage && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800"
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {supportsPayLater && (
        <div className="flex items-center justify-between rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-700">
          <span>
            <strong className="text-zinc-900 font-medium">Pay Later:</strong> 4 payments of{" "}
            <strong className="tabular-nums text-zinc-900 font-semibold">
              {formatUsd(installment)}
            </strong>
          </span>
          <span className="text-[11px] text-zinc-500">Interest-free</span>
        </div>
      )}

      {useLiveSdk ? (
        <PayPalSdkBoundary fallback={fallbackButtons}>
          {hasRealToken && clientToken ? (
            <PayPalProvider
              clientToken={clientToken}
              environment={sdkEnv}
              components={["paypal-payments", "venmo-payments"]}
              pageType="checkout"
            >
              <SdkButtonsInner
                amountValue={amountValue}
                description={description}
                channel3DealId={channel3DealId}
                supportsPayLater={supportsPayLater}
                onCaptured={(captured, state) => {
                  setCompletedOrder(captured);
                  onSuccess(captured, state);
                }}
                onSdkError={(msg) => setErrorMessage(msg)}
                fallbackButtons={fallbackButtons}
              />
            </PayPalProvider>
          ) : (
            <PayPalProvider
              clientId={effectiveClientId}
              environment={sdkEnv}
              components={["paypal-payments", "venmo-payments"]}
              pageType="checkout"
            >
              <SdkButtonsInner
                amountValue={amountValue}
                description={description}
                channel3DealId={channel3DealId}
                supportsPayLater={supportsPayLater}
                onCaptured={(captured, state) => {
                  setCompletedOrder(captured);
                  onSuccess(captured, state);
                }}
                onSdkError={(msg) => setErrorMessage(msg)}
                fallbackButtons={fallbackButtons}
              />
            </PayPalProvider>
          )}
        </PayPalSdkBoundary>
      ) : (
        fallbackButtons
      )}

      <dialog
        ref={dialogRef}
        aria-labelledby="paypal-v6-dialog-title"
        onClose={() => setModalOpen(false)}
        className="m-auto w-full max-w-md rounded-[12px] border border-zinc-200 bg-white p-0 shadow-[0_8px_24px_-4px_rgb(9_9_11/0.12),0_2px_6px_-1px_rgb(9_9_11/0.06)] backdrop:bg-zinc-950/35"
      >
        {createdOrder && (
          <div className="overflow-hidden rounded-[12px] bg-white">
            <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-950 px-5 py-3.5 text-white">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-zinc-300" />
                <h3 id="paypal-v6-dialog-title" className="text-[14px] font-semibold">
                  Confirm PayPal payment
                </h3>
              </div>
              <button
                type="button"
                aria-label="Close checkout dialog"
                onClick={() => setModalOpen(false)}
                className="rounded-[6px] p-1 text-zinc-300 hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-5 text-[13px] text-zinc-800">
              <div className="rounded-[6px] border border-zinc-200 bg-zinc-50 p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-600">
                  <span>Order reference</span>
                  <code className="font-mono font-medium text-zinc-900">{createdOrder.id}</code>
                </div>
                <div className="border-t border-zinc-200 pt-2 text-xs font-medium text-zinc-900">
                  {description}
                </div>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-zinc-600">Total due</span>
                  <span className="tabular-nums text-lg font-semibold text-zinc-950">
                    {formatUsd(createdOrder.amount.value)}
                  </span>
                </div>
              </div>

              <div className="space-y-2 rounded-lg border border-zinc-200 bg-white p-3.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-600">Account</span>
                  <code className="font-mono text-zinc-800">{sandboxBuyerEmail || createdOrder.payer_email}</code>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-600">Payment method</span>
                  <span className="font-medium text-zinc-900">
                    {selectedFunding === "paylater"
                      ? `Pay Later (4 × ${formatUsd(installment)})`
                      : selectedFunding === "venmo"
                        ? "Venmo"
                        : "PayPal"}
                  </span>
                </div>
              </div>

              {createdOrder.mode !== "mirror" && createdOrder.approve_url && (
                <div className="rounded-lg border border-sky-200 bg-sky-50/70 p-3 text-xs text-sky-950 space-y-2">
                  <p className="text-[11px] text-sky-900">
                    Live Sandbox order <strong>{createdOrder.id}</strong> requires buyer approval on{" "}
                    <span className="font-mono">sandbox.paypal.com</span> before capture.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={createdOrder.approve_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-8 items-center justify-center gap-1 rounded-md bg-[#003087] hover:bg-[#002366] px-2.5 text-[11px] font-semibold text-white transition"
                    >
                      <span>Approve in Sandbox</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    <button
                      type="button"
                      onClick={() => window.location.assign(createdOrder.approve_url!)}
                      className="inline-flex h-8 items-center justify-center rounded-md border border-sky-300 bg-white hover:bg-sky-50 px-2.5 text-[11px] font-semibold text-sky-950 transition"
                    >
                      Redirect &amp; Return
                    </button>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div
                  role="alert"
                  className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="h-9 rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={approveAndCaptureOrder}
                  className="flex h-9 flex-1 items-center justify-center gap-2 rounded-md bg-zinc-950 hover:bg-zinc-800 px-4 text-xs font-medium text-white transition disabled:opacity-50"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>
                    {loading
                      ? "Processing payment..."
                      : `Pay ${formatUsd(createdOrder.amount.value)}`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}
