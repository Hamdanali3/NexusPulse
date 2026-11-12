"use client";

import React, { useState } from "react";
import {
  Analytics01Icon,
  ArrowRight02Icon,
  Camera01Icon,
  CancelCircleIcon,
  CheckmarkCircle02Icon,
  CreditCardIcon,
  SecurityCheckIcon,
  SquareLock02Icon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import { AppIcon } from "@/components/ui/Icon";

interface FeaturePillar {
  id: string;
  tabTitle: string;
  tabIcon: IconSvgElement;
  engineLabel: string;
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
    tabTitle: "Spending limits",
    tabIcon: CreditCardIcon,
    engineLabel: "Price watch",
    engineTab: "channel3",
    headline: "Approve purchases within set price targets",
    subheadline: "Set maximum target prices on tracked items instead of sharing raw payment credentials.",
    metricBefore: "Manual review",
    metricAfter: "Policy-checked (Demo)",
    problemTitle: "Unbounded checkout",
    problemTag: "No target cap",
    solutionTitle: "Price-capped approval",
    solutionTag: "Target rule",
  },
  {
    id: "oracles",
    tabTitle: "Field verification",
    tabIcon: Camera01Icon,
    engineLabel: "Verified tasks",
    engineTab: "bounties",
    headline: "Confirm real-world work before sending money",
    subheadline: "Technicians attach notes or photos checked against task criteria before payout release.",
    metricBefore: "Unchecked claim",
    metricAfter: "Verified payout (Demo)",
    problemTitle: "Unverified completion",
    problemTag: "Missing proof",
    solutionTitle: "Checklist review",
    solutionTag: "Photo & notes",
  },
  {
    id: "escrow",
    tabTitle: "Milestone escrow",
    tabIcon: SquareLock02Icon,
    engineLabel: "Milestone escrow",
    engineTab: "bryntum",
    headline: "Hold funds until scheduled deliverables finish",
    subheadline: "Keep milestone authorizations held cleanly until completion proof is reviewed.",
    metricBefore: "Early release",
    metricAfter: "Held on delivery (Demo)",
    problemTitle: "Upfront release risk",
    problemTag: "Open dispute",
    solutionTitle: "Staged release",
    solutionTag: "Escrow hold",
  },
  {
    id: "cfo",
    tabTitle: "Spending review",
    tabIcon: Analytics01Icon,
    engineLabel: "Spending review",
    engineTab: "aggrid",
    headline: "Spot unused subscriptions before they renew",
    subheadline: "Review active recurring plans, see projected annual costs, and confirm downgrades.",
    metricBefore: "Idle seats",
    metricAfter: "Reviewed plans (Demo)",
    problemTitle: "Silent renewals",
    problemTag: "Idle seats",
    solutionTitle: "Confirmed changes",
    solutionTag: "Plan review",
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
      className="rounded-[12px] border border-zinc-200 bg-white p-6 space-y-6"
    >
      {/* Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-4">
        <div>
          <span className="text-[12px] font-medium text-indigo-700">
            Workflow comparison
          </span>
          <h2
            id="problem-solution-heading"
            className="mt-1 text-[20px] font-semibold tracking-tight text-zinc-950"
          >
            How spending rules and verification work together
          </h2>
          <p className="mt-1 text-[13px] text-zinc-600 max-w-xl">
            Select a workflow below to compare unguarded transactions against rule-checked payments.
          </p>
        </div>

        {onSelectEngine && (
          <button
            type="button"
            onClick={() => onSelectEngine(pillar.engineTab)}
            className="inline-flex h-9 items-center gap-1.5 rounded-[6px] border border-zinc-200 bg-white hover:bg-zinc-50 px-3.5 text-[13px] font-medium text-zinc-800 transition self-start sm:self-center shrink-0"
          >
            <span>Open {pillar.engineLabel}</span>
            <AppIcon icon={ArrowRight02Icon} size="sm" className="text-zinc-500" />
          </button>
        )}
      </div>

      {/* Neutral Tab Switcher */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {PILLARS.map((p) => {
          const isActive = p.id === activePillarId;

          return (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setActivePillarId(p.id);
                setSimulatedCheckout(false);
              }}
              className={`rounded-[6px] px-3 py-2.5 border transition-colors text-left flex items-center gap-2.5 ${
                isActive
                  ? "border-indigo-600 bg-indigo-50/50 text-zinc-950"
                  : "border-zinc-200 bg-[#fafafa] hover:bg-white text-zinc-700"
              }`}
            >
              <AppIcon
                icon={p.tabIcon}
                size="sm"
                className={isActive ? "text-indigo-600" : "text-zinc-600"}
              />
              <div className="min-w-0">
                <div className="text-[13px] font-medium truncate">{p.tabTitle}</div>
                <div className="text-[12px] text-zinc-600 truncate">
                  {p.metricAfter}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Workflow Stage: Neutral Side-by-Side Comparison */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#fafafa] px-4 py-3.5 rounded-[12px] border border-zinc-200">
          <div>
            <span className="text-[12px] font-medium text-zinc-600">
              {pillar.engineLabel} · Demo simulation
            </span>
            <h3 className="mt-0.5 text-[15px] font-semibold text-zinc-950">
              {pillar.headline}
            </h3>
            <p className="text-[13px] text-zinc-600 mt-0.5">
              {pillar.subheadline}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start sm:self-center text-[12px]">
            <div>
              <span className="text-zinc-600 block">Without checks</span>
              <span className="font-medium text-red-700">{pillar.metricBefore}</span>
            </div>
            <span className="text-zinc-400">→</span>
            <div>
              <span className="text-zinc-600 block">With NexusPulse</span>
              <span className="font-medium text-emerald-700">{pillar.metricAfter}</span>
            </div>
          </div>
        </div>

        {/* Neutral Panels with Semantic Status Indicators */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* LEFT: WITHOUT GUARDRAILS (neutral surface, red dot/text accent only) */}
          <div className="rounded-[12px] border border-zinc-200 bg-[#fafafa] p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-zinc-200">
                <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-zinc-950">
                  <AppIcon icon={CancelCircleIcon} size="sm" className="text-red-700" />
                  Without guardrails: {pillar.problemTitle}
                </span>
                <span className="text-[12px] font-medium text-red-700 whitespace-nowrap">
                  ● {pillar.problemTag}
                </span>
              </div>

              <div className="rounded-[6px] border border-zinc-200 bg-white p-4 space-y-3 text-[13px]">
                {pillar.id === "wallets" && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-200 text-[12px]">
                      <span className="font-mono text-zinc-600">Checkout request</span>
                      <span className="font-medium text-red-700">Declined (HTTP 403)</span>
                    </div>
                    <div className="rounded-[6px] border border-zinc-200 bg-[#fafafa] p-3 font-mono text-[12px] text-zinc-800 space-y-1">
                      <div>&gt; CHECKOUT_ATTEMPT: session_881</div>
                      <div className="text-zinc-600">&gt; No approved spending cap or payer on file.</div>
                      <div className="text-red-700">&gt; Payment paused pending manual review.</div>
                    </div>
                    <p className="text-[12px] text-zinc-600">
                      Unbounded purchases either fail checkout or expose raw payment methods.
                    </p>
                  </div>
                )}

                {pillar.id === "oracles" && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-200 text-[12px]">
                      <span className="font-mono text-zinc-600">Field status</span>
                      <span className="font-medium text-red-700">No physical proof</span>
                    </div>
                    <div className="rounded-[6px] border border-zinc-200 bg-[#fafafa] p-3 font-mono text-[12px] text-zinc-800 space-y-1">
                      <div>&gt; TASK: Check intake fan status at Rack B-14</div>
                      <div className="text-zinc-600">&gt; Status: No inspection photo or sensor reading attached.</div>
                      <div className="text-red-700">&gt; Outcome: Payout withheld until evidence is uploaded.</div>
                    </div>
                    <p className="text-[12px] text-zinc-600">
                      Releasing payouts without photo or site proof increases completion disputes.
                    </p>
                  </div>
                )}

                {pillar.id === "escrow" && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-200 text-[12px]">
                      <span className="font-mono text-zinc-600">Resolution queue</span>
                      <span className="font-medium text-red-700">Dispute opened</span>
                    </div>
                    <div className="rounded-[6px] border border-zinc-200 bg-[#fafafa] p-3 font-mono text-[12px] text-zinc-800 space-y-1">
                      <div>&gt; CASE_ID: PP-D-998240</div>
                      <div className="text-zinc-600">&gt; CLAIM: Work marked complete before deliverable check.</div>
                      <div className="text-red-700">&gt; STATUS: $1,250.00 held during manual dispute review.</div>
                    </div>
                    <p className="text-[12px] text-zinc-600">
                      Paying full milestones upfront leaves buyers exposed when criteria are unmet.
                    </p>
                  </div>
                )}

                {pillar.id === "cfo" && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-200 text-[12px]">
                      <span className="font-mono text-zinc-600">Recurring plans</span>
                      <span className="font-medium text-red-700">Unused charges</span>
                    </div>
                    <div className="divide-y divide-zinc-200 rounded-[6px] border border-zinc-200 bg-[#fafafa] text-[12px]">
                      <div className="flex items-center justify-between px-3 py-2">
                        <span className="text-zinc-800 font-medium">Idle GPU cluster (0% 30d usage)</span>
                        <span className="tabular-nums font-medium text-red-700">−$80.00/mo</span>
                      </div>
                      <div className="flex items-center justify-between px-3 py-2">
                        <span className="text-zinc-800 font-medium">Over-sized search index plan</span>
                        <span className="tabular-nums font-medium text-red-700">−$45.00/mo</span>
                      </div>
                    </div>
                    <p className="text-[12px] text-zinc-600">
                      Unmonitored recurring renewals keep charging long after team usage drops.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2.5 text-[12px] text-zinc-600 border-t border-zinc-200 flex items-center justify-between">
              <span>Outcome</span>
              <span className="font-medium text-zinc-900">Unverified spend and delays</span>
            </div>
          </div>

          {/* RIGHT: WITH NEXUSPULSE (neutral surface, emerald/indigo semantic accent) */}
          <div className="rounded-[12px] border border-zinc-200 bg-[#fafafa] p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-zinc-200">
                <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-zinc-950">
                  <AppIcon icon={CheckmarkCircle02Icon} size="sm" className="text-emerald-700" />
                  With NexusPulse: {pillar.solutionTitle}
                </span>
                <span className="text-[12px] font-medium text-emerald-700 whitespace-nowrap">
                  ● {pillar.solutionTag}
                </span>
              </div>

              <div className="rounded-[6px] border border-zinc-200 bg-white p-4 space-y-3 text-[13px]">
                {pillar.id === "wallets" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-200 text-[12px]">
                      <span className="font-medium text-zinc-900">Price watch checkout</span>
                      <span className="text-emerald-700 font-medium">Policy verified</span>
                    </div>

                    <div className="rounded-[6px] border border-zinc-200 bg-[#fafafa] p-3 space-y-2">
                      <div className="flex items-center justify-between text-[12px]">
                        <span className="text-zinc-600">Target ceiling: 75% used</span>
                        <span className="tabular-nums font-medium text-zinc-950">$189.00 / $250.00</span>
                      </div>
                      <div className="w-full bg-zinc-200 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-indigo-600 h-1.5 rounded-full w-[75%]" />
                      </div>
                      <div className="flex items-center justify-between text-[12px] text-zinc-600">
                        <span>Target matched</span>
                        <span>Explicit PayPal checkout</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={handleSimulateAction}
                        className="inline-flex h-8 items-center gap-1.5 rounded-[6px] bg-zinc-950 hover:bg-zinc-800 text-white px-3 text-[12px] font-medium transition"
                      >
                        {simulatedCheckout ? (
                          <>
                            <AppIcon icon={CheckmarkCircle02Icon} size="xs" />
                            <span>Simulated capture complete</span>
                          </>
                        ) : (
                          <span>Run demo check</span>
                        )}
                      </button>
                      <span className="text-[12px] text-zinc-600">
                        Demo simulation
                      </span>
                    </div>
                  </div>
                )}

                {pillar.id === "oracles" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-200 text-[12px]">
                      <span className="font-medium text-zinc-900 flex items-center gap-1.5">
                        <AppIcon icon={Camera01Icon} size="xs" className="text-zinc-600" />
                        Field check review
                      </span>
                      <span className="text-emerald-700 font-medium">Payout approved</span>
                    </div>

                    <div className="rounded-[6px] border border-zinc-200 bg-[#fafafa] p-3 space-y-1.5">
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="font-medium text-zinc-900">Dallas cooling fan check</span>
                        <span className="tabular-nums font-semibold text-emerald-700">+$35.00</span>
                      </div>
                      <div className="text-[12px] text-zinc-600">
                        GPS coordinates matched · Inspection photo verified
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[12px] text-zinc-600">
                      <span className="text-emerald-700 font-medium">
                        Payout sent upon review
                      </span>
                      <span>Demo simulation</span>
                    </div>
                  </div>
                )}

                {pillar.id === "escrow" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-200 text-[12px]">
                      <span className="font-medium text-zinc-900 flex items-center gap-1.5">
                        <AppIcon icon={SquareLock02Icon} size="xs" className="text-zinc-600" />
                        Milestone release steps
                      </span>
                      <span className="text-indigo-700 font-medium">Authorization held</span>
                    </div>

                    <div className="divide-y divide-zinc-200 rounded-[6px] border border-zinc-200 bg-[#fafafa] text-[12px]">
                      <div className="flex items-center justify-between px-3 py-2">
                        <span className="text-zinc-900 font-medium">1. Deliverable proof checked</span>
                        <span className="text-emerald-700 font-medium">Verified</span>
                      </div>
                      <div className="flex items-center justify-between px-3 py-2">
                        <span className="text-zinc-900 font-medium">2. Carrier delivery confirmed</span>
                        <span className="text-emerald-700 font-medium">Delivered</span>
                      </div>
                      <div className="flex items-center justify-between px-3 py-2">
                        <span className="text-zinc-900 font-medium">3. Escrow funds captured</span>
                        <span className="tabular-nums font-medium text-indigo-700">$1,250.00</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[12px] text-zinc-600">
                      <AppIcon icon={SecurityCheckIcon} size="sm" className="text-emerald-700" />
                      <span>Funds remain protected until completion criteria are met.</span>
                    </div>
                  </div>
                )}

                {pillar.id === "cfo" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-200 text-[12px]">
                      <span className="font-medium text-zinc-900 flex items-center gap-1.5">
                        <AppIcon icon={Analytics01Icon} size="xs" className="text-zinc-600" />
                        Subscription audit
                      </span>
                      <span className="text-emerald-700 font-medium">Savings ready</span>
                    </div>

                    <div className="rounded-[6px] border border-zinc-200 bg-[#fafafa] p-3 space-y-1">
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="text-zinc-600">Projected annual savings (demo)</span>
                        <span className="tabular-nums text-emerald-700 font-semibold">
                          {cfoOptimized ? "+$2,940.00 / yr" : "+$1,440.00 / yr"}
                        </span>
                      </div>
                      <p className="text-[12px] text-zinc-600">
                        {cfoOptimized
                          ? "Simulated plan downgrade confirmed for idle cluster."
                          : "Flagged an unused compute plan with 0% usage over 30 days."}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={handleSimulateAction}
                        className="inline-flex h-8 items-center gap-1.5 rounded-[6px] bg-zinc-950 hover:bg-zinc-800 text-white px-3 text-[12px] font-medium transition"
                      >
                        <AppIcon icon={ArrowRight02Icon} size="xs" />
                        <span>{cfoOptimized ? "Downgrade simulated" : "Simulate downgrade"}</span>
                      </button>
                      <span className="text-[12px] text-emerald-700 font-medium">
                        {cfoOptimized ? "Saves $1,500.00/yr" : "Requires confirmation"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2.5 text-[12px] text-zinc-600 border-t border-zinc-200 flex items-center justify-between">
              <span>Outcome</span>
              <span className="font-medium text-emerald-700">Verified and user-confirmed</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
