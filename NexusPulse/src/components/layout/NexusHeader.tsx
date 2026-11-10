"use client";

import React, { useEffect, useState } from "react";
import {
  Activity,
  Calendar,
  ChevronDown,
  Database,
  KeyRound,
  Layers,
  Palette,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Sun,
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

export type WhiteThemeId = "stripe" | "mercury" | "nordic";

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

const THEME_OPTIONS: Array<{
  id: WhiteThemeId;
  name: string;
  description: string;
  tag: string;
}> = [
  {
    id: "stripe",
    name: "Stripe Pure Light",
    description: "Crisp Pure White with Electric Cyan Ambiance",
    tag: "Default White",
  },
  {
    id: "mercury",
    name: "Mercury Ivory Light",
    description: "Warm Alabaster with Champagne Gold Accents",
    tag: "Warm Luxury",
  },
  {
    id: "nordic",
    name: "Nordic Frost Light",
    description: "Cool Clean Slate with Royal Azure Accents",
    tag: "Cool Minimal",
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
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<WhiteThemeId>("stripe");
  const [sandboxClientId, setSandboxClientId] = useState("");
  const [sandboxClientSecret, setSandboxClientSecret] = useState("");
  const [savingCreds, setSavingCreds] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = (localStorage.getItem("nexus_theme") as WhiteThemeId) || "stripe";
      setCurrentTheme(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
    }
  }, []);

  function handleSelectTheme(themeId: WhiteThemeId) {
    setCurrentTheme(themeId);
    if (typeof window !== "undefined") {
      localStorage.setItem("nexus_theme", themeId);
      document.documentElement.setAttribute("data-theme", themeId);
    }
    setShowThemeMenu(false);
  }

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

  const activeThemeMeta = THEME_OPTIONS.find((t) => t.id === currentTheme) ?? THEME_OPTIONS[0];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-colors">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-8 lg:px-12 h-14 sm:h-16 flex items-center justify-between gap-4">
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
                  className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 ${
                    isActive
                      ? "text-slate-950 font-semibold bg-slate-100/90 shadow-xs"
                      : "text-slate-600 hover:text-slate-950 hover:bg-slate-50"
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? "text-sky-600" : "text-slate-500"}`} />
                  <span>{item.label}</span>
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute -bottom-[9px] left-3 right-3 h-[2px] rounded-full bg-gradient-to-r from-sky-500 to-indigo-600"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Right: Sleek Status & Control Cluster */}
        <div className="flex items-center gap-2">
          {/* White Background Theme Selector Dropdown */}
          <div className="relative">
            <button
              type="button"
              aria-label="Select White Background Theme"
              title="Switch between White Background Themes (Stripe, Mercury, Nordic)"
              onClick={() => setShowThemeMenu((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-xs transition"
            >
              <Palette className="h-3.5 w-3.5 text-sky-600" />
              <span className="hidden sm:inline">{activeThemeMeta.name.split(" ")[0]} Light</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {showThemeMenu && (
              <div
                role="menu"
                className="nexus-fade-in absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl ring-1 ring-slate-900/5 z-50"
              >
                <div className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
                  White Background Themes
                </div>
                {THEME_OPTIONS.map((theme) => {
                  const isCur = currentTheme === theme.id;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      role="menuitem"
                      onClick={() => handleSelectTheme(theme.id)}
                      className={`w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition ${
                        isCur
                          ? "bg-sky-50 text-sky-950 font-semibold border border-sky-200/60"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Sun className={`h-3 w-3 ${isCur ? "text-sky-600" : "text-slate-400"}`} />
                          <span>{theme.name}</span>
                        </div>
                        <p className="mt-0.5 text-[10px] text-slate-500">{theme.description}</p>
                      </div>
                      <span className="text-[10px] rounded-md bg-slate-100 px-1.5 py-0.5 text-slate-600">
                        {theme.tag}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Gateway Status Badge & Drawer Trigger */}
          <button
            type="button"
            aria-expanded={showGatewayDrawer}
            onClick={() => setShowGatewayDrawer((v) => !v)}
            title="Configure PayPal Gateway & Database runtime"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-xs transition"
          >
            <span
              className={`h-2 w-2 rounded-full shrink-0 ${
                activeMode === "sandbox"
                  ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]"
                  : "bg-sky-500 shadow-[0_0_6px_rgba(14,165,233,0.5)]"
              }`}
            />
            <span className="hidden sm:inline text-slate-700 font-medium">
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
            className="group inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 text-xs font-semibold text-sky-700 shadow-xs transition active:scale-95"
          >
            {voiceLoading ? (
              <div className="audio-bars text-sky-600" aria-hidden="true">
                <span className="audio-bar" />
                <span className="audio-bar" />
                <span className="audio-bar" />
                <span className="audio-bar" />
              </div>
            ) : (
              <Volume2 className="h-3.5 w-3.5 text-sky-600 transition-transform group-hover:scale-110" />
            )}
            <span className="hidden sm:inline">
              {voiceLoading ? "Speaking..." : "Voice CFO"}
            </span>
          </button>

          {/* Reset State Button */}
          <button
            type="button"
            onClick={onResetDemoState}
            aria-label="Reset Demo State"
            title="Reset All Sandbox State to Clean Baseline"
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 p-1.5 text-slate-600 hover:text-slate-900 shadow-xs transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Gateway & Hot-Swap Drawer */}
      {showGatewayDrawer && (
        <div className="nexus-fade-in border-t border-slate-200 bg-slate-50/95 px-4 sm:px-6 py-3.5 backdrop-blur-xl">
          <div className="mx-auto max-w-[1600px] px-4 sm:px-8 lg:px-12 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 text-xs">
            {/* Mode Switcher */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-700">Gateway Mode:</span>
              <div
                role="group"
                aria-label="PayPal Execution Mode"
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white p-0.5 shadow-xs"
              >
                {(["auto", "sandbox", "mirror"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={preferredMode === m}
                    onClick={() => onSwitchMode(m)}
                    className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                      preferredMode === m
                        ? "bg-slate-900 text-white font-semibold shadow-xs"
                        : "text-slate-600 hover:text-slate-950 hover:bg-slate-50"
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
              <span className="text-slate-400">•</span>
              <span className="inline-flex items-center gap-1 text-slate-600">
                <Database className="h-3 w-3 text-emerald-600" />
                Store: <span className="font-semibold text-slate-800">{databaseSource === "supabase_postgres" ? "Supabase PostgreSQL" : "Local Mirror"}</span>
              </span>
            </div>

            {/* Hot-Swap Credentials Form */}
            <form
              onSubmit={handleCredsSubmit}
              className="flex flex-wrap items-center gap-2"
            >
              <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                <KeyRound className="h-3.5 w-3.5 text-indigo-600" />
                Hot-Swap Keys:
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
                className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-900 font-mono placeholder:text-slate-400 shadow-xs"
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
                className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-900 font-mono placeholder:text-slate-400 shadow-xs"
                required
              />
              <button
                type="submit"
                disabled={savingCreds}
                className="rounded-md bg-slate-900 hover:bg-slate-800 px-3 py-1 text-xs font-semibold text-white shadow-xs transition"
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
          className="nexus-fade-in border-t border-sky-200 bg-sky-50 px-4 sm:px-6 py-1.5 text-center text-xs font-medium text-sky-800"
        >
          🔊 <em>&ldquo;{voiceTranscript}&rdquo;</em>
        </div>
      )}
    </header>
  );
}
