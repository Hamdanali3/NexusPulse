"use client";

import React from "react";
import { ArrowLeft02Icon, ArrowRight01Icon, ArrowRight02Icon } from "@hugeicons/core-free-icons";
import { AppIcon } from "@/components/ui/Icon";
import type { WorkspaceTabId } from "@/components/layout/NexusHeader";

type FeatureMeta = {
  eyebrow: string;
  title: string;
  description: string;
};

export const FEATURE_PAGES: Record<Exclude<WorkspaceTabId, "overview">, FeatureMeta> = {
  channel3: {
    eyebrow: "Price watch",
    title: "Price watch",
    description: "Track product prices against your target and check out when ready.",
  },
  bounties: {
    eyebrow: "Verified tasks",
    title: "Verified tasks",
    description: "Review task checklists, attach field photos, and send payouts after approval.",
  },
  bryntum: {
    eyebrow: "Milestone escrow",
    title: "Milestone escrow",
    description: "Track milestone dates and release held funds once work is verified.",
  },
  aggrid: {
    eyebrow: "Ledger",
    title: "Ledger",
    description: "Review orders, payouts, invoices, and webhook test events in one place.",
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
    <div key={tab} className="pt-2 pb-1">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13px] text-zinc-600">
        <button
          type="button"
          onClick={() => onNavigate("overview")}
          className="inline-flex items-center gap-1 font-medium text-zinc-600 hover:text-zinc-950 transition-colors"
        >
          <AppIcon icon={ArrowLeft02Icon} size="xs" />
          Overview
        </button>
        <AppIcon icon={ArrowRight01Icon} size="xs" className="text-zinc-500" />
        <span className="font-medium text-zinc-950">{meta.title}</span>
      </nav>

      {/* Header text and next link */}
      <div className="mt-3 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-zinc-950">
            {meta.title}
          </h1>
          <p className="mt-1 text-[14px] text-zinc-600 max-w-xl">
            {meta.description}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate(nextTab)}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[6px] border border-zinc-200 bg-white hover:bg-zinc-50 px-3 text-[13px] font-medium text-zinc-800 transition-colors self-start sm:self-auto"
        >
          <span className="text-zinc-600">Next:</span>
          <span>{nextMeta.title}</span>
          <AppIcon icon={ArrowRight02Icon} size="xs" className="text-zinc-500" />
        </button>
      </div>
    </div>
  );
}
