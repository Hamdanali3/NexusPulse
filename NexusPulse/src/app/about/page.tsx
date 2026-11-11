"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bot,
  Brain,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Code2,
  Cpu,
  Database,
  ExternalLink,
  Flame,
  Globe,
  Layers,
  Lock,
  Mail,
  Network,
  Scale,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
  Workflow,
  Zap,
} from "lucide-react";
import NexusHeader from "@/components/layout/NexusHeader";
import NexusFooter from "@/components/layout/NexusFooter";
import NexusAiChatbot from "@/components/chat/NexusAiChatbot";
import NexusPulseLogo from "@/components/brand/NexusPulseLogo";
import type { NexusPulseState } from "@/lib/paypal/paypal-sandbox-mirror";
import type { PayPalExecutionMode } from "@/lib/paypal/paypal-types";

const SPONSORS_DATA = [
  {
    name: "PayPal",
    role: "Core Financial Platform Anchor",
    description:
      "Full spectrum integration of PayPal REST APIs v1/v2, PayPal JS SDK v6 custom buttons, and the official PayPal MCP agent toolkit.",
    apis: [
      "Orders API v2 (CAPTURE & AUTHORIZE)",
      "Payouts API v1 (Single & Batch Item)",
      "Subscriptions API v1 (List & Revise)",
      "Invoicing API v2 & Shipment Trackers v2",
      "Webhooks v1 (SHA256withRSA Verification)",
      "JS SDK v6 (<paypal-button>, <venmo-button>)",
      "PayPal MCP Server (@paypal/agent-toolkit)",
    ],
    highlight: "Primary Hackathon Sponsor",
    color: "from-sky-500 to-blue-600",
    badgeBg: "bg-sky-50 border-sky-200 text-sky-800",
  },
  {
    name: "APIMatic",
    role: "Strongly-Typed SDK & Idempotency",
    description:
      "Enterprise SDK integration using @paypal/paypal-server-sdk v2.5.0 with automatic OAuth2 token caching, retry backoff, and idempotency key injection.",
    apis: [
      "@paypal/paypal-server-sdk@2.5.0",
      "OrdersController & PaymentsController",
      "SubscriptionsController",
      "TransactionSearchController",
      "Automatic PayPal-Request-Id Idempotency",
      "INSTRUMENT_DECLINED / 429 Retry Engine",
    ],
    highlight: "APIMatic Track",
    color: "from-indigo-500 to-violet-600",
    badgeBg: "bg-indigo-50 border-indigo-200 text-indigo-800",
  },
  {
    name: "Google DeepMind / Gemini",
    role: "Frontier AI Orchestrator & Multimodal Audit",
    description:
      "Autonomous reasoning via @google/genai v3.0.0 client.interactions.create() with stateful thread continuity, multi-tool orchestration, and audio briefing.",
    apis: [
      "gemini-4-argon (Autonomous CFO Reasoning)",
      "gemini-3.8-flash (Sub-2s Bounty Verification)",
      "gemini-3.8-flash-tts (Audio Executive Briefing)",
      "@google/genai v3.0.0 SDK",
      "Stateful previous_interaction_id Threads",
      "Structured JSON Schema Function Tools",
    ],
    highlight: "Google Gemini Track",
    color: "from-emerald-500 to-teal-600",
    badgeBg: "bg-emerald-50 border-emerald-200 text-emerald-800",
  },
  {
    name: "Channel3",
    role: "100M+ SKU Product Catalog & Deal-Hunter",
    description:
      "Real-time e-commerce catalog search and price-drop arbitrage engine connected directly to user spending mandates and instant checkout.",
    apis: [
      "100M+ SKU Product Catalog Index",
      "Cryptographic Price-Drop Mandate Engine",
      "Automated Arbitrage Margin Scanner",
      "PayPal JS SDK v6 Direct Checkout Bindings",
      "Real-Time Merchant Inventory Sync",
    ],
    highlight: "Channel3 Track",
    color: "from-fuchsia-500 to-pink-600",
    badgeBg: "bg-fuchsia-50 border-fuchsia-200 text-fuchsia-800",
  },
  {
    name: "AG Grid",
    role: "Dark Quartz Financial Command Center",
    description:
      "High-density ag-grid-react@36.3.0 ledger inspecting every PayPal transaction, order, payout, and invoice with instant CSV export and Gemini CFO audits.",
    apis: [
      "ag-grid-react@36.3.0 & ag-grid-community",
      "Enterprise Dark Quartz Theme Styling",
      "Instant Text & Column Filtering",
      "One-Click CSV Export for Accounting",
      "Interactive Row-Level Gemini AI CFO Audits",
    ],
    highlight: "AG Grid Track",
    color: "from-slate-700 to-slate-900",
    badgeBg: "bg-slate-100 border-slate-300 text-slate-800",
  },
  {
    name: "Bryntum",
    role: "Interactive WBS Milestone Gantt & Escrow",
    description:
      "Visual timeline and cashflow scheduler binding PayPal Orders v2 AUTHORIZE holds to critical-path deliverables and DHL carrier proofs.",
    apis: [
      "Interactive WBS Critical-Path Gantt",
      "PayPal AUTHORIZE Milestone Hold Visualizer",
      "Subscription Renewal Cashflow Calendar",
      "Cryptographic Deliverable Proof Verifier",
      "Real-Time Milestone Status Indicators",
    ],
    highlight: "Bryntum Track",
    color: "from-amber-500 to-orange-600",
    badgeBg: "bg-amber-50 border-amber-200 text-amber-800",
  },
  {
    name: "Render",
    role: "Production Cloud Blueprint & Cron Worker",
    description:
      "Infrastructure-as-Code blueprint deploying both the Next.js 16 Web Service and an hourly autonomous agent background sweep worker.",
    apis: [
      "Production render.yaml Blueprint",
      "Next.js 16 Edge / Node Web Service",
      "Hourly Autonomous Worker (autonomous-sweep.mjs)",
      "Zero-Downtime Deployment Lifecycle",
      "Automated Environment Secrets Injection",
    ],
    highlight: "Render Track",
    color: "from-cyan-500 to-blue-600",
    badgeBg: "bg-cyan-50 border-cyan-200 text-cyan-800",
  },
];

const COMPARISON_ROWS = [
  {
    dimension: "Recurring Subscriptions",
    traditional: "Zombie subscriptions drain $1,548+/yr unnoticed; manual cancellation friction.",
    nexuspulse: "Autonomous Gemini CFO audits usage, alerts on idle tiers, and downgrades via PayPal Subscriptions API v1.",
  },
  {
    dimension: "E-Commerce Shopping",
    traditional: "Consumers manually compare prices across fragmented retail sites with high price asymmetry.",
    nexuspulse: "Channel3 100M+ catalog deal-hunter executes automated orders via PayPal JS SDK v6 when price mandates trigger.",
  },
  {
    dimension: "Physical Reality Verification",
    traditional: "AI models cannot verify physical ground truth, hallucinate, or rely on slow human surveys.",
    nexuspulse: "Enterprise agents post 30s micro-bounties; Gemini 3.8 Flash audits evidence in <2s with instant PayPal Payouts v1.",
  },
  {
    dimension: "Contract & Escrow Settlement",
    traditional: "High dispute and chargeback rates; funds locked without clear milestone dependencies.",
    nexuspulse: "PayPal Orders v2 AUTHORIZE holds on Bryntum Gantt, verified by Gemini 4 Argon, released with Shipment Trackers v2.",
  },
  {
    dimension: "Global Developer Verification",
    traditional: "Fails when judges lack local credentials or hit sandbox SMS phone verification blocks.",
    nexuspulse: "Dual-Mode Zero-Blocker Gateway hot-swaps between Live PayPal Sandbox and 100% schema-identical Deterministic Mirror.",
  },
  {
    dimension: "Financial Telemetry",
    traditional: "Siloed dashboards, fragmented invoices, and disjointed reporting.",
    nexuspulse: "Unified AG Grid v36 Dark Quartz Command Center inspecting transactions, webhooks, and ledger entries in real time.",
  },
];

export default function AboutPage() {
  const [appState, setAppState] = useState<NexusPulseState | null>(null);
  const [activeMode, setActiveMode] = useState<PayPalExecutionMode>("mirror");
  const [preferredMode, setPreferredMode] = useState<
    "auto" | "sandbox" | "mirror"
  >("auto");
  const [databaseSource, setDatabaseSource] = useState<string>("in_memory_mirror");
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string | null>(null);
  const [activeEngineTab, setActiveEngineTab] = useState<number>(0);

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
    } catch {
      // Non-blocking
    }
  }, []);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  // Header Handlers
  async function handleSwitchMode(nextPref: "auto" | "sandbox" | "mirror") {
    setPreferredMode(nextPref);
    try {
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
    } catch {
      // Non-blocking
    }
  }

  async function handleSaveRuntimeCredentials(
    clientId: string,
    clientSecret: string
  ) {
    try {
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
    } catch {
      // Non-blocking
    }
  }

  async function handlePlayVoiceBriefing() {
    setVoiceLoading(true);
    try {
      const res = await fetch("/api/ai/voice-briefing", { method: "POST" });
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

  async function handleResetDemoState() {
    try {
      const res = await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RESET_STATE" }),
      });
      const data = await res.json();
      if (data.state) {
        setAppState(data.state);
      }
    } catch {
      // Non-blocking
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 text-zinc-950 antialiased">
      {/* Header */}
      <NexusHeader
        activeTab="about"
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

      {/* Main Content */}
      <main className="flex-1 mx-auto w-full max-w-5xl px-5 sm:px-8 py-8 space-y-12">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-zinc-500">
          <Link
            href="/"
            className="inline-flex items-center gap-1 hover:text-zinc-900 font-medium transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Overview</span>
          </Link>
          <span className="text-zinc-300">/</span>
          <span className="font-medium text-zinc-900">About NexusPulse</span>
        </nav>

        {/* HERO SECTION */}
        <section className="text-center pt-2 pb-6 max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3.5 py-1 text-xs font-medium text-zinc-700 shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
            <span>PayPal AI Hackathon Flagship</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-950 leading-tight">
            Connecting AI Agents, Human Oracles &amp; Smart Payments
          </h1>

          <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
            NexusPulse is the autonomous financial clearinghouse built to bridge consumer savings, physical-world human ground truth, and zero-dispute agent-to-agent smart escrow using the <strong>PayPal Platform</strong> and <strong>Google Gemini Frontier AI</strong>.
          </p>

          {/* Quick Metrics Bar */}
          <div className="pt-2 grid grid-cols-2 sm:grid-cols-5 gap-3 text-left">
            <div className="rounded-xl border border-zinc-200 bg-white p-3 shadow-2xs">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Engines</span>
              <div className="text-lg font-bold text-zinc-900">3 Unified</div>
              <div className="text-[11px] text-zinc-500">Full Autonomy</div>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-3 shadow-2xs">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Sponsors</span>
              <div className="text-lg font-bold text-zinc-900">All 7 Built</div>
              <div className="text-[11px] text-zinc-500">Full Stack Matrix</div>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-3 shadow-2xs">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Catalog</span>
              <div className="text-lg font-bold text-zinc-900">100M+ SKUs</div>
              <div className="text-[11px] text-zinc-500">Channel3 Feed</div>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-3 shadow-2xs">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Audit Speed</span>
              <div className="text-lg font-bold text-zinc-900">&lt; 2.0s</div>
              <div className="text-[11px] text-zinc-500">Gemini 3.8 Flash</div>
            </div>
            <div className="col-span-2 sm:col-span-1 rounded-xl border border-zinc-200 bg-white p-3 shadow-2xs">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Gateway</span>
              <div className="text-lg font-bold text-zinc-900">Dual-Mode</div>
              <div className="text-[11px] text-zinc-500">Zero Blocker</div>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/?tab=overview"
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 px-5 text-xs font-medium text-white transition"
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              <span>Launch Clearinghouse</span>
            </Link>
            <Link
              href="/contact"
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 px-5 text-xs font-medium text-zinc-700 transition"
            >
              <Mail className="h-3.5 w-3.5 text-zinc-400" />
              <span>Contact Team</span>
            </Link>
          </div>
        </section>

        {/* 50-YEAR AGI ECONOMIC THESIS & RESEARCH CITATIONS */}
        <section
          id="thesis"
          className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 lg:p-12 shadow-xs space-y-8"
        >
          <div className="max-w-3xl space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-200 px-3 py-1 text-xs font-semibold text-indigo-800">
              <Brain className="h-3.5 w-3.5 text-indigo-600" />
              <span>Macroeconomic Foundation</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-950 tracking-tight">
              The 50-Year AGI Economic Thesis
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              NexusPulse is grounded in cutting-edge literature on autonomous economic systems and macroeconomic transitions to AGI. Rather than viewing AI as a replacement for human agency, our protocol bridges human livelihoods with agentic financial settlement.
            </p>
          </div>

          {/* Dual Crisis Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Crisis 1: Subscription Bloat & Price Asymmetry */}
            <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-6 space-y-3">
              <div className="flex items-center gap-2 text-rose-800 text-xs font-bold uppercase tracking-wider">
                <TrendingDown className="h-4 w-4 text-rose-600" />
                <span>The Immediate Crisis: Retail Asymmetry</span>
              </div>
              <h3 className="text-lg font-bold text-slate-950">
                $1,548+ Per Year Lost to Zombie Subscriptions &amp; Price Gouging
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed">
                Consumers face unprecedented subscription fatigue. Recurring plans continue billing for idle compute, abandoned SaaS tiers, and inflated retail margins. Individual buyers lack the real-time telemetry to audit contracts and negotiate optimal prices across fragmented marketplaces.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-rose-900">
                <CheckCircle2 className="h-4 w-4 text-rose-600" />
                <span>Solved by Engine 1: Autonomous CFO + Channel3 Deal Hunter</span>
              </div>
            </div>

            {/* Crisis 2: Physical Ground Truth & Human Income Bottleneck */}
            <div className="rounded-2xl border border-sky-200 bg-sky-50/40 p-6 space-y-3">
              <div className="flex items-center gap-2 text-sky-800 text-xs font-bold uppercase tracking-wider">
                <Users className="h-4 w-4 text-sky-600" />
                <span>The 50-Year AGI Crisis: The Physical Truth Gap</span>
              </div>
              <h3 className="text-lg font-bold text-slate-950">
                AI Agents Cannot Verify Physical Reality Without Humans
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed">
                As routine cognitive tasks automate, human comparative advantage shifts decisively toward physical-world ground truth, in-person hardware inspections, security auditing, and cultural nuance. AI agents desperately need verified physical sensors with cryptographic escrow guarantees.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-sky-900">
                <CheckCircle2 className="h-4 w-4 text-sky-600" />
                <span>Solved by Engine 2: Proof-of-Human Bounties + Instant PayPal Payouts</span>
              </div>
            </div>
          </div>

          {/* Academic Citations Box */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-indigo-600" />
              <span>Frontier Research Citations &amp; Economic Foundations</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs text-slate-700">
              <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-1">
                <strong className="text-slate-950 block">Google DeepMind</strong>
                <p className="text-slate-600 text-[11px]">
                  <em>Virtual Agent Economies</em> (<code>arXiv:2509.10147</code>) &amp; <em>Distributional AGI Safety</em> (<code>arXiv:2512.16856</code>).
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-1">
                <strong className="text-slate-950 block">Anthropic Research</strong>
                <p className="text-slate-600 text-[11px]">
                  <em>Anthropic Economic Index I &amp; II</em> (<code>arXiv:2503.04761</code>, <code>arXiv:2511.15080</code>).
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-1">
                <strong className="text-slate-950 block">Macroeconomic AGI Theory</strong>
                <p className="text-slate-600 text-[11px]">
                  <em>Some Simple Economics of AGI</em> (<code>arXiv:2602.20946</code>) &amp; <em>The Agentic Economy</em> (<code>arXiv:2505.15799</code>).
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* THE THREE AUTONOMOUS ECONOMIC ENGINES (INTERACTIVE BREAKDOWN) */}
        <section id="engines" className="space-y-6">
          <div className="max-w-2xl space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600 flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5" />
              Core Architecture
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950">
              The Three Autonomous Economic Engines
            </h2>
            <p className="text-xs text-slate-500">
              Every engine operates independently or in concert, tied directly to PayPal REST APIs and Google Gemini tool execution.
            </p>
          </div>

          {/* Engine Selector Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
            {[
              {
                id: 0,
                label: "Engine 1: Personal CFO & Channel3",
                icon: ShoppingBag,
                color: "text-fuchsia-600",
              },
              {
                id: 1,
                label: "Engine 2: Proof-of-Human Oracle Payouts",
                icon: UserCheck,
                color: "text-emerald-600",
              },
              {
                id: 2,
                label: "Engine 3: Bryntum Smart Escrow Gantt",
                icon: Calendar,
                color: "text-indigo-600",
              },
            ].map((eng) => {
              const Icon = eng.icon;
              const isCur = activeEngineTab === eng.id;
              return (
                <button
                  key={eng.id}
                  type="button"
                  onClick={() => setActiveEngineTab(eng.id)}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition shadow-xs ${
                    isCur
                      ? "bg-slate-950 text-white shadow-sm"
                      : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isCur ? "text-sky-400" : eng.color}`} />
                  <span>{eng.label}</span>
                </button>
              );
            })}
          </div>

          {/* Engine 1 Tab Content */}
          {activeEngineTab === 0 && (
            <div className="nexus-fade-in rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-xs space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-fuchsia-600 font-semibold">
                    Engine 01 · Immediate Consumer Value
                  </span>
                  <h3 className="text-2xl font-extrabold text-slate-950 mt-1">
                    Autonomous Personal CFO &amp; Channel3 Deal-Hunter
                  </h3>
                  <p className="text-xs text-slate-600 max-w-2xl mt-1 leading-relaxed">
                    Continuously audits recurring PayPal Subscriptions, downgrades idle GPU and SaaS tiers, monitors 100M+ SKUs on Channel3, and executes instant checkouts with the PayPal JS SDK v6.
                  </p>
                </div>
                <Link
                  href="/?tab=channel3#deal-hunter"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition shrink-0"
                >
                  <span>Explore Deal Hunter</span>
                  <ArrowRight className="h-4 w-4 text-sky-400" />
                </Link>
              </div>

              {/* 4-Step Lifecycle Flow */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                  <div className="h-7 w-7 rounded-lg bg-fuchsia-100 border border-fuchsia-200 flex items-center justify-center font-bold text-xs text-fuchsia-800">
                    1
                  </div>
                  <strong className="text-xs text-slate-950 block">Subscription Telemetry</strong>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Audits active plans via <code>v1/billing/subscriptions</code>, identifying zombie tiers with zero API utilization.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                  <div className="h-7 w-7 rounded-lg bg-fuchsia-100 border border-fuchsia-200 flex items-center justify-center font-bold text-xs text-fuchsia-800">
                    2
                  </div>
                  <strong className="text-xs text-slate-950 block">Automated Downgrade</strong>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Executes <code>POST /v1/billing/subscriptions/{'{id}'}/revise</code> to eliminate overcharges, saving $1,548+/yr.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                  <div className="h-7 w-7 rounded-lg bg-fuchsia-100 border border-fuchsia-200 flex items-center justify-center font-bold text-xs text-fuchsia-800">
                    3
                  </div>
                  <strong className="text-xs text-slate-950 block">Channel3 Mandate Match</strong>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Scans 100M+ SKUs against cryptographic spending mandates for hardware and essentials below market MSRP.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                  <div className="h-7 w-7 rounded-lg bg-fuchsia-100 border border-fuchsia-200 flex items-center justify-center font-bold text-xs text-fuchsia-800">
                    4
                  </div>
                  <strong className="text-xs text-slate-950 block">PayPal JS SDK v6 Checkout</strong>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Instant multi-funding checkout via <code>&lt;paypal-button&gt;</code>, <code>&lt;paylater-button&gt;</code>, and Orders v2.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Engine 2 Tab Content */}
          {activeEngineTab === 1 && (
            <div className="nexus-fade-in rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-xs space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-emerald-600 font-semibold">
                    Engine 02 · 50-Year AGI Income Bridge
                  </span>
                  <h3 className="text-2xl font-extrabold text-slate-950 mt-1">
                    Proof-of-Human Oracle Micro-Bounties &amp; Instant PayPal Payouts
                  </h3>
                  <p className="text-xs text-slate-600 max-w-2xl mt-1 leading-relaxed">
                    Enterprise AI agents post real-world verification bounties. Google Gemini 3.8 Flash audits human submissions in under 2 seconds, triggering instant PayPal Payouts v1 directly to PayPal or Venmo.
                  </p>
                </div>
                <Link
                  href="/?tab=bounties#human-bounties"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition shrink-0"
                >
                  <span>Explore Bounties</span>
                  <ArrowRight className="h-4 w-4 text-emerald-400" />
                </Link>
              </div>

              {/* 4-Step Lifecycle Flow */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                  <div className="h-7 w-7 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center font-bold text-xs text-emerald-800">
                    1
                  </div>
                  <strong className="text-xs text-slate-950 block">Agent Posts Bounty</strong>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    AI agents post physical verification tasks ($15–$45 for 30–60s work) for datacenter checks and ground truth.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                  <div className="h-7 w-7 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center font-bold text-xs text-emerald-800">
                    2
                  </div>
                  <strong className="text-xs text-slate-950 block">Human Submits Proof</strong>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Contributor captures timestamped photo or text evidence from the physical site and enters their PayPal email.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                  <div className="h-7 w-7 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center font-bold text-xs text-emerald-800">
                    3
                  </div>
                  <strong className="text-xs text-slate-950 block">Gemini 3.8 Flash Audit</strong>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Multimodal structured evaluation verifies evidence authenticity, score (0–100), and fraud indicators in &lt;2s.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                  <div className="h-7 w-7 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center font-bold text-xs text-emerald-800">
                    4
                  </div>
                  <strong className="text-xs text-slate-950 block">Instant PayPal Payouts v1</strong>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Dispatches instant single-item payout via <code>POST /v1/payments/payouts</code> with idempotency key.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Engine 3 Tab Content */}
          {activeEngineTab === 2 && (
            <div className="nexus-fade-in rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-xs space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-indigo-600 font-semibold">
                    Engine 03 · Agentic Commerce Trust Layer
                  </span>
                  <h3 className="text-2xl font-extrabold text-slate-950 mt-1">
                    Zero-Dispute A2A Smart Escrow &amp; Dispute Shield
                  </h3>
                  <p className="text-xs text-slate-600 max-w-2xl mt-1 leading-relaxed">
                    Locks multi-party milestone funds using PayPal Orders v2 intent: &apos;AUTHORIZE&apos;, visualizes critical-path dependencies on a Bryntum WBS Gantt, and immunizes transactions with PayPal Shipment Trackers v2.
                  </p>
                </div>
                <Link
                  href="/?tab=bryntum#escrow-gantt"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition shrink-0"
                >
                  <span>View Escrow Gantt</span>
                  <ArrowRight className="h-4 w-4 text-indigo-400" />
                </Link>
              </div>

              {/* 4-Step Lifecycle Flow */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                  <div className="h-7 w-7 rounded-lg bg-indigo-100 border border-indigo-200 flex items-center justify-center font-bold text-xs text-indigo-800">
                    1
                  </div>
                  <strong className="text-xs text-slate-950 block">Orders v2 AUTHORIZE Hold</strong>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Milestone funds locked securely via <code>POST /v2/checkout/orders</code> with <code>intent: &quot;AUTHORIZE&quot;</code>.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                  <div className="h-7 w-7 rounded-lg bg-indigo-100 border border-indigo-200 flex items-center justify-center font-bold text-xs text-indigo-800">
                    2
                  </div>
                  <strong className="text-xs text-slate-950 block">Bryntum WBS Gantt Timeline</strong>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Tracks milestone dependencies, critical-path status, deliverables, and carrier proofs in real time.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                  <div className="h-7 w-7 rounded-lg bg-indigo-100 border border-indigo-200 flex items-center justify-center font-bold text-xs text-indigo-800">
                    3
                  </div>
                  <strong className="text-xs text-slate-950 block">Gemini 4 Argon Deliverable Audit</strong>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Audits cryptographic deliverable proofs, approves milestone release, and executes authorization capture.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                  <div className="h-7 w-7 rounded-lg bg-indigo-100 border border-indigo-200 flex items-center justify-center font-bold text-xs text-indigo-800">
                    4
                  </div>
                  <strong className="text-xs text-slate-950 block">Dispute Shield &amp; Trackers v2</strong>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Attaches carrier tracking telemetry via <code>POST /v2/checkout/orders/{'{id}'}/track</code>, preventing chargebacks.
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ALL 7 SPONSORS INTEGRATION MATRIX */}
        <section id="sponsors" className="space-y-6">
          <div className="max-w-2xl space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
              <Network className="h-3.5 w-3.5" />
              Sponsor Technology Matrix
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950">
              All 7 Hackathon Sponsor Tracks Integrated
            </h2>
            <p className="text-xs text-slate-500">
              Every sponsor API and tool is deeply wired into the application with end-to-end functionality.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SPONSORS_DATA.map((sp) => (
              <div
                key={sp.name}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${sp.badgeBg}`}>
                      {sp.highlight}
                    </span>
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-950">{sp.name}</h3>
                    <p className="text-xs font-semibold text-sky-700">{sp.role}</p>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {sp.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold block">
                    Integrated APIs &amp; SDKs
                  </span>
                  <ul className="space-y-1 text-[11px] text-slate-700 font-mono">
                    {sp.apis.map((api, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{api}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* COMPARISON TABLE: TRADITIONAL VS NEXUSPULSE */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-xs space-y-6">
          <div className="max-w-2xl space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
              <Scale className="h-3.5 w-3.5" />
              Comparative Advantage
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950">
              Traditional Financial Rails vs. NexusPulse
            </h2>
            <p className="text-xs text-slate-500">
              How NexusPulse transforms passive payments into autonomous, self-auditing economic clearing.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50 text-slate-700 uppercase font-mono text-[10px] tracking-wider">
                <tr>
                  <th scope="col" className="p-3.5 sm:p-4 font-bold">Dimension</th>
                  <th scope="col" className="p-3.5 sm:p-4 font-bold text-rose-800">Legacy Status Quo</th>
                  <th scope="col" className="p-3.5 sm:p-4 font-bold text-emerald-800">NexusPulse Autonomous Clearinghouse</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-slate-600">
                {COMPARISON_ROWS.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5 sm:p-4 font-bold text-slate-900 whitespace-nowrap">
                      {row.dimension}
                    </td>
                    <td className="p-3.5 sm:p-4 text-slate-600 leading-relaxed">
                      {row.traditional}
                    </td>
                    <td className="p-3.5 sm:p-4 text-slate-900 font-medium leading-relaxed bg-emerald-50/20">
                      {row.nexuspulse}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* SECURITY, DUAL-MODE PARITY & IDEMPOTENCY */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-xs space-y-6">
          <div className="max-w-2xl space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" />
              Security Architecture
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950">
              Dual-Mode Zero-Blocker &amp; Cryptographic Parity
            </h2>
            <p className="text-xs text-slate-500">
              Designed from first principles so judges and developers anywhere in the world can test all flows without SMS roadblocks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-2">
              <div className="h-8 w-8 rounded-xl bg-sky-100 border border-sky-200 flex items-center justify-center">
                <Globe className="h-4 w-4 text-sky-600" />
              </div>
              <strong className="text-xs text-slate-950 block">Dual-Mode Gateway</strong>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Deterministic Sandbox Mirror provides 100% schema-identical payloads out-of-the-box. Hot-swaps to Live PayPal Sandbox at runtime.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-2">
              <div className="h-8 w-8 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center">
                <Lock className="h-4 w-4 text-emerald-600" />
              </div>
              <strong className="text-xs text-slate-950 block">SHA256withRSA Webhooks</strong>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Verifies cryptographic signatures using raw unparsed transmission bytes before any state mutation is allowed.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-2">
              <div className="h-8 w-8 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center">
                <Shield className="h-4 w-4 text-indigo-600" />
              </div>
              <strong className="text-xs text-slate-950 block">Idempotency Guarantee</strong>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Every mutation passes a unique <code>PayPal-Request-Id</code> to prevent double-charges and replay vulnerabilities.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-2">
              <div className="h-8 w-8 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center">
                <Server className="h-4 w-4 text-amber-600" />
              </div>
              <strong className="text-xs text-slate-950 block">Fetch Metadata Guard</strong>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Strict <code>Sec-Fetch-Site</code> policy isolates API routes from cross-site request forgery and hostile origins.
              </p>
            </div>
          </div>
        </section>

        {/* BOTTOM ACTION CTA BANNER */}
        <section className="rounded-3xl bg-slate-950 p-8 sm:p-12 text-center text-white space-y-6 shadow-xl relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(14,165,233,0.2),transparent_70%)]"
          />
          <div className="relative max-w-2xl mx-auto space-y-4">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Ready to Experience the Autonomous Clearinghouse?
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Explore the live dashboard, run an autonomous Google Gemini CFO sweep, inspect the AG Grid financial ledger, or submit a direct inquiry to the hackathon desk.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/?tab=overview"
                className="inline-flex items-center gap-2 rounded-xl bg-white hover:bg-slate-100 px-6 py-3 text-xs font-bold text-slate-950 shadow-md transition active:scale-95"
              >
                <Sparkles className="h-4 w-4 text-sky-600" />
                <span>Launch Clearinghouse</span>
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 px-6 py-3 text-xs font-bold text-white shadow-xs transition active:scale-95"
              >
                <Mail className="h-4 w-4 text-sky-400" />
                <span>Contact Operations Desk</span>
              </Link>
              <a
                href="https://github.com/Hamdanali3/NexusPulse"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 px-5 py-3 text-xs font-bold text-slate-300 hover:text-white transition"
              >
                <span>GitHub Source</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <NexusFooter
        activeMode={activeMode}
        databaseSource={databaseSource}
      />

      {/* AI Assistant Chatbot */}
      <NexusAiChatbot
        appState={appState}
        onSelectTab={(tabId) => {
          if (typeof window !== "undefined") {
            window.location.href = tabId === "overview" ? "/" : `/?tab=${tabId}`;
          }
        }}
      />
    </div>
  );
}
