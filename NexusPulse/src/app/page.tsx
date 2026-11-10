"use client";

import React, { useCallback, useEffect, useState } from "react";
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
        className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center"
      >
        <div className="mb-4">
          <NexusPulseLogo size="lg" showTagline={false} />
        </div>
        <h1 className="text-base font-bold text-white">
          Initializing NexusPulse Clearinghouse...
        </h1>
        <p className="mt-1 text-xs text-slate-400">
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
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Accessibility Skip Link (modern-web-guidance: accessibility) */}
      <a href="#main-workspace" className="skip-link visually-hidden">
        Skip to main content
      </a>

      {/* MINIMALIST EXECUTIVE HEADER */}
      <NexusHeader
        activeTab={activeTab}
        onSelectTab={setActiveTab}
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
        className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 pt-8 space-y-8"
      >
        {/* MINIMALIST EXECUTIVE PRODUCT HERO & 3-ENGINE FLOW */}
        <section
          aria-labelledby="product-hero-heading"
          className="nexus-fade-in rounded-3xl border border-slate-800/80 bg-slate-900/45 p-6 sm:p-8 shadow-2xl backdrop-blur-md"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-6 border-b border-slate-800/70">
            <div className="space-y-2.5 max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/25 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-300">
                <Sparkles className="h-3.5 w-3.5" />
                Autonomous Personal AI CFO • Human-Oracle Clearinghouse • Smart Escrow
              </div>
              <h1
                id="product-hero-heading"
                style={{ fontSize: "var(--font-fluid-hero)" }}
                className="font-extrabold tracking-tight text-white"
              >
                Automate Your Savings, Human-Oracle Earnings &amp; Smart Escrow on PayPal
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Built for consumers, independent builders, and autonomous AI teams.{" "}
                <strong className="text-white">NexusPulse</strong> connects Google Gemini 4 Argon &amp; 3.8 Flash with PayPal&apos;s REST APIs and JS SDK v6 across three minimalist, closed-loop financial engines:
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => handleRunAgentInteraction()}
                disabled={agentRunning}
                className="inline-flex items-center gap-2 rounded-full bg-white hover:bg-slate-100 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-lg transition"
              >
                <Sparkles className="h-4 w-4 text-indigo-600" />
                {agentRunning ? "Running CFO Sweep..." : "Run 1-Click AI CFO Sweep"}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("bounties")}
                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/35 bg-emerald-500/10 hover:bg-emerald-500/20 px-4 py-2.5 text-xs font-semibold text-emerald-200 transition"
              >
                <span>Claim Human Bounties</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* 3 Minimalist Interactive Engine Cards */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              role="button"
              tabIndex={0}
              onClick={() => setActiveTab("channel3")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setActiveTab("channel3");
                }
              }}
              className="interactive-card group rounded-2xl border border-slate-800/90 bg-slate-950/60 hover:border-fuchsia-500/40 p-4 flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-fuchsia-300">
                  <span>01 / SAVE — Deal &amp; Subscription Guard</span>
                  <ShoppingBag className="h-4 w-4 text-fuchsia-400 transition-transform group-hover:scale-110" />
                </div>
                <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                  Scans Channel3&apos;s 100M+ SKU catalog against your target price mandate and auto-downgrades idle PayPal subscriptions (<code className="text-slate-200">/v1/billing/subscriptions</code>).
                </p>
              </div>
              <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-fuchsia-300 group-hover:text-white">
                <span>Explore Channel3 &amp; PayPal v6</span>
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
              </div>
            </div>

            <div
              role="button"
              tabIndex={0}
              onClick={() => setActiveTab("bounties")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setActiveTab("bounties");
                }
              }}
              className="interactive-card group rounded-2xl border border-slate-800/90 bg-slate-950/60 hover:border-emerald-500/40 p-4 flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-emerald-300">
                  <span>02 / EARN — Proof-of-Human Oracles</span>
                  <UserCheck className="h-4 w-4 text-emerald-400 transition-transform group-hover:scale-110" />
                </div>
                <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                  AI agents post 30–60s micro-bounties for physical-world verification and compliance rulings. Gemini 3.8 Flash verifies and triggers instant PayPal Payouts (<code className="text-slate-200">/v1/payments/payouts</code>).
                </p>
              </div>
              <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-300 group-hover:text-white">
                <span>Open Human Bounty Board</span>
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
              </div>
            </div>

            <div
              role="button"
              tabIndex={0}
              onClick={() => setActiveTab("bryntum")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setActiveTab("bryntum");
                }
              }}
              className="interactive-card group rounded-2xl border border-slate-800/90 bg-slate-950/60 hover:border-indigo-500/40 p-4 flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-indigo-300">
                  <span>03 / PROTECT — Zero-Dispute Escrow</span>
                  <Lock className="h-4 w-4 text-indigo-400 transition-transform group-hover:scale-110" />
                </div>
                <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                  Locks B2B/freelance funds in PayPal Orders v2 <code className="text-slate-200">AUTHORIZE</code> holds on a Bryntum Gantt timeline and attaches DHL tracking proofs before capture.
                </p>
              </div>
              <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-indigo-300 group-hover:text-white">
                <span>Inspect Bryntum Escrow Gantt</span>
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </div>

          {/* Progressive Disclosure Deep-Dive (modern-web-guidance: content-first-noise-reduction) */}
          <details className="mt-4 rounded-2xl border border-slate-800/70 bg-slate-950/40 px-4 py-2.5 text-xs text-slate-300">
            <summary className="flex items-center gap-2 font-semibold text-slate-300 hover:text-white cursor-pointer select-none">
              <Info className="h-3.5 w-3.5 text-sky-400" />
              <span>
                View Full 7-Sponsor Technical Architecture &amp; Dual-Mode Sandbox Verification Matrix
              </span>
            </summary>
            <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-300">
              <div>
                <strong className="text-white">PayPal &amp; APIMatic Stack:</strong>{" "}
                Uses <code className="text-indigo-300">@paypal/paypal-server-sdk v2.5.0</code> (Orders v2, Capture/Authorize, Subscriptions v1, Payouts v1, Invoicing v2, Trackers v2, Webhooks v1, JS SDK v6, and PayPal Sandbox MCP Server).
              </div>
              <div>
                <strong className="text-white">Enterprise Telemetry &amp; Persistence:</strong>{" "}
                AG Grid v36.3.0 multi-endpoint ledger, Bryntum Milestone Gantt, Channel3 100M+ SKU Catalog API, Google Gemini Interactions API (<code className="text-indigo-300">@google/genai v3.0.0</code>), Supabase PostgreSQL, and Render Cloud Blueprint.
              </div>
            </div>
          </details>
        </section>

        {/* INTERACTIVE KPI TELEMETRY STRIP */}
        <section
          aria-label="Key Financial Performance Indicators"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <button
            type="button"
            onClick={() => setActiveTab("channel3")}
            className="kpi-card text-left rounded-2xl border border-slate-800/80 bg-slate-900/60 hover:border-emerald-500/40 p-4 shadow-lg tabular-nums"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">
                Engine 1: AI CFO &amp; Channel3 Savings
              </span>
              <span className="rounded-xl bg-emerald-500/15 p-2 text-emerald-400">
                <TrendingUp className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-2 text-2xl font-extrabold text-white">
              ${(appState.totalSavedByAiUsd + annualSubSavings).toLocaleString(
                "en-US",
                {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }
              )}
              <span className="text-xs font-normal text-emerald-400 ml-1">
                /yr impact
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              ${appState.totalSavedByAiUsd.toFixed(2)} Realized + $
              {annualSubSavings.toFixed(0)}/yr Subscription Guard
            </p>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("bounties")}
            className="kpi-card text-left rounded-2xl border border-slate-800/80 bg-slate-900/60 hover:border-sky-500/40 p-4 shadow-lg tabular-nums"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">
                Engine 2: Proof-of-Human Payouts
              </span>
              <span className="rounded-xl bg-sky-500/15 p-2 text-sky-400">
                <UserCheck className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-2 text-2xl font-extrabold text-white">
              ${appState.totalEarnedFromBountiesUsd.toFixed(2)}
              <span className="text-xs font-normal text-sky-400 ml-1.5">
                Instant Settled
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Verified by Gemini 3.8 Flash • Paid via PayPal Payouts v1
            </p>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("bryntum")}
            className="kpi-card text-left rounded-2xl border border-slate-800/80 bg-slate-900/60 hover:border-indigo-500/40 p-4 shadow-lg tabular-nums"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">
                Engine 3: Active A2A Auth Escrow
              </span>
              <span className="rounded-xl bg-indigo-500/15 p-2 text-indigo-400">
                <Lock className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-2 text-2xl font-extrabold text-white">
              ${appState.totalEscrowProtectedUsd.toFixed(2)}
              <span className="text-xs font-normal text-indigo-400 ml-1.5">
                AUTHORIZE Hold
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Bryntum Milestone Gantt + PayPal Orders v2 Auth &amp; Capture
            </p>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("aggrid")}
            className="kpi-card text-left rounded-2xl border border-slate-800/80 bg-slate-900/60 hover:border-amber-500/40 p-4 shadow-lg tabular-nums"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">
                PayPal Wallet Balance &amp; Dispute Shield
              </span>
              <span className="rounded-xl bg-amber-500/15 p-2 text-amber-400">
                <ShieldCheck className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-2 text-2xl font-extrabold text-white">
              ${appState.walletBalanceUsd.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              <span className="text-xs font-semibold text-emerald-400">
                (100% Protected)
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Auto-Trackers v2 + PayPal-Request-Id Idempotency
            </p>
          </button>
        </section>

        {/* INTERACTIVE GEMINI 4 ARGON / 3.8 FLASH AGENTIC CFO & MCP CONSOLE */}
        <section
          aria-labelledby="gemini-console-heading"
          className="rounded-3xl border border-indigo-500/25 bg-slate-900/55 p-6 shadow-xl backdrop-blur-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-indigo-500/15 border border-indigo-500/35 flex items-center justify-center">
                <Bot className="h-4 w-4 text-indigo-300" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 id="gemini-console-heading" className="text-sm font-bold text-white">
                    Google Gemini Interactions API — Autonomous CFO &amp; PayPal MCP Orchestrator
                  </h2>
                  <span className="rounded-full bg-indigo-500/15 border border-indigo-500/30 px-2.5 py-0.5 font-mono text-xs text-indigo-300">
                    client.interactions.create()
                  </span>
                  {turnCount > 0 && (
                    <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 font-mono text-xs text-emerald-300">
                      Turn #{turnCount} Stateful Thread
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  Powered by <code className="text-indigo-300">@google/genai v3.0.0</code> with stateful <code className="text-indigo-300">previous_interaction_id</code> and native PayPal tool bindings
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {agentResponse && (
                <button
                  type="button"
                  onClick={() => {
                    setAgentResponse(null);
                    setTurnCount(0);
                  }}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 px-3 py-1.5 text-xs text-slate-300"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>New Thread</span>
                </button>
              )}

              <label htmlFor="gemini-model-select" className="visually-hidden">
                Select Gemini Model
              </label>
              <select
                id="gemini-model-select"
                value={agentMode}
                onChange={(e) =>
                  setAgentMode(
                    e.target.value as "deep_cfo_audit" | "fast_agent"
                  )
                }
                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-indigo-300"
              >
                <option value="deep_cfo_audit">
                  gemini-4-argon (Frontier Agentic Reasoning)
                </option>
                <option value="fast_agent">
                  gemini-3.8-flash (High-Speed Multimodal)
                </option>
              </select>
            </div>
          </div>

          <form
            onSubmit={(e) => handleRunAgentInteraction(undefined, e)}
            className="mt-4 space-y-3"
          >
            <div className="flex flex-col md:flex-row gap-2.5">
              <label htmlFor="gemini-agent-prompt-input" className="visually-hidden">
                Ask your Autonomous CFO to execute PayPal actions
              </label>
              <input
                id="gemini-agent-prompt-input"
                type="text"
                value={agentPrompt}
                onChange={(e) => setAgentPrompt(e.target.value)}
                className="flex-1 rounded-xl border border-slate-700/90 bg-slate-950/90 px-4 py-2.5 text-xs text-white focus:border-indigo-500"
                placeholder="Ask your Autonomous CFO to optimize subscriptions, buy Channel3 deals, verify human bounties, or inspect escrow..."
              />
              <button
                type="submit"
                disabled={agentRunning}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/25 transition shrink-0"
              >
                <Sparkles className="h-4 w-4" />
                {agentRunning
                  ? "Running Gemini Interaction..."
                  : "Execute Autonomous CFO Sweep"}
              </button>
            </div>

            {/* Preset Prompt Pills (Balanced Layout) */}
            <div className="balanced-pills items-center text-xs">
              <span className="text-slate-400 mr-1">One-Click Agent Actions:</span>
              {[
                "Optimize my unused PayPal subscription and downgrade idle GPU plan to save money",
                "Buy the NVIDIA Jetson Orin Nano deal on Channel3 via PayPal Order v2",
                "Rank open Proof-of-Human Oracle bounties by hourly PayPal Payout yield",
                "Audit A2A Smart Escrow milestones and Dispute Shield tracking status",
              ].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleRunAgentInteraction(preset)}
                  className="rounded-full border border-slate-800 bg-slate-950/80 hover:border-indigo-500/50 px-3 py-1 text-slate-300 hover:text-white transition"
                >
                  {preset}
                </button>
              ))}
            </div>
          </form>

          {/* Gemini Interaction Output */}
          {agentResponse && (
            <div
              role="status"
              aria-live="polite"
              className="nexus-fade-in mt-4 rounded-2xl border border-indigo-500/30 bg-slate-950/90 p-4 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-indigo-300">
                    Interaction ID: <code>{agentResponse.interactionId}</code>
                  </span>
                  {agentResponse.previousInteractionId && (
                    <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-xs text-slate-300">
                      prev: {agentResponse.previousInteractionId.slice(0, 14)}...
                    </span>
                  )}
                  <span className="rounded bg-indigo-500/20 px-2 py-0.5 font-mono text-xs text-indigo-200">
                    {agentResponse.modelUsed}
                  </span>
                  {agentResponse.durationMs !== undefined && (
                    <span className="inline-flex items-center gap-1 text-xs text-slate-400 tabular-nums">
                      <Clock className="h-3 w-3" />
                      {agentResponse.durationMs}ms
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {agentResponse.toolExecutions.map((t, idx) => (
                    <span
                      key={idx}
                      className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 font-mono text-xs text-emerald-300"
                    >
                      Executed: {t.toolName}
                    </span>
                  ))}
                </div>
              </div>

              <div className="text-xs text-slate-200 whitespace-pre-line leading-relaxed">
                {agentResponse.outputText}
              </div>
            </div>
          )}
        </section>

        {/* MOBILE / TABLET WORKSPACE TABS (modern-web-guidance: tabs) */}
        <div
          role="tablist"
          aria-label="NexusPulse Financial Engines and Sponsor Workspaces"
          className="flex lg:hidden flex-wrap items-center gap-2 border-b border-slate-800 pb-3"
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
                onClick={() => setActiveTab(tab.id as WorkspaceTabId)}
                className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                  active
                    ? "bg-white text-slate-950 shadow"
                    : "bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB CONTENT */}
        {(activeTab === "overview" || activeTab === "channel3") && (
          <div className="nexus-fade-in">
            <Channel3DealHunterPanel
              deals={appState.channel3Deals}
              activeMode={activeMode}
              onStateUpdated={fetchState}
            />
          </div>
        )}

        {(activeTab === "overview" || activeTab === "bounties") && (
          <div className="nexus-fade-in">
            <ProofOfHumanBountyBoard
              bounties={appState.bounties}
              payouts={appState.payouts}
              onStateUpdated={fetchState}
            />
          </div>
        )}

        {(activeTab === "overview" || activeTab === "bryntum") && (
          <div className="nexus-fade-in">
            <BryntumEscrowTimeline
              milestones={appState.escrowMilestones}
              subscriptions={appState.subscriptions}
              onStateUpdated={fetchState}
            />
          </div>
        )}

        {(activeTab === "overview" || activeTab === "aggrid") && (
          <div className="nexus-fade-in space-y-6">
            <AgGridFinancialCommandCenter
              state={appState}
              onAskGeminiAboutLedger={(prompt) => {
                handleRunAgentInteraction(prompt);
              }}
            />

            {/* PAYPAL WEBHOOKS V1 SIGNATURE VERIFIER & APIMATIC SDK INSPECTOR */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      PayPal Webhooks v1 Security
                    </span>
                    <h3 className="mt-1 text-base font-bold text-white">
                      Cryptographic Webhook Signature Verifier &amp; Dispute Shield
                    </h3>
                    <p className="text-xs text-slate-400">
                      Verifies <code className="text-indigo-300">PAYPAL-TRANSMISSION-SIG</code> via{" "}
                      <code className="text-indigo-300">POST /v1/notifications/verify-webhook-signature</code>{" "}
                      using raw unparsed payload bytes before mutating state.
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
                      className="rounded-xl border border-slate-700 bg-slate-950 hover:border-indigo-500 px-3 py-1.5 font-mono text-xs text-slate-200 transition"
                    >
                      Simulate {evt}
                    </button>
                  ))}
                </div>

                {webhookResult && (
                  <div
                    role="status"
                    aria-live="polite"
                    className="nexus-fade-in rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-3.5 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-mono">
                      <span className="font-bold text-emerald-300">
                        Signature Verification: {webhookResult.verification_status}
                      </span>
                      <span className="text-slate-400">
                        Event ID: {webhookResult.eventId}
                      </span>
                    </div>
                    <p className="text-slate-300 text-xs">
                      Deduplicated &amp; logged to Webhook Event Ledger (Mode:{" "}
                      {webhookResult.mode.toUpperCase()}).
                    </p>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 px-2.5 py-0.5 text-xs font-semibold text-indigo-300">
                      <KeyRound className="h-3.5 w-3.5" />
                      Sponsor: APIMatic SDK + Dual-Mode Gateway Architecture
                    </span>
                    <h3 className="mt-1 text-base font-bold text-white">
                      Zero-Blocker Judge &amp; Global Developer Verification
                    </h3>
                  </div>
                </div>

                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>APIMatic Strongly-Typed Controllers:</strong> Uses{" "}
                      <code className="text-indigo-300">@paypal/paypal-server-sdk v2.5.0</code>{" "}
                      (<code className="text-slate-200">OrdersController</code>,{" "}
                      <code className="text-slate-200">PaymentsController</code>,{" "}
                      <code className="text-slate-200">SubscriptionsController</code>,{" "}
                      <code className="text-slate-200">TransactionSearchController</code>) with automatic OAuth2 token caching and{" "}
                      <code className="text-slate-200">PayPal-Request-Id</code> idempotency.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Dual-Mode Sandbox &amp; Mirror Parity:</strong> Works out-of-the-box in{" "}
                      <strong>Deterministic Sandbox Mirror Mode</strong> (solving regional SMS verification barriers) and switches automatically to{" "}
                      <strong>Live PayPal Sandbox</strong> whenever{" "}
                      <code className="text-indigo-300">PAYPAL_CLIENT_ID</code> &amp;{" "}
                      <code className="text-indigo-300">PAYPAL_CLIENT_SECRET</code> are configured.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Render Cloud Blueprint Ready:</strong> Includes production{" "}
                      <code className="text-indigo-300">render.yaml</code> with Web Service + Hourly Autonomous Cron Worker (
                      <code className="text-slate-200">scripts/autonomous-sweep.mjs</code>).
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
        onSelectTab={setActiveTab}
      />
    </div>
  );
}
