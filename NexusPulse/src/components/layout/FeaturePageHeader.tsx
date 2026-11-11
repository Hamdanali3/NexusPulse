"use client";

import React from "react";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Calendar,
  ChevronRight,
  ShoppingBag,
  UserCheck,
} from "lucide-react";
import type { WorkspaceTabId } from "@/components/layout/NexusHeader";

type FeatureMeta = {
  eyebrow: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  text: string;
  glow: string;
};

export const FEATURE_PAGES: Record<Exclude<WorkspaceTabId, "overview">, FeatureMeta> = {
  channel3: {
    eyebrow: "Engine 01 · Deal Hunter",
    title: "Deal & Subscription Guard",
    description:
      "Real-time catalog scan across 100M+ products with automated subscription downgrades.",
    icon: ShoppingBag,
    gradient: "from-sky-500 to-cyan-400",
    text: "text-sky-700",
    glow: "rgba(14,165,233,0.16)",
  },
  bounties: {
    eyebrow: "Engine 02 · Proof-of-Human",
    title: "Oracle Micro-Bounties",
    description:
      "60-second physical verification tasks with instant PayPal Payouts.",
    icon: UserCheck,
    gradient: "from-emerald-500 to-teal-400",
    text: "text-emerald-700",
    glow: "rgba(16,185,129,0.16)",
  },
  bryntum: {
    eyebrow: "Engine 03 · Smart Escrow",
    title: "Bryntum Milestone Escrow",
    description:
      "Milestone-based authorization holds tracked on an interactive Gantt timeline.",
    icon: Calendar,
    gradient: "from-indigo-500 to-violet-400",
    text: "text-indigo-700",
    glow: "rgba(99,102,241,0.16)",
  },
  aggrid: {
    eyebrow: "Telemetry · Financial Ledger",
    title: "AG Grid Ledger & Webhooks",
    description:
      "Real-time transaction auditing, webhook simulation, and APIMatic SDK architecture.",
    icon: Activity,
    gradient: "from-slate-700 to-slate-500",
    text: "text-slate-700",
    glow: "rgba(100,116,139,0.16)",
  },
};

const ORDER: Array<Exclude<WorkspaceTabId, "overview">> = ["channel3", "bounties", "bryntum", "aggrid"];

interface FeaturePageHeaderProps {
  tab: Exclude<WorkspaceTabId, "overview">;
  onNavigate: (tab: WorkspaceTabId) => void;
}

export default function FeaturePageHeader({ tab, onNavigate }: FeaturePageHeaderProps) {
  const meta = FEATURE_PAGES[tab];
  const Icon = meta.icon;
  const nextTab = ORDER[(ORDER.indexOf(tab) + 1) % ORDER.length];
  const nextMeta = FEATURE_PAGES[nextTab];

  return (
    <div key={tab} className="feature-page-enter relative pt-4 sm:pt-8">
      <div
        aria-hidden="true"
        className="es-edge-fade pointer-events-none absolute inset-x-0 -top-10 -z-10 h-72"
        style={{ background: `radial-gradient(ellipse 60% 70% at 30% 0%, ${meta.glow}, transparent 70%)` }}
      />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500">
        <button
          type="button"
          onClick={() => onNavigate("overview")}
          className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-medium hover:text-slate-900 hover:bg-slate-100 transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Overview
        </button>
        <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
        <span aria-current="page" className={`font-semibold ${meta.text}`}>
          {meta.eyebrow.split("·")[1]?.trim() ?? meta.title}
        </span>
      </nav>

      <div className="mt-5 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div className="flex items-start gap-4">
          <span
            className={`hidden sm:inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${meta.gradient} shadow-lg`}
          >
            <Icon className="h-7 w-7 text-white" />
          </span>
          <div>
            <p className={`text-[11px] font-mono font-bold uppercase tracking-[0.18em] ${meta.text}`}>
              {meta.eyebrow}
            </p>
            <h1 className="mt-1.5 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950">
              {meta.title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm sm:text-base leading-relaxed text-slate-600">
              {meta.description}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate(nextTab)}
          className="group inline-flex shrink-0 items-center gap-2 self-start lg:self-auto rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:ring-slate-300 hover:text-slate-950 transition"
        >
          <span className="text-slate-400">Next:</span>
          {nextMeta.title}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
}
