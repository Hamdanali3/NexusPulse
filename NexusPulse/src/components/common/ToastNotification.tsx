"use client";

import React, { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  durationMs?: number;
}

interface ToastNotificationContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export default function ToastNotificationContainer({
  toasts,
  onDismiss,
}: ToastNotificationContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <aside
      aria-label="Notifications"
      aria-live="polite"
      className="fixed bottom-20 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </aside>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const duration = toast.durationMs ?? 5500;
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onDismiss(toast.id), 250);
    }, duration);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const handleManualDismiss = () => {
    setExiting(true);
    setTimeout(() => onDismiss(toast.id), 250);
  };

  const isSuccess = toast.type === "success";
  const isError = toast.type === "error";

  const borderColor = isSuccess
    ? "border-emerald-300"
    : isError
      ? "border-rose-300"
      : "border-sky-300";

  const bgColor = isSuccess
    ? "bg-emerald-50/95"
    : isError
      ? "bg-rose-50/95"
      : "bg-sky-50/95";

  const textColor = isSuccess
    ? "text-emerald-950"
    : isError
      ? "text-rose-950"
      : "text-sky-950";

  const iconColor = isSuccess
    ? "text-emerald-600"
    : isError
      ? "text-rose-600"
      : "text-sky-600";

  return (
    <div
      role={isError ? "alert" : "status"}
      className={`pointer-events-auto rounded-[12px] border ${borderColor} ${bgColor} p-3.5 shadow-[0_8px_24px_-4px_rgb(9_9_11/0.08),0_2px_6px_-1px_rgb(9_9_11/0.04)] transition-all duration-200 ${
        exiting ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0 animate-slide-up"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">
          {isSuccess && <CheckCircle2 className={`h-4 w-4 ${iconColor}`} strokeWidth={1.5} />}
          {isError && <AlertCircle className={`h-4 w-4 ${iconColor}`} strokeWidth={1.5} />}
          {!isSuccess && !isError && <Info className={`h-4 w-4 ${iconColor}`} strokeWidth={1.5} />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className={`text-[13px] font-medium ${textColor} truncate`}>
              {toast.title}
            </h4>
            <span className="text-[11px] font-mono text-zinc-600 shrink-0">
              Just now
            </span>
          </div>
          <p className="mt-0.5 text-[12px] text-zinc-700 leading-relaxed break-words">
            {toast.message}
          </p>
        </div>

        <button
          type="button"
          onClick={handleManualDismiss}
          className="shrink-0 p-1 text-zinc-600 hover:text-zinc-950 rounded-[6px] transition-colors"
          aria-label="Dismiss notification"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
