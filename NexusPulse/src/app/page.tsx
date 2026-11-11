"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Bot,
  Calendar,
  CheckCircle2,
  Clock,
  Info,
  KeyRound,
  Layers,
  Lock,
  Mail,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import type { NexusPulseState } from "@/lib/paypal/paypal-sandbox-mirror";
import type { PayPalExecutionMode } from "@/lib/paypal/paypal-types";
import NexusHeader, { type WorkspaceTabId } from "@/components/layout/NexusHeader";
import NexusFooter from "@/components/layout/NexusFooter";
import NexusPulseLogo from "@/components/brand/NexusPulseLogo";
import Channel3DealHunterPanel from "@/components/sponsors/Channel3DealHunterPanel";
import ProofOfHumanBountyBoard from "@/components/bounties/ProofOfHumanBountyBoard";
import BryntumEscrowTimeline from "@/components/sponsors/BryntumEscrowTimeline";
import AgGridFinancialCommandCenter from "@/components/sponsors/AgGridFinancialCommandCenter";
import NexusAiChatbot from "@/components/chat/NexusAiChatbot";
import EngineShowcase from "@/components/home/EngineShowcase";
import FeaturePageHeader from "@/components/layout/FeaturePageHeader";
import CfoExecutiveDocumentOutput from "@/components/ai/CfoExecutiveDocumentOutput";

// URL hash <-> workspace tab mapping so every feature has its own shareable "page"
// (e.g. /#deal-hunter) and the browser Back button works between features.
const TAB_TO_HASH: Record<WorkspaceTabId, string> = {
  overview: "",
  channel3: "deal-hunter",
  bounties: "human-bounties",
  bryntum: "escrow-gantt",
  aggrid: "telemetry",
};

function tabFromHashOrQuery(hash: string, search: string): WorkspaceTabId {
  try {
    const params = new URLSearchParams(search);
    const tabParam = params.get("tab") as WorkspaceTabId | null;
    if (
      tabParam &&
      ["overview", "channel3", "bounties", "bryntum", "aggrid"].includes(tabParam)
    ) {
      return tabParam;
    }
  } catch {
    // Ignore URLSearchParams errors
  }

  const clean = hash.replace(/^#/, "");
  const match = (Object.keys(TAB_TO_HASH) as WorkspaceTabId[]).find(
    (t) => TAB_TO_HASH[t] === clean && clean !== ""
  );
  if (match) return match;

  if (clean === "engine-channel3" || clean === "engine-1-heading") return "channel3";
  if (clean === "engine-bounties" || clean === "engine-2-heading") return "bounties";
  if (clean === "engine-bryntum") return "bryntum";
  if (clean === "aggrid-heading" || clean === "webhooks-security") return "aggrid";

  return "overview";
}

export default function NexusPulseHomePage() {
  const [appState, setAppState] = useState<NexusPulseState | null>(null);
  const [activeMode, setActiveMode] = useState<PayPalExecutionMode>("mirror");
  const [preferredMode, setPreferredMode] = useState<
    "auto" | "sandbox" | "mirror"
  >("auto");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<WorkspaceTabId>("overview");

  // Gemini Interactions API Console state (with multi-turn previousInteractionId continuity)
  const [agentPrompt, setAgentPrompt] = useState(
    "Perform a full Autonomous CFO & AGI Clearinghouse sweep: identify my highest-ROI PayPal subscription optimization, best Channel3 deal mandate, highest hourly Proof-of-Human Oracle bounty, and next A2A Smart Escrow milestone ready for capture."
  );
  const [agentMode, setAgentMode] = useState<"deep_cfo_audit" | "fast_agent">(
    "deep_cfo_audit"
  );
  const [agentRunning, setAgentRunning] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  const [agentResponse, setAgentResponse] = useState<{
    interactionId: string;
    previousInteractionId?: string;
    modelUsed: string;
    outputText: string;
    durationMs?: number;
    toolExecutions: Array<{
      toolName: string;
      args: Record<string, unknown>;
      resultSummary: string;
    }>;
  } | null>(null);

  // Voice Briefing state (Gemini 3.8 Flash TTS)
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string | null>(null);

  // Webhook Simulator state
  const [webhookSimulating, setWebhookSimulating] = useState(false);
  const [webhookResult, setWebhookResult] = useState<{
    verification_status: string;
    eventId: string;
    mode: string;
  } | null>(null);

  const [databaseSource, setDatabaseSource] = useState<string>("in_memory_mirror");

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch("/api/state", { cache: "no-store" });
      const data = await res.json();
      if (data.state) {
        setAppState(data.state);
        setActiveMode(data.activeMode ?? "mirror");
        setPreferredMode(data.preferredMode ?? "auto");
        setDatabaseSource(data.database || "in_memory_mirror");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  // Sync the active feature page with URL query/hash (deep links + Back/Forward).
  useEffect(() => {
    const syncFromUrl = () => {
      setActiveTab(tabFromHashOrQuery(window.location.hash, window.location.search));
      const hashId = window.location.hash.replace(/^#/, "");
      if (hashId) {
        requestAnimationFrame(() => {
          const el = document.getElementById(hashId);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
    };
    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    window.addEventListener("hashchange", syncFromUrl);
    return () => {
      window.removeEventListener("popstate", syncFromUrl);
      window.removeEventListener("hashchange", syncFromUrl);
    };
  }, []);

  /** Navigate to a feature page: switch view, update URL, and scroll to target section or top. */
  const navigateTo = useCallback((tab: WorkspaceTabId, sectionId?: string) => {
    setActiveTab(tab);
    const hash = sectionId || TAB_TO_HASH[tab];
    const url = `/?tab=${tab}${hash ? `#${hash}` : ""}`;
    window.history.pushState(null, "", url);
    requestAnimationFrame(() => {
      if (sectionId) {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }, []);

  async function handleSwitchMode(nextPref: "auto" | "sandbox" | "mirror") {
    setPreferredMode(nextPref);
    const res = await fetch("/api/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferredMode: nextPref }),
    });
    const data = await res.json();
    if (data.state) {
      setAppState(data.state);
      setActiveMode(data.activeMode ?? "mirror");
    }
  }

  async function handleSaveRuntimeCredentials(
    clientId: string,
    clientSecret: string
  ) {
    const res = await fetch("/api/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        clientSecret,
        preferredMode: "sandbox",
      }),
    });
    const data = await res.json();
    if (data.state) {
      setAppState(data.state);
      setActiveMode(data.activeMode ?? "sandbox");
      setPreferredMode("sandbox");
    }
  }

  async function handleRunAgentInteraction(
    customPrompt?: string,
    e?: React.FormEvent
  ) {
    if (e) e.preventDefault();
    const promptToUse = customPrompt ?? agentPrompt;
    if (customPrompt) {
      setAgentPrompt(customPrompt);
    }
    setAgentRunning(true);
    try {
      const res = await fetch("/api/ai/interact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptToUse,
          previousInteractionId: agentResponse?.interactionId,
          mode: agentMode,
        }),
      });
      const data = await res.json();
      if (data.interactionId) {
        setAgentResponse({
          interactionId: data.interactionId,
          previousInteractionId: data.previousInteractionId,
          modelUsed: data.modelUsed,
          outputText: data.outputText,
          durationMs: data.durationMs,
          toolExecutions: data.toolExecutions ?? [],
        });
        setTurnCount((c) => c + 1);
        if (data.state) {
          setAppState(data.state);
        }
      }
    } finally {
      setAgentRunning(false);
    }
  }

  async function handlePlayVoiceBriefing() {
    setVoiceLoading(true);
    try {
      const res = await fetch("/api/ai/voice-briefing", {
        method: "POST",
      });
      const data = await res.json();
      if (data.transcript) {
        setVoiceTranscript(data.transcript);
        if (data.audioBase64) {
          const audio = new Audio(
            `data:${data.mimeType || "audio/wav"};base64,${data.audioBase64}`
          );
          audio.play().catch(() => {});
        } else if (typeof window !== "undefined" && "speechSynthesis" in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(data.transcript);
          utterance.rate = 1.04;
          window.speechSynthesis.speak(utterance);
        }
      }
    } finally {
      setVoiceLoading(false);
    }
  }

  async function handleSimulateWebhook(eventType: string) {
    setWebhookSimulating(true);
    try {
      const res = await fetch("/api/paypal/webhooks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "paypal-transmission-id": `WH-TX-${Date.now()}`,
          "paypal-transmission-time": new Date().toISOString(),
          "paypal-transmission-sig": "SHA256withRSA-Verified-PayPal-Signature",
          "paypal-auth-algo": "SHA256withRSA",
          "paypal-cert-url":
            "https://api.sandbox.paypal.com/v1/notifications/certs/CERT-360caa42-fca2a594-1d93a270",
        },
        body: JSON.stringify({
          id: `WH-${Date.now()}`,
          event_type: eventType,
          resource: {
            id: "0VF52814937998046",
            amount: { currency_code: "USD", value: "279.00" },
          },
          summary: `Simulated ${eventType} verified via PayPal Webhook Signature Verifier`,
        }),
      });
      const data = await res.json();
      if (data.received) {
        setWebhookResult({
          verification_status: data.verification_status,
          eventId: data.eventId,
          mode: data.mode,
        });
        if (data.state) {
          setAppState(data.state);
        }
      }
    } finally {
      setWebhookSimulating(false);
    }
  }

  async function handleResetDemoState() {
    const res = await fetch("/api/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "RESET_STATE" }),
    });
    const data = await res.json();
    if (data.state) {
      setAppState(data.state);
      setAgentResponse(null);
      setTurnCount(0);
    }
  }

  if (loading || !appState) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center animate-fade-in"
      >
        <div className="mb-4 animate-bounce">
          <NexusPulseLogo size="lg" showTagline={false} />
        </div>
        <h1 className="text-base font-bold text-slate-900">
          Initializing NexusPulse Clearinghouse...
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Loading PayPal Dual-Mode Gateway, Channel3 Catalog, Bryntum Escrow Gantt, and AG Grid Ledger
        </p>
      </div>
    );
  }

  const annualSubSavings =
    appState.subscriptions.reduce(
      (sum, s) => sum + Number(s.potential_monthly_savings.value),
      0
    ) * 12;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 text-slate-900">
      {/* Accessibility Skip Link (modern-web-guidance: accessibility) */}
      <a href="#main-workspace" className="skip-link visually-hidden">
        Skip to main content
      </a>

      {/* MINIMALIST EXECUTIVE HEADER */}
      <NexusHeader
        activeTab={activeTab}
        onSelectTab={navigateTo}
        activeMode={activeMode}
        preferredMode={preferredMode}
        databaseSource={databaseSource}
        voiceLoading={voiceLoading}
        voiceTranscript={voiceTranscript}
        onSwitchMode={handleSwitchMode}
        onSaveRuntimeCredentials={handleSaveRuntimeCredentials}
        onPlayVoiceBriefing={handlePlayVoiceBriefing}
        onResetDemoState={handleResetDemoState}
      />

      {/* MAIN WORKSPACE */}
      <main
        id="main-workspace"
        className="flex-1 mx-auto w-full max-w-[1600px] px-4 sm:px-8 lg:px-12 pt-6 space-y-8"
      >
        {/* DEDICATED FEATURE PAGE HEADER (shown when a specific engine is selected) */}
        {activeTab !== "overview" && (
          <FeaturePageHeader tab={activeTab} onNavigate={navigateTo} />
        )}

        {/* HOMEPAGE-ONLY SECTIONS (hero, KPI ribbon, Gemini console) */}
        {activeTab === "overview" && (
        <>
        {/* WORLD-CLASS MINIMALIST HERO (WHITE BACKGROUND FINTECH PARADIGM — FULL WIDTH) */}
        <section
          aria-labelledby="product-hero-heading"
          className="relative text-center pt-6 pb-6 sm:pt-12 sm:pb-10 px-4 sm:px-8 max-w-6xl mx-auto w-full overflow-hidden"
        >
          {/* Subtle ambient light beam */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 -top-16 -z-10 h-80 bg-[radial-gradient(ellipse_75%_55%_at_50%_0%,rgba(14,165,233,0.12),transparent_70%)]"
          />

          {/* Cascade Item 1: Minimalist Micro-Badge */}
          <div className="animate-cascade-1 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3.5 py-1 text-xs font-semibold text-sky-800 shadow-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" />
            <span>Autonomous Financial Clearinghouse on PayPal</span>
          </div>

          {/* Cascade Item 2: High-Impact Confident Headline */}
          <h1
            id="product-hero-heading"
            className="animate-cascade-2 mt-5 text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-950 leading-[1.1] text-balance"
          >
            Autonomous Commerce, Oracle Bounties &amp; Programmable Escrow.
          </h1>

          {/* Cascade Item 3: Crisp, Balanced Subheadline */}
          <p className="animate-cascade-3 mt-4 text-sm sm:text-base lg:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed text-balance">
            Connecting Google Gemini with PayPal REST APIs &amp; JS SDK v6. Orchestrating autonomous deal-hunting, physical verification bounties, and zero-dispute milestone escrow.
          </p>

          {/* Cascade Item 4: Action CTAs */}
          <div className="animate-cascade-4 mt-7 flex flex-wrap items-center justify-center gap-3.5">
            <button
              type="button"
              onClick={() => handleRunAgentInteraction()}
              disabled={agentRunning}
              className="btn-primary inline-flex items-center gap-2 rounded-xl bg-slate-950 hover:bg-slate-800 px-6 py-3 text-xs font-bold text-white shadow-sm transition hover:scale-105 active:scale-95"
            >
              <Sparkles className="h-4 w-4 text-sky-400" />
              <span>{agentRunning ? "Running CFO Sweep..." : "Run AI CFO Sweep"}</span>
            </button>
            <button
              type="button"
              onClick={() => navigateTo("bounties")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-5 py-3 text-xs font-bold text-slate-800 shadow-xs transition hover:scale-105 active:scale-95"
            >
              <span>Explore Human Bounties</span>
              <ArrowRight className="h-4 w-4 text-slate-500" />
            </button>
          </div>

          {/* Cascade Items 5-7: Animated, looping 3-Engine Spotlight (one engine after another) */}
          <div className="animate-cascade-5">
            <EngineShowcase onOpenEngine={navigateTo} />
          </div>
        </section>

        {/* Cascade Item 8: INSTITUTIONAL FINANCIAL TELEMETRY RIBBON (FULL WIDTH) */}
        <section
          id="kpi-telemetry-ribbon"
          aria-label="Key Financial Performance Indicators"
          className="animate-cascade-8 rounded-2xl border border-slate-200 bg-white shadow-xs hover:shadow-md transition-all overflow-hidden w-full"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            <button
              type="button"
              onClick={() => navigateTo("channel3")}
              className="p-5 sm:p-6 text-left hover:bg-slate-50/80 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold group-hover:text-slate-800 transition-colors">
                  Annual AI Savings
                </span>
                <TrendingUp className="h-4 w-4 text-emerald-600 transition-transform group-hover:scale-110" />
              </div>
              <div className="mt-2 text-2xl lg:text-3xl font-extrabold text-slate-950 tabular-nums">
                ${(appState.totalSavedByAiUsd + annualSubSavings).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                ${appState.totalSavedByAiUsd.toFixed(2)} Realized + ${annualSubSavings.toFixed(0)}/yr Guard
              </div>
            </button>

            <button
              type="button"
              onClick={() => navigateTo("bounties")}
              className="p-5 sm:p-6 text-left hover:bg-slate-50/80 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold group-hover:text-slate-800 transition-colors">
                  Proof-of-Human Payouts
                </span>
                <UserCheck className="h-4 w-4 text-sky-600 transition-transform group-hover:scale-110" />
              </div>
              <div className="mt-2 text-2xl lg:text-3xl font-extrabold text-slate-950 tabular-nums">
                ${appState.totalEarnedFromBountiesUsd.toFixed(2)}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Gemini 3.8 Flash Verified • Instant Payouts v1
              </div>
            </button>

            <button
              type="button"
              onClick={() => navigateTo("bryntum")}
              className="p-5 sm:p-6 text-left hover:bg-slate-50/80 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold group-hover:text-slate-800 transition-colors">
                  Active Escrow Holds
                </span>
                <Lock className="h-4 w-4 text-indigo-600 transition-transform group-hover:scale-110" />
              </div>
              <div className="mt-2 text-2xl lg:text-3xl font-extrabold text-slate-950 tabular-nums">
                ${appState.totalEscrowProtectedUsd.toFixed(2)}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                PayPal Orders v2 AUTHORIZE Hold
              </div>
            </button>

            <button
              type="button"
              onClick={() => navigateTo("aggrid")}
              className="p-5 sm:p-6 text-left hover:bg-slate-50/80 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold group-hover:text-slate-800 transition-colors">
                  Protected Wallet
                </span>
                <ShieldCheck className="h-4 w-4 text-emerald-600 transition-transform group-hover:scale-110" />
              </div>
              <div className="mt-2 text-2xl lg:text-3xl font-extrabold text-slate-950 tabular-nums">
                ${appState.walletBalanceUsd.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Trackers v2 Proofs &amp; Idempotency Active
              </div>
            </button>
          </div>
        </section>

        {/* Cascade Item 9: INTERACTIVE AI CFO COMMAND BAR (MINIMALIST & CLEAN) */}
        <section
          aria-labelledby="gemini-console-heading"
          className="animate-cascade-9 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs hover:shadow-md transition-all w-full"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center">
                <Bot className="h-3.5 w-3.5 text-indigo-600" />
              </div>
              <h2 id="gemini-console-heading" className="text-xs font-bold text-slate-950">
                Autonomous AI CFO
              </h2>
              <span className="rounded-full bg-indigo-50 border border-indigo-200 px-2 py-0.5 font-mono text-[10px] text-indigo-700 font-semibold">
                gemini-4-argon
              </span>
              {turnCount > 0 && (
                <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 font-mono text-[10px] text-emerald-800 font-semibold">
                  Turn #{turnCount}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {agentResponse && (
                <button
                  type="button"
                  onClick={() => {
                    setAgentResponse(null);
                    setTurnCount(0);
                  }}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1 text-xs text-slate-700 font-medium shadow-xs transition"
                >
                  <RotateCcw className="h-3 w-3 text-slate-500" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          <form
            onSubmit={(e) => handleRunAgentInteraction(undefined, e)}
            className="mt-3.5 space-y-3"
          >
            <div className="flex flex-col md:flex-row gap-2">
              <label htmlFor="gemini-agent-prompt-input" className="visually-hidden">
                Ask your Autonomous CFO
              </label>
              <input
                id="gemini-agent-prompt-input"
                type="text"
                value={agentPrompt}
                onChange={(e) => setAgentPrompt(e.target.value)}
                className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-sky-500 shadow-xs"
                placeholder="Ask your Autonomous CFO to audit subscriptions, buy deals, or verify escrow..."
              />
              <button
                type="submit"
                disabled={agentRunning}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 hover:bg-slate-800 px-4 py-2 text-xs font-semibold text-white shadow-xs transition shrink-0"
              >
                <Sparkles className="h-3.5 w-3.5 text-sky-400" />
                {agentRunning ? "Running..." : "Run AI Sweep"}
              </button>
            </div>

            {/* Quick Action Chips */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs pt-0.5">
              <span className="text-slate-400 text-[11px] mr-1">Quick:</span>
              {[
                { label: "Audit Subscriptions", prompt: "Optimize my unused PayPal subscription and downgrade idle GPU plan to save money" },
                { label: "Best Deal", prompt: "Buy the NVIDIA Jetson Orin Nano deal on Channel3 via PayPal Order v2" },
                { label: "Top Bounties", prompt: "Rank open Proof-of-Human Oracle bounties by hourly PayPal Payout yield" },
                { label: "Verify Escrow", prompt: "Audit A2A Smart Escrow milestones and Dispute Shield tracking status" },
              ].map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => handleRunAgentInteraction(chip.prompt)}
                  className="rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 px-2.5 py-1 text-[11px] text-slate-700 hover:text-slate-950 transition font-medium shadow-2xs"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </form>

          {/* Autonomous AI CFO Formatted Document Output */}
          {agentResponse && (
            <CfoExecutiveDocumentOutput
              response={agentResponse}
              onNavigate={navigateTo}
            />
          )}
        </section>
        </>
        )}

        {/* MOBILE / TABLET WORKSPACE TABS (modern-web-guidance: tabs) */}
        <div
          role="tablist"
          aria-label="NexusPulse Financial Engines and Sponsor Workspaces"
          className="flex lg:hidden flex-wrap items-center gap-2 border-b border-slate-200 pb-3"
        >
          {[
            {
              id: "overview",
              label: "All Engines",
              icon: Layers,
            },
            {
              id: "channel3",
              label: "Engine 1: Channel3",
              icon: ShoppingBag,
            },
            {
              id: "bounties",
              label: "Engine 2: Bounties",
              icon: UserCheck,
            },
            {
              id: "bryntum",
              label: "Engine 3: Escrow",
              icon: Calendar,
            },
            {
              id: "aggrid",
              label: "AG Grid Ledger",
              icon: Activity,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => navigateTo(tab.id as WorkspaceTabId)}
                className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition shadow-xs ${
                  active
                    ? "bg-slate-950 text-white shadow-sm"
                    : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 hover:text-slate-950"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
          <Link
            href="/about"
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition shadow-xs bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 hover:text-slate-950"
          >
            <Info className="h-3.5 w-3.5 text-sky-600" />
            <span>About</span>
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition shadow-xs bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 hover:text-slate-950"
          >
            <Mail className="h-3.5 w-3.5 text-indigo-600" />
            <span>Contact</span>
          </Link>
        </div>

        {/* OVERVIEW TAB: 3-ENGINE EXECUTIVE BENTO GRID (MINIMALIST & VISUAL) */}
        {activeTab === "overview" && (
          <section
            aria-label="NexusPulse 3-Engine Clearinghouse Hub"
            className="space-y-6 pt-2"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight">
                  Autonomous Engines
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Three automated financial protocols connecting Gemini AI with PayPal.
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  All 3 Engines Live &amp; Operational
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Engine 01 Bento Card */}
              <div
                id="engine-channel3"
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 border border-sky-200 px-2.5 py-0.5 text-xs font-semibold text-sky-800">
                      <ShoppingBag className="h-3.5 w-3.5 text-sky-600" />
                      Engine 01 · Deal Hunter
                    </span>
                    <span className="text-xs font-mono font-bold text-sky-700">100M+ SKUs</span>
                  </div>

                  <h3 className="mt-3.5 text-lg font-bold text-slate-950">
                    Deal &amp; Subscription Guard
                  </h3>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                    Automated price drop monitoring with instant PayPal v6 checkout and idle SaaS downgrades.
                  </p>

                  {/* Visual Deal Previews */}
                  <div className="mt-4 space-y-2.5">
                    {appState.channel3Deals.slice(0, 2).map((deal) => (
                      <div
                        key={deal.id}
                        className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 flex items-center justify-between text-xs"
                      >
                        <div className="truncate pr-3">
                          <div className="font-semibold text-slate-900 truncate">
                            {deal.title}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Retail: ${deal.retail_price.toFixed(2)}
                          </div>
                        </div>
                        <div className="text-right shrink-0 tabular-nums">
                          <div className="font-extrabold text-emerald-600">
                            ${deal.channel3_best_price.toFixed(2)}
                          </div>
                          <span className="inline-block mt-0.5 rounded bg-emerald-100/90 text-emerald-800 text-[10px] font-bold px-1.5 py-0.2">
                            Save {deal.savings_percent}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigateTo("channel3")}
                  className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 py-2.5 text-xs font-bold text-white transition hover:scale-[1.01] active:scale-[0.99] shadow-xs"
                >
                  <span>Open Deal Hunter</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </button>
              </div>

              {/* Engine 02 Bento Card */}
              <div
                id="engine-bounties"
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                      <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                      Engine 02 · Human Oracle
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-700">Instant Payouts</span>
                  </div>

                  <h3 className="mt-3.5 text-lg font-bold text-slate-950">
                    60-Second Bounties
                  </h3>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                    Physical verification tasks audited by Gemini AI with immediate PayPal disbursements.
                  </p>

                  {/* Visual Bounty Previews */}
                  <div className="mt-4 space-y-2.5">
                    {appState.bounties.slice(0, 2).map((b) => (
                      <div
                        key={b.id}
                        className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 flex items-center justify-between text-xs"
                      >
                        <div className="truncate pr-3">
                          <div className="font-semibold text-slate-900 truncate">
                            {b.title}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            ~{b.estimated_seconds}s verification
                          </div>
                        </div>
                        <div className="text-right shrink-0 tabular-nums">
                          <div className="font-extrabold text-emerald-600">
                            +${b.reward.value}
                          </div>
                          <span className="inline-block mt-0.5 rounded bg-sky-100/90 text-sky-800 text-[10px] font-bold px-1.5 py-0.2">
                            PayPal Payout
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigateTo("bounties")}
                  className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 py-2.5 text-xs font-bold text-white transition hover:scale-[1.01] active:scale-[0.99] shadow-xs"
                >
                  <span>Explore Bounties</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </button>
              </div>

              {/* Engine 03 Bento Card */}
              <div
                id="engine-bryntum"
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-xs font-semibold text-indigo-800">
                      <Lock className="h-3.5 w-3.5 text-indigo-600" />
                      Engine 03 · Smart Escrow
                    </span>
                    <span className="text-xs font-mono font-bold text-indigo-700">Dispute Shield</span>
                  </div>

                  <h3 className="mt-3.5 text-lg font-bold text-slate-950">
                    Bryntum Escrow Gantt
                  </h3>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                    PayPal authorization holds released on deliverable proof with shipment tracking dispute shield.
                  </p>

                  {/* Visual Escrow Previews */}
                  <div className="mt-4 space-y-2.5">
                    {appState.escrowMilestones.slice(0, 2).map((m) => (
                      <div
                        key={m.id}
                        className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 flex items-center justify-between text-xs"
                      >
                        <div className="truncate pr-3">
                          <div className="font-semibold text-slate-900 truncate">
                            {m.project_name}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Progress: {m.progress_percent}%
                          </div>
                        </div>
                        <div className="text-right shrink-0 tabular-nums">
                          <div className="font-extrabold text-slate-900">
                            ${m.amount.value}
                          </div>
                          <span
                            className={`inline-block mt-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              m.status === "AI_VERIFIED_CAPTURED"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-900"
                            }`}
                          >
                            {m.status === "AI_VERIFIED_CAPTURED" ? "Captured" : "Auth Locked"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigateTo("bryntum")}
                  className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 py-2.5 text-xs font-bold text-white transition hover:scale-[1.01] active:scale-[0.99] shadow-xs"
                >
                  <span>View Escrow Gantt</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          </section>
        )}

        {/* DEDICATED ENGINE 1 TAB */}
        {activeTab === "channel3" && (
          <div id="engine-channel3-workspace" className="nexus-fade-in">
            <Channel3DealHunterPanel
              deals={appState.channel3Deals}
              activeMode={activeMode}
              onStateUpdated={fetchState}
            />
          </div>
        )}

        {/* DEDICATED ENGINE 2 TAB */}
        {activeTab === "bounties" && (
          <div id="engine-bounties-workspace" className="nexus-fade-in">
            <ProofOfHumanBountyBoard
              bounties={appState.bounties}
              payouts={appState.payouts}
              onStateUpdated={fetchState}
            />
          </div>
        )}

        {/* DEDICATED ENGINE 3 TAB */}
        {activeTab === "bryntum" && (
          <div id="engine-bryntum-workspace" className="nexus-fade-in">
            <BryntumEscrowTimeline
              milestones={appState.escrowMilestones}
              subscriptions={appState.subscriptions}
              onStateUpdated={fetchState}
            />
          </div>
        )}

        {/* DEDICATED AG GRID TELEMETRY TAB */}
        {activeTab === "aggrid" && (
          <div id="aggrid-heading" className="nexus-fade-in space-y-6">
            <AgGridFinancialCommandCenter
              state={appState}
              onAskGeminiAboutLedger={(prompt) => {
                handleRunAgentInteraction(prompt);
              }}
            />

            {/* PAYPAL WEBHOOKS V1 SIGNATURE VERIFIER & APIMATIC SDK INSPECTOR */}
            <div id="webhooks-security" className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition-all space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      PayPal Webhooks v1 Security
                    </span>
                    <h3 className="mt-1 text-base font-bold text-slate-900">
                      Webhook Signature Verifier
                    </h3>
                    <p className="text-xs text-slate-600">
                      Simulate and verify live PayPal events with SHA256withRSA signature validation.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    "PAYMENT.CAPTURE.COMPLETED",
                    "PAYMENT.PAYOUTS-ITEM.SUCCEEDED",
                    "CUSTOMER.DISPUTE.CREATED",
                    "BILLING.SUBSCRIPTION.UPDATED",
                  ].map((evt) => (
                    <button
                      key={evt}
                      type="button"
                      disabled={webhookSimulating}
                      onClick={() => handleSimulateWebhook(evt)}
                      className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-indigo-400 hover:shadow-xs px-3 py-1.5 font-mono text-xs text-slate-800 font-medium transition active:scale-95"
                    >
                      Simulate {evt}
                    </button>
                  ))}
                </div>

                {webhookResult && (
                  <div
                    role="status"
                    aria-live="polite"
                    className="nexus-fade-in rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-mono">
                      <span className="font-bold text-emerald-900">
                        Signature Verification: {webhookResult.verification_status}
                      </span>
                      <span className="text-slate-600">
                        Event ID: {webhookResult.eventId}
                      </span>
                    </div>
                    <p className="text-slate-700 text-xs">
                      Deduplicated &amp; logged to Webhook Event Ledger (Mode:{" "}
                      <strong className="text-slate-900">{webhookResult.mode.toUpperCase()}</strong>).
                    </p>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition-all space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-xs font-semibold text-indigo-800">
                      <KeyRound className="h-3.5 w-3.5 text-indigo-600" />
                      Sponsor: APIMatic SDK + Dual-Mode Gateway Architecture
                    </span>
                    <h3 className="mt-1 text-base font-bold text-slate-900">
                      APIMatic Architecture &amp; Dual-Mode Gateway
                    </h3>
                  </div>
                </div>

                <ul className="space-y-2 text-xs text-slate-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-slate-900">APIMatic Strongly-Typed SDK:</strong> Powered by <code className="text-indigo-700 font-mono text-[11px]">@paypal/paypal-server-sdk v2.5.0</code> with automatic OAuth2 token caching and idempotency headers.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-slate-900">Dual-Mode Execution:</strong> Instant zero-blocker evaluations via deterministic mirror, with seamless hot-swap to live PayPal Sandbox.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-slate-900">Cloud Blueprint:</strong> Production <code className="text-indigo-700 font-mono text-[11px]">render.yaml</code> blueprint with autonomous hourly background sweeps.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MINIMALIST ARCHITECTURAL FOOTER */}
      <NexusFooter
        activeMode={activeMode}
        databaseSource={databaseSource}
        onSelectTab={navigateTo}
      />

      {/* NEXUSPULSE AI ASSISTANT */}
      <NexusAiChatbot
        appState={appState}
        onSelectTab={navigateTo}
      />
    </div>
  );
}
