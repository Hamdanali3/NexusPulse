"use client";

import React, { useEffect, useState } from "react";
import {
  AlertCircleIcon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons";
import { AppIcon } from "@/components/ui/Icon";

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
    ? "border-emerald-200"
    : isError
      ? "border-red-200"
      : "border-zinc-200";

  const bgColor = isSuccess
    ? "bg-emerald-50/95"
    : isError
      ? "bg-red-50/95"
      : "bg-white/95";

  const textColor = isSuccess
    ? "text-emerald-950"
    : isError
      ? "text-red-950"
      : "text-zinc-950";

  const iconColor = isSuccess
    ? "text-emerald-700"
    : isError
      ? "text-red-700"
      : "text-indigo-600";

  return (
    <div
      role={isError ? "alert" : "status"}
      className={`pointer-events-auto rounded-[12px] border ${borderColor} ${bgColor} p-3.5 shadow-[0_8px_24px_-4px_rgb(9_9_11/0.08),0_2px_6px_-1px_rgb(9_9_11/0.04)] transition-all duration-200 ${
        exiting ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0 animate-slide-up"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">
          {isSuccess && <AppIcon icon={CheckmarkCircle02Icon} size="sm" className={iconColor} />}
          {isError && <AppIcon icon={AlertCircleIcon} size="sm" className={iconColor} />}
          {!isSuccess && !isError && <AppIcon icon={InformationCircleIcon} size="sm" className={iconColor} />}
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
          <AppIcon icon={Cancel01Icon} size="xs" />
        </button>
      </div>
    </div>
  );
}
