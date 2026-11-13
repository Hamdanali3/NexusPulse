"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowDown01Icon,
  Cancel01Icon,
  Copy01Icon,
  Key01Icon,
  LayoutTable01Icon,
  Logout01Icon,
  Menu01Icon,
  SecurityLockIcon,
  SlidersHorizontalIcon,
  Tag01Icon,
  TaskDone01Icon,
  Tick02Icon,
  Undo02Icon,
  User02Icon,
  VolumeHighIcon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import type { PayPalExecutionMode, PayPalSandboxAccountConfig } from "@/lib/paypal/paypal-types";
import { DEMO_EVALUATOR_ACCOUNTS, type UserProfile, type UserRole } from "@/lib/auth/auth-types";
import { formatUsd } from "@/lib/format";
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
  onSwitchUser?: (user: UserProfile) => void;
  onSignOut?: () => void;
  onSwitchMode: (mode: "auto" | "live" | "sandbox" | "mirror") => void;
  onSaveRuntimeCredentials: (clientId: string, clientSecret: string) => Promise<void>;
  onPlayVoiceBriefing: () => void;
  onResetDemoState: () => void;
}

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Reviewer",
  CONSUMER: "Buyer",
  ORACLE_WORKER: "Verifier",
  ENTERPRISE_AGENT: "Enterprise",
};

function getUserInitials(fullName: string): string {
  return (
    fullName
      .trim()
      .split(/\s+/)
      .map((part) => part[0] || "")
      .join("")
      .slice(0, 2)
      .toUpperCase() || "NP"
  );
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
  onSwitchUser,
  onSignOut,
  onSwitchMode,
  onSaveRuntimeCredentials,
  onPlayVoiceBriefing,
  onResetDemoState,
}: NexusHeaderProps) {
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [copiedPayPal, setCopiedPayPal] = useState(false);
  const [switchingDemoKey, setSwitchingDemoKey] = useState<string | null>(null);
  const [showSandboxKeys, setShowSandboxKeys] = useState(false);
  const [showEngines, setShowEngines] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [sandboxClientId, setSandboxClientId] = useState("");
  const [sandboxClientSecret, setSandboxClientSecret] = useState("");
  const [savingCreds, setSavingCreds] = useState(false);

  const enginesRef = useRef<HTMLDivElement | null>(null);
  const toolsRef = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);

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
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setShowEngines(false);
        setShowToolsMenu(false);
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  async function handleQuickSwitchDemo(demoKey: string) {
    if (!onSwitchUser || switchingDemoKey) return;
    setSwitchingDemoKey(demoKey);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demoKey }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        onSwitchUser(data.user);
        setShowProfileMenu(false);
      }
    } finally {
      setSwitchingDemoKey(null);
    }
  }

  function handleCopyPayPalEmail(email: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(email);
      setCopiedPayPal(true);
      window.setTimeout(() => setCopiedPayPal(false), 1600);
    }
  }

  function go(tab: WorkspaceTabId) {
    setShowEngines(false);
    setShowToolsMenu(false);
    setShowProfileMenu(false);
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
                onClick={() => {
                  setShowToolsMenu(false);
                  setShowProfileMenu(false);
                  setShowEngines((s) => !s);
                }}
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
              onClick={() => {
                setShowEngines(false);
                setShowProfileMenu(false);
                setShowToolsMenu((s) => !s);
              }}
              aria-expanded={showToolsMenu}
              aria-haspopup="menu"
              className="hidden sm:inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-zinc-200 bg-white hover:bg-zinc-50 px-2.5 text-[13px] font-medium text-zinc-700 transition-colors duration-150"
            >
              <AppIcon icon={SlidersHorizontalIcon} size="xs" className="text-zinc-600" />
              <span>Workspace</span>
              <AppIcon
                icon={ArrowDown01Icon}
                size="xs"
                className={`text-zinc-500 transition-transform duration-150 ${showToolsMenu ? "rotate-180" : ""}`}
              />
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

          <span className="hidden sm:block h-4 w-px bg-zinc-200 mx-0.5" aria-hidden="true" />

          {currentUser ? (
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => {
                  setShowEngines(false);
                  setShowToolsMenu(false);
                  setShowProfileMenu((s) => !s);
                }}
                aria-expanded={showProfileMenu}
                aria-haspopup="menu"
                aria-label={`Account menu for ${currentUser.fullName}`}
                title={`${currentUser.fullName} — ${ROLE_LABELS[currentUser.role]}`}
                className={`group inline-flex h-8 items-center gap-2 rounded-full pl-0.5 pr-2 text-[13px] font-medium transition-colors duration-150 ${
                  showProfileMenu
                    ? "bg-zinc-100 text-zinc-950"
                    : "text-zinc-800 hover:bg-zinc-100/90 hover:text-zinc-950"
                }`}
              >
                <span className="relative inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[11px] font-semibold tracking-tight text-[#4a3be8] ring-1 ring-inset ring-indigo-200/90 group-hover:ring-indigo-300 transition-all duration-150">
                  {getUserInitials(currentUser.fullName)}
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-600 ring-2 ring-white"
                  />
                </span>
                <span className="hidden sm:inline truncate max-w-[96px]">
                  {currentUser.fullName.split(" ")[0]}
                </span>
                <AppIcon
                  icon={ArrowDown01Icon}
                  size={13}
                  className={`text-zinc-500 transition-transform duration-150 ${
                    showProfileMenu ? "rotate-180 text-zinc-800" : ""
                  }`}
                />
              </button>

              {showProfileMenu && (
                <div
                  role="menu"
                  aria-label="Account options"
                  className="animate-slide-up absolute right-0 mt-2 w-72 sm:w-80 rounded-[12px] border border-zinc-200 bg-white shadow-[0_8px_24px_-4px_rgb(9_9_11/0.08),0_2px_6px_-1px_rgb(9_9_11/0.04)] overflow-hidden z-50"
                >
                  {/* Profile identity */}
                  <div className="p-3.5 bg-[#fafafa] border-b border-zinc-100 space-y-2.5">
                    <div className="flex items-center gap-3">
                      <span className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[12px] font-semibold tracking-tight text-[#4a3be8] ring-1 ring-inset ring-indigo-200">
                        {getUserInitials(currentUser.fullName)}
                        <span
                          aria-hidden="true"
                          className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-600 ring-2 ring-white"
                        />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[13px] font-semibold text-zinc-950 truncate">
                            {currentUser.fullName}
                          </span>
                          <span className="text-[11px] font-medium text-[#4a3be8] shrink-0">
                            {ROLE_LABELS[currentUser.role]}
                          </span>
                        </div>
                        <p className="text-[12px] text-zinc-600 truncate">
                          {currentUser.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 rounded-[6px] border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px]">
                      <span className="font-mono text-zinc-600 truncate">
                        {currentUser.paypalEmail}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyPayPalEmail(currentUser.paypalEmail)}
                        className="inline-flex items-center gap-1 font-medium text-zinc-700 hover:text-zinc-950 shrink-0 transition-colors"
                        title="Copy PayPal account email"
                      >
                        {copiedPayPal ? (
                          <>
                            <AppIcon icon={Tick02Icon} size={12} className="text-emerald-700" />
                            <span className="text-emerald-700">Copied</span>
                          </>
                        ) : (
                          <>
                            <AppIcon icon={Copy01Icon} size={12} className="text-zinc-500" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Account balance & auto-spend limits */}
                  <div className="px-3.5 py-2.5 border-b border-zinc-100 grid grid-cols-2 gap-3">
                    <div>
                      <span className="block text-[11px] text-zinc-600">Wallet balance</span>
                      <span className="text-[13px] font-semibold text-zinc-950 tabular-nums">
                        {formatUsd(currentUser.walletBalanceUsd)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-zinc-600">Auto-spend limit</span>
                      <span className="text-[13px] font-semibold text-zinc-950 tabular-nums">
                        {formatUsd(currentUser.autoSpendLimitUsd)}
                      </span>
                    </div>
                  </div>

                  {/* Quick role switcher */}
                  {onSwitchUser && (
                    <div className="p-1.5 border-b border-zinc-100 space-y-0.5">
                      <div className="px-2.5 py-1 text-[11px] font-medium text-zinc-600">
                        Switch profile
                      </div>
                      {Object.entries(DEMO_EVALUATOR_ACCOUNTS).map(([demoKey, demo]) => {
                        const isActive = currentUser.email === demo.email;
                        const isBusy = switchingDemoKey === demoKey;
                        return (
                          <button
                            key={demoKey}
                            type="button"
                            role="menuitem"
                            disabled={Boolean(switchingDemoKey)}
                            onClick={() => handleQuickSwitchDemo(demoKey)}
                            className={`w-full flex items-center justify-between gap-2 rounded-[6px] px-2.5 py-1.5 text-left transition-colors duration-150 disabled:opacity-60 ${
                              isActive
                                ? "bg-indigo-50/70 text-zinc-950"
                                : "text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950"
                            }`}
                          >
                            <span className="flex items-center gap-2 min-w-0">
                              <span
                                className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
                                  isActive
                                    ? "bg-[#4a3be8] text-white"
                                    : "bg-zinc-100 text-zinc-700"
                                }`}
                              >
                                {getUserInitials(demo.fullName)}
                              </span>
                              <span className="min-w-0">
                                <span className="block text-[12px] font-medium truncate">
                                  {demo.fullName}
                                </span>
                                <span className="block text-[11px] text-zinc-600 truncate">
                                  {ROLE_LABELS[demo.role]}
                                </span>
                              </span>
                            </span>
                            {isBusy ? (
                              <span className="text-[11px] text-zinc-500">Switching...</span>
                            ) : isActive ? (
                              <AppIcon icon={Tick02Icon} size="xs" className="text-[#4a3be8]" />
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Footer account controls */}
                  <div className="p-1.5 space-y-0.5">
                    {onOpenAuthModal && (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setShowProfileMenu(false);
                          onOpenAuthModal();
                        }}
                        className="w-full flex items-center gap-2 rounded-[6px] px-2.5 py-1.5 text-left text-[13px] font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950 transition-colors"
                      >
                        <AppIcon icon={User02Icon} size="sm" className="text-zinc-600" />
                        <span>Account &amp; sign-in options</span>
                      </button>
                    )}

                    {onSignOut && (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setShowProfileMenu(false);
                          onSignOut();
                        }}
                        className="w-full flex items-center gap-2 rounded-[6px] px-2.5 py-1.5 text-left text-[13px] font-medium text-red-700 hover:bg-red-50 transition-colors"
                      >
                        <AppIcon icon={Logout01Icon} size="sm" className="text-red-700" />
                        <span>Sign out</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
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
