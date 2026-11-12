"use client";

import React from "react";

export interface ListSectionProps {
  children: React.ReactNode;
  className?: string;
}

/** Single hairline container with vertical row dividers (no card-inside-card nesting). */
export function ListSection({ children, className = "" }: ListSectionProps) {
  return (
    <div className={`rounded-[12px] border border-zinc-200 bg-white divide-y divide-zinc-200 overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

export interface ListRowProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  amount?: React.ReactNode;
  action?: React.ReactNode;
  selected?: boolean;
  onSelect?: () => void;
  className?: string;
}

/** Dense financial row: title + single muted detail line, right-aligned tabular amount, optional action. */
export function ListRow({
  title,
  subtitle,
  amount,
  action,
  selected = false,
  onSelect,
  className = "",
}: ListRowProps) {
  const rowStyle = selected
    ? "bg-indigo-50/50 border-l-2 border-l-indigo-600"
    : "hover:bg-zinc-50 border-l-2 border-l-transparent";

  return (
    <div
      onClick={onSelect}
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onKeyDown={
        onSelect
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect();
              }
            }
          : undefined
      }
      className={`px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-4 transition-colors duration-150 ${
        onSelect ? "cursor-pointer" : ""
      } ${rowStyle} ${className}`}
    >
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-medium text-zinc-950 line-clamp-2">{title}</div>
        {subtitle && <div className="mt-0.5 text-[12px] text-zinc-600 leading-relaxed">{subtitle}</div>}
      </div>
      {(amount || action) && (
        <div className="flex items-center justify-end gap-3 shrink-0 self-end sm:self-center">
          {amount && <div className="text-right tabular-nums text-[14px] font-semibold text-zinc-950">{amount}</div>}
          {action}
        </div>
      )}
    </div>
  );
}
