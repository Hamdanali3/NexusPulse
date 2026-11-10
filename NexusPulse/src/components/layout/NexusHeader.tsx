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
  label: string;
  fullTitle: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: "overview",
    label: "Overview",
    fullTitle: "Autonomous Financial Clearinghouse Overview",
    icon: Layers,
  },
  {
    id: "channel3",
    label: "Deal Hunter",
    fullTitle: "Engine 1: Channel3 + PayPal v6 Commerce",
    icon: ShoppingBag,
  },
  {
    id: "bounties",
    label: "Human Bounties",
    fullTitle: "Engine 2: Proof-of-Human Oracle Payouts",
    icon: UserCheck,
  },
  {
    id: "bryntum",
    label: "Escrow Gantt",
    fullTitle: "Engine 3: Bryntum Escrow & Subscriptions",
    icon: Calendar,
  },
  {
    id: "aggrid",
    label: "Telemetry",
    fullTitle: "AG Grid v36 Financial Ledger & Webhooks",
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
    <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-slate-950/80 backdrop-blur-xl transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Logo (Always directs to Homepage "/" and resets to Overview) */}
        <NexusPulseLogo
          onNavigateHome={() => {
            onSelectTab("overview");
          }}
        />

        {/* Center: Linear-Style Clean Navigation Links */}
        <nav
          aria-label="Workspace Engines"
          className="hidden md:flex items-center gap-1"
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
                  title={item.fullTitle}
                  onClick={() => onSelectTab(item.id)}
                  className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150 ${
                    isActive
                      ? "text-white font-semibold bg-white/[0.08]"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? "text-sky-400" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute -bottom-[9px] left-3 right-3 h-[2px] rounded-full bg-gradient-to-r from-sky-400 to-indigo-500"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Right: Sleek Status & Control Cluster */}
        <div className="flex items-center gap-2">
          {/* Gateway Status Badge & Drawer Trigger */}
          <button
            type="button"
            aria-expanded={showGatewayDrawer}
            onClick={() => setShowGatewayDrawer((v) => !v)}
            title="Configure PayPal Gateway & Database runtime"
            className="group inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-slate-900/60 hover:border-white/20 hover:bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition"
          >
            <span
              className={`h-2 w-2 rounded-full shrink-0 ${
                activeMode === "sandbox"
                  ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                  : "bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]"
              }`}
            />
            <span className="hidden sm:inline text-slate-300">
              {activeMode === "sandbox" ? "PayPal Sandbox" : "PayPal Mirror"}
            </span>
            <ChevronDown
              className={`h-3 w-3 text-slate-400 transition-transform duration-200 ${
                showGatewayDrawer ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Voice CFO Trigger */}
          <button
            type="button"
            onClick={onPlayVoiceBriefing}
            disabled={voiceLoading}
            title="Listen to Executive Audio Briefing from Gemini"
            className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/25 bg-sky-500/[0.08] hover:bg-sky-500/15 hover:border-sky-500/40 px-3 py-1.5 text-xs font-medium text-sky-200 transition"
          >
            <Volume2
              className={`h-3.5 w-3.5 text-sky-400 ${
                voiceLoading ? "animate-pulse" : ""
              }`}
            />
            <span className="hidden sm:inline">
              {voiceLoading ? "Briefing..." : "Voice CFO"}
            </span>
          </button>

          {/* Reset State Button */}
          <button
            type="button"
            onClick={onResetDemoState}
            aria-label="Reset Demo State"
            title="Reset All Sandbox State to Clean Baseline"
            className="inline-flex items-center justify-center rounded-lg border border-white/[0.08] bg-slate-900/60 hover:border-white/20 hover:bg-slate-900 p-1.5 text-slate-400 hover:text-white transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Gateway & Hot-Swap Drawer */}
      {showGatewayDrawer && (
        <div className="nexus-fade-in border-t border-white/[0.08] bg-slate-950/95 px-4 sm:px-6 py-3.5 backdrop-blur-xl">
          <div className="mx-auto max-w-7xl flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 text-xs">
            {/* Mode Switcher */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-slate-400">Gateway Mode:</span>
              <div
                role="group"
                aria-label="PayPal Execution Mode"
                className="inline-flex items-center gap-1 rounded-md border border-white/[0.08] bg-slate-900/80 p-0.5"
              >
                {(["auto", "sandbox", "mirror"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={preferredMode === m}
                    onClick={() => onSwitchMode(m)}
                    className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                      preferredMode === m
                        ? "bg-white text-slate-950 font-semibold shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {m === "auto"
                      ? `Auto (${activeMode})`
                      : m === "sandbox"
                        ? "Live Sandbox"
                        : "Deterministic Mirror"}
                  </button>
                ))}
              </div>
              <span className="text-slate-600">•</span>
              <span className="inline-flex items-center gap-1 text-slate-400">
                <Database className="h-3 w-3 text-emerald-400" />
                Store: <span className="text-slate-200">{databaseSource === "supabase_postgres" ? "Supabase PostgreSQL" : "Local Mirror"}</span>
              </span>
            </div>

            {/* Hot-Swap Credentials Form */}
            <form
              onSubmit={handleCredsSubmit}
              className="flex flex-wrap items-center gap-2"
            >
              <span className="inline-flex items-center gap-1 text-slate-400">
                <KeyRound className="h-3.5 w-3.5 text-indigo-400" />
                Keys:
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
                placeholder="Sandbox Client ID"
                className="rounded-md border border-white/10 bg-slate-900 px-2.5 py-1 text-xs text-white font-mono placeholder:text-slate-600"
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
                placeholder="Sandbox Secret"
                className="rounded-md border border-white/10 bg-slate-900 px-2.5 py-1 text-xs text-white font-mono placeholder:text-slate-600"
                required
              />
              <button
                type="submit"
                disabled={savingCreds}
                className="rounded-md bg-white hover:bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-950 transition"
              >
                {savingCreds ? "Saving..." : "Connect"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Voice Transcript Bar */}
      {voiceTranscript && (
        <div
          role="status"
          aria-live="polite"
          className="nexus-fade-in border-t border-sky-500/20 bg-sky-950/40 px-4 sm:px-6 py-1.5 text-center text-xs text-sky-200"
        >
          🔊 <em>&ldquo;{voiceTranscript}&rdquo;</em>
        </div>
      )}
    </header>
  );
}
