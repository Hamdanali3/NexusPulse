"use client";

import React, { useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  Lock,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  Truck,
} from "lucide-react";
import type {
  PayPalEscrowMilestone,
  PayPalSubscriptionRecord,
} from "@/lib/paypal/paypal-types";

interface BryntumEscrowTimelineProps {
  milestones: PayPalEscrowMilestone[];
  subscriptions: PayPalSubscriptionRecord[];
  onStateUpdated: () => void;
}

export default function BryntumEscrowTimeline({
  milestones,
  subscriptions,
  onStateUpdated,
}: BryntumEscrowTimelineProps) {
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>(
    milestones.find((m) => m.status === "AUTH_HOLD_PENDING_DELIVERABLE")?.id ??
      milestones[0]?.id ??
      "ESCROW-102"
  );
  const selectedMilestone =
    milestones.find((m) => m.id === selectedMilestoneId) ?? milestones[0] ?? null;

  const [deliverableInput, setDeliverableInput] = useState<string>(
    selectedMilestone?.deliverable_proof ??
      "https://github.com/nexus-pulse/smart-clearinghouse/commit/9e8b7c6a5d4e3f210"
  );
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [optimizingSubId, setOptimizingSubId] = useState<string | null>(null);

  // New Milestone Form state
  const [showNewMilestoneModal, setShowNewMilestoneModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState(
    "Automated B2B Cross-Border Settlement Gateway"
  );
  const [newClientAgent, setNewClientAgent] = useState("Acme Global Logistics AI");
  const [newAmount, setNewAmount] = useState("1450.00");
  const [newRequirement, setNewRequirement] = useState(
    "Verify SHA256 cryptographic proof of international carrier bill of lading"
  );
  const [creatingMilestone, setCreatingMilestone] = useState(false);
  const [actionBanner, setActionBanner] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Date range anchor for Gantt bar calculations
  const timelineStart = new Date("2026-11-01T00:00:00Z").getTime();
  const timelineEnd = new Date("2026-11-30T23:59:59Z").getTime();
  const totalDuration = timelineEnd - timelineStart;

  function getBarPosition(startStr: string, endStr: string) {
    const s = Math.max(timelineStart, new Date(startStr).getTime());
    const e = Math.min(timelineEnd, new Date(endStr).getTime());
    const leftPercent = Math.max(0, Math.min(100, ((s - timelineStart) / totalDuration) * 100));
    const widthPercent = Math.max(8, Math.min(100 - leftPercent, ((e - s) / totalDuration) * 100));
    return {
      left: `${leftPercent.toFixed(1)}%`,
      width: `${widthPercent.toFixed(1)}%`,
    };
  }

  async function handleVerifyAndCapture(milestone: PayPalEscrowMilestone) {
    setVerifyingId(milestone.id);
    setActionBanner(null);
    try {
      const res = await fetch("/api/paypal/escrow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RELEASE_MILESTONE",
          milestoneId: milestone.id,
          submittedProof: deliverableInput,
        }),
      });
      const data = await res.json();
      if (data.ok && data.milestone) {
        setActionBanner({
          type: "success",
          text: `Escrow ${milestone.id} verified by Gemini 4 Argon! PayPal Authorization ${milestone.paypal_authorization_id} captured (${data.milestone.paypal_capture_id}) & Dispute Shield Tracking ${data.milestone.tracking_number} attached.`,
        });
        onStateUpdated();
      }
    } finally {
      setVerifyingId(null);
    }
  }

  async function handleCreateEscrowMilestone(e: React.FormEvent) {
    e.preventDefault();
    setCreatingMilestone(true);
    setActionBanner(null);
    try {
      const res = await fetch("/api/paypal/escrow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_MILESTONE",
          projectName: newProjectName,
          clientAgent: newClientAgent,
          amountValue: newAmount,
          deliverableRequirement: newRequirement,
        }),
      });
      const data = await res.json();
      if (data.ok && data.milestone) {
        setSelectedMilestoneId(data.milestone.id);
        setShowNewMilestoneModal(false);
        setActionBanner({
          type: "success",
          text: `Created PayPal AUTHORIZE Escrow Order ${data.milestone.paypal_order_id} (Auth ${data.milestone.paypal_authorization_id}) for $${data.milestone.amount.value} USD.`,
        });
        onStateUpdated();
      }
    } finally {
      setCreatingMilestone(false);
    }
  }

  async function handleOptimizeSubscription(
    sub: PayPalSubscriptionRecord,
    action: "REVISE_DOWNGRADE" | "CANCEL_UNUSED" | "NEGOTIATE_DISCOUNT"
  ) {
    setOptimizingSubId(sub.id);
    setActionBanner(null);
    try {
      const res = await fetch("/api/paypal/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptionId: sub.id,
          action,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setActionBanner({
          type: "success",
          text: `Optimized ${sub.plan_name} (${sub.id}) via PayPal Subscriptions v1 API — saved $${Number(data.monthlySaved ?? 0).toFixed(2)}/mo ($${Number(data.annualSaved ?? 0).toFixed(2)}/yr).`,
        });
        onStateUpdated();
      }
    } finally {
      setOptimizingSubId(null);
    }
  }

  return (
    <section aria-labelledby="engine-3-heading" className="space-y-6">
      {actionBanner && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs text-emerald-800 flex items-center justify-between shadow-xs animate-bounce"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{actionBanner.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionBanner(null)}
            className="text-emerald-700 hover:text-emerald-950 text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* BRYNTUM INTERACTIVE ESCROW GANTT & RESOURCE TIMELINE */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                <Calendar className="h-3.5 w-3.5 text-indigo-600" />
                Bryntum Gantt Scheduler
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                <Lock className="h-3 w-3 text-emerald-600" />
                PayPal Orders v2 AUTHORIZE
              </span>
            </div>
            <h3 id="engine-3-heading" className="mt-1.5 text-lg font-bold text-slate-950">
              Engine 3: Milestone Escrow &amp; Dispute Protection
            </h3>
            <p className="text-xs text-slate-600">
              Authorization holds tracked on an interactive Gantt timeline with automated deliverable verification.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowNewMilestoneModal((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition hover:scale-105 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            New PayPal Auth Escrow Milestone
          </button>
        </div>

        {/* New Milestone Form Drawer */}
        {showNewMilestoneModal && (
          <form
            onSubmit={handleCreateEscrowMilestone}
            className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 space-y-3 nexus-fade-in"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-900">
                Create Programmable PayPal Authorization Hold (POST /v2/checkout/orders [intent=AUTHORIZE])
              </span>
              <button
                type="button"
                onClick={() => setShowNewMilestoneModal(false)}
                className="text-xs text-slate-500 hover:text-slate-800 font-medium"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label
                  htmlFor="milestone-title-input"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Milestone Title
                </label>
                <input
                  id="milestone-title-input"
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 shadow-xs focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="milestone-client-input"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Client Agent Counterparty
                </label>
                <input
                  id="milestone-client-input"
                  type="text"
                  value={newClientAgent}
                  onChange={(e) => setNewClientAgent(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 shadow-xs focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="milestone-amount-input"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Escrow Hold Amount (USD)
                </label>
                <input
                  id="milestone-amount-input"
                  type="number"
                  step="0.01"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 shadow-xs focus:border-indigo-500"
                  required
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="milestone-req-input"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Cryptographic Verification Requirement (Evaluated by Gemini 4 Argon before Capture)
              </label>
              <input
                id="milestone-req-input"
                type="text"
                value={newRequirement}
                onChange={(e) => setNewRequirement(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 shadow-xs focus:border-indigo-500"
                required
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={creatingMilestone}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-1.5 text-xs font-bold text-white shadow-xs transition hover:scale-105 active:scale-95"
              >
                <Lock className="h-3.5 w-3.5" />
                {creatingMilestone
                  ? "Locking PayPal Auth Hold..."
                  : `Lock $${newAmount} USD in PayPal Escrow`}
              </button>
            </div>
          </form>
        )}

        {/* Bryntum Timeline Grid Header */}
        <div className="mt-4 overflow-x-auto">
          <div className="min-w-[780px] rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            {/* Timeline Date Scale Header */}
            <div className="grid grid-cols-12 border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-800">
              <div className="col-span-4 px-3.5 py-2.5 border-r border-slate-200">
                WBS Task / Authorization ID
              </div>
              <div className="col-span-2 px-3 py-2.5 border-r border-slate-200 text-right">
                Locked Escrow
              </div>
              <div className="col-span-6 grid grid-cols-6 text-center text-slate-700 font-semibold">
                <div className="py-2.5 border-r border-slate-200">Nov 01–05</div>
                <div className="py-2.5 border-r border-slate-200">Nov 06–10</div>
                <div className="py-2.5 border-r border-slate-200 bg-indigo-100/90 font-bold text-indigo-950">
                  Nov 11–15 (Active)
                </div>
                <div className="py-2.5 border-r border-slate-200">Nov 16–20</div>
                <div className="py-2.5 border-r border-slate-200">Nov 21–25</div>
                <div className="py-2.5">Nov 26–30</div>
              </div>
            </div>

            {/* Milestone Gantt Rows */}
            <div className="divide-y divide-slate-100">
              {milestones.map((m, idx) => {
                const pos = getBarPosition(m.start_date, m.end_date);
                const isSelected = selectedMilestone?.id === m.id;
                const isCaptured = m.status === "AI_VERIFIED_CAPTURED";

                return (
                  <div
                    key={m.id}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    onClick={() => setSelectedMilestoneId(m.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedMilestoneId(m.id);
                      }
                    }}
                    className={`grid grid-cols-12 items-center text-xs transition cursor-pointer ${
                      isSelected
                        ? "bg-indigo-50/70"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="col-span-4 px-3.5 py-3 border-r border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-slate-100 border border-slate-200 text-xs font-mono font-bold text-slate-800">
                          1.{idx + 1}
                        </span>
                        <span className="font-bold text-slate-900 truncate">
                          {m.project_name}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-600">
                        <span className="font-mono text-indigo-700 font-semibold">
                          Auth: {m.paypal_authorization_id}
                        </span>
                        <span>•</span>
                        <span className="truncate text-slate-600 font-medium">{m.client_agent}</span>
                      </div>
                    </div>

                    <div className="col-span-2 px-3 py-3 border-r border-slate-200 text-right tabular-nums">
                      <div className="font-mono font-extrabold text-slate-950">
                        ${m.amount.value} {m.amount.currency_code}
                      </div>
                      <span
                        className={`inline-block mt-0.5 rounded px-2 py-0.5 text-[11px] font-bold ${
                          isCaptured
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-amber-50 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {isCaptured ? "CAPTURED + TRACKED" : "AUTH HOLD LOCKED"}
                      </span>
                    </div>

                    {/* Gantt Bar Canvas */}
                    <div className="col-span-6 relative h-14 px-2 flex items-center">
                      <div className="absolute inset-0 grid grid-cols-6 pointer-events-none">
                        <div className="border-r border-slate-100" />
                        <div className="border-r border-slate-100" />
                        <div className="border-r border-indigo-200 bg-indigo-50/30" />
                        <div className="border-r border-slate-100" />
                        <div className="border-r border-slate-100" />
                        <div />
                      </div>

                      <div
                        style={{ left: pos.left, width: pos.width }}
                        className={`relative z-10 h-7 rounded-lg border px-2.5 flex items-center justify-between text-xs font-bold shadow-xs transition-all hover:scale-[1.02] ${
                          isCaptured
                            ? "border-emerald-500 bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-emerald-500/20"
                            : "border-amber-400 bg-gradient-to-r from-amber-500 to-indigo-600 text-white shadow-amber-500/20"
                        }`}
                      >
                        <span className="truncate">
                          {m.id} ({m.progress_percent}%)
                        </span>
                        {m.dependencies && m.dependencies.length > 0 && (
                          <span className="ml-1 rounded bg-black/30 px-1 py-0.5 font-mono text-[10px] text-white">
                            dep→{m.dependencies.join(",")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Milestone Inspector & Gemini 4 Argon Capture Trigger */}
        {selectedMilestone && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4 shadow-xs nexus-fade-in">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-indigo-100 border border-indigo-200 px-2 py-0.5 font-mono text-xs font-bold text-indigo-800">
                    {selectedMilestone.id}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900">
                    {selectedMilestone.project_name}
                  </h4>
                </div>
                <p className="mt-1.5 text-xs text-slate-700">
                  <strong className="text-slate-900">Requirement:</strong>{" "}
                  {selectedMilestone.deliverable_requirement}
                </p>
                <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                  <span>
                    PayPal Order:{" "}
                    <code className="text-slate-900 font-mono font-bold bg-white px-2 py-0.5 rounded border border-slate-200 shadow-xs">
                      {selectedMilestone.paypal_order_id}
                    </code>
                  </span>
                  <span>
                    Authorization Hold:{" "}
                    <code className="text-amber-800 font-mono font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      {selectedMilestone.paypal_authorization_id}
                    </code>
                  </span>
                  {selectedMilestone.paypal_capture_id && (
                    <span>
                      Capture ID:{" "}
                      <code className="text-emerald-800 font-mono font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {selectedMilestone.paypal_capture_id}
                      </code>
                    </span>
                  )}
                  {selectedMilestone.tracking_number && (
                    <span className="inline-flex items-center gap-1 text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <Truck className="h-3.5 w-3.5 text-emerald-600" />
                      Tracker: <code>{selectedMilestone.tracking_number}</code> ({selectedMilestone.carrier})
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right tabular-nums">
                <div className="text-xs text-slate-500 font-medium">Authorized Hold</div>
                <div className="text-xl font-extrabold text-slate-950">
                  ${selectedMilestone.amount.value} {selectedMilestone.amount.currency_code}
                </div>
              </div>
            </div>

            {selectedMilestone.status !== "AI_VERIFIED_CAPTURED" ? (
              <div className="mt-4 pt-3 border-t border-slate-200 space-y-3">
                <label
                  htmlFor="deliverable-proof-input"
                  className="block text-xs font-semibold text-slate-800"
                >
                  Submit Cryptographic Deliverable Evidence for Gemini 4 Argon Audit &amp; Automatic PayPal Capture:
                </label>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    id="deliverable-proof-input"
                    type="text"
                    value={deliverableInput}
                    onChange={(e) => setDeliverableInput(e.target.value)}
                    className="flex-1 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 shadow-xs focus:border-indigo-500"
                    placeholder="Paste GitHub commit hash, OpenAPI spec report, or test artifact proof..."
                  />
                  <button
                    type="button"
                    disabled={verifyingId === selectedMilestone.id}
                    onClick={() => handleVerifyAndCapture(selectedMilestone)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:scale-105 active:scale-95 shrink-0"
                  >
                    <Sparkles className="h-4 w-4 text-emerald-200" />
                    {verifyingId === selectedMilestone.id
                      ? "Gemini 4 Argon Auditing & Capturing..."
                      : `Verify & Capture $${selectedMilestone.amount.value} Hold`}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-3 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-800 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200 font-semibold">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong>AI Audit &amp; Dispute Shield Complete:</strong>{" "}
                    {selectedMilestone.ai_audit_notes}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SUBSCRIPTION RENEWAL SCHEDULER & AUTONOMOUS GUARD */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                <TrendingDown className="h-3.5 w-3.5 text-amber-600" />
                PayPal Subscriptions v1 API
              </span>
              <span className="text-xs text-slate-500 font-mono">
                POST /v1/billing/subscriptions/&#123;id&#125;/revise &amp; /cancel
              </span>
            </div>
            <h3 className="mt-1 text-base font-bold text-slate-950">
              Autonomous Subscription Renewal Scheduler &amp; Leakage Eliminator
            </h3>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {subscriptions.map((sub) => (
            <div
              key={sub.id}
              className="rounded-xl border border-slate-200 bg-white hover:border-slate-300 p-4 flex flex-col justify-between shadow-xs transition hover:scale-[1.02]"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-slate-500 font-semibold">
                    {sub.id}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      sub.status === "ACTIVE"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-slate-100 text-slate-700 border border-slate-200"
                    }`}
                  >
                    {sub.status}
                  </span>
                </div>

                <h4 className="mt-2 text-sm font-bold text-slate-950">
                  {sub.plan_name}
                </h4>
                <p className="text-xs text-slate-500 font-medium">{sub.merchant_name}</p>

                <div className="mt-3 flex items-baseline justify-between border-y border-slate-100 py-2 tabular-nums">
                  <div>
                    <div className="text-[11px] text-slate-500 font-medium">Current Rate</div>
                    <div className="text-sm font-bold text-slate-950">
                      ${sub.billing_amount.value}/mo
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500 font-medium">Benchmark</div>
                    <div className="text-sm font-bold text-emerald-600">
                      ${sub.market_benchmark_amount.value}/mo
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] text-slate-500 font-medium">AI Savings</div>
                    <div className="text-sm font-extrabold text-amber-700">
                      +${sub.potential_monthly_savings.value}/mo
                    </div>
                  </div>
                </div>

                <p className="mt-2.5 text-xs text-slate-600 leading-relaxed">
                  <strong className="text-indigo-700 font-bold">Gemini Audit:</strong>{" "}
                  {sub.ai_rationale}
                </p>
              </div>

              <div className="mt-4 pt-2 flex flex-wrap gap-2">
                {sub.status === "ACTIVE" &&
                Number(sub.potential_monthly_savings.value) > 0 ? (
                  <button
                    type="button"
                    disabled={optimizingSubId === sub.id}
                    onClick={() =>
                      handleOptimizeSubscription(
                        sub,
                        sub.ai_recommendation === "CANCEL_UNUSED"
                          ? "CANCEL_UNUSED"
                          : "REVISE_DOWNGRADE"
                      )
                    }
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-300 px-3 py-2 text-xs font-bold text-amber-900 transition hover:scale-102 active:scale-98 shadow-xs"
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 ${
                        optimizingSubId === sub.id ? "animate-spin" : ""
                      }`}
                    />
                    {optimizingSubId === sub.id
                      ? "Executing via PayPal API..."
                      : sub.ai_recommendation === "CANCEL_UNUSED"
                      ? `Cancel Zombie Sub (+$${sub.potential_monthly_savings.value}/mo)`
                      : `Auto-Revise Plan (+$${sub.potential_monthly_savings.value}/mo)`}
                  </button>
                ) : (
                  <div className="w-full rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-center text-xs font-bold text-emerald-800">
                    ✓ Optimized via PayPal Subscriptions API
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
