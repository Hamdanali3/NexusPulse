"use client";

import React, { useEffect } from "react";
import { Button } from "./Button";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  confirmTone?: "primary" | "danger";
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Keep plan",
  confirmTone = "danger",
  busy = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/35 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onClick={() => {
        if (!busy) onClose();
      }}
    >
      <div
        className="w-full max-w-md rounded-[12px] border border-zinc-200 bg-white p-6 space-y-4 shadow-[0_8px_24px_-4px_rgb(9_9_11/0.08),0_2px_6px_-1px_rgb(9_9_11/0.04)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-1.5">
          <h3 id="confirm-dialog-title" className="text-[16px] font-semibold text-zinc-950">
            {title}
          </h3>
          <div className="text-[14px] leading-relaxed text-zinc-600">{description}</div>
        </div>
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="secondary" size="md" onClick={onClose} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button
            variant={confirmTone === "danger" ? "danger" : "primary"}
            size="md"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Updating..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
