"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Activity,
  Bot,
  Calendar,
  CheckCircle2,
  KeyRound,
  Layers,
  Lock,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  UserCheck,
  Volume2,
  Zap,
} from "lucide-react";
import type { SovereignPulseState } from "@/lib/paypal/paypal-sandbox-mirror";
import type { PayPalExecutionMode } from "@/lib/paypal/paypal-types";
import Channel3DealHunterPanel from "@/components/sponsors/Channel3DealHunterPanel";
import ProofOfHumanBountyBoard from "@/components/bounties/ProofOfHumanBountyBoard";
import BryntumEscrowTimeline from "@/components/sponsors/BryntumEscrowTimeline";
import AgGridFinancialCommandCenter from "@/components/sponsors/AgGridFinancialCommandCenter";

export default function SovereignPulseHomePage() {
  const [appState, setAppState] = useState<SovereignPulseState | null>(null);
  const [activeMode, setActiveMode] = useState<PayPalExecutionMode>("mirror");
  const [preferredMode, setPreferredMode] = useState<
    "auto" | "sandbox" | "mirror"
  >("auto");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "channel3" | "bounties" | "bryntum" | "aggrid"
  >("overview");

  // Live Sandbox Credentials Drawer state
  const [showCredsDrawer, setShowCredsDrawer] = useState(false);
  const [sandboxClientId, setSandboxClientId] = useState("");
  const [sandboxClientSecret, setSandboxClientSecret] = useState("");

  // Gemini Interactions API Console state
  const [agentPrompt, setAgentPrompt] = useState(
    "Perform a full Autonomous CFO & AGI Clearinghouse sweep: identify my highest-ROI PayPal subscription optimization, best Channel3 deal mandate, highest hourly Proof-of-Human Oracle bounty, and next A2A Smart Escrow milestone ready for capture."
  );
  const [agentMode, setAgentMode] = useState<"deep_cfo_audit" | "fast_agent">(
    "deep_cfo_audit"
  );
  const [agentRunning, setAgentRunning] = useState(false);
  const [agentResponse, setAgentResponse] = useState<{
    interactionId: string;
    modelUsed: string;
    outputText: string;
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

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch("/api/state", { cache: "no-store" });
      const data = await res.json();
      if (data.state) {
        setAppState(data.state);
        setActiveMode(data.activeMode ?? "mirror");
        setPreferredMode(data.preferredMode ?? "auto");
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

  async function handleSaveRuntimeCredentials(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: sandboxClientId,
        clientSecret: sandboxClientSecret,
        preferredMode: "sandbox",
      }),
    });
    const data = await res.json();
    if (data.state) {
      setAppState(data.state);
      setActiveMode(data.activeMode ?? "sandbox");
      setPreferredMode("sandbox");
      setShowCredsDrawer(false);
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
          mode: agentMode,
        }),
      });
      const data = await res.json();
      if (data.interactionId) {
        setAgentResponse({
          interactionId: data.interactionId,
          modelUsed: data.modelUsed,
          outputText: data.outputText,
          toolExecutions: data.toolExecutions ?? [],
        });
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
    }
  }

  if (loading || !appState) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="h-12 w-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center animate-pulse mb-4">
          <Sparkles className="h-6 w-6 text-indigo-400" />
        </div>
        <h1 className="text-lg font-bold text-white">
          Initializing Sovereign Pulse (AuraPay) Clearinghouse...
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
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* TOP COMMAND HEADER */}
      <header className="sticky top-0 z-40 border-b border-slate-800/90 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-600 via-sky-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-white">
                  SOVEREIGN PULSE{" "}
                  <span className="text-indigo-400 font-semibold">(AuraPay)</span>
                </h1>
                <span className="hidden md:inline-flex items-center gap-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 px-2.5 py-0.5 text-[10px] font-semibold text-indigo-300">
                  PayPal AI Hackathon Flagship
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Autonomous Economic Clearinghouse &amp; Personal AI Financial Officer on PayPal
              </p>
            </div>
          </div>

          {/* Right Controls: Dual-Mode Switcher + Credentials Drawer + Voice Briefing + Reset */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900/90 p-1 text-xs">
              <span className="px-2 text-[11px] text-slate-400 font-medium hidden sm:inline">
                PayPal Mode:
              </span>
              {(["auto", "sandbox", "mirror"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleSwitchMode(m)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer ${
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

            <button
              type="button"
              onClick={() => setShowCredsDrawer((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-500/15 hover:bg-indigo-500/25 px-3 py-1.5 text-xs font-semibold text-indigo-200 transition cursor-pointer"
            >
              <KeyRound className="h-3.5 w-3.5 text-indigo-400" />
              Sandbox Keys
            </button>

            <button
              type="button"
              onClick={handlePlayVoiceBriefing}
              disabled={voiceLoading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-sky-500/40 bg-sky-500/15 hover:bg-sky-500/25 px-3 py-1.5 text-xs font-semibold text-sky-200 transition cursor-pointer"
            >
              <Volume2 className="h-3.5 w-3.5 text-sky-400" />
              {voiceLoading ? "Synthesizing..." : "AI Voice CFO Briefing"}
            </button>

            <button
              type="button"
              onClick={handleResetDemoState}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 transition cursor-pointer"
              title="Reset Demo Ledger & Bounties"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reset
            </button>
          </div>
        </div>

        {/* Live Sandbox Credentials Drawer */}
        {showCredsDrawer && (
          <form
            onSubmit={handleSaveRuntimeCredentials}
            className="border-t border-indigo-500/30 bg-indigo-950/30 px-4 sm:px-6 py-3"
          >
            <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-indigo-200">
                <strong>Hot-Swap PayPal Sandbox Credentials:</strong> Works immediately in{" "}
                <code className="text-amber-300">DETERMINISTIC MIRROR</code> mode (zero regional SMS blocker), or paste judge{" "}
                <code className="text-indigo-300">PAYPAL_CLIENT_ID</code> &amp;{" "}
                <code className="text-indigo-300">PAYPAL_CLIENT_SECRET</code> to route through live{" "}
                <code className="text-emerald-300">api-m.sandbox.paypal.com</code>:
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={sandboxClientId}
                  onChange={(e) => setSandboxClientId(e.target.value)}
                  placeholder="PAYPAL_CLIENT_ID"
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white font-mono"
                  required
                />
                <input
                  type="password"
                  value={sandboxClientSecret}
                  onChange={(e) => setSandboxClientSecret(e.target.value)}
                  placeholder="PAYPAL_CLIENT_SECRET"
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white font-mono"
                  required
                />
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-white transition cursor-pointer"
                >
                  Activate Live Sandbox
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Zero-Blocker Dual-Mode Status Bar */}
        <div className="border-t border-slate-800/70 bg-slate-900/60">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <div className="flex flex-wrap items-center gap-2 text-slate-300">
              <span
                className={`inline-flex items-center gap-1 font-semibold ${
                  activeMode === "sandbox"
                    ? "text-emerald-400"
                    : "text-amber-300"
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-current animate-pulse" />
                Active Engine:{" "}
                {activeMode === "sandbox"
                  ? "LIVE PAYPAL SANDBOX REST API (api-m.sandbox.paypal.com)"
                  : "DETERMINISTIC PAYPAL SANDBOX MIRROR (100% Schema-Identical v1/v2 + JS SDK v6)"}
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">
                Sponsors:{" "}
                <strong className="text-slate-200">
                  PayPal (Orders v2, Payouts v1, Subscriptions v1, Trackers, Webhooks, JS SDK v6, MCP) • APIMatic SDK • AG Grid v36 • Bryntum Gantt • Channel3 • Google Gemini Interactions API • Render
                </strong>
              </span>
            </div>
            {voiceTranscript && (
              <div className="text-sky-300 truncate max-w-md">
                🔊 <em>&ldquo;{voiceTranscript}&rdquo;</em>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 pt-6 space-y-6">
        {/* KPI TELEMETRY STRIP */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">
                Engine 1: AI CFO &amp; Channel3 Savings
              </span>
              <span className="rounded-lg bg-emerald-500/15 p-2 text-emerald-400">
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
            <p className="mt-1 text-[11px] text-slate-400">
              ${appState.totalSavedByAiUsd.toFixed(2)} Realized + $
              {annualSubSavings.toFixed(0)}/yr Subscription Guard
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">
                Engine 2: Proof-of-Human Payouts
              </span>
              <span className="rounded-lg bg-sky-500/15 p-2 text-sky-400">
                <UserCheck className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-2 text-2xl font-extrabold text-white">
              ${appState.totalEarnedFromBountiesUsd.toFixed(2)}
              <span className="text-xs font-normal text-sky-400 ml-1.5">
                Instant Settled
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Verified by Gemini 3.8 Flash • Paid via PayPal Payouts v1
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">
                Engine 3: Active A2A Auth Escrow
              </span>
              <span className="rounded-lg bg-indigo-500/15 p-2 text-indigo-400">
                <Lock className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-2 text-2xl font-extrabold text-white">
              ${appState.totalEscrowProtectedUsd.toFixed(2)}
              <span className="text-xs font-normal text-indigo-400 ml-1.5">
                AUTHORIZE Hold
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Bryntum Milestone Gantt + PayPal Orders v2 Auth &amp; Capture
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">
                PayPal Wallet Balance &amp; Dispute Shield
              </span>
              <span className="rounded-lg bg-amber-500/15 p-2 text-amber-400">
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
            <p className="mt-1 text-[11px] text-slate-400">
              Auto-Trackers v2 + PayPal-Request-Id Idempotency
            </p>
          </div>
        </section>

        {/* INTERACTIVE GEMINI 4 ARGON / 3.8 FLASH AGENTIC CFO & MCP CONSOLE */}
        <section className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/30 p-5 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
                <Bot className="h-4 w-4 text-indigo-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-white">
                    Google Gemini Interactions API — Autonomous CFO &amp; PayPal MCP Orchestrator
                  </h2>
                  <span className="rounded-full bg-indigo-500/20 border border-indigo-500/40 px-2 py-0.5 font-mono text-[10px] text-indigo-300">
                    client.interactions.create()
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Powered by <code className="text-indigo-300">@google/genai v3.0.0</code> with native <code className="text-indigo-300">@paypal/agent-toolkit</code> MCP tool bindings
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={agentMode}
                onChange={(e) =>
                  setAgentMode(
                    e.target.value as "deep_cfo_audit" | "fast_agent"
                  )
                }
                aria-label="Select Gemini Model"
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
            className="mt-3.5 space-y-3"
          >
            <div className="flex flex-col md:flex-row gap-2.5">
              <input
                type="text"
                value={agentPrompt}
                onChange={(e) => setAgentPrompt(e.target.value)}
                className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                placeholder="Ask your Autonomous CFO to optimize subscriptions, buy Channel3 deals, verify human bounties, or inspect escrow..."
              />
              <button
                type="submit"
                disabled={agentRunning}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/25 transition cursor-pointer shrink-0"
              >
                <Sparkles className="h-4 w-4" />
                {agentRunning
                  ? "Running Gemini Interaction..."
                  : "Execute Autonomous CFO Sweep"}
              </button>
            </div>

            {/* Preset Prompt Pills */}
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <span className="text-slate-400">One-Click Agent Actions:</span>
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
                  className="rounded-lg border border-slate-800 bg-slate-950/80 hover:border-indigo-500/50 px-2.5 py-1 text-slate-300 hover:text-white transition cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>
          </form>

          {/* Gemini Interaction Output */}
          {agentResponse && (
            <div className="mt-4 rounded-xl border border-indigo-500/30 bg-slate-950/90 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-indigo-300">
                    Interaction ID: <code>{agentResponse.interactionId}</code>
                  </span>
                  <span className="rounded bg-indigo-500/20 px-2 py-0.5 font-mono text-[10px] text-indigo-200">
                    {agentResponse.modelUsed}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {agentResponse.toolExecutions.map((t, idx) => (
                    <span
                      key={idx}
                      className="rounded bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 font-mono text-[10px] text-emerald-300"
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

        {/* NAVIGATION TABS FOR ALL ENGINES & SPONSOR INTEGRATIONS */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
          {[
            {
              id: "overview",
              label: "Unified Clearinghouse (All Engines)",
              icon: Layers,
            },
            {
              id: "channel3",
              label: "Engine 1: Channel3 + PayPal v6 Checkout",
              icon: ShoppingBag,
            },
            {
              id: "bounties",
              label: "Engine 2: Proof-of-Human + PayPal Payouts",
              icon: UserCheck,
            },
            {
              id: "bryntum",
              label: "Engine 3: Bryntum Escrow Gantt + Subscriptions",
              icon: Calendar,
            },
            {
              id: "aggrid",
              label: "AG Grid Ledger + Webhook & APIMatic Inspector",
              icon: Activity,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() =>
                  setActiveTab(
                    tab.id as
                      | "overview"
                      | "channel3"
                      | "bounties"
                      | "bryntum"
                      | "aggrid"
                  )
                }
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
                  active
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25"
                    : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB CONTENT */}
        {(activeTab === "overview" || activeTab === "channel3") && (
          <Channel3DealHunterPanel
            deals={appState.channel3Deals}
            activeMode={activeMode}
            onStateUpdated={fetchState}
          />
        )}

        {(activeTab === "overview" || activeTab === "bounties") && (
          <ProofOfHumanBountyBoard
            bounties={appState.bounties}
            payouts={appState.payouts}
            onStateUpdated={fetchState}
          />
        )}

        {(activeTab === "overview" || activeTab === "bryntum") && (
          <BryntumEscrowTimeline
            milestones={appState.escrowMilestones}
            subscriptions={appState.subscriptions}
            onStateUpdated={fetchState}
          />
        )}

        {(activeTab === "overview" || activeTab === "aggrid") && (
          <div className="space-y-6">
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
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-300">
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
                      className="rounded-xl border border-slate-700 bg-slate-950 hover:border-indigo-500 px-3 py-1.5 font-mono text-[11px] text-slate-200 transition cursor-pointer"
                    >
                      Simulate {evt}
                    </button>
                  ))}
                </div>

                {webhookResult && (
                  <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-3.5 text-xs space-y-1">
                    <div className="flex items-center justify-between font-mono">
                      <span className="font-bold text-emerald-300">
                        Signature Verification: {webhookResult.verification_status}
                      </span>
                      <span className="text-slate-400">
                        Event ID: {webhookResult.eventId}
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px]">
                      Deduplicated &amp; logged to Webhook Event Ledger (Mode:{" "}
                      {webhookResult.mode.toUpperCase()}).
                    </p>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 px-2.5 py-0.5 text-[10px] font-semibold text-indigo-300">
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
    </div>
  );
}
