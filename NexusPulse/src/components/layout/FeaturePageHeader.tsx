"use client";

import React from "react";
import { ArrowLeft, ArrowRight, ChevronRight } from "lucide-react";
import type { WorkspaceTabId } from "@/components/layout/NexusHeader";

type FeatureMeta = {
  eyebrow: string;
  title: string;
  description: string;
};

export const FEATURE_PAGES: Record<Exclude<WorkspaceTabId, "overview">, FeatureMeta> = {
  channel3: {
    eyebrow: "Engine 01",
    title: "Deal Hunter",
    description: "Automated price monitoring with 1-click PayPal v6 checkout.",
  },
  bounties: {
    eyebrow: "Engine 02",
    title: "Human Bounties",
    description: "Physical verification tasks audited by AI with instant payouts.",
  },
  bryntum: {
    eyebrow: "Engine 03",
    title: "Smart Escrow",
    description: "Milestone authorization holds with automated dispute protection.",
  },
  aggrid: {
    eyebrow: "Engine 04",
    title: "Ledger & Telemetry",
    description: "Complete financial event logs, PayPal webhooks, and APIMatic SDK state.",
  },
};

const ORDER: Array<Exclude<WorkspaceTabId, "overview">> = ["channel3", "bounties", "bryntum", "aggrid"];

interface FeaturePageHeaderProps {
  tab: Exclude<WorkspaceTabId, "overview">;
  onNavigate: (tab: WorkspaceTabId) => void;
}

export default function FeaturePageHeader({ tab, onNavigate }: FeaturePageHeaderProps) {
  const meta = FEATURE_PAGES[tab];
  const nextTab = ORDER[(ORDER.indexOf(tab) + 1) % ORDER.length];
  const nextMeta = FEATURE_PAGES[nextTab];

  return (
    <div key={tab} className="feature-page-enter pt-2 pb-1">
      {/* Minimal breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-zinc-400">
        <button
          type="button"
          onClick={() => onNavigate("overview")}
          className="inline-flex items-center gap-1 font-medium text-zinc-500 hover:text-zinc-950 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Overview
        </button>
        <ChevronRight className="h-3 w-3 text-zinc-300" />
        <span className="font-medium text-zinc-900">{meta.title}</span>
      </nav>

      {/* Header text and next button */}
      <div className="mt-3 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-medium text-indigo-600 bg-indigo-50 border border-indigo-100 rounded px-1.5 py-0.5">
              {meta.eyebrow}
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950">
              {meta.title}
            </h1>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-zinc-500 max-w-xl">
            {meta.description}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate(nextTab)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:text-zinc-950 shadow-2xs transition-colors self-start sm:self-auto"
        >
          <span className="text-zinc-400">Next:</span>
          <span>{nextMeta.title}</span>
          <ArrowRight className="h-3 w-3 text-zinc-400" />
        </button>
      </div>
    </div>
  );
}
