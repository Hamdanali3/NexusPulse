"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, Menu, RotateCcw, Settings2, Volume2, X } from "lucide-react";
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
  preferredMode: "auto" | "live" | "sandbox" | "mirror";
  databaseSource: string;
  voiceLoading: boolean;
  voiceTranscript: string | null;
  onSwitchMode: (mode: "auto" | "live" | "sandbox" | "mirror") => void;
  onSaveRuntimeCredentials: (clientId: string, clientSecret: string) => Promise<void>;
  onPlayVoiceBriefing: () => void;
  onResetDemoState: () => void;
}

export const ENGINE_ITEMS: Array<{
  id: Exclude<WorkspaceTabId, "overview">;
  label: string;
  description: string;
}> = [
  { id: "channel3", label: "Deal Hunter", description: "Buy at your target price" },
  { id: "bounties", label: "Human Bounties", description: "Quick tasks, instant payouts" },
  { id: "bryntum", label: "Smart Escrow", description: "Release funds on proof" },
  { id: "aggrid", label: "Ledger", description: "Every transaction, one table" },
];

const linkBase = "rounded-md px-3 py-1.5 text-sm transition-colors";
const linkIdle = "text-zinc-500 hover:text-zinc-950";
const linkActive = "text-zinc-950 font-medium";

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
  const [showSettings, setShowSettings] = useState(false);
  const [showEngines, setShowEngines] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sandboxClientId, setSandboxClientId] = useState("");
  const [sandboxClientSecret, setSandboxClientSecret] = useState("");
  const [savingCreds, setSavingCreds] = useState(false);
  const enginesRef = useRef<HTMLDivElement | null>(null);

  const isEngineActive = ENGINE_ITEMS.some((e) => e.id === activeTab);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (enginesRef.current && !enginesRef.current.contains(e.target as Node)) {
        setShowEngines(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function go(tab: WorkspaceTabId) {
    setShowEngines(false);
    setMobileOpen(false);
    if (onSelectTab) {
      onSelectTab(tab);
    } else if (typeof window !== "undefined") {
      window.location.href = tab === "overview" ? "/" : `/?tab=${tab}`;
    }
  }

  async function handleCredsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSavingCreds(true);
    try {
      await onSaveRuntimeCredentials(sandboxClientId, sandboxClientSecret);
      setShowSettings(false);
    } finally {
      setSavingCreds(false);
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/70 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <div className="flex items-center gap-8">
          <NexusPulseLogo onNavigateHome={() => onSelectTab?.("overview")} />

          {/* Primary navigation — 4 items */}
          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            <button
              type="button"
              onClick={() => go("overview")}
              aria-current={activeTab === "overview" ? "page" : undefined}
              className={`${linkBase} ${activeTab === "overview" ? linkActive : linkIdle}`}
            >
              Overview
            </button>

            <div className="relative" ref={enginesRef}>
              <button
                type="button"
                aria-expanded={showEngines}
                aria-haspopup="menu"
                onClick={() => setShowEngines((v) => !v)}
                className={`${linkBase} inline-flex items-center gap-1 ${isEngineActive ? linkActive : linkIdle}`}
              >
                Engines
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showEngines ? "rotate-180" : ""}`} />
              </button>

              {showEngines && (
                <div
                  role="menu"
                  className="nexus-fade-in absolute left-0 mt-2 w-64 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-lg shadow-zinc-950/5"
                >
                  {ENGINE_ITEMS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      role="menuitem"
                      onClick={() => go(item.id)}
                      className={`flex w-full flex-col rounded-lg px-3 py-2 text-left transition-colors hover:bg-zinc-50 ${
                        activeTab === item.id ? "bg-zinc-50" : ""
                      }`}
                    >
                      <span className="text-sm font-medium text-zinc-950">{item.label}</span>
                      <span className="text-xs text-zinc-500">{item.description}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Link href="/about" className={`${linkBase} ${activeTab === "about" ? linkActive : linkIdle}`}>
              About
            </Link>
            <Link href="/contact" className={`${linkBase} ${activeTab === "contact" ? linkActive : linkIdle}`}>
              Contact
            </Link>
          </nav>
        </div>

        {/* Quiet controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowSettings((v) => !v)}
            aria-expanded={showSettings}
            title="PayPal connection settings"
            className="hidden items-center gap-2 rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-600 transition-colors hover:border-zinc-300 hover:text-zinc-950 sm:inline-flex"
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                activeMode === "live"
                  ? "bg-emerald-500 ring-2 ring-emerald-500/20"
                  : activeMode === "sandbox"
                    ? "bg-sky-500 ring-2 ring-sky-500/20"
                    : "bg-zinc-400"
              }`}
            />
            {activeMode === "live" ? "Live" : activeMode === "sandbox" ? "Sandbox" : "Demo mode"}
          </button>

          <button
            type="button"
            onClick={onPlayVoiceBriefing}
            disabled={voiceLoading}
            aria-label="Play voice briefing"
            title="Voice briefing"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950"
          >
            {voiceLoading ? (
              <span className="audio-bars text-indigo-600" aria-hidden="true">
                <span className="audio-bar" />
                <span className="audio-bar" />
                <span className="audio-bar" />
                <span className="audio-bar" />
              </span>
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>

          <button
            type="button"
            onClick={onResetDemoState}
            aria-label="Reset demo data"
            title="Reset demo data"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => setShowSettings((v) => !v)}
            aria-label="Settings"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950 sm:hidden"
          >
            <Settings2 className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={mobileOpen}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-700 hover:bg-zinc-100 md:hidden"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav aria-label="Mobile" className="nexus-fade-in border-t border-zinc-200 bg-white px-5 py-3 md:hidden">
          <button type="button" onClick={() => go("overview")} className="block w-full py-2 text-left text-sm font-medium text-zinc-950">
            Overview
          </button>
          <p className="pt-3 pb-1 text-xs text-zinc-400">Engines</p>
          {ENGINE_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => go(item.id)}
              className={`block w-full py-2 text-left text-sm ${activeTab === item.id ? "font-medium text-zinc-950" : "text-zinc-600"}`}
            >
              {item.label}
            </button>
          ))}
          <div className="mt-2 border-t border-zinc-100 pt-2">
            <Link href="/about" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-zinc-600">
              About
            </Link>
            <Link href="/contact" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-zinc-600">
              Contact
            </Link>
          </div>
        </nav>
      )}

      {/* Connection settings */}
      {showSettings && (
        <div className="nexus-fade-in border-t border-zinc-200 bg-white">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-4 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="text-zinc-500">Mode</span>
              <div role="group" aria-label="PayPal mode" className="inline-flex rounded-lg bg-zinc-100 p-0.5">
                {(["auto", "live", "sandbox", "mirror"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={preferredMode === m}
                    onClick={() => onSwitchMode(m)}
                    className={`rounded-md px-3 py-1 text-xs transition-colors ${
                      preferredMode === m ? "bg-white font-medium text-zinc-950 shadow-sm" : "text-zinc-500 hover:text-zinc-950"
                    }`}
                  >
                    {m === "auto" ? "Auto" : m === "live" ? "Live" : m === "sandbox" ? "Sandbox" : "Demo"}
                  </button>
                ))}
              </div>
              <span className="text-xs text-zinc-400">
                {databaseSource === "supabase_postgres" ? "Supabase" : "Local data"}
              </span>
            </div>

            <form onSubmit={handleCredsSubmit} className="flex flex-wrap items-center gap-2">
              <label htmlFor="header-sandbox-id" className="visually-hidden">
                PayPal Sandbox Client ID
              </label>
              <input
                id="header-sandbox-id"
                type="text"
                autoComplete="off"
                value={sandboxClientId}
                onChange={(e) => setSandboxClientId(e.target.value)}
                placeholder="Sandbox client ID"
                className="h-8 w-44 rounded-md border border-zinc-200 bg-white px-2.5 text-xs placeholder:text-zinc-400"
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
                placeholder="Secret"
                className="h-8 w-36 rounded-md border border-zinc-200 bg-white px-2.5 text-xs placeholder:text-zinc-400"
                required
              />
              <button
                type="submit"
                disabled={savingCreds}
                className="h-8 rounded-md bg-zinc-950 px-3 text-xs font-medium text-white transition-colors hover:bg-zinc-800"
              >
                {savingCreds ? "Connecting…" : "Connect"}
              </button>
            </form>
          </div>
        </div>
      )}

      {voiceTranscript && (
        <div role="status" aria-live="polite" className="border-t border-zinc-200 bg-white px-5 py-2 text-center text-xs text-zinc-500">
          “{voiceTranscript}”
        </div>
      )}
    </header>
  );
}
