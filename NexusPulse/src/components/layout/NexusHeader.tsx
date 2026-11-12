"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowDown01Icon,
  Cancel01Icon,
  Key01Icon,
  LayoutTable01Icon,
  Menu01Icon,
  SecurityLockIcon,
  SlidersHorizontalIcon,
  Tag01Icon,
  TaskDone01Icon,
  Undo02Icon,
  VolumeHighIcon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import type { PayPalExecutionMode, PayPalSandboxAccountConfig } from "@/lib/paypal/paypal-types";
import type { UserProfile } from "@/lib/auth/auth-types";
import { AppIcon } from "@/components/ui/Icon";
import NexusPulseLogo from "@/components/brand/NexusPulseLogo";

export type WorkspaceTabId = "overview" | "channel3" | "bounties" | "bryntum" | "aggrid";
export type HeaderNavTab = WorkspaceTabId | "about" | "contact";

export interface NexusHeaderProps {
  activeTab: HeaderNavTab;
  onSelectTab?: (tab: WorkspaceTabId) => void;
  activeMode: PayPalExecutionMode;
  preferredMode: "auto" | "live" | "sandbox" | "mirror";
  databaseSource: string;
  sandboxAccounts?: PayPalSandboxAccountConfig;
  voiceLoading: boolean;
  voiceTranscript: string | null;
  currentUser?: UserProfile | null;
  onOpenAuthModal?: () => void;
  onSwitchMode: (mode: "auto" | "live" | "sandbox" | "mirror") => void;
  onSaveRuntimeCredentials: (clientId: string, clientSecret: string) => Promise<void>;
  onPlayVoiceBriefing: () => void;
  onResetDemoState: () => void;
}

export const ENGINE_ITEMS: Array<{
  id: Exclude<WorkspaceTabId, "overview">;
  label: string;
  description: string;
  icon: IconSvgElement;
}> = [
  { id: "channel3", label: "Price watch", description: "Track target prices on items you want", icon: Tag01Icon },
  { id: "bounties", label: "Verified tasks", description: "Quick checks paid out via PayPal", icon: TaskDone01Icon },
  { id: "bryntum", label: "Milestone escrow", description: "Hold funds until delivery is verified", icon: SecurityLockIcon },
  { id: "aggrid", label: "Ledger", description: "All payments and invoices in one table", icon: LayoutTable01Icon },
];

const linkBase = "rounded-[6px] px-3 py-1.5 text-[13px] font-medium transition-colors duration-150";
const linkActive = "text-zinc-950 bg-zinc-100";
const linkIdle = "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/70";

export default function NexusHeader({
  activeTab,
  onSelectTab,
  activeMode,
  preferredMode,
  sandboxAccounts,
  voiceLoading,
  voiceTranscript,
  currentUser,
  onOpenAuthModal,
  onSwitchMode,
  onSaveRuntimeCredentials,
  onPlayVoiceBriefing,
  onResetDemoState,
}: NexusHeaderProps) {
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [showSandboxKeys, setShowSandboxKeys] = useState(false);
  const [showEngines, setShowEngines] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [sandboxClientId, setSandboxClientId] = useState("");
  const [sandboxClientSecret, setSandboxClientSecret] = useState("");
  const [savingCreds, setSavingCreds] = useState(false);

  const enginesRef = useRef<HTMLDivElement | null>(null);
  const toolsRef = useRef<HTMLDivElement | null>(null);

  const isEngineActive = ENGINE_ITEMS.some((e) => e.id === activeTab);
  const isDemoSession = activeMode === "mirror" || preferredMode === "mirror";

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (enginesRef.current && !enginesRef.current.contains(e.target as Node)) {
        setShowEngines(false);
      }
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) {
        setShowToolsMenu(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setShowEngines(false);
        setShowToolsMenu(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
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

  async function handleSaveCredentialsSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!sandboxClientId.trim() || !sandboxClientSecret.trim()) return;
    setSavingCreds(true);
    try {
      await onSaveRuntimeCredentials(sandboxClientId.trim(), sandboxClientSecret.trim());
      setShowSandboxKeys(false);
    } finally {
      setSavingCreds(false);
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6 min-w-0">
          <NexusPulseLogo onNavigateHome={() => go("overview")} />

          <nav aria-label="Primary" className="hidden md:flex items-center gap-1">
            {onSelectTab ? (
              <button
                type="button"
                onClick={() => go("overview")}
                className={`${linkBase} ${activeTab === "overview" ? linkActive : linkIdle}`}
                aria-current={activeTab === "overview" ? "page" : undefined}
              >
                Overview
              </button>
            ) : (
              <Link
                href="/"
                className={`${linkBase} ${activeTab === "overview" ? linkActive : linkIdle}`}
              >
                Overview
              </Link>
            )}

            <div className="relative" ref={enginesRef}>
              <button
                type="button"
                onClick={() => setShowEngines((s) => !s)}
                aria-expanded={showEngines}
                aria-haspopup="menu"
                className={`${linkBase} inline-flex items-center gap-1 ${isEngineActive ? linkActive : linkIdle}`}
              >
                <span>Tools</span>
                <AppIcon
                  icon={ArrowDown01Icon}
                  size="xs"
                  className={`transition-transform duration-150 ${showEngines ? "rotate-180" : ""}`}
                />
              </button>

              {showEngines && (
                <div
                  role="menu"
                  aria-label="Tools menu"
                  className="absolute left-0 mt-2 w-72 rounded-[12px] border border-zinc-200 bg-white p-1.5 shadow-[0_8px_24px_-4px_rgb(9_9_11/0.08),0_2px_6px_-1px_rgb(9_9_11/0.04)]"
                >
                  {ENGINE_ITEMS.map((item) => {
                    const selected = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        role="menuitem"
                        onClick={() => go(item.id)}
                        className={`w-full text-left rounded-[6px] px-3 py-2 transition-colors duration-150 flex items-start gap-2.5 ${
                          selected
                            ? "bg-indigo-50/70 text-zinc-950 border-l-2 border-l-indigo-600"
                            : "text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950"
                        }`}
                      >
                        <AppIcon
                          icon={item.icon}
                          size="sm"
                          className={`mt-0.5 ${selected ? "text-indigo-600" : "text-zinc-600"}`}
                        />
                        <span className="flex flex-col gap-0.5 min-w-0">
                          <span className="text-[13px] font-medium text-zinc-950">{item.label}</span>
                          <span className="text-[12px] text-zinc-600">{item.description}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <Link
              href="/about"
              className={`${linkBase} ${activeTab === "about" ? linkActive : linkIdle}`}
              aria-current={activeTab === "about" ? "page" : undefined}
            >
              About
            </Link>

            <Link
              href="/contact"
              className={`${linkBase} ${activeTab === "contact" ? linkActive : linkIdle}`}
              aria-current={activeTab === "contact" ? "page" : undefined}
            >
              Contact
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Single labeled Workspace Menu containing Audio Briefing, Reset Demo Data, and Mode switching */}
          <div className="relative" ref={toolsRef}>
            <button
              type="button"
              onClick={() => setShowToolsMenu((s) => !s)}
              aria-expanded={showToolsMenu}
              aria-haspopup="menu"
              className="hidden sm:inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-zinc-200 bg-white hover:bg-zinc-50 px-2.5 text-[13px] font-medium text-zinc-700 transition-colors duration-150"
            >
              <AppIcon icon={SlidersHorizontalIcon} size="xs" className="text-zinc-600" />
              <span>Workspace</span>
              <AppIcon icon={ArrowDown01Icon} size="xs" className="text-zinc-500" />
            </button>

            {showToolsMenu && (
              <div
                role="menu"
                aria-label="Workspace actions"
                className="absolute right-0 mt-2 w-64 rounded-[12px] border border-zinc-200 bg-white p-1.5 shadow-[0_8px_24px_-4px_rgb(9_9_11/0.08),0_2px_6px_-1px_rgb(9_9_11/0.04)] space-y-1"
              >
                <div className="px-3 py-1.5">
                  <div className="text-[12px] font-medium text-zinc-600 mb-1.5">Payment environment</div>
                  <div className="inline-flex w-full rounded-[6px] border border-zinc-200 bg-zinc-50 p-0.5">
                    {(["auto", "mirror", "sandbox"] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          onSwitchMode(m);
                          setBannerDismissed(false);
                        }}
                        className={`flex-1 rounded-[4px] py-1 text-[12px] font-medium transition-colors duration-150 ${
                          preferredMode === m
                            ? "bg-white text-zinc-950 border border-zinc-200"
                            : "text-zinc-600 hover:text-zinc-950"
                        }`}
                      >
                        {m === "auto" ? "Auto" : m === "mirror" ? "Demo" : "Sandbox"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-zinc-100 my-1" />

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setShowToolsMenu(false);
                    onPlayVoiceBriefing();
                  }}
                  disabled={voiceLoading}
                  className="w-full flex items-center justify-between rounded-[6px] px-3 py-2 text-left text-[13px] font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950 disabled:opacity-50"
                >
                  <span className="inline-flex items-center gap-2">
                    <AppIcon icon={VolumeHighIcon} size="sm" className="text-zinc-600" />
                    <span>{voiceLoading ? "Preparing audio summary..." : "Play audio summary"}</span>
                  </span>
                  {voiceTranscript && (
                    <span className="audio-bars text-indigo-600" aria-hidden="true">
                      <span className="audio-bar" />
                      <span className="audio-bar" />
                      <span className="audio-bar" />
                      <span className="audio-bar" />
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setShowToolsMenu(false);
                    onResetDemoState();
                  }}
                  className="w-full flex items-center gap-2 rounded-[6px] px-3 py-2 text-left text-[13px] font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950"
                >
                  <AppIcon icon={Undo02Icon} size="sm" className="text-zinc-600" />
                  <span>Reset demo data</span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setShowToolsMenu(false);
                    setShowSandboxKeys((s) => !s);
                  }}
                  className="w-full flex items-center justify-between rounded-[6px] px-3 py-2 text-left text-[13px] font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950"
                >
                  <span className="inline-flex items-center gap-2">
                    <AppIcon icon={Key01Icon} size="sm" className="text-zinc-600" />
                    <span>PayPal sandbox keys</span>
                  </span>
                  <span className="text-[12px] text-zinc-600">
                    {sandboxAccounts?.merchantEmail ? "Ready" : "Configure"}
                  </span>
                </button>
              </div>
            )}
          </div>

          {currentUser ? (
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="inline-flex h-8 items-center gap-2 rounded-[6px] border border-zinc-200 bg-white hover:bg-zinc-50 px-2.5 text-[13px] font-medium text-zinc-900 transition-colors duration-150"
              title={`Signed in as ${currentUser.fullName}`}
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-zinc-950 text-[11px] font-medium text-white">
                {currentUser.fullName
                  .split(/\s+/)
                  .map((w) => w[0] || "")
                  .join("")
                  .slice(0, 2)
                  .toUpperCase() || "NP"}
              </span>
              <span className="hidden sm:inline truncate max-w-[110px]">
                {currentUser.fullName.split(" ")[0]}
              </span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="inline-flex h-8 items-center px-2.5 rounded-[6px] text-[13px] font-medium text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 transition-colors duration-150"
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="hidden sm:inline-flex h-8 items-center gap-1.5 rounded-[6px] bg-zinc-950 hover:bg-zinc-800 px-3 text-[13px] font-medium text-white transition-colors duration-150"
              >
                Get started
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((m) => !m)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
            className="inline-flex md:hidden h-8 w-8 items-center justify-center rounded-[6px] border border-zinc-200 bg-white text-zinc-700"
          >
            <AppIcon icon={mobileOpen ? Cancel01Icon : Menu01Icon} size="sm" />
          </button>
        </div>
      </div>

      {/* Single thin dismissible Demo Mode banner (moved out of header controls) */}
      {isDemoSession && !bannerDismissed && (
        <div className="border-t border-zinc-200 bg-zinc-50 px-4 sm:px-6 py-1.5">
          <div className="mx-auto max-w-[1200px] flex items-center justify-between gap-3 text-[12px] text-zinc-700">
            <div className="flex items-center gap-2 min-w-0">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 shrink-0" aria-hidden="true" />
              <span className="truncate">
                Demo mode — sample numbers are shown and actions reset cleanly whenever needed.
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  onResetDemoState();
                }}
                className="font-medium text-indigo-600 hover:text-indigo-700 underline underline-offset-2"
              >
                Reset demo data
              </button>
              <button
                type="button"
                onClick={() => setBannerDismissed(true)}
                aria-label="Dismiss demo mode notice"
                className="p-0.5 text-zinc-600 hover:text-zinc-950 rounded-[6px]"
              >
                <AppIcon icon={Cancel01Icon} size="xs" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Nav Drawer */}
      {mobileOpen && (
        <nav aria-label="Mobile" className="border-t border-zinc-200 bg-white px-5 py-3 md:hidden">
          <div className="flex flex-col space-y-1 text-[14px]">
            <button
              type="button"
              onClick={() => go("overview")}
              className={`rounded-[6px] px-3 py-2 text-left font-medium ${
                activeTab === "overview" ? "bg-zinc-100 text-zinc-950" : "text-zinc-700"
              }`}
            >
              Overview
            </button>
            <p className="pt-2 pb-1 px-3 text-[12px] font-medium text-zinc-600">Tools</p>
            {ENGINE_ITEMS.map((item) => {
              const selected = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => go(item.id)}
                  className={`rounded-[6px] px-3 py-2 text-left font-medium flex items-center gap-2.5 ${
                    selected ? "bg-indigo-50/70 text-zinc-950 border-l-2 border-l-indigo-600" : "text-zinc-700"
                  }`}
                >
                  <AppIcon
                    icon={item.icon}
                    size="sm"
                    className={selected ? "text-indigo-600" : "text-zinc-600"}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
            <div className="pt-2 border-t border-zinc-100 flex flex-col gap-1">
              <Link href="/about" onClick={() => setMobileOpen(false)} className="rounded-[6px] px-3 py-2 text-zinc-700">
                About
              </Link>
              <Link href="/contact" onClick={() => setMobileOpen(false)} className="rounded-[6px] px-3 py-2 text-zinc-700">
                Contact
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  onResetDemoState();
                }}
                className="rounded-[6px] px-3 py-2 text-left text-zinc-700 hover:bg-zinc-50 flex items-center gap-2"
              >
                <AppIcon icon={Undo02Icon} size="sm" className="text-zinc-600" />
                <span>Reset demo data</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  onPlayVoiceBriefing();
                }}
                className="rounded-[6px] px-3 py-2 text-left text-zinc-700 hover:bg-zinc-50 flex items-center gap-2"
              >
                <AppIcon icon={VolumeHighIcon} size="sm" className="text-zinc-600" />
                <span>{voiceLoading ? "Preparing audio summary..." : "Play audio summary"}</span>
              </button>
            </div>
          </div>
        </nav>
      )}

      {/* Sandbox Credentials Drawer (explicitly opened from Workspace menu) */}
      {showSandboxKeys && (
        <div className="border-t border-zinc-200 bg-white">
          <div className="mx-auto max-w-[1200px] px-4 sm:px-6 py-4 flex flex-wrap items-end justify-between gap-4">
            <form onSubmit={handleSaveCredentialsSubmit} className="flex flex-wrap items-end gap-3">
              <div>
                <label htmlFor="header-sandbox-id" className="block text-[12px] font-medium text-zinc-700 mb-1">
                  PayPal client ID
                </label>
                <input
                  id="header-sandbox-id"
                  type="text"
                  value={sandboxClientId}
                  onChange={(e) => setSandboxClientId(e.target.value)}
                  placeholder="Enter client ID"
                  className="h-9 w-48 rounded-[6px] border border-zinc-200 bg-white px-2.5 text-[13px] placeholder:text-zinc-500"
                />
              </div>
              <div>
                <label htmlFor="header-sandbox-secret" className="block text-[12px] font-medium text-zinc-700 mb-1">
                  PayPal secret
                </label>
                <input
                  id="header-sandbox-secret"
                  type="password"
                  value={sandboxClientSecret}
                  onChange={(e) => setSandboxClientSecret(e.target.value)}
                  placeholder="Enter secret"
                  className="h-9 w-40 rounded-[6px] border border-zinc-200 bg-white px-2.5 text-[13px] placeholder:text-zinc-500"
                />
              </div>
              <button
                type="submit"
                disabled={savingCreds || !sandboxClientId.trim() || !sandboxClientSecret.trim()}
                className="h-9 rounded-[6px] bg-zinc-950 hover:bg-zinc-800 px-3.5 text-[13px] font-medium text-white disabled:opacity-50"
              >
                {savingCreds ? "Connecting..." : "Connect"}
              </button>
              <button
                type="button"
                onClick={() => setShowSandboxKeys(false)}
                className="h-9 rounded-[6px] border border-zinc-200 bg-white hover:bg-zinc-50 px-3 text-[13px] font-medium text-zinc-700"
              >
                Cancel
              </button>
            </form>
            {sandboxAccounts?.merchantEmail && (
              <p className="text-[12px] text-zinc-600">
                Sandbox account: <span className="font-mono text-zinc-900">{sandboxAccounts.merchantEmail}</span>
              </p>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
