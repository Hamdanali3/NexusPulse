"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Camera,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Eye,
  EyeOff,
  Flame,
  Layers,
  Lock,
  PackageCheck,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Truck,
  UserCheck,
  XCircle,
  Zap,
} from "lucide-react";

interface FeaturePillar {
  id: string;
  tabTitle: string;
  tabIcon: React.ElementType;
  engineBadge: string;
  engineTab: "channel3" | "bounties" | "bryntum" | "aggrid";
  headline: string;
  subheadline: string;
  metricBefore: string;
  metricAfter: string;
  problemTitle: string;
  problemTag: string;
  solutionTitle: string;
  solutionTag: string;
}

const PILLARS: FeaturePillar[] = [
  {
    id: "wallets",
    tabTitle: "AI Smart Wallets",
    tabIcon: CreditCard,
    engineBadge: "Engine 01 • Deal Hunter",
    engineTab: "channel3",
    headline: "Autonomous Spending Without Bank KYC Hurdles",
    subheadline: "Software agents can't open bank accounts. NexusPulse gives them delegated PayPal smart rails with strict spending caps.",
    metricBefore: "100% Blocked",
    metricAfter: "< 1.2s Checkout",
    problemTitle: "The AI Financial Wall",
    problemTag: "KYC & Identity Blocked",
    solutionTitle: "Delegated PayPal Rails",
    solutionTag: "Cryptographic Mandate",
  },
  {
    id: "oracles",
    tabTitle: "Human Oracles",
    tabIcon: Camera,
    engineBadge: "Engine 02 • Human Bounties",
    engineTab: "bounties",
    headline: "Ground-Truth Verification for Blind AI Models",
    subheadline: "AI is blind to physical reality. Verified human technicians check on-site assets, audited by Gemini Vision in seconds.",
    metricBefore: "0% Physical Vision",
    metricAfter: "1.4s Instant Payout",
    problemTitle: "The Physical Hallucination Gap",
    problemTag: "Zero Real-World Eyes",
    solutionTitle: "Proof-of-Human Micro-Bounties",
    solutionTag: "Multimodal Gemini + PayPal",
  },
  {
    id: "escrow",
    tabTitle: "Milestone Escrow",
    tabIcon: Lock,
    engineBadge: "Engine 03 • Smart Escrow",
    engineTab: "bryntum",
    headline: "Zero-Dispute Holds with Automated Carrier Shields",
    subheadline: "Funds locked in PayPal Authorization holds. Released only when deliverables are verified and DHL tracking confirms delivery.",
    metricBefore: "14-Day Lockup",
    metricAfter: "0% Dispute Rate",
    problemTitle: "Chargeback & Delivery Fraud",
    problemTag: "Frozen Escrow Capital",
    solutionTitle: "Bryntum Critical-Path Escrow",
    solutionTag: "PayPal Orders v2 AUTHORIZE",
  },
  {
    id: "cfo",
    tabTitle: "Autonomous CFO",
    tabIcon: Bot,
    engineBadge: "Autonomous CFO Console",
    engineTab: "aggrid",
    headline: "Automated Capital Recovery for SaaS & GPU Creep",
    subheadline: "Gemini 4 Argon audits PayPal recurring subscriptions, spots idle tiers, and automates plan downgrades with 1 click.",
    metricBefore: "-$14.2k/yr Lost",
    metricAfter: "24/7 Auto-Recovery",
    problemTitle: "Silent Subscription Creep",
    problemTag: "Idle Cloud Spend",
    solutionTitle: "Autonomous Subscription Sweeps",
    solutionTag: "Gemini 4 Argon + Subscriptions v1",
  },
];

interface ProblemSolutionComparisonProps {
  onSelectEngine?: (tab: "channel3" | "bounties" | "bryntum" | "aggrid") => void;
}

export default function ProblemSolutionComparison({
  onSelectEngine,
}: ProblemSolutionComparisonProps) {
  const [activePillarId, setActivePillarId] = useState<string>("wallets");
  const [simulatedCheckout, setSimulatedCheckout] = useState<boolean>(false);
  const [cfoOptimized, setCfoOptimized] = useState<boolean>(false);
  const [escrowStep, setEscrowStep] = useState<number>(3);

  const pillar = PILLARS.find((p) => p.id === activePillarId) || PILLARS[0];

  function handleSimulateAction() {
    if (pillar.id === "wallets") {
      setSimulatedCheckout(true);
      setTimeout(() => setSimulatedCheckout(false), 3000);
    } else if (pillar.id === "cfo") {
      setCfoOptimized(true);
    }
  }

  return (
    <section
      aria-labelledby="problem-solution-heading"
      className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-7 shadow-xs space-y-6"
    >
      {/* Modern Visual Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/60 bg-indigo-50/70 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
            <Zap className="h-3 w-3 text-indigo-600" />
            <span>Interactive Architecture Studio</span>
          </div>
          <h2
            id="problem-solution-heading"
            className="mt-2 text-lg sm:text-xl font-bold tracking-tight text-zinc-950"
          >
            The Problem We Solve: Bridging AI Autonomy &amp; Real Money
          </h2>
          <p className="mt-1 text-xs text-zinc-500 max-w-xl">
            Click each tab below to see the exact real-world bottleneck and how NexusPulse solves it with PayPal smart rails.
          </p>
        </div>

        {onSelectEngine && (
          <button
            type="button"
            onClick={() => onSelectEngine(pillar.engineTab)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-800 shadow-2xs transition self-start sm:self-center"
          >
            <span>Open {pillar.engineBadge.split("•")[0].trim()}</span>
            <ArrowRight className="h-3 w-3 text-zinc-400" />
          </button>
        )}
      </div>

      {/* Sleek Interactive Tab Switcher */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {PILLARS.map((p) => {
          const Icon = p.tabIcon;
          const isActive = p.id === activePillarId;

          return (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setActivePillarId(p.id);
                setSimulatedCheckout(false);
              }}
              className={`rounded-xl p-3 border transition-all text-left flex items-center gap-2.5 ${
                isActive
                  ? "border-zinc-950 bg-zinc-950 text-white shadow-xs"
                  : "border-zinc-200 bg-zinc-50/60 hover:bg-white hover:border-zinc-300 text-zinc-700"
              }`}
            >
              <div
                className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                  isActive ? "bg-zinc-800 text-indigo-400" : "bg-white text-zinc-600 border border-zinc-200"
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="truncate">
                <div className="text-xs font-bold truncate">{p.tabTitle}</div>
                <div className={`text-[10px] truncate ${isActive ? "text-zinc-400" : "text-zinc-400"}`}>
                  {p.metricAfter}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Pillar Stage: Visual Side-by-Side Comparison */}
      <div className="space-y-4">
        {/* Dynamic Pillar Headline */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-zinc-50/60 p-3.5 rounded-xl border border-zinc-200/70">
          <div>
            <span className="rounded bg-indigo-50 border border-indigo-200/60 text-indigo-700 font-mono text-[10px] px-2 py-0.5 font-bold">
              {pillar.engineBadge}
            </span>
            <h3 className="mt-1 text-sm sm:text-base font-bold text-zinc-900">
              {pillar.headline}
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              {pillar.subheadline}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
            <div className="text-right">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Friction</span>
              <span className="font-mono text-xs font-bold text-red-600">{pillar.metricBefore}</span>
            </div>
            <div className="text-zinc-300 font-light text-lg">→</div>
            <div className="text-left">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold block">NexusPulse</span>
              <span className="font-mono text-xs font-bold text-emerald-600">{pillar.metricAfter}</span>
            </div>
          </div>
        </div>

        {/* Visual Mockups Grid: Without vs With */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* LEFT: THE BROKEN REALITY (RED THEME) */}
          <div className="rounded-[12px] border border-zinc-200 bg-white p-5 space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-700">
                  <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                  Without NexusPulse: {pillar.problemTitle}
                </span>
                <span className="rounded bg-red-100/70 border border-red-200 text-red-800 text-[10px] font-mono px-2 py-0.5 font-bold">
                  {pillar.problemTag}
                </span>
              </div>

              {/* Dynamic Visual Mockup of the Problem */}
              <div className="mt-4 rounded-lg border border-red-200 bg-white p-4 shadow-2xs space-y-3">
                {pillar.id === "wallets" && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-100">
                      <span className="font-mono text-zinc-500">Merchant Terminal</span>
                      <span className="rounded bg-red-50 text-red-700 font-bold font-mono text-[10px] px-1.5 py-0.5">
                        DECLINED: HTTP 403
                      </span>
                    </div>
                    <div className="rounded-md bg-zinc-900 text-zinc-100 p-3 font-mono text-[11px] space-y-1">
                      <div className="text-red-400">&gt; CHECKOUT_ATTEMPT: agent_session_881</div>
                      <div className="text-zinc-400">&gt; ERROR: No valid SSN, corporate entity, or credit card attached.</div>
                      <div className="text-amber-400">&gt; ACTION_REQUIRED: Manual human card swipe needed. Process halted.</div>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-red-700 font-medium">
                      <AlertTriangle className="h-3.5 w-3.5 text-red-600 shrink-0" />
                      <span>AI agents cannot legally own banking accounts or hold physical cards.</span>
                    </div>
                  </div>
                )}

                {pillar.id === "oracles" && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-100">
                      <span className="font-mono text-zinc-500">LLM Context Window</span>
                      <span className="rounded bg-amber-50 text-amber-800 font-bold font-mono text-[10px] px-1.5 py-0.5">
                        BLIND TO REALITY
                      </span>
                    </div>
                    <div className="rounded-md bg-zinc-900 text-zinc-100 p-3 font-mono text-[11px] space-y-1">
                      <div className="text-indigo-300">&gt; QUERY: &quot;Is server rack cooling fan spinning at Equinix DC4?&quot;</div>
                      <div className="text-red-400">&gt; HALLUCINATION RISK: High. No physical sensor or visual feed available.</div>
                      <div className="text-zinc-500">&gt; System cannot confirm ground truth. Severe hardware risk.</div>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-red-700 font-medium">
                      <AlertTriangle className="h-3.5 w-3.5 text-red-600 shrink-0" />
                      <span>Zero visibility into real-world inventory, delivery drops, or server racks.</span>
                    </div>
                  </div>
                )}

                {pillar.id === "escrow" && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-100">
                      <span className="font-mono text-zinc-500">PayPal Resolution Center</span>
                      <span className="rounded bg-red-50 text-red-700 font-bold font-mono text-[10px] px-1.5 py-0.5">
                        DISPUTE OPEN
                      </span>
                    </div>
                    <div className="rounded-md bg-zinc-900 text-zinc-100 p-3 font-mono text-[11px] space-y-1">
                      <div className="text-amber-400">&gt; CASE_ID: PP-D-998240 (Item Not Received)</div>
                      <div className="text-zinc-400">&gt; CLAIM: Buyer claims milestone deliverable was fraudulent.</div>
                      <div className="text-red-400">&gt; STATUS: $1,250.00 frozen for 14-21 days during manual review.</div>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-red-700 font-medium">
                      <AlertTriangle className="h-3.5 w-3.5 text-red-600 shrink-0" />
                      <span>Remote contracting plagued by chargebacks, manual disputes, and frozen funds.</span>
                    </div>
                  </div>
                )}

                {pillar.id === "cfo" && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-100">
                      <span className="font-mono text-zinc-500">Unmonitored Subscriptions</span>
                      <span className="rounded bg-red-50 text-red-700 font-bold font-mono text-[10px] px-1.5 py-0.5">
                        CAPITAL LEAKAGE
                      </span>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between bg-zinc-50 p-2 rounded border border-zinc-100">
                        <span className="text-zinc-700 font-medium">Idle GPU Cluster (0% past 30d)</span>
                        <span className="font-mono font-bold text-red-600">-$80.00/mo</span>
                      </div>
                      <div className="flex items-center justify-between bg-zinc-50 p-2 rounded border border-zinc-100">
                        <span className="text-zinc-700 font-medium">Over-provisioned Vector DB Tier</span>
                        <span className="font-mono font-bold text-red-600">-$45.00/mo</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-red-700 font-medium pt-1">
                      <AlertTriangle className="h-3.5 w-3.5 text-red-600 shrink-0" />
                      <span>Silent SaaS and GPU creep wastes 20%+ of startup operating runway.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 text-[11px] text-zinc-500 border-t border-red-100 flex items-center justify-between">
              <span>Failure outcome:</span>
              <strong className="text-red-700">Blocked operations &amp; wasted capital</strong>
            </div>
          </div>

          {/* RIGHT: THE NEXUSPULSE SOLUTION (EMERALD/INDIGO THEME) */}
          <div className="rounded-[12px] border border-zinc-200 bg-white p-5 space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  With NexusPulse: {pillar.solutionTitle}
                </span>
                <span className="rounded bg-emerald-100/70 border border-emerald-200 text-emerald-800 text-[10px] font-mono px-2 py-0.5 font-bold">
                  {pillar.solutionTag}
                </span>
              </div>

              {/* Dynamic Interactive Visual Mockup of the Solution */}
              <div className="mt-4 rounded-lg border border-emerald-200 bg-white p-4 shadow-2xs space-y-3">
                {pillar.id === "wallets" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-100">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="font-semibold text-zinc-900">PayPal Delegated Smart Wallet</span>
                      </div>
                      <span className="font-mono text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Orders API v2
                      </span>
                    </div>

                    <div className="bg-zinc-950 text-white rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-400">Cryptographic Mandate:</span>
                        <span className="font-mono text-emerald-400 font-bold">$189.00 / $250.00 Limit</span>
                      </div>
                      <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-emerald-500 h-1.5 rounded-full w-[75%]" />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1">
                        <span>Vendor: Channel3 Price Match</span>
                        <span className="text-zinc-300 font-mono">0% Card Exposure</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={handleSimulateAction}
                        className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-semibold shadow-2xs transition"
                      >
                        {simulatedCheckout ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Captured in 1.1s!</span>
                          </>
                        ) : (
                          <>
                            <Zap className="h-3.5 w-3.5" />
                            <span>Test 1-Click Agent Checkout</span>
                          </>
                        )}
                      </button>
                      <span className="text-[11px] font-mono text-emerald-800 font-semibold">
                        SLA: &lt; 1.2s
                      </span>
                    </div>
                  </div>
                )}

                {pillar.id === "oracles" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-100">
                      <div className="flex items-center gap-2">
                        <Camera className="h-3.5 w-3.5 text-indigo-600" />
                        <span className="font-semibold text-zinc-900">Proof-of-Human Micro-Bounty</span>
                      </div>
                      <span className="font-mono text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Payouts API v1
                      </span>
                    </div>

                    <div className="rounded-lg border border-indigo-100 bg-indigo-50/40 p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-zinc-900">Dallas DC4 Cooling Fan Check</span>
                        <span className="font-mono font-bold text-emerald-600">+$35.00 Payout</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-zinc-600">
                        <span className="rounded bg-white border border-indigo-200 px-1.5 py-0.5 font-mono">
                          GPS: 32.7767° N, 96.7970° W
                        </span>
                        <span className="rounded bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 font-mono">
                          Gemini 98.6% Pass
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Instant PayPal disbursement sent to Elena Rostova.</span>
                      </div>
                      <span className="font-mono text-xs font-bold text-zinc-900">1.4s SLA</span>
                    </div>
                  </div>
                )}

                {pillar.id === "escrow" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-100">
                      <div className="flex items-center gap-2">
                        <Lock className="h-3.5 w-3.5 text-indigo-600" />
                        <span className="font-semibold text-zinc-900">Bryntum Critical Path Escrow</span>
                      </div>
                      <span className="font-mono text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        AUTHORIZE Hold
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="h-5 w-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">1</span>
                        <span className="text-zinc-800 font-medium truncate">Code Commit: GitHub v2.4.0 verified</span>
                        <span className="ml-auto text-emerald-600 font-bold font-mono text-[10px]">PASS</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="h-5 w-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">2</span>
                        <span className="text-zinc-800 font-medium truncate">DHL Express #4920194821 Delivered</span>
                        <span className="ml-auto text-emerald-600 font-bold font-mono text-[10px]">PASS</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="h-5 w-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">3</span>
                        <span className="text-zinc-800 font-medium truncate">PayPal Authorization Capture released</span>
                        <span className="ml-auto text-indigo-600 font-bold font-mono text-[10px]">$1,250.00</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-emerald-800 pt-1">
                      <div className="flex items-center gap-1.5 font-medium">
                        <ShieldCheck className="h-4 w-4 text-emerald-600" />
                        <span>DHL Tracking attached automatically • Zero dispute risk.</span>
                      </div>
                    </div>
                  </div>
                )}

                {pillar.id === "cfo" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-100">
                      <div className="flex items-center gap-2">
                        <Bot className="h-3.5 w-3.5 text-indigo-600" />
                        <span className="font-semibold text-zinc-900">Gemini 4 Argon CFO Console</span>
                      </div>
                      <span className="font-mono text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Subscriptions v1
                      </span>
                    </div>

                    <div className="rounded-lg bg-zinc-950 text-white p-3 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-400">Annual Recovered Capital:</span>
                        <span className="font-mono text-emerald-400 font-bold text-sm">
                          {cfoOptimized ? "+$2,940.00 / yr" : "+$1,440.00 / yr"}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400">
                        {cfoOptimized
                          ? "✓ Downgrade executed via PayPal Subscriptions API v1. Plan downgraded to Serverless."
                          : "Detected idle GPU cluster (0% usage for 30 days). Ready for 1-click downgrade."}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={handleSimulateAction}
                        className="inline-flex h-8 items-center gap-1.5 rounded-[6px] bg-zinc-950 hover:bg-zinc-800 text-white px-3 text-[12px] font-medium transition"
                      >
                        <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                        <span>{cfoOptimized ? "Downgrade applied" : "Apply downgrade"}</span>
                      </button>
                      <span className="text-[11px] font-mono text-emerald-700 font-semibold">
                        {cfoOptimized ? "Saved $1,500/yr" : "Audited 24/7"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 text-[11px] text-zinc-500 border-t border-emerald-100 flex items-center justify-between">
              <span>Solution outcome:</span>
              <strong className="text-emerald-700">100% Autonomous, Verified &amp; Protected</strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
