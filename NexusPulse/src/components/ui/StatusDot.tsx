"use client";

import React from "react";

export type StatusTone = "positive" | "accent" | "negative" | "neutral";

const DOT_CLASSES: Record<StatusTone, string> = {
  positive: "bg-emerald-700",
  accent: "bg-indigo-600",
  negative: "bg-red-700",
  neutral: "bg-zinc-500",
};

const TEXT_CLASSES: Record<StatusTone, string> = {
  positive: "text-emerald-700",
  accent: "text-indigo-700",
  negative: "text-red-700",
  neutral: "text-zinc-700",
};

export interface StatusDotProps {
  label: string;
  tone?: StatusTone;
  className?: string;
}

/** Quiet inline status readout ("● Captured") replacing noisy filled badges. */
export function StatusDot({ label, tone = "neutral", className = "" }: StatusDotProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[13px] font-medium whitespace-nowrap ${TEXT_CLASSES[tone]} ${className}`}>
      <span className={`h-2 w-2 rounded-full shrink-0 ${DOT_CLASSES[tone]}`} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
