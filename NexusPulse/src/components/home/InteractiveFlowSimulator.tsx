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
    badge: "Step 1 · Hold created",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
    title: "Buyer posts an inspection task",
    actor: "Operations team #402",
    actorRole: "Requester",
    action: "Needs photo confirmation of a server rack cooling fan at Equinix DC4 before scheduling maintenance.",
    payload: "Task reward: $35.00 USD | Hold ID: AUTH-HOLD-883192",
    latency: "12ms",
    tech: "Authorized hold",
  },
  {
    step: 2,
    badge: "Step 2 · Evidence uploaded",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    title: "Contributor uploads inspection proof",
    actor: "Elena Rostova",
    actorRole: "Verified Technician",
    action: "Inspects Rack B-14 on site, takes a photo of the obstructed fan rotor, and attaches timestamped metadata.",
    payload: "Attachment: IMG_20261112_DC4_RACKB14.jpg (SHA256: e8f1...39c2)",
    latency: "45s turnaround",
    tech: "Field evidence",
  },
  {
    step: 3,
    badge: "Step 3 · Review check",
    badgeColor: "bg-zinc-100 text-zinc-700 border-zinc-200",
    title: "Submission checked against criteria",
    actor: "Automated verification",
    actorRole: "Evidence Check",
    action: "Confirms rack serial number, visible defect, and facility coordinates match the task checklist.",
    payload: "Confidence: 98.6% | Rubric Score: 5/5",
    latency: "1.1s",
    tech: "Automated verification",
  },
  {
    step: 4,
    badge: "Step 4 · Payout sent",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    title: "PayPal sends payout to contributor",
    actor: "NexusPulse",
    actorRole: "Payout Processing",
    action: "Releases $35.00 to the contributor PayPal account and writes a receipt to the transaction ledger.",
    payload: "Payout ID: 9Y882310TX771 | Status: Sent",
    latency: "1.4s",
    tech: "PayPal Payouts",
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
            className="mt-2 text-[20px] font-semibold tracking-tight text-zinc-950"
          >
            How task payouts work
          </h2>
          <p className="mt-1 text-[13px] text-zinc-600 max-w-xl">
            Walk through how an inspection request holds funds, verifies uploaded proof, and settles via PayPal.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handlePlayToggle}
            className="inline-flex h-9 items-center gap-1.5 rounded-[6px] bg-zinc-950 hover:bg-zinc-800 px-3.5 text-[13px] font-medium text-white transition-colors"
          >
            {isPlaying ? (
              <>
                <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
                <span>Simulating...</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" strokeWidth={1.5} />
                <span>{activeStep === 4 ? "Replay walkthrough" : "Run sample flow"}</span>
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
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-[13px]">
          <div className="rounded-[8px] bg-white p-3 border border-zinc-200">
            <span className="text-[12px] font-medium text-zinc-600">
              Actor
            </span>
            <div className="mt-1 font-medium text-zinc-950">{current.actor}</div>
            <div className="text-[12px] text-zinc-600 mt-0.5">{current.actorRole}</div>
          </div>

          <div className="md:col-span-2 rounded-[8px] bg-white p-3 border border-zinc-200">
            <span className="text-[12px] font-medium text-zinc-600">
              Action
            </span>
            <p className="mt-1 text-zinc-700 leading-relaxed">
              {current.action}
            </p>
          </div>
        </div>

        {/* Payload */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-[6px] bg-zinc-900 px-3.5 py-2.5 text-[12px] text-zinc-200 font-mono">
          <div className="truncate">
            <span className="text-zinc-300">{current.payload}</span>
          </div>
          <span className="text-[12px] text-zinc-400 shrink-0">
            Sample simulation
          </span>
        </div>
      </div>

      {/* Simulated PayPal Payout Receipt (Appears at Step 4) */}
      {showReceipt && (
        <div className="rounded-[12px] border border-emerald-200 bg-emerald-50/40 p-4 sm:p-5 text-[13px] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-600" aria-hidden="true" />
              <span className="font-semibold text-zinc-950 text-[14px]">
                Sample payout receipt
              </span>
            </div>
            <span className="text-[12px] font-mono text-zinc-700">
              TX-PAYOUT-883192
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3 rounded-[8px] border border-zinc-200">
            <div>
              <div className="text-[12px] text-zinc-600">Amount sent</div>
              <div className="font-semibold text-emerald-700 tabular-nums">$35.00 USD</div>
            </div>
            <div>
              <div className="text-[12px] text-zinc-600">Recipient</div>
              <div className="font-medium text-zinc-900 truncate">elena.rostova@example.com</div>
            </div>
            <div>
              <div className="text-[12px] text-zinc-600">Check result</div>
              <div className="font-medium text-zinc-900">98.6% confidence</div>
            </div>
            <div>
              <div className="text-[12px] text-zinc-600">Time elapsed</div>
              <div className="font-medium text-zinc-900 tabular-nums">1.4s</div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[12px] text-zinc-700 pt-1">
            <span>Receipt recorded to the ledger.</span>
            {onExploreEngines && (
              <button
                type="button"
                onClick={onExploreEngines}
                className="font-medium text-indigo-600 hover:underline inline-flex items-center gap-1 shrink-0"
              >
                <span>Open verified tasks</span>
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
