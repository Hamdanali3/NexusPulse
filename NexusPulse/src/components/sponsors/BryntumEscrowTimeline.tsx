"use client";

import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  Info,
  Layers,
  Lock,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sliders,
  Sparkles,
  TrendingDown,
  Truck,
  Zap,
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
  milestones: initialMilestones,
  subscriptions,
  onStateUpdated,
}: BryntumEscrowTimelineProps) {
  // Local mutable state for interactive Gantt adjustments (progress slider, date shifting)
  const [localMilestones, setLocalMilestones] = useState<PayPalEscrowMilestone[]>(initialMilestones);

  useEffect(() => {
    setLocalMilestones(initialMilestones);
  }, [initialMilestones]);

  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>(
    initialMilestones.find((m) => m.status === "AUTH_HOLD_PENDING_DELIVERABLE")?.id ??
      initialMilestones[0]?.id ??
      "ESCROW-102"
  );

  const selectedMilestone =
    localMilestones.find((m) => m.id === selectedMilestoneId) ?? localMilestones[0] ?? null;

  const [deliverableInput, setDeliverableInput] = useState<string>(
    selectedMilestone?.deliverable_proof ??
      "https://github.com/nexus-pulse/smart-clearinghouse/commit/9e8b7c6a5d4e3f210"
  );
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [optimizingSubId, setOptimizingSubId] = useState<string | null>(null);

  // Interactive filters
  const [statusFilter, setStatusFilter] = useState<"ALL" | "AUTH_HOLD" | "CAPTURED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Interactive Gantt Hover Tooltip State
  const [hoveredMilestone, setHoveredMilestone] = useState<{
    milestone: PayPalEscrowMilestone;
    x: number;
    y: number;
  } | null>(null);

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

  // Success and Failure Alert Banners
  const [actionBanner, setActionBanner] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Date range anchor for Gantt bar calculations (November 2026)
  const timelineStart = new Date("2026-11-01T00:00:00Z").getTime();
  const timelineEnd = new Date("2026-11-30T23:59:59Z").getTime();
  const totalDuration = timelineEnd - timelineStart;

  function getBarPosition(startStr: string, endStr: string) {
    const s = Math.max(timelineStart, new Date(startStr).getTime());
    const e = Math.min(timelineEnd, new Date(endStr).getTime());
    const leftPercent = Math.max(0, Math.min(95, ((s - timelineStart) / totalDuration) * 100));
    const widthPercent = Math.max(10, Math.min(100 - leftPercent, ((e - s) / totalDuration) * 100));
    return {
      left: `${leftPercent.toFixed(1)}%`,
      width: `${widthPercent.toFixed(1)}%`,
    };
  }

  // Interactive Progress Update
  function handleUpdateProgress(milestoneId: string, newProgress: number) {
    setLocalMilestones((prev) =>
      prev.map((m) =>
        m.id === milestoneId ? { ...m, progress_percent: newProgress } : m
      )
    );
    setActionBanner({
      type: "success",
      text: `Updated ${milestoneId} progress to ${newProgress}% on interactive Gantt canvas.`,
    });
  }

  // Interactive Date Shifting (Reschedule Milestone)
  function handleShiftMilestoneDates(milestoneId: string, daysShift: number) {
    setLocalMilestones((prev) =>
      prev.map((m) => {
        if (m.id !== milestoneId) return m;
        const currentStart = new Date(m.start_date);
        const currentEnd = new Date(m.end_date);
        currentStart.setDate(currentStart.getDate() + daysShift);
        currentEnd.setDate(currentEnd.getDate() + daysShift);

        const newStartStr = currentStart.toISOString().split("T")[0];
        const newEndStr = currentEnd.toISOString().split("T")[0];

        return {
          ...m,
          start_date: newStartStr,
          end_date: newEndStr,
        };
      })
    );
    setActionBanner({
      type: "success",
      text: `Interactive Gantt: Rescheduled ${milestoneId} by ${daysShift > 0 ? `+${daysShift}` : daysShift} days. Timeline updated!`,
    });
  }

  // Filtered Milestones
  const filteredMilestones = localMilestones.filter((m) => {
    if (statusFilter === "AUTH_HOLD" && m.status !== "AUTH_HOLD_PENDING_DELIVERABLE") {
      return false;
    }
    if (statusFilter === "CAPTURED" && m.status !== "AI_VERIFIED_CAPTURED") {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = m.project_name.toLowerCase().includes(q);
      const matchAgent = m.client_agent.toLowerCase().includes(q);
      const matchId = m.id.toLowerCase().includes(q);
      if (!matchTitle && !matchAgent && !matchId) return false;
    }
    return true;
  });

  async function handleVerifyAndCapture(milestone: PayPalEscrowMilestone) {
    if (!deliverableInput.trim()) {
      setActionBanner({
        type: "error",
        text: "Deliverable evidence cannot be empty. Please provide cryptographic commit or test proof.",
      });
      return;
    }
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
      if (res.ok && data.ok && data.milestone) {
        setActionBanner({
          type: "success",
          text: `Milestone ${milestone.id} Verified & Captured! Gemini 4 Argon audited deliverable. PayPal Authorization ${milestone.paypal_authorization_id} captured (${data.milestone.paypal_capture_id}) & Dispute Shield Tracking ${data.milestone.tracking_number} attached.`,
        });
        setLocalMilestones((prev) =>
          prev.map((m) => (m.id === milestone.id ? data.milestone : m))
        );
        onStateUpdated();
      } else {
        setActionBanner({
          type: "error",
          text: data.error || `Verification failed for milestone ${milestone.id}. Deliverable proof did not satisfy cryptographic requirements.`,
        });
      }
    } catch (err) {
      setActionBanner({
        type: "error",
        text: `Network failure while verifying milestone: ${err instanceof Error ? err.message : "Connection error"}`,
      });
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
      if (res.ok && data.ok && data.milestone) {
        setLocalMilestones((prev) => [data.milestone, ...prev]);
        setSelectedMilestoneId(data.milestone.id);
        setShowNewMilestoneModal(false);
        setActionBanner({
          type: "success",
          text: `Success: Created PayPal AUTHORIZE Escrow Order ${data.milestone.paypal_order_id} (Auth ${data.milestone.paypal_authorization_id}) for $${data.milestone.amount.value} USD. Visible on interactive Gantt!`,
        });
        onStateUpdated();
      } else {
        setActionBanner({
          type: "error",
          text: data.error || "Failed to create PayPal Escrow Milestone. Please check parameters.",
        });
      }
    } catch (err) {
      setActionBanner({
        type: "error",
        text: `Network failure during milestone creation: ${err instanceof Error ? err.message : "Error"}`,
      });
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
      if (res.ok && data.ok) {
        setActionBanner({
          type: "success",
          text: `Success: Optimized ${sub.plan_name} (${sub.id}) via PayPal Subscriptions API — Saved $${Number(data.monthlySaved ?? 0).toFixed(2)}/mo ($${Number(data.annualSaved ?? 0).toFixed(2)}/yr).`,
        });
        onStateUpdated();
      } else {
        setActionBanner({
          type: "error",
          text: data.error || `Subscription optimization failed for ${sub.plan_name}.`,
        });
      }
    } catch (err) {
      setActionBanner({
        type: "error",
        text: `Subscription optimization network error: ${err instanceof Error ? err.message : "Error"}`,
      });
    } finally {
      setOptimizingSubId(null);
    }
  }

  return (
    <section aria-labelledby="engine-3-heading" className="space-y-6">
      {/* Explicit Success or Failure Message Banner */}
      {actionBanner && (
        <div
          role={actionBanner.type === "error" ? "alert" : "status"}
          aria-live="polite"
          className={`rounded-xl border px-4 py-3 text-xs flex items-center justify-between shadow-xs transition-all ${
            actionBanner.type === "success"
              ? "border-emerald-300 bg-emerald-50 text-emerald-900"
              : "border-rose-300 bg-rose-50 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2">
            {actionBanner.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span className="font-semibold">{actionBanner.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionBanner(null)}
            className={`text-xs font-bold px-2 py-0.5 rounded transition ${
              actionBanner.type === "success"
                ? "text-emerald-700 hover:text-emerald-950 hover:bg-emerald-100"
                : "text-rose-700 hover:text-rose-950 hover:bg-rose-100"
            }`}
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
                Interactive Gantt Scheduler
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                <Lock className="h-3 w-3 text-emerald-600" />
                PayPal Orders v2 AUTHORIZE
              </span>
            </div>
            <h3 id="engine-3-heading" className="mt-1.5 text-lg font-bold text-slate-950">
              Engine 3: Interactive Milestone Escrow &amp; Dispute Protection
            </h3>
            <p className="text-xs text-slate-600">
              Click any Gantt bar to inspect, slide progress, reschedule dates, and trigger Gemini 4 Argon milestone verification.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowNewMilestoneModal((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition hover:scale-105 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            New Escrow Milestone
          </button>
        </div>

        {/* Interactive Filter & Search Controls */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50/70 p-2.5 rounded-xl border border-slate-200">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-700 flex items-center gap-1">
              <Filter className="h-3.5 w-3.5 text-slate-500" />
              Filter:
            </span>
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                statusFilter === "ALL"
                  ? "bg-slate-900 text-white font-bold"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              All ({localMilestones.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("AUTH_HOLD")}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                statusFilter === "AUTH_HOLD"
                  ? "bg-amber-600 text-white font-bold"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              Auth Holds Active ({localMilestones.filter((m) => m.status === "AUTH_HOLD_PENDING_DELIVERABLE").length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("CAPTURED")}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                statusFilter === "CAPTURED"
                  ? "bg-emerald-600 text-white font-bold"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              Captured &amp; Tracked ({localMilestones.filter((m) => m.status === "AI_VERIFIED_CAPTURED").length})
            </button>
          </div>

          <div className="relative">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search milestone or agent..."
              className="pl-8 pr-3 py-1 text-xs rounded-md border border-slate-300 bg-white placeholder:text-slate-400 w-52 shadow-2xs"
            />
          </div>
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

        {/* Interactive Bryntum Timeline Grid Header */}
        <div className="mt-4 overflow-x-auto">
          <div className="min-w-[820px] rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs relative">
            {/* Timeline Date Scale Header */}
            <div className="grid grid-cols-12 border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-800">
              <div className="col-span-4 px-3.5 py-2.5 border-r border-slate-200 flex items-center justify-between">
                <span>Task / Authorization ID</span>
                <span className="text-[10px] text-slate-500 font-normal">Click row to inspect</span>
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
              {filteredMilestones.map((m, idx) => {
                const pos = getBarPosition(m.start_date, m.end_date);
                const isSelected = selectedMilestone?.id === m.id;
                const isCaptured = m.status === "AI_VERIFIED_CAPTURED";

                return (
                  <div
                    key={m.id}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    onClick={() => {
                      setSelectedMilestoneId(m.id);
                      setDeliverableInput(m.deliverable_proof ?? "");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedMilestoneId(m.id);
                        setDeliverableInput(m.deliverable_proof ?? "");
                      }
                    }}
                    className={`grid grid-cols-12 items-center text-xs transition cursor-pointer ${
                      isSelected
                        ? "bg-indigo-50/80 ring-1 ring-inset ring-indigo-400"
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
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                            : "bg-amber-100 text-amber-900 border border-amber-300"
                        }`}
                      >
                        {isCaptured ? "CAPTURED" : "AUTH LOCKED"}
                      </span>
                    </div>

                    {/* Interactive Gantt Bar Canvas */}
                    <div className="col-span-6 relative h-14 px-2 flex items-center">
                      <div className="absolute inset-0 grid grid-cols-6 pointer-events-none">
                        <div className="border-r border-slate-100" />
                        <div className="border-r border-slate-100" />
                        <div className="border-r border-indigo-200 bg-indigo-50/30" />
                        <div className="border-r border-slate-100" />
                        <div className="border-r border-slate-100" />
                        <div />
                      </div>

                      {/* Interactive Gantt Bar with Direct Click, Drag/Hover Telemetry */}
                      <div
                        style={{ left: pos.left, width: pos.width }}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredMilestone({
                            milestone: m,
                            x: rect.left,
                            y: rect.top - 80,
                          });
                        }}
                        onMouseLeave={() => setHoveredMilestone(null)}
                        className={`relative z-10 h-7 rounded-lg border px-2.5 flex items-center justify-between text-xs font-bold shadow-xs transition-all hover:scale-[1.03] group ${
                          isCaptured
                            ? "border-emerald-500 bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-emerald-500/20"
                            : "border-amber-400 bg-gradient-to-r from-amber-500 to-indigo-600 text-white shadow-amber-500/20"
                        } ${isSelected ? "ring-2 ring-indigo-500 ring-offset-1" : ""}`}
                      >
                        <span className="truncate flex items-center gap-1">
                          <span>{m.id}</span>
                          <span className="font-normal opacity-90">({m.progress_percent}%)</span>
                        </span>

                        {/* Interactive In-Bar Progress Indicator */}
                        <div className="flex items-center gap-1 shrink-0">
                          {m.dependencies && m.dependencies.length > 0 && (
                            <span className="rounded bg-black/35 px-1 py-0.2 font-mono text-[9px] text-white">
                              dep: {m.dependencies.join(",")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Floating Gantt Bar Telemetry Tooltip */}
            {hoveredMilestone && (
              <div
                role="tooltip"
                className="pointer-events-none fixed z-50 rounded-xl border border-slate-300 bg-slate-950 text-white p-3 shadow-2xl text-xs space-y-1 max-w-xs animate-fade-in"
                style={{
                  top: Math.max(10, hoveredMilestone.y),
                  left: Math.max(10, hoveredMilestone.x),
                }}
              >
                <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1">
                  <span className="font-bold text-sky-400 font-mono">
                    {hoveredMilestone.milestone.id}
                  </span>
                  <span className="text-[10px] bg-slate-800 px-1.5 py-0.2 rounded font-mono">
                    {hoveredMilestone.milestone.start_date} → {hoveredMilestone.milestone.end_date}
                  </span>
                </div>
                <div className="font-semibold text-slate-100 truncate">
                  {hoveredMilestone.milestone.project_name}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                  <span>Hold: ${hoveredMilestone.milestone.amount.value} USD</span>
                  <span className="text-emerald-400 font-bold">
                    Progress: {hoveredMilestone.milestone.progress_percent}%
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight line-clamp-2">
                  Req: {hoveredMilestone.milestone.deliverable_requirement}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Selected Milestone Interactive Workspace: Progress Slider & Date Rescheduling */}
        {selectedMilestone && (
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/90 p-4 shadow-xs nexus-fade-in space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-indigo-100 border border-indigo-200 px-2.5 py-0.5 font-mono text-xs font-bold text-indigo-800">
                    {selectedMilestone.id}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900">
                    {selectedMilestone.project_name}
                  </h4>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      selectedMilestone.status === "AI_VERIFIED_CAPTURED"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-900"
                    }`}
                  >
                    {selectedMilestone.status === "AI_VERIFIED_CAPTURED" ? "Captured & Settled" : "Auth Hold Locked"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-700">
                  <strong className="text-slate-900">Requirement:</strong>{" "}
                  {selectedMilestone.deliverable_requirement}
                </p>
              </div>

              <div className="text-right tabular-nums">
                <div className="text-xs text-slate-500 font-medium">Authorized Hold</div>
                <div className="text-xl font-extrabold text-slate-950">
                  ${selectedMilestone.amount.value} {selectedMilestone.amount.currency_code}
                </div>
              </div>
            </div>

            {/* Interactive Progress Slider & Date Rescheduling Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-200">
              {/* Interactive Progress Slider */}
              <div className="rounded-lg bg-white border border-slate-200 p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="interactive-progress-slider" className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Sliders className="h-3.5 w-3.5 text-indigo-600" />
                    Interactive Milestone Progress:
                  </label>
                  <span className="font-mono font-extrabold text-indigo-600 text-sm">
                    {selectedMilestone.progress_percent}%
                  </span>
                </div>
                <input
                  id="interactive-progress-slider"
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={selectedMilestone.progress_percent}
                  onChange={(e) =>
                    handleUpdateProgress(selectedMilestone.id, Number(e.target.value))
                  }
                  className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                />
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateProgress(
                        selectedMilestone.id,
                        Math.min(100, selectedMilestone.progress_percent + 25)
                      )
                    }
                    className="rounded bg-slate-100 hover:bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-700 transition"
                  >
                    +25% Progress
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateProgress(selectedMilestone.id, 100)}
                    className="rounded bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 px-2 py-0.5 text-[11px] font-bold text-indigo-700 transition"
                  >
                    Set 100% (Ready to Verify)
                  </button>
                </div>
              </div>

              {/* Interactive Date Rescheduling Tool */}
              <div className="rounded-lg bg-white border border-slate-200 p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-sky-600" />
                    Interactive Schedule Shifter:
                  </span>
                  <span className="font-mono text-slate-600 font-semibold text-xs">
                    {selectedMilestone.start_date} → {selectedMilestone.end_date}
                  </span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleShiftMilestoneDates(selectedMilestone.id, -2)}
                    className="flex-1 inline-flex items-center justify-center gap-1 rounded bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-800 transition"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Shift -2 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => handleShiftMilestoneDates(selectedMilestone.id, 2)}
                    className="flex-1 inline-flex items-center justify-center gap-1 rounded bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-800 transition"
                  >
                    Shift +2 Days
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Directly shifts start and end dates on the Gantt canvas with automatic position recalculation.
                </p>
              </div>
            </div>

            {/* Cryptographic Deliverable Verification & Capture Console */}
            {selectedMilestone.status !== "AI_VERIFIED_CAPTURED" ? (
              <div className="pt-3 border-t border-slate-200 space-y-2.5">
                <label
                  htmlFor="deliverable-proof-input"
                  className="block text-xs font-semibold text-slate-800"
                >
                  Submit Cryptographic Deliverable Proof for Gemini 4 Argon Audit &amp; PayPal Capture:
                </label>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    id="deliverable-proof-input"
                    type="text"
                    value={deliverableInput}
                    onChange={(e) => setDeliverableInput(e.target.value)}
                    className="flex-1 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 shadow-xs focus:border-indigo-500"
                    placeholder="Paste GitHub commit hash, OpenAPI spec report, or carrier bill of lading..."
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
              <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-800 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200 font-semibold">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong>AI Audit &amp; Dispute Shield Complete:</strong>{" "}
                    {selectedMilestone.ai_audit_notes}
                  </span>
                </div>
                {selectedMilestone.tracking_number && (
                  <span className="font-mono text-xs text-slate-700">
                    Dispute Shield Tracker: <strong>{selectedMilestone.tracking_number}</strong>
                  </span>
                )}
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
              PayPal Subscriptions Optimization &amp; Renewal Guard
            </h3>
            <p className="text-xs text-slate-600">
              Autonomous CFO detects unused plans and executes instant downgrades to eliminate subscription bloat.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {subscriptions.map((sub) => (
            <div
              key={sub.id}
              className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs hover:border-slate-300 transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="rounded bg-slate-100 border border-slate-200 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-700">
                    {sub.id}
                  </span>
                  <h4 className="mt-1.5 text-sm font-bold text-slate-900">
                    {sub.plan_name}
                  </h4>
                  <p className="text-xs text-slate-500">{sub.merchant_name}</p>
                </div>
                <div className="text-right">
                  <div className="text-base font-extrabold text-slate-950 tabular-nums">
                    ${sub.billing_amount.value}/mo
                  </div>
                  <span
                    className={`inline-block mt-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      sub.status === "ACTIVE"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {sub.status}
                  </span>
                </div>
              </div>

              <div className="rounded-lg bg-amber-50/70 border border-amber-200 p-2.5 text-xs text-amber-900">
                <div className="font-semibold text-amber-950">AI Utilization Signal:</div>
                <p className="mt-0.5 text-[11px] text-amber-800">
                  {sub.ai_rationale}
                </p>
                <div className="mt-1 font-bold text-emerald-700">
                  Potential Savings: +${sub.potential_monthly_savings.value}/month
                </div>
              </div>

              {sub.status === "ACTIVE" && (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    disabled={optimizingSubId === sub.id}
                    onClick={() => handleOptimizeSubscription(sub, "REVISE_DOWNGRADE")}
                    className="flex-1 rounded-lg bg-slate-900 hover:bg-slate-800 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition disabled:opacity-50"
                  >
                    {optimizingSubId === sub.id ? "Downgrading..." : "Downgrade Plan"}
                  </button>
                  <button
                    type="button"
                    disabled={optimizingSubId === sub.id}
                    onClick={() => handleOptimizeSubscription(sub, "CANCEL_UNUSED")}
                    className="rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 text-xs font-bold text-rose-700 transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
