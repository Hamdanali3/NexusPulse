"use client";

import React, { useState } from "react";
import {
  Activity,
  Calendar,
  ChevronDown,
  Database,
  KeyRound,
  Layers,
  RefreshCw,
  ShoppingBag,
  UserCheck,
  Volume2,
} from "lucide-react";
import type { PayPalExecutionMode } from "@/lib/paypal/paypal-types";
import NexusPulseLogo from "@/components/brand/NexusPulseLogo";

export type WorkspaceTabId =
  | "overview"
  | "channel3"
  | "bounties"
  | "bryntum"
  | "aggrid";

interface NexusHeaderProps {
  activeTab: WorkspaceTabId;
  onSelectTab: (tab: WorkspaceTabId) => void;
  activeMode: PayPalExecutionMode;
  preferredMode: "auto" | "sandbox" | "mirror";
  databaseSource: string;
  voiceLoading: boolean;
  voiceTranscript: string | null;
  onSwitchMode: (mode: "auto" | "sandbox" | "mirror") => void;
  onSaveRuntimeCredentials: (clientId: string, clientSecret: string) => Promise<void>;
  onPlayVoiceBriefing: () => void;
  onResetDemoState: () => void;
}

const NAV_ITEMS: Array<{
  id: WorkspaceTabId;
  shortLabel: string;
  fullLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: "overview",
    shortLabel: "Overview",
    fullLabel: "Unified Clearinghouse (All Engines)",
    icon: Layers,
  },
  {
    id: "channel3",
    shortLabel: "Deal Hunter",
    fullLabel: "Engine 1: Channel3 + PayPal v6",
    icon: ShoppingBag,
  },
  {
    id: "bounties",
    shortLabel: "Human Bounties",
    fullLabel: "Engine 2: Proof-of-Human Payouts",
    icon: UserCheck,
  },
  {
    id: "bryntum",
    shortLabel: "Escrow Gantt",
    fullLabel: "Engine 3: Bryntum Escrow + Subscriptions",
    icon: Calendar,
  },
  {
    id: "aggrid",
    shortLabel: "AG Grid Ledger",
    fullLabel: "AG Grid Telemetry & Webhooks",
    icon: Activity,
  },
];

export default function NexusHeader({
  activeTab,
  onSelectTab,
  activeMode,
  preferredMode,
  databaseSource,
  voiceLoading,
  voiceTranscript,
  onSwitchMode,
  onSaveRuntimeCredentials,
  onPlayVoiceBriefing,
  onResetDemoState,
}: NexusHeaderProps) {
  const [showGatewayDrawer, setShowGatewayDrawer] = useState(false);
  const [sandboxClientId, setSandboxClientId] = useState("");
  const [sandboxClientSecret, setSandboxClientSecret] = useState("");
  const [savingCreds, setSavingCreds] = useState(false);

  async function handleCredsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSavingCreds(true);
    try {
      await onSaveRuntimeCredentials(sandboxClientId, sandboxClientSecret);
      setShowGatewayDrawer(false);
    } finally {
      setSavingCreds(false);
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Left: Brand Logo (Clicking directs to Homepage "/" and resets to Overview) */}
        <NexusPulseLogo
          onNavigateHome={() => {
            onSelectTab("overview");
          }}
        />

        {/* Center: Minimalist Pill Navigation (Desktop) */}
        <nav
          aria-label="Primary Workspace Navigation"
          className="hidden lg:flex items-center gap-1 rounded-full border border-slate-800/90 bg-slate-900/75 p-1 shadow-inner"
        >
          <div role="tablist" aria-label="Workspace Views" className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  title={item.fullLabel}
                  onClick={() => onSelectTab(item.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-white text-slate-950 font-semibold shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{item.shortLabel}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Right: Minimalist Status & Action Cluster */}
        <div className="flex items-center gap-2">
          {/* Unified Gateway & Database Status Trigger */}
          <button
            type="button"
            aria-expanded={showGatewayDrawer}
            onClick={() => setShowGatewayDrawer((v) => !v)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/90 hover:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 transition"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                activeMode === "sandbox"
                  ? "bg-emerald-400 animate-pulse"
                  : "bg-sky-400 animate-pulse"
              }`}
            />
            <span className="hidden sm:inline">
              {activeMode === "sandbox" ? "PayPal Sandbox" : "PayPal Mirror"}
            </span>
            <span className="text-slate-600 hidden md:inline">•</span>
            <span className="hidden md:inline-flex items-center gap-1 text-emerald-400">
              <Database className="h-3 w-3" />
              {databaseSource === "supabase_postgres" ? "Supabase" : "Local"}
            </span>
            <ChevronDown
              className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${
                showGatewayDrawer ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Voice CFO Briefing Button */}
          <button
            type="button"
            onClick={onPlayVoiceBriefing}
            disabled={voiceLoading}
            className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 px-3.5 py-1.5 text-xs font-semibold text-sky-200 transition"
          >
            <Volume2
              className={`h-3.5 w-3.5 text-sky-400 ${
                voiceLoading ? "animate-bounce" : ""
              }`}
            />
            <span className="hidden sm:inline">
              {voiceLoading ? "Speaking..." : "Voice CFO"}
            </span>
          </button>

          {/* Reset Demo Button */}
          <button
            type="button"
            onClick={onResetDemoState}
            aria-label="Reset Demo State"
            title="Reset Demo State"
            className="group inline-flex items-center justify-center rounded-full border border-slate-800 bg-slate-900/90 hover:border-slate-700 hover:bg-slate-800 p-2 text-slate-400 hover:text-white transition"
          >
            <RefreshCw className="h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-180" />
          </button>
        </div>
      </div>

      {/* Collapsible Gateway Mode & Sandbox Credentials Drawer */}
      {showGatewayDrawer && (
        <div className="nexus-fade-in border-t border-slate-800/80 bg-slate-900/95 px-4 sm:px-6 py-4">
          <div className="mx-auto max-w-7xl flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Mode Selector */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-300">
                Execution Mode:
              </span>
              <div
                role="group"
                aria-label="PayPal Execution Mode"
                className="inline-flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-950 p-1"
              >
                {(["auto", "sandbox", "mirror"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={preferredMode === m}
                    onClick={() => onSwitchMode(m)}
                    className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                      preferredMode === m
                        ? "bg-indigo-600 text-white shadow"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {m === "auto"
                      ? `Auto (${activeMode.toUpperCase()})`
                      : m === "sandbox"
                        ? "Live Sandbox"
                        : "Deterministic Mirror"}
                  </button>
                ))}
              </div>
            </div>

            {/* Hot-Swap Credentials Form */}
            <form
              onSubmit={handleCredsSubmit}
              className="flex flex-wrap items-center gap-2"
            >
              <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                <KeyRound className="h-3.5 w-3.5 text-indigo-400" />
                Hot-Swap Sandbox Keys:
              </span>
              <label htmlFor="header-sandbox-id" className="visually-hidden">
                PayPal Sandbox Client ID
              </label>
              <input
                id="header-sandbox-id"
                type="text"
                autoComplete="off"
                value={sandboxClientId}
                onChange={(e) => setSandboxClientId(e.target.value)}
                placeholder="PAYPAL_CLIENT_ID"
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white font-mono"
                required
              />
              <label htmlFor="header-sandbox-secret" className="visually-hidden">
                PayPal Sandbox Client Secret
              </label>
              <input
                id="header-sandbox-secret"
                type="password"
                autoComplete="off"
                value={sandboxClientSecret}
                onChange={(e) => setSandboxClientSecret(e.target.value)}
                placeholder="PAYPAL_CLIENT_SECRET"
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white font-mono"
                required
              />
              <button
                type="submit"
                disabled={savingCreds}
                className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-white transition"
              >
                {savingCreds ? "Saving..." : "Activate Live Sandbox"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Voice Transcript Banner (Only visible when active) */}
      {voiceTranscript && (
        <div
          role="status"
          aria-live="polite"
          className="nexus-fade-in border-t border-sky-500/20 bg-sky-950/30 px-4 sm:px-6 py-1.5 text-center text-xs text-sky-200"
        >
          🔊 <em>&ldquo;{voiceTranscript}&rdquo;</em>
        </div>
      )}
    </header>
  );
}
