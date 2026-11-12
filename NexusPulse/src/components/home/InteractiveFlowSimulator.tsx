"use client";

import React, { useState, useEffect } from "react";
import {
  Bot,
  UserCheck,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Play,
  RotateCcw,
  ExternalLink,
  DollarSign,
  Camera,
  Layers,
  Clock,
} from "lucide-react";

interface StepData {
  step: number;
  badge: string;
  badgeColor: string;
  title: string;
  actor: string;
  actorRole: string;
  action: string;
  payload: string;
  latency: string;
  tech: string;
}

const SIMULATION_STEPS: StepData[] = [
  {
    step: 1,
    badge: "01. Task Origination",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
    title: "Autonomous Agent Detects Physical Anomaly",
    actor: "Sentinel-AI Agent #402",
    actorRole: "Autonomous Infrastructure Agent",
    action: "Detects thermal spike in Equinix DC4 server rack. Requires human verification before rebooting mission-critical cluster.",
    payload: "Bounty Created: $35.00 USD | PayPal Escrow Lock: AUTH-HOLD-883192",
    latency: "12ms",
    tech: "PayPal Orders v2 AUTHORIZE",
  },
  {
    step: 2,
    badge: "02. Physical Proof",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    title: "Human Oracle Uploads Ground-Truth Evidence",
    actor: "Elena Rostova",
    actorRole: "Verified Level-3 Data Center Technician",
    action: "Arrives at Rack B-14, inspects cooling intake fan, snaps high-res photo showing fan #3 rotor obstruction, and uploads with geo-stamp.",
    payload: "Evidence: IMG_20261112_DC4_RACKB14.jpg (SHA256: e8f1...39c2)",
    latency: "45s total human turnaround",
    tech: "Proof-of-Human Mobile Oracle",
  },
  {
    step: 3,
    badge: "03. AI Vision Audit",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    title: "Gemini Multimodal Audits Against Rubric",
    actor: "Google Gemini 1.5 Pro / Flash",
    actorRole: "Autonomous Evidence Auditor",
    action: "Verifies rack serial tag, cooling impeller defect, and confirms GPS metadata matches Equinix Dallas coordinates. Zero hallucination.",
    payload: "Verification Confidence: 98.6% PASS | Rubric Score: 5/5",
    latency: "1,140ms",
    tech: "Gemini Multimodal Vision API",
  },
  {
    step: 4,
    badge: "04. Instant Settlement",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    title: "PayPal Disburses Instant Payout to Human",
    actor: "NexusPulse Clearinghouse",
    actorRole: "PayPal Smart Settlement Gateway",
    action: "Releases $35.00 directly to Elena's PayPal account with zero delay. Dispatches tracking confirmation and updates global ledger.",
    payload: "Payout ID: 9Y882310TX771 | Status: SUCCESS | Fee: $0.25 (Sponsored)",
    latency: "1.4s",
    tech: "PayPal Payouts API v1",
  },
];

interface InteractiveFlowSimulatorProps {
  onExploreEngines?: () => void;
}

export default function InteractiveFlowSimulator({
  onExploreEngines,
}: InteractiveFlowSimulatorProps) {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([1]);
  const [showReceipt, setShowReceipt] = useState<boolean>(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setTimeout(() => {
        if (activeStep < 4) {
          const next = activeStep + 1;
          setActiveStep(next);
          setCompletedSteps((prev) => Array.from(new Set([...prev, next])));
          if (next === 4) {
            setShowReceipt(true);
            setIsPlaying(false);
          }
        } else {
          setIsPlaying(false);
        }
      }, 2600);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, activeStep]);

  function handleSelectStep(step: number) {
    setIsPlaying(false);
    setActiveStep(step);
    setCompletedSteps((prev) => Array.from(new Set([...prev, step])));
    if (step === 4) {
      setShowReceipt(true);
    }
  }

  function handleReset() {
    setIsPlaying(false);
    setActiveStep(1);
    setCompletedSteps([1]);
    setShowReceipt(false);
  }

  function handlePlayToggle() {
    if (activeStep === 4) {
      setActiveStep(1);
      setCompletedSteps([1]);
      setShowReceipt(false);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  }

  const current = SIMULATION_STEPS.find((s) => s.step === activeStep) || SIMULATION_STEPS[0];

  return (
    <section
      aria-labelledby="flow-simulator-heading"
      className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-7 shadow-xs space-y-6"
    >
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 rounded-[6px] border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-[12px] font-medium text-zinc-700">
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" strokeWidth={1.5} />
            <span>Step-by-step walkthrough</span>
          </div>
          <h2
            id="flow-simulator-heading"
            className="mt-2 text-lg sm:text-xl font-bold tracking-tight text-zinc-950"
          >
            How It Works: The 4-Phase AI-to-Human Clearing Loop
          </h2>
          <p className="mt-1 text-xs text-zinc-500 max-w-xl">
            See how an autonomous AI agent hires a verified human for real-world verification, audits the proof via Gemini Vision, and settles instantly through PayPal.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handlePlayToggle}
            className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition"
          >
            {isPlaying ? (
              <>
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Simulating...</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 text-indigo-400 fill-indigo-400" />
                <span>{activeStep === 4 ? "Replay Flow" : "Run Live Simulation"}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleReset}
            title="Reset simulation"
            className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 p-2 text-zinc-600 transition"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Step Indicators Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
        {SIMULATION_STEPS.map((s) => {
          const isCurrent = s.step === activeStep;
          const isDone = completedSteps.includes(s.step);

          return (
            <button
              key={s.step}
              type="button"
              onClick={() => handleSelectStep(s.step)}
              className={`text-left rounded-xl p-3 border transition-all ${
                isCurrent
                  ? "border-indigo-500 bg-indigo-50/40 ring-2 ring-indigo-500/10 shadow-2xs"
                  : isDone
                  ? "border-zinc-200 bg-zinc-50/70 hover:border-zinc-300"
                  : "border-zinc-100 bg-zinc-50/30 opacity-70 hover:opacity-100"
              }`}
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className={`font-mono font-bold ${isCurrent ? "text-indigo-600" : "text-zinc-500"}`}>
                  0{s.step}
                </span>
                {isDone && (
                  <CheckCircle2 className={`h-3.5 w-3.5 ${isCurrent ? "text-indigo-600" : "text-emerald-600"}`} />
                )}
              </div>
              <div className="mt-1 font-semibold text-xs text-zinc-900 truncate">
                {s.title.split(" ")[0]} {s.title.split(" ")[1]}
              </div>
              <div className="text-[10px] text-zinc-400 truncate mt-0.5">
                {s.tech}
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Stage Deep-Dive Card */}
      <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/40 p-4 sm:p-5 transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-200/60">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-xl bg-white border border-zinc-200 flex items-center justify-center shadow-2xs shrink-0 mt-0.5">
              {activeStep === 1 && <Bot className="h-5 w-5 text-indigo-600" />}
              {activeStep === 2 && <Camera className="h-5 w-5 text-amber-600" />}
              {activeStep === 3 && <ShieldCheck className="h-5 w-5 text-indigo-600" strokeWidth={1.5} />}
              {activeStep === 4 && <DollarSign className="h-5 w-5 text-emerald-600" />}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-md border px-2 py-0.5 text-[10px] font-mono font-bold ${current.badgeColor}`}>
                  {current.badge}
                </span>
                <span className="text-xs text-zinc-500 font-medium">
                  Protocol SLA: <strong className="text-zinc-800">{current.latency}</strong>
                </span>
              </div>
              <h3 className="mt-1 text-base font-bold text-zinc-950">
                {current.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-center">
            <span className="rounded-full bg-white border border-zinc-200 px-3 py-1 text-xs font-mono text-zinc-700 shadow-2xs font-medium">
              {current.tech}
            </span>
          </div>
        </div>

        {/* Narrative & Context */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="rounded-lg bg-white p-3 border border-zinc-200/70 shadow-2xs">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              Primary Actor
            </span>
            <div className="mt-1 font-bold text-zinc-900">{current.actor}</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">{current.actorRole}</div>
          </div>

          <div className="md:col-span-2 rounded-lg bg-white p-3 border border-zinc-200/70 shadow-2xs">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              Autonomous Operation &amp; Ground Truth
            </span>
            <p className="mt-1 text-zinc-700 leading-relaxed">
              {current.action}
            </p>
          </div>
        </div>

        {/* Cryptographic / Financial Payload */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-zinc-900 px-3.5 py-2.5 text-xs text-zinc-200 font-mono">
          <div className="truncate">
            <span className="text-emerald-400 font-bold">$ </span>
            <span className="text-zinc-300">{current.payload}</span>
          </div>
          <span className="text-[11px] text-zinc-500 shrink-0">
            Validated by PayPal Gateway
          </span>
        </div>
      </div>

      {/* Simulated PayPal Payout Receipt (Appears at Step 4) */}
      {showReceipt && (
        <div className="nexus-fade-in rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 sm:p-5 text-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                ✓
              </div>
              <span className="font-bold text-emerald-950 text-sm">
                PayPal Payouts v1 Settlement Completed
              </span>
            </div>
            <span className="rounded bg-emerald-100/80 border border-emerald-300 text-emerald-800 text-[10px] font-mono px-2 py-0.5 font-bold">
              TX-PAYOUT-883192
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3 rounded-lg border border-emerald-200/60">
            <div>
              <div className="text-[10px] text-zinc-400 uppercase font-semibold">Net Disbursed</div>
              <div className="font-bold text-zinc-950 text-sm text-emerald-700">$35.00 USD</div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-400 uppercase font-semibold">Recipient</div>
              <div className="font-medium text-zinc-800 truncate">elena.rostova@personal.example.com</div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-400 uppercase font-semibold">Verification Rubric</div>
              <div className="font-medium text-zinc-800">Gemini Vision 98.6% Pass</div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-400 uppercase font-semibold">Execution Time</div>
              <div className="font-medium text-zinc-800">1.4 seconds (Instant)</div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-emerald-900 pt-1">
            <span>Proof of human verification securely archived to Supabase PostgreSQL &amp; AG Grid financial ledger.</span>
            {onExploreEngines && (
              <button
                type="button"
                onClick={onExploreEngines}
                className="font-semibold underline hover:text-emerald-950 inline-flex items-center gap-1 shrink-0"
              >
                <span>View in Bounties Engine</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
