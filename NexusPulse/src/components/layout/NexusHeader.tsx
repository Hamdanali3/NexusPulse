"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Activity,
  Calendar,
  ChevronDown,
  Database,
  Info,
  KeyRound,
  Layers,
  Mail,
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

export type HeaderNavTab = WorkspaceTabId | "about" | "contact";

interface NexusHeaderProps {
  activeTab: HeaderNavTab;
  onSelectTab?: (tab: WorkspaceTabId) => void;
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

const ENGINE_ITEMS: Array<{
  id: WorkspaceTabId;
  label: string;
  badge: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: "channel3",
    label: "Deal Hunter",
    badge: "Engine 01",
    description: "100M+ SKU Catalog & PayPal v6 Checkout",
    icon: ShoppingBag,
  },
  {
    id: "bounties",
    label: "Human Bounties",
    badge: "Engine 02",
    description: "60-Second Tasks & Instant PayPal Payouts",
    icon: UserCheck,
  },
  {
    id: "bryntum",
    label: "Escrow Gantt",
    badge: "Engine 03",
    description: "Interactive Milestones & Dispute Shield",
    icon: Calendar,
  },
  {
    id: "aggrid",
    label: "Telemetry",
    badge: "Ledger",
    description: "AG Grid Financial Ledger & Webhooks",
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
  const [showEnginesMenu, setShowEnginesMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sandboxClientId, setSandboxClientId] = useState("");
  const [sandboxClientSecret, setSandboxClientSecret] = useState("");
  const [savingCreds, setSavingCreds] = useState(false);
  const enginesMenuRef = useRef<HTMLDivElement | null>(null);

  const isEngineActive =
    activeTab === "channel3" ||
    activeTab === "bounties" ||
    activeTab === "bryntum" ||
    activeTab === "aggrid";

  const activeEngineMeta = ENGINE_ITEMS.find((e) => e.id === activeTab);

  // Close engines dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        enginesMenuRef.current &&
        !enginesMenuRef.current.contains(e.target as Node)
      ) {
        setShowEnginesMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  function handleSelectEngine(id: WorkspaceTabId) {
    setShowEnginesMenu(false);
    setMobileMenuOpen(false);
    if (onSelectTab) {
      onSelectTab(id);
    } else if (typeof window !== "undefined") {
      window.location.href = `/?tab=${id}`;
    }
  }

  function handleSelectOverview() {
    setMobileMenuOpen(false);
    if (onSelectTab) {
      onSelectTab("overview");
    } else if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-colors">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-8 lg:px-12 h-14 sm:h-16 flex items-center justify-between gap-4">
        {/* Left: Redesigned Purpose Logo */}
        <NexusPulseLogo
          onNavigateHome={() => {
            if (onSelectTab) {
              onSelectTab("overview");
            }
          }}
        />

        {/* Center: Exactly 4 Clean Navigation Options (Overview, Engines, About, Contact) */}
        <nav
          aria-label="Main Navigation"
          className="hidden md:flex items-center gap-1.5"
        >
          {/* Option 1: Overview */}
          <button
            type="button"
            onClick={handleSelectOverview}
            className={`relative inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 ${
              activeTab === "overview"
                ? "text-slate-950 bg-slate-100/90 shadow-xs"
                : "text-slate-600 hover:text-slate-950 hover:bg-slate-50"
            }`}
          >
            <Layers
              className={`h-3.5 w-3.5 ${
                activeTab === "overview" ? "text-sky-600" : "text-slate-500"
              }`}
            />
            <span>Overview</span>
            {activeTab === "overview" && (
              <span
                aria-hidden="true"
                className="absolute -bottom-[9px] left-3 right-3 h-[2px] rounded-full bg-gradient-to-r from-sky-500 to-indigo-600"
              />
            )}
          </button>

          {/* Option 2: Engines (Consolidates all engines in 1 single option with sleek dropdown) */}
          <div className="relative" ref={enginesMenuRef}>
            <button
              type="button"
              aria-expanded={showEnginesMenu}
              aria-haspopup="true"
              onClick={() => setShowEnginesMenu((v) => !v)}
              className={`relative inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 ${
                isEngineActive
                  ? "text-slate-950 bg-slate-100/90 shadow-xs"
                  : "text-slate-600 hover:text-slate-950 hover:bg-slate-50"
              }`}
            >
              <ShoppingBag
                className={`h-3.5 w-3.5 ${
                  isEngineActive ? "text-sky-600" : "text-slate-500"
                }`}
              />
              <span>Engines</span>
              {activeEngineMeta && (
                <span className="rounded bg-sky-100 text-sky-800 text-[10px] font-bold px-1.5 py-0.2">
                  {activeEngineMeta.label}
                </span>
              )}
              <ChevronDown
                className={`h-3 w-3 text-slate-400 transition-transform duration-200 ${
                  showEnginesMenu ? "rotate-180" : ""
                }`}
              />
              {isEngineActive && (
                <span
                  aria-hidden="true"
                  className="absolute -bottom-[9px] left-3 right-3 h-[2px] rounded-full bg-gradient-to-r from-sky-500 to-indigo-600"
                />
              )}
            </button>

            {/* Engines Dropdown Menu */}
            {showEnginesMenu && (
              <div
                role="menu"
                className="nexus-fade-in absolute left-0 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-xl ring-1 ring-slate-900/5 z-50 divide-y divide-slate-100"
              >
                <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Autonomous Financial Engines
                </div>

                <div className="py-1 space-y-1">
                  {ENGINE_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isCur = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        role="menuitem"
                        onClick={() => handleSelectEngine(item.id)}
                        className={`w-full flex items-start gap-3 rounded-lg px-2.5 py-2 text-left transition ${
                          isCur
                            ? "bg-sky-50 text-sky-950 font-semibold border border-sky-200/60"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <div className="p-1.5 rounded-lg bg-slate-100 border border-slate-200 shrink-0 mt-0.5">
                          <Icon className="h-4 w-4 text-sky-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900">
                              {item.label}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                              {item.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                            {item.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="h-4 w-[1px] bg-slate-200 mx-1" aria-hidden="true" />

          {/* Option 3: About */}
          <Link
            href="/about"
            className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 ${
              activeTab === "about"
                ? "text-slate-950 bg-slate-100/90 shadow-xs"
                : "text-slate-600 hover:text-slate-950 hover:bg-slate-50"
            }`}
          >
            <Info
              className={`h-3.5 w-3.5 ${
                activeTab === "about" ? "text-sky-600" : "text-slate-500"
              }`}
            />
            <span>About</span>
            {activeTab === "about" && (
              <span
                aria-hidden="true"
                className="absolute -bottom-[9px] left-3 right-3 h-[2px] rounded-full bg-gradient-to-r from-sky-500 to-indigo-600"
              />
            )}
          </Link>

          {/* Option 4: Contact */}
          <Link
            href="/contact"
            className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 ${
              activeTab === "contact"
                ? "text-slate-950 bg-slate-100/90 shadow-xs"
                : "text-slate-600 hover:text-slate-950 hover:bg-slate-50"
            }`}
          >
            <Mail
              className={`h-3.5 w-3.5 ${
                activeTab === "contact" ? "text-sky-600" : "text-slate-500"
              }`}
            />
            <span>Contact</span>
            {activeTab === "contact" && (
              <span
                aria-hidden="true"
                className="absolute -bottom-[9px] left-3 right-3 h-[2px] rounded-full bg-gradient-to-r from-sky-500 to-indigo-600"
              />
            )}
          </Link>
        </nav>

        {/* Right: Sleek Status & Control Cluster (Theme switcher removed for single theme) */}
        <div className="flex items-center gap-2">
          {/* Mobile Navigation Trigger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Toggle navigation menu"
            className="inline-flex md:hidden items-center justify-center p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs"
          >
            <Layers className="h-4 w-4" />
          </button>

          {/* Gateway Status Badge & Drawer Trigger */}
          <button
            type="button"
            aria-expanded={showGatewayDrawer}
            onClick={() => setShowGatewayDrawer((v) => !v)}
            title="Configure PayPal Gateway & Database runtime"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-xs transition"
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

          {/* Reset Demo State Button */}
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

      {/* Mobile Drawer (4 Clean Options: Overview, Engines, About, Contact) */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-2 shadow-lg nexus-fade-in">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2">
            Navigation (4 Core Options)
          </div>
          <button
            type="button"
            onClick={handleSelectOverview}
            className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-left ${
              activeTab === "overview"
                ? "bg-slate-950 text-white"
                : "text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>1. Overview</span>
          </button>

          <div className="pl-2 space-y-1">
            <div className="text-[11px] font-bold text-slate-700 px-1 py-1">
              2. Engines Hub:
            </div>
            {ENGINE_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectEngine(item.id)}
                className={`w-full flex items-center justify-between rounded-lg px-3 py-1.5 text-xs text-left ${
                  activeTab === item.id
                    ? "bg-sky-50 text-sky-950 font-bold border border-sky-200"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span>{item.label}</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {item.badge}
                </span>
              </button>
            ))}
          </div>

          <Link
            href="/about"
            onClick={() => setMobileMenuOpen(false)}
            className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${
              activeTab === "about"
                ? "bg-slate-950 text-white"
                : "text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Info className="h-4 w-4 text-sky-600" />
            <span>3. About</span>
          </Link>

          <Link
            href="/contact"
            onClick={() => setMobileMenuOpen(false)}
            className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${
              activeTab === "contact"
                ? "bg-slate-950 text-white"
                : "text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Mail className="h-4 w-4 text-indigo-600" />
            <span>4. Contact</span>
          </Link>
        </div>
      )}

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
                Store:{" "}
                <span className="font-semibold text-slate-800">
                  {databaseSource === "supabase_postgres"
                    ? "Supabase PostgreSQL"
                    : "Local Mirror"}
                </span>
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
