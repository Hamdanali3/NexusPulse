"use client";

import React, { useMemo, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Lock,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  Truck,
} from "lucide-react";
import type {
  PayPalSubscriptionRecord,
  SmartEscrowMilestone,
} from "@/lib/paypal/paypal-types";

interface BryntumEscrowTimelineProps {
  milestones: SmartEscrowMilestone[];
  subscriptions: PayPalSubscriptionRecord[];
  onStateUpdated: () => void;
}

export default function BryntumEscrowTimeline({
  milestones,
  subscriptions,
  onStateUpdated,
}: BryntumEscrowTimelineProps) {
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>(
    milestones.find((m) => m.status !== "AI_VERIFIED_CAPTURED")?.id ??
      milestones[0]?.id ??
      "ESCROW-102"
  );
  const [deliverableInput, setDeliverableInput] = useState<string>(
    "GitHub Release Tag v2.4.0-prod (SHA256: 9f4d8e2c7a1b) + Playwright E2E Suite 42/42 Passed + APIMatic OpenAPI 3.1 Lint 0 Errors + Lighthouse 99/100."
  );
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [optimizingSubId, setOptimizingSubId] = useState<string | null>(null);
  const [showNewMilestoneModal, setShowNewMilestoneModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState(
    "Agentic Treasury Webhook Firewall & Dispute Auto-Responder"
  );
  const [newClientAgent, setNewClientAgent] = useState(
    "NexusPulse Autonomous Procurement Agent"
  );
  const [newAmount, setNewAmount] = useState("320.00");
  const [newRequirement, setNewRequirement] = useState(
    "Zero-downtime PayPal Webhook signature verifier with automated tracking proof injection."
  );
  const [creatingMilestone, setCreatingMilestone] = useState(false);
  const [actionBanner, setActionBanner] = useState<{
    type: "success" | "info";
    text: string;
  } | null>(null);

  const selectedMilestone = useMemo(
    () =>
      milestones.find((m) => m.id === selectedMilestoneId) ?? milestones[0] ?? null,
    [milestones, selectedMilestoneId]
  );

  const timelineStart = new Date("2026-11-01T00:00:00Z").getTime();
  const timelineEnd = new Date("2026-11-30T23:59:59Z").getTime();
  const totalSpan = timelineEnd - timelineStart;

  function getBarPosition(startIso: string, endIso: string) {
    const start = Math.max(timelineStart, new Date(startIso).getTime());
    const end = Math.min(timelineEnd, new Date(endIso).getTime());
    const leftPercent = Math.max(
      0,
      Math.min(92, ((start - timelineStart) / totalSpan) * 100)
    );
    const widthPercent = Math.max(
      8,
      Math.min(100 - leftPercent, ((end - start) / totalSpan) * 100)
    );
    return {
      left: `${leftPercent.toFixed(1)}%`,
      width: `${widthPercent.toFixed(1)}%`,
    };
  }

  async function handleVerifyAndCapture(milestone: SmartEscrowMilestone) {
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
          className="rounded-xl border border-emerald-500/40 bg-emerald-950/30 px-4 py-3 text-xs text-emerald-200 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{actionBanner.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionBanner(null)}
            className="text-emerald-300 hover:text-white text-xs font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* BRYNTUM INTERACTIVE ESCROW GANTT & RESOURCE TIMELINE */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 px-2.5 py-0.5 text-xs font-semibold text-indigo-300">
                <Calendar className="h-3.5 w-3.5" />
                Sponsor: Bryntum Gantt &amp; Cashflow Scheduler
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
                <Lock className="h-3 w-3" />
                PayPal Orders v2 AUTHORIZE + Trackers API
              </span>
            </div>
            <h3 id="engine-3-heading" className="mt-1.5 text-lg font-bold text-white">
              Engine 3: Zero-Dispute A2A Smart Escrow Milestone Gantt
            </h3>
            <p className="text-xs text-slate-400">
              Interactive critical-path Gantt timeline binding PayPal{" "}
              <code className="text-indigo-300">intent: &quot;AUTHORIZE&quot;</code>{" "}
              holds to cryptographic AI deliverable verification and automatic shipment tracking dispute protection.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowNewMilestoneModal((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 transition"
          >
            <Plus className="h-4 w-4" />
            New PayPal Auth Escrow Milestone
          </button>
        </div>

        {/* New Milestone Form Drawer */}
        {showNewMilestoneModal && (
          <form
            onSubmit={handleCreateEscrowMilestone}
            className="mt-4 rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-indigo-300">
                Create Programmable PayPal Authorization Hold (POST /v2/checkout/orders [intent=AUTHORIZE])
              </span>
              <button
                type="button"
                onClick={() => setShowNewMilestoneModal(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label
                  htmlFor="milestone-title-input"
                  className="block text-xs text-slate-300 mb-1"
                >
                  Milestone Title
                </label>
                <input
                  id="milestone-title-input"
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="milestone-client-input"
                  className="block text-xs text-slate-300 mb-1"
                >
                  Client Agent Counterparty
                </label>
                <input
                  id="milestone-client-input"
                  type="text"
                  value={newClientAgent}
                  onChange={(e) => setNewClientAgent(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="milestone-amount-input"
                  className="block text-xs text-slate-300 mb-1"
                >
                  Escrow Hold Amount (USD)
                </label>
                <input
                  id="milestone-amount-input"
                  type="number"
                  step="0.01"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white"
                  required
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="milestone-req-input"
                className="block text-xs text-slate-300 mb-1"
              >
                Cryptographic Verification Requirement (Evaluated by Gemini 4 Argon before Capture)
              </label>
              <input
                id="milestone-req-input"
                type="text"
                value={newRequirement}
                onChange={(e) => setNewRequirement(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white"
                required
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={creatingMilestone}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-white transition"
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
          <div className="min-w-[780px] rounded-xl border border-slate-800 bg-slate-950/90 overflow-hidden">
            {/* Timeline Date Scale Header */}
            <div className="grid grid-cols-12 border-b border-slate-800 bg-slate-900/80 text-xs font-semibold text-slate-400">
              <div className="col-span-4 px-3.5 py-2.5 border-r border-slate-800">
                Bryntum WBS Task / PayPal Authorization ID
              </div>
              <div className="col-span-2 px-3 py-2.5 border-r border-slate-800 text-right">
                Locked Escrow
              </div>
              <div className="col-span-6 grid grid-cols-6 text-center">
                <div className="py-2.5 border-r border-slate-800/60">Nov 01–05</div>
                <div className="py-2.5 border-r border-slate-800/60">Nov 06–10</div>
                <div className="py-2.5 border-r border-slate-800/60 bg-indigo-950/30 text-indigo-300">
                  Nov 11–15 (Active)
                </div>
                <div className="py-2.5 border-r border-slate-800/60">Nov 16–20</div>
                <div className="py-2.5 border-r border-slate-800/60">Nov 21–25</div>
                <div className="py-2.5">Nov 26–30</div>
              </div>
            </div>

            {/* Milestone Gantt Rows */}
            <div className="divide-y divide-slate-800/80">
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
                        ? "bg-indigo-950/35"
                        : "hover:bg-slate-900/60"
                    }`}
                  >
                    <div className="col-span-4 px-3.5 py-3 border-r border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-slate-800 text-xs font-mono text-slate-300">
                          1.{idx + 1}
                        </span>
                        <span className="font-semibold text-white truncate">
                          {m.project_name}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                        <span className="font-mono text-indigo-300">
                          Auth: {m.paypal_authorization_id}
                        </span>
                        <span>•</span>
                        <span className="truncate">{m.client_agent}</span>
                      </div>
                    </div>

                    <div className="col-span-2 px-3 py-3 border-r border-slate-800 text-right tabular-nums">
                      <div className="font-mono font-bold text-white">
                        ${m.amount.value} {m.amount.currency_code}
                      </div>
                      <span
                        className={`inline-block mt-0.5 rounded px-1.5 py-0.5 text-[11px] font-semibold ${
                          isCaptured
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-amber-500/20 text-amber-300"
                        }`}
                      >
                        {isCaptured ? "CAPTURED + TRACKED" : "AUTH HOLD LOCKED"}
                      </span>
                    </div>

                    {/* Gantt Bar Canvas */}
                    <div className="col-span-6 relative h-14 px-2 flex items-center">
                      <div className="absolute inset-0 grid grid-cols-6 pointer-events-none">
                        <div className="border-r border-slate-800/40" />
                        <div className="border-r border-slate-800/40" />
                        <div className="border-r border-indigo-500/20 bg-indigo-950/10" />
                        <div className="border-r border-slate-800/40" />
                        <div className="border-r border-slate-800/40" />
                        <div />
                      </div>

                      <div
                        style={{ left: pos.left, width: pos.width }}
                        className={`relative z-10 h-7 rounded-lg border px-2.5 flex items-center justify-between text-xs font-semibold shadow-md transition-all ${
                          isCaptured
                            ? "border-emerald-400/50 bg-gradient-to-r from-emerald-600/80 to-teal-600/80 text-white"
                            : "border-amber-400/50 bg-gradient-to-r from-amber-600/75 to-indigo-600/75 text-white"
                        }`}
                      >
                        <span className="truncate">
                          {m.id} ({m.progress_percent}%)
                        </span>
                        {m.dependencies && m.dependencies.length > 0 && (
                          <span className="ml-1 rounded bg-black/30 px-1 py-0.5 font-mono text-[10px]">
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
          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/80 p-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-indigo-500/20 px-2 py-0.5 font-mono text-xs font-bold text-indigo-300">
                    {selectedMilestone.id}
                  </span>
                  <h4 className="text-sm font-bold text-white">
                    {selectedMilestone.project_name}
                  </h4>
                </div>
                <p className="mt-1 text-xs text-slate-300">
                  <strong>Requirement:</strong>{" "}
                  {selectedMilestone.deliverable_requirement}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  <span>
                    PayPal Order:{" "}
                    <code className="text-slate-200">
                      {selectedMilestone.paypal_order_id}
                    </code>
                  </span>
                  <span>
                    Authorization Hold:{" "}
                    <code className="text-amber-300">
                      {selectedMilestone.paypal_authorization_id}
                    </code>
                  </span>
                  {selectedMilestone.paypal_capture_id && (
                    <span>
                      Capture ID:{" "}
                      <code className="text-emerald-300">
                        {selectedMilestone.paypal_capture_id}
                      </code>
                    </span>
                  )}
                  {selectedMilestone.tracking_number && (
                    <span className="inline-flex items-center gap-1 text-emerald-300">
                      <Truck className="h-3.5 w-3.5" />
                      Tracker: <code>{selectedMilestone.tracking_number}</code> (
                      {selectedMilestone.carrier})
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right tabular-nums">
                <div className="text-xs text-slate-400">Authorized Hold</div>
                <div className="text-xl font-bold text-white">
                  ${selectedMilestone.amount.value}{" "}
                  {selectedMilestone.amount.currency_code}
                </div>
              </div>
            </div>

            {selectedMilestone.status !== "AI_VERIFIED_CAPTURED" ? (
              <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-3">
                <label
                  htmlFor="deliverable-proof-input"
                  className="block text-xs font-medium text-slate-300"
                >
                  Submit Cryptographic Deliverable Evidence for Gemini 4 Argon Audit &amp; Automatic PayPal Capture:
                </label>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    id="deliverable-proof-input"
                    type="text"
                    value={deliverableInput}
                    onChange={(e) => setDeliverableInput(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs text-white"
                    placeholder="Paste GitHub commit hash, OpenAPI spec report, or test artifact proof..."
                  />
                  <button
                    type="button"
                    disabled={verifyingId === selectedMilestone.id}
                    onClick={() => handleVerifyAndCapture(selectedMilestone)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-600/20 transition shrink-0"
                  >
                    <Sparkles className="h-4 w-4" />
                    {verifyingId === selectedMilestone.id
                      ? "Gemini 4 Argon Auditing & Capturing..."
                      : `Verify & Capture $${selectedMilestone.amount.value} Hold`}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-300">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
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
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-xs font-semibold text-amber-300">
                <TrendingDown className="h-3.5 w-3.5" />
                PayPal Subscriptions v1 API
              </span>
              <span className="text-xs text-slate-400">
                POST /v1/billing/subscriptions/&#123;id&#125;/revise &amp; /cancel
              </span>
            </div>
            <h3 className="mt-1 text-base font-bold text-white">
              Autonomous Subscription Renewal Scheduler &amp; Leakage Eliminator
            </h3>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {subscriptions.map((sub) => (
            <div
              key={sub.id}
              className="rounded-xl border border-slate-800 bg-slate-950/90 p-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-slate-400">
                    {sub.id}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      sub.status === "ACTIVE"
                        ? "bg-emerald-500/15 text-emerald-300"
                        : "bg-slate-700 text-slate-300"
                    }`}
                  >
                    {sub.status}
                  </span>
                </div>

                <h4 className="mt-2 text-sm font-bold text-white">
                  {sub.plan_name}
                </h4>
                <p className="text-xs text-slate-400">{sub.merchant_name}</p>

                <div className="mt-3 flex items-baseline justify-between border-y border-slate-800/80 py-2 tabular-nums">
                  <div>
                    <div className="text-xs text-slate-400">Current Rate</div>
                    <div className="text-sm font-bold text-white">
                      ${sub.billing_amount.value}/mo
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Benchmark</div>
                    <div className="text-sm font-semibold text-emerald-400">
                      ${sub.market_benchmark_amount.value}/mo
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400">AI Savings</div>
                    <div className="text-sm font-bold text-amber-300">
                      +${sub.potential_monthly_savings.value}/mo
                    </div>
                  </div>
                </div>

                <p className="mt-2.5 text-xs text-slate-300 leading-relaxed">
                  <strong className="text-indigo-300">Gemini Audit:</strong>{" "}
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
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 px-3 py-2 text-xs font-semibold text-amber-200 transition"
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
                  <div className="w-full rounded-lg bg-emerald-950/30 border border-emerald-500/30 px-3 py-2 text-center text-xs font-medium text-emerald-300">
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
