"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Lock,
  Plus,
  Search,
  ShieldCheck,
  Sliders,
  Wallet,
  X,
} from "lucide-react";
import type {
  PayPalEscrowMilestone,
  PayPalExecutionMode,
  PayPalSubscriptionRecord,
} from "@/lib/paypal/paypal-types";
import {
  formatDateRange,
  formatUsd,
  formatUsdPerMonth,
  humanizeEscrowStatus,
  sanitizeSeedCopy,
} from "@/lib/format";
import { Button, ConfirmDialog, FormField, ListSection, StatusDot } from "@/components/ui";

interface BryntumEscrowTimelineProps {
  milestones: PayPalEscrowMilestone[];
  subscriptions: PayPalSubscriptionRecord[];
  activeMode?: PayPalExecutionMode;
  onStateUpdated: () => void;
}

export default function BryntumEscrowTimeline({
  milestones: initialMilestones,
  subscriptions,
  activeMode = "sandbox",
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
  const [finalizingAuthId, setFinalizingAuthId] = useState<string | null>(null);
  const [optimizingSubId, setOptimizingSubId] = useState<string | null>(null);
  const [confirmSubAction, setConfirmSubAction] = useState<{
    sub: PayPalSubscriptionRecord;
    action: "REVISE_DOWNGRADE" | "CANCEL_UNUSED";
  } | null>(null);
  const [creatingLiveSub, setCreatingLiveSub] = useState(false);
  const [liveSubApproveUrl, setLiveSubApproveUrl] = useState<string | null>(null);

  // Interactive filters
  const [statusFilter, setStatusFilter] = useState<"ALL" | "AUTH_HOLD" | "CAPTURED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Interactive Gantt Hover Tooltip State
  const [hoveredMilestone, setHoveredMilestone] = useState<{
    milestone: PayPalEscrowMilestone;
    x: number;
    y: number;
  } | null>(null);

  // New Milestone Form state (empty defaults with muted placeholder examples)
  const [showNewMilestoneModal, setShowNewMilestoneModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newClientAgent, setNewClientAgent] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newRequirement, setNewRequirement] = useState("");
  const [milestoneErrors, setMilestoneErrors] = useState<Record<string, string>>({});
  const [creatingMilestone, setCreatingMilestone] = useState(false);

  function validateMilestoneField(field: "title" | "client" | "amount" | "requirement", val: string) {
    const trimmed = val.trim();
    let msg = "";
    if (field === "title" && !trimmed) msg = "Enter a milestone name.";
    if (field === "client" && !trimmed) msg = "Enter a counterparty name.";
    if (field === "requirement" && !trimmed) msg = "Enter verification criteria.";
    if (field === "amount") {
      const parsed = Number(val);
      if (!val || Number.isNaN(parsed) || parsed <= 0) {
        msg = "Enter an amount greater than $0.00.";
      }
    }
    setMilestoneErrors((prev) => ({ ...prev, [field]: msg }));
    return !msg;
  }

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
    const rawWidth = ((e - s) / totalDuration) * 100;
    const widthPercent = Math.max(22, Math.min(100, rawWidth));
    const maxLeft = Math.max(0, 100 - widthPercent);
    const leftPercent = Math.max(0, Math.min(maxLeft, ((s - timelineStart) / totalDuration) * 100));
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
      text: `Updated milestone progress to ${newProgress}%.`,
    });
  }

  // Interactive Date-Range Update
  function handleUpdateMilestoneDates(milestoneId: string, startDate: string, endDate: string) {
    if (!startDate || !endDate) return;
    if (endDate < startDate) {
      setActionBanner({
        type: "error",
        text: "End date must be on or after the start date.",
      });
      return;
    }
    setLocalMilestones((prev) =>
      prev.map((m) =>
        m.id === milestoneId
          ? { ...m, start_date: startDate, end_date: endDate }
          : m
      )
    );
    setActionBanner({
      type: "success",
      text: `Updated schedule for ${milestoneId} to ${formatDateRange(startDate, endDate)}.`,
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
          text: `Milestone ${milestone.id} verified and captured (${data.milestone.paypal_capture_id}). Tracking reference ${data.milestone.tracking_number} attached.`,
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
        const approvalNote = data.approveUrl
          ? " Buyer approval required on PayPal Sandbox before Authorization lock completes."
          : "";
        setActionBanner({
          type: "success",
          text: `Success: Created PayPal AUTHORIZE Escrow Order ${data.milestone.paypal_order_id}${
            data.milestone.paypal_authorization_id
              ? ` (Auth ${data.milestone.paypal_authorization_id})`
              : ""
          } for $${data.milestone.amount.value} USD.${approvalNote}`,
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

  async function handleFinalizeAuthorization(milestone: PayPalEscrowMilestone) {
    setFinalizingAuthId(milestone.id);
    setActionBanner(null);
    try {
      const res = await fetch("/api/paypal/escrow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "FINALIZE_AUTHORIZE",
          milestoneId: milestone.id,
          orderId: milestone.paypal_order_id,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok && data.milestone) {
        setLocalMilestones((prev) =>
          prev.map((m) => (m.id === milestone.id ? data.milestone : m))
        );
        setActionBanner({
          type: "success",
          text: `Escrow authorization ready for ${milestone.paypal_order_id} (${data.milestone.paypal_authorization_id}).`,
        });
        onStateUpdated();
      } else {
        setActionBanner({
          type: "error",
          text:
            data.error ||
            "Order is not yet buyer-approved in PayPal Sandbox. Open the Sandbox Approval Link first.",
        });
      }
    } catch (err) {
      setActionBanner({
        type: "error",
        text: `Failed to finalize authorization: ${err instanceof Error ? err.message : "Error"}`,
      });
    } finally {
      setFinalizingAuthId(null);
    }
  }

  async function handleCreateLiveSubscription() {
    setCreatingLiveSub(true);
    setActionBanner(null);
    setLiveSubApproveUrl(null);
    try {
      const res = await fetch("/api/paypal/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_LIVE_SUBSCRIPTION",
          planName: "Compute GPU Plan",
          merchantName: "Cloud Compute Provider",
          amountValue: "79.00",
          marketBenchmarkValue: "149.00",
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        if (data.approveUrl) {
          setLiveSubApproveUrl(data.approveUrl);
        }
        setActionBanner({
          type: "success",
          text: `Provisioned PayPal Subscription ${data.subscription?.id ?? ""} via Catalog Products & Billing Plans (${data.mode?.toUpperCase() ?? activeMode.toUpperCase()}).`,
        });
        onStateUpdated();
      } else {
        setActionBanner({
          type: "error",
          text: data.error || "Failed to provision PayPal Sandbox subscription.",
        });
      }
    } catch (err) {
      setActionBanner({
        type: "error",
        text: `Subscription provisioning error: ${err instanceof Error ? err.message : "Error"}`,
      });
    } finally {
      setCreatingLiveSub(false);
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
          text: `${action === "CANCEL_UNUSED" ? "Cancelled" : "Downgraded"} ${sub.merchant_name} (${sanitizeSeedCopy(sub.plan_name)}). Saving ${formatUsdPerMonth(data.monthlySaved ?? 0)} (${formatUsd(data.annualSaved ?? 0)}/yr).`,
        });
        setConfirmSubAction(null);
        onStateUpdated();
      } else {
        setActionBanner({
          type: "error",
          text: data.error || `Subscription optimization failed for ${sanitizeSeedCopy(sub.plan_name)}.`,
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
    <section aria-label="Milestone escrow and subscriptions" className="space-y-6">
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

      {/* MILESTONE ESCROW TIMELINE */}
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-200">
          <span className="text-[13px] text-zinc-600">
            Select a milestone row to update completion progress, adjust dates, or verify deliverables.
          </span>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => setShowNewMilestoneModal((v) => !v)}
          >
            <Plus className="h-4 w-4" strokeWidth={1.5} />
            Add milestone
          </Button>
        </div>

        {/* Filter & Search Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-[13px]">
          <div role="group" aria-label="Filter milestones" className="flex flex-wrap items-center gap-1 rounded-[6px] bg-zinc-100 p-1">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`rounded-[6px] px-2.5 py-1 text-[13px] font-medium transition-colors ${
                statusFilter === "ALL"
                  ? "bg-white text-zinc-950 border border-zinc-200"
                  : "text-zinc-600 hover:text-zinc-950"
              }`}
            >
              All ({localMilestones.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("AUTH_HOLD")}
              className={`rounded-[6px] px-2.5 py-1 text-[13px] font-medium transition-colors ${
                statusFilter === "AUTH_HOLD"
                  ? "bg-white text-zinc-950 border border-zinc-200"
                  : "text-zinc-600 hover:text-zinc-950"
              }`}
            >
              Held ({localMilestones.filter((m) => m.status === "AUTH_HOLD_PENDING_DELIVERABLE").length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("CAPTURED")}
              className={`rounded-[6px] px-2.5 py-1 text-[13px] font-medium transition-colors ${
                statusFilter === "CAPTURED"
                  ? "bg-white text-zinc-950 border border-zinc-200"
                  : "text-zinc-600 hover:text-zinc-950"
              }`}
            >
              Captured ({localMilestones.filter((m) => m.status === "AI_VERIFIED_CAPTURED").length})
            </button>
          </div>

          <div className="relative">
            <label htmlFor="escrow-search-input" className="visually-hidden">
              Search milestone
            </label>
            <Search className="h-4 w-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" strokeWidth={1.5} />
            <input
              id="escrow-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search milestone"
              className="h-9 pl-9 pr-3 text-[13px] rounded-[6px] border border-zinc-200 bg-white placeholder:text-zinc-500 w-56 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        {/* New Milestone Form Drawer */}
        {showNewMilestoneModal && (
          <form
            onSubmit={handleCreateEscrowMilestone}
            className="rounded-[12px] border border-zinc-200 bg-white p-5 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <span className="text-[14px] font-semibold text-zinc-950">
                Create escrow hold
              </span>
              <button
                type="button"
                onClick={() => setShowNewMilestoneModal(false)}
                className="text-[13px] text-zinc-600 hover:text-zinc-950 font-medium"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <FormField
                id="milestone-title-input"
                label="Milestone name"
                error={milestoneErrors.title}
                required
              >
                <input
                  id="milestone-title-input"
                  type="text"
                  placeholder="e.g. API gateway integration"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onBlur={(e) => validateMilestoneField("title", e.target.value)}
                  aria-invalid={Boolean(milestoneErrors.title)}
                  className="w-full h-9 rounded-[6px] border border-zinc-200 bg-white px-2.5 text-[13px] text-zinc-900 placeholder:text-zinc-500 transition focus:border-indigo-500 focus:outline-none"
                  required
                />
              </FormField>
              <FormField
                id="milestone-client-input"
                label="Recipient or contractor"
                error={milestoneErrors.client}
                required
              >
                <input
                  id="milestone-client-input"
                  type="text"
                  placeholder="e.g. Acme Studio LLC"
                  value={newClientAgent}
                  onChange={(e) => setNewClientAgent(e.target.value)}
                  onBlur={(e) => validateMilestoneField("client", e.target.value)}
                  aria-invalid={Boolean(milestoneErrors.client)}
                  className="w-full h-9 rounded-[6px] border border-zinc-200 bg-white px-2.5 text-[13px] text-zinc-900 placeholder:text-zinc-500 transition focus:border-indigo-500 focus:outline-none"
                  required
                />
              </FormField>
              <FormField
                id="milestone-amount-input"
                label="Amount (USD)"
                helperText="Held until verification passes"
                error={milestoneErrors.amount}
                required
              >
                <input
                  id="milestone-amount-input"
                  type="number"
                  step="0.01"
                  min="1"
                  placeholder="1,450.00"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  onBlur={(e) => validateMilestoneField("amount", e.target.value)}
                  aria-invalid={Boolean(milestoneErrors.amount)}
                  className="w-full h-9 rounded-[6px] border border-zinc-200 bg-white px-2.5 text-[13px] text-zinc-900 placeholder:text-zinc-500 tabular-nums transition focus:border-indigo-500 focus:outline-none"
                  required
                />
              </FormField>
            </div>
            <FormField
              id="milestone-req-input"
              label="Verification criteria"
              error={milestoneErrors.requirement}
              required
            >
              <input
                id="milestone-req-input"
                type="text"
                placeholder="e.g. Signed bill of lading uploaded and confirmed"
                value={newRequirement}
                onChange={(e) => setNewRequirement(e.target.value)}
                onBlur={(e) => validateMilestoneField("requirement", e.target.value)}
                aria-invalid={Boolean(milestoneErrors.requirement)}
                className="w-full h-9 rounded-[6px] border border-zinc-200 bg-white px-2.5 text-[13px] text-zinc-900 placeholder:text-zinc-500 transition focus:border-indigo-500 focus:outline-none"
                required
              />
            </FormField>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={creatingMilestone}
                className="inline-flex h-9 items-center gap-1.5 rounded-[6px] bg-zinc-950 hover:bg-zinc-800 px-3.5 text-[13px] font-medium text-white transition disabled:opacity-50"
              >
                <Lock className="h-3.5 w-3.5" />
                {creatingMilestone
                  ? "Holding funds..."
                  : Number(newAmount) > 0
                    ? `Hold ${formatUsd(Number(newAmount))}`
                    : "Hold funds in escrow"}
              </button>
            </div>
          </form>
        )}

        {/* Mobile Stacked Milestone Cards (< md): zero horizontal overflow at 375px */}
        <div className="md:hidden divide-y divide-zinc-200 rounded-[12px] border border-zinc-200 bg-white overflow-hidden">
          {filteredMilestones.map((m) => {
            const isSelected = selectedMilestone?.id === m.id;
            const statusLabel =
              m.status === "AI_VERIFIED_CAPTURED"
                ? "Captured"
                : m.approve_url && !m.paypal_authorization_id
                  ? "Awaiting approval"
                  : m.progress_percent > 0
                    ? "In progress"
                    : "Scheduled";
            const statusTone =
              m.status === "AI_VERIFIED_CAPTURED"
                ? "positive"
                : m.progress_percent > 0 && !(m.approve_url && !m.paypal_authorization_id)
                  ? "accent"
                  : "neutral";

            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMilestoneId(m.id)}
                className={`w-full text-left px-4 py-3.5 space-y-1.5 transition-colors ${
                  isSelected ? "bg-indigo-50/40 border-l-2 border-l-indigo-600" : "hover:bg-zinc-50/70"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 font-medium text-[14px] text-zinc-950 line-clamp-2">
                    {sanitizeSeedCopy(m.project_name)}
                  </div>
                  <div className="shrink-0 tabular-nums text-[14px] font-semibold text-zinc-950">
                    {formatUsd(m.amount.value)}
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-[12px] text-zinc-600">
                  <span>{formatDateRange(m.start_date, m.end_date)} · {m.progress_percent}%</span>
                  <StatusDot label={statusLabel} tone={statusTone} className="text-[12px]" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Escrow Milestone Timeline Grid (>= md, fluid fit across 768px and 1440px) */}
        <div className="hidden md:block overflow-x-auto">
          <div className="w-full rounded-[12px] border border-zinc-200 bg-white overflow-hidden relative">
            {/* Timeline Date Scale Header */}
            <div className="grid grid-cols-12 border-b border-zinc-200 bg-[#fafafa] text-[12px] font-medium text-zinc-600">
              <div className="col-span-4 px-3.5 py-2.5 border-r border-zinc-200 flex items-center justify-between">
                <span>Milestone</span>
                <span className="text-[12px] text-zinc-600">Select to inspect</span>
              </div>
              <div className="col-span-2 px-3 py-2.5 border-r border-zinc-200 text-right">
                Amount
              </div>
              <div className="col-span-6 grid grid-cols-6 text-center text-zinc-600">
                <div className="py-2.5 border-r border-zinc-200">Nov 1 – 5</div>
                <div className="py-2.5 border-r border-zinc-200">Nov 6 – 10</div>
                <div className="py-2.5 border-r border-zinc-200 bg-indigo-50/50 font-medium text-indigo-700">
                  Nov 11 – 15
                </div>
                <div className="py-2.5 border-r border-zinc-200">Nov 16 – 20</div>
                <div className="py-2.5 border-r border-zinc-200">Nov 21 – 25</div>
                <div className="py-2.5">Nov 26 – 30</div>
              </div>
            </div>

            {/* Milestone Gantt Rows */}
            <div className="divide-y divide-zinc-200">
              {filteredMilestones.map((m, idx) => {
                const pos = getBarPosition(m.start_date, m.end_date);
                const isSelected = selectedMilestone?.id === m.id;
                const isCaptured = m.status === "AI_VERIFIED_CAPTURED";
                const isInProgress = !isCaptured && m.progress_percent > 0;
                const statusLabel = humanizeEscrowStatus(
                  isInProgress ? "IN_PROGRESS" : m.status
                );
                const barClass = isCaptured
                  ? "bg-emerald-600 text-white"
                  : isInProgress
                    ? "bg-indigo-600 text-white"
                    : "bg-zinc-200 text-zinc-900 border border-zinc-300";

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
                    className={`grid grid-cols-12 items-center text-[13px] transition-colors duration-150 cursor-pointer border-l-2 ${
                      isSelected
                        ? "bg-indigo-50/50 border-l-indigo-600"
                        : "border-l-transparent hover:bg-zinc-50"
                    }`}
                  >
                    <div className="col-span-4 px-3.5 py-3 border-r border-zinc-200">
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] bg-zinc-100 text-[11px] font-mono font-medium text-zinc-700">
                          {idx + 1}
                        </span>
                        <span
                          title={sanitizeSeedCopy(m.project_name)}
                          className="font-medium text-zinc-950 line-clamp-2 leading-snug"
                        >
                          {sanitizeSeedCopy(m.project_name)}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-[12px] text-zinc-600">
                        <span className="font-mono text-zinc-700">
                          {m.id}
                        </span>
                        <span>·</span>
                        <span>{formatDateRange(m.start_date, m.end_date)}</span>
                      </div>
                    </div>

                    <div className="col-span-2 px-3 py-3 border-r border-zinc-200 text-right tabular-nums">
                      <div className="font-semibold text-zinc-950">
                        {formatUsd(m.amount.value)}
                      </div>
                      <span className="inline-flex items-center justify-end gap-1.5 mt-0.5 text-[12px] font-medium text-zinc-700">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isCaptured
                              ? "bg-emerald-700"
                              : isInProgress
                                ? "bg-indigo-600"
                                : "bg-zinc-500"
                          }`}
                          aria-hidden="true"
                        />
                        {statusLabel}
                      </span>
                    </div>

                    {/* Interactive Gantt Bar Canvas */}
                    <div className="col-span-6 relative h-12 px-2 flex items-center">
                      <div className="absolute inset-0 grid grid-cols-6 pointer-events-none">
                        <div className="border-r border-zinc-200" />
                        <div className="border-r border-zinc-200" />
                        <div className="border-r border-zinc-200 bg-indigo-50/25" />
                        <div className="border-r border-zinc-200" />
                        <div className="border-r border-zinc-200" />
                        <div />
                      </div>

                      {/* Interactive Gantt Bar: single clean label + single color per status */}
                      <div
                        style={{ left: pos.left, width: pos.width }}
                        title={`${sanitizeSeedCopy(m.project_name)} · ${formatDateRange(m.start_date, m.end_date)} · ${statusLabel} (${m.progress_percent}%)`}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredMilestone({
                            milestone: m,
                            x: rect.left,
                            y: rect.top - 80,
                          });
                        }}
                        onMouseLeave={() => setHoveredMilestone(null)}
                        className={`relative z-10 h-7 rounded-[6px] px-2.5 flex items-center text-[12px] font-medium transition-colors duration-150 ${barClass} ${
                          isSelected ? "ring-2 ring-indigo-600/35" : ""
                        }`}
                      >
                        <span className="truncate">{sanitizeSeedCopy(m.project_name)}</span>
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
                className="pointer-events-none fixed z-50 rounded-[6px] border border-zinc-800 bg-zinc-950 text-white p-2.5 shadow-[0_8px_24px_-4px_rgb(9_9_11/0.14),0_2px_6px_-1px_rgb(9_9_11/0.06)] text-[12px] space-y-1 max-w-xs"
                style={{
                  top: Math.max(10, hoveredMilestone.y),
                  left: Math.max(10, hoveredMilestone.x),
                }}
              >
                <div className="flex items-center justify-between gap-3 border-b border-zinc-800 pb-1">
                  <span className="font-mono text-zinc-200">
                    {hoveredMilestone.milestone.id}
                  </span>
                  <span className="text-[11px] text-zinc-300">
                    {formatDateRange(
                      hoveredMilestone.milestone.start_date,
                      hoveredMilestone.milestone.end_date
                    )}
                  </span>
                </div>
                <div className="font-medium text-white line-clamp-2">
                  {sanitizeSeedCopy(hoveredMilestone.milestone.project_name)}
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-300 tabular-nums">
                  <span>{formatUsd(hoveredMilestone.milestone.amount.value)}</span>
                  <span className="font-medium text-white">
                    {hoveredMilestone.milestone.progress_percent}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Selected Milestone Detail Inspector */}
        {selectedMilestone && (
          <div className="rounded-[12px] border border-zinc-200 bg-white p-5 space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h3 className="text-[16px] font-semibold text-zinc-950">
                    {sanitizeSeedCopy(selectedMilestone.project_name)}
                  </h3>
                  <StatusDot
                    label={
                      selectedMilestone.status === "AI_VERIFIED_CAPTURED"
                        ? "Captured"
                        : selectedMilestone.approve_url && !selectedMilestone.paypal_authorization_id
                          ? "Awaiting approval"
                          : selectedMilestone.progress_percent > 0
                            ? "In progress"
                            : "Scheduled"
                    }
                    tone={
                      selectedMilestone.status === "AI_VERIFIED_CAPTURED"
                        ? "positive"
                        : selectedMilestone.progress_percent > 0
                          ? "accent"
                          : "neutral"
                    }
                  />
                </div>
                <p className="text-[13px] text-zinc-600">
                  {sanitizeSeedCopy(selectedMilestone.deliverable_requirement)}
                </p>
              </div>

              <div className="text-right tabular-nums shrink-0">
                <div className="text-[12px] text-zinc-600">Escrow amount</div>
                <div className="text-[20px] font-semibold text-zinc-950">
                  {formatUsd(selectedMilestone.amount.value)}
                </div>
              </div>
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-3 border-y border-zinc-200 py-3.5 text-[13px]">
              <div>
                <dt className="text-[12px] text-zinc-600">Milestone ID</dt>
                <dd className="mt-0.5 font-mono text-[12px] font-medium text-zinc-900">
                  {selectedMilestone.id}
                </dd>
              </div>
              <div>
                <dt className="text-[12px] text-zinc-600">Provider</dt>
                <dd className="mt-0.5 font-medium text-zinc-900">
                  {selectedMilestone.provider_name}
                </dd>
              </div>
              <div>
                <dt className="text-[12px] text-zinc-600">Schedule</dt>
                <dd className="mt-0.5 font-medium text-zinc-900">
                  {formatDateRange(selectedMilestone.start_date, selectedMilestone.end_date)}
                </dd>
              </div>
              <div>
                <dt className="text-[12px] text-zinc-600">Hold reference</dt>
                <dd className="mt-0.5 font-mono text-[12px] text-zinc-800">
                  {selectedMilestone.paypal_authorization_id || selectedMilestone.paypal_order_id}
                </dd>
              </div>
            </dl>

            {/* Progress Slider & Date-Range Picker */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4 border-b border-zinc-200">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-[13px]">
                  <label
                    htmlFor="interactive-progress-slider"
                    className="font-medium text-zinc-800 flex items-center gap-1.5"
                  >
                    <Sliders className="h-4 w-4 text-zinc-500" strokeWidth={1.5} />
                    Completion progress
                  </label>
                  <span className="font-mono font-medium text-zinc-950 tabular-nums">
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
                  className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-zinc-200 rounded-[6px]"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateProgress(
                        selectedMilestone.id,
                        Math.min(100, selectedMilestone.progress_percent + 25)
                      )
                    }
                    className="rounded-[6px] border border-zinc-200 bg-white hover:bg-zinc-50 px-2.5 py-1 text-[12px] font-medium text-zinc-800 transition-colors"
                  >
                    +25%
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateProgress(selectedMilestone.id, 100)}
                    className="rounded-[6px] border border-zinc-200 bg-white hover:bg-zinc-50 px-2.5 py-1 text-[12px] font-medium text-indigo-700 transition-colors"
                  >
                    Mark 100%
                  </button>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="font-medium text-zinc-800 flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-zinc-500" strokeWidth={1.5} />
                    Date range
                  </span>
                  <span className="text-[12px] text-zinc-600 font-medium">
                    {formatDateRange(selectedMilestone.start_date, selectedMilestone.end_date)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="milestone-start-date"
                      className="block text-[12px] text-zinc-600 mb-1"
                    >
                      Start date
                    </label>
                    <input
                      id="milestone-start-date"
                      type="date"
                      value={selectedMilestone.start_date}
                      onChange={(e) =>
                        handleUpdateMilestoneDates(
                          selectedMilestone.id,
                          e.target.value,
                          selectedMilestone.end_date
                        )
                      }
                      className="w-full h-9 rounded-[6px] border border-zinc-200 bg-white px-2.5 text-[13px] text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="milestone-end-date"
                      className="block text-[12px] text-zinc-600 mb-1"
                    >
                      End date
                    </label>
                    <input
                      id="milestone-end-date"
                      type="date"
                      value={selectedMilestone.end_date}
                      onChange={(e) =>
                        handleUpdateMilestoneDates(
                          selectedMilestone.id,
                          selectedMilestone.start_date,
                          e.target.value
                        )
                      }
                      className="w-full h-9 rounded-[6px] border border-zinc-200 bg-white px-2.5 text-[13px] text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Buyer Approval Gate when Authorization Hold is newly created */}
            {selectedMilestone.status !== "AI_VERIFIED_CAPTURED" &&
              selectedMilestone.approve_url &&
              !selectedMilestone.paypal_authorization_id && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-[6px] border border-zinc-200 bg-[#fafafa] px-4 py-3 text-[13px]">
                  <div className="space-y-0.5">
                    <div className="font-medium text-zinc-950 flex items-center gap-1.5">
                      <Wallet className="h-4 w-4 text-zinc-700" strokeWidth={1.5} />
                      <span>Order {selectedMilestone.paypal_order_id} awaiting approval</span>
                    </div>
                    <p className="text-[12px] text-zinc-600">
                      Approve this authorization hold with your test buyer account, then confirm below.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={selectedMilestone.approve_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-9 items-center gap-1.5 rounded-[6px] bg-zinc-950 hover:bg-zinc-800 px-3 text-[13px] font-medium text-white transition-colors"
                    >
                      <span>Approve hold</span>
                      <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </a>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      loading={finalizingAuthId === selectedMilestone.id}
                      onClick={() => handleFinalizeAuthorization(selectedMilestone)}
                    >
                      {finalizingAuthId === selectedMilestone.id
                        ? "Confirming..."
                        : "Confirm hold"}
                    </Button>
                  </div>
                </div>
              )}

            {/* Deliverable Verification & Release */}
            {selectedMilestone.status !== "AI_VERIFIED_CAPTURED" ? (
              <div className="space-y-2">
                <label
                  htmlFor="deliverable-proof-input"
                  className="block text-[13px] font-medium text-zinc-900"
                >
                  Deliverable link or note
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    id="deliverable-proof-input"
                    type="text"
                    value={deliverableInput}
                    onChange={(e) => setDeliverableInput(e.target.value)}
                    className="flex-1 h-9 rounded-[6px] border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 placeholder:text-zinc-500 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="https://github.com/... or completion note"
                  />
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    loading={verifyingId === selectedMilestone.id}
                    onClick={() => handleVerifyAndCapture(selectedMilestone)}
                    className="shrink-0"
                  >
                    <ShieldCheck className="h-4 w-4" strokeWidth={1.5} />
                    {verifyingId === selectedMilestone.id
                      ? "Verifying..."
                      : `Verify & release ${formatUsd(selectedMilestone.amount.value)}`}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-2 text-[13px] text-emerald-900 bg-emerald-50/70 px-3.5 py-2.5 rounded-[6px] border border-emerald-200">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-700 shrink-0" strokeWidth={1.5} />
                  <span>
                    <strong className="font-semibold">Released:</strong>{" "}
                    {sanitizeSeedCopy(selectedMilestone.ai_audit_notes)}
                  </span>
                </div>
                {selectedMilestone.tracking_number && (
                  <span className="font-mono text-[12px] text-zinc-700">
                    Tracking {selectedMilestone.tracking_number}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* SUBSCRIPTIONS & RENEWAL MANAGEMENT */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4 pb-3 border-b border-zinc-200">
          <div>
            <h3 className="text-[18px] font-semibold tracking-tight text-zinc-950">
              Subscriptions
            </h3>
            <p className="mt-0.5 text-[13px] text-zinc-600">
              Spot unused seats and downgrade or cancel recurring plans before renewal.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {liveSubApproveUrl && (
              <a
                href={liveSubApproveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-[6px] bg-zinc-950 hover:bg-zinc-800 px-3 text-[13px] font-medium text-white transition-colors"
              >
                <span>Approve plan</span>
                <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} />
              </a>
            )}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              loading={creatingLiveSub}
              onClick={handleCreateLiveSubscription}
            >
              <Plus className="h-4 w-4" strokeWidth={1.5} />
              <span>{creatingLiveSub ? "Adding plan..." : "Add test plan"}</span>
            </Button>
          </div>
        </div>

        <ListSection>
          {subscriptions.map((sub) => (
            <div key={sub.id} className="px-5 py-4 space-y-3 hover:bg-zinc-50/60 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-[15px] font-semibold text-zinc-950">
                      {sanitizeSeedCopy(sub.plan_name)}
                    </h4>
                    <StatusDot
                      label={sub.status === "ACTIVE" ? "Active" : "Cancelled"}
                      tone={sub.status === "ACTIVE" ? "positive" : "neutral"}
                      className="text-[12px]"
                    />
                  </div>
                  <p className="text-[13px] text-zinc-600 leading-relaxed">
                    {sub.merchant_name} · <span className="font-mono text-[12px] text-zinc-700">{sub.id}</span> ·{" "}
                    {sanitizeSeedCopy(sub.ai_rationale)}
                  </p>
                </div>

                <div className="text-left sm:text-right sm:shrink-0 tabular-nums">
                  <div className="text-[15px] font-semibold text-zinc-950">
                    {formatUsdPerMonth(sub.billing_amount.value)}
                  </div>
                  <div className="text-[12px] font-medium text-emerald-700">
                    Potential savings: {formatUsdPerMonth(sub.potential_monthly_savings.value)} (
                    {formatUsd(Number(sub.potential_monthly_savings.value) * 12)}/yr)
                  </div>
                </div>
              </div>

              {sub.status === "ACTIVE" && (
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={optimizingSubId === sub.id}
                    onClick={() =>
                      setConfirmSubAction({ sub, action: "REVISE_DOWNGRADE" })
                    }
                  >
                    {optimizingSubId === sub.id ? "Downgrading..." : "Downgrade"}
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    disabled={optimizingSubId === sub.id}
                    onClick={() =>
                      setConfirmSubAction({ sub, action: "CANCEL_UNUSED" })
                    }
                  >
                    Cancel subscription
                  </Button>
                </div>
              )}
            </div>
          ))}
        </ListSection>
      </div>

      {/* Confirmation dialog naming the exact subscription and projected savings */}
      <ConfirmDialog
        open={Boolean(confirmSubAction)}
        title={
          confirmSubAction
            ? confirmSubAction.action === "CANCEL_UNUSED"
              ? `Cancel ${confirmSubAction.sub.merchant_name}?`
              : `Downgrade ${confirmSubAction.sub.merchant_name}?`
            : ""
        }
        description={
          confirmSubAction ? (
            <div className="space-y-3">
              <p>
                Plan:{" "}
                <span className="font-medium text-zinc-900">
                  {sanitizeSeedCopy(confirmSubAction.sub.plan_name)}
                </span>{" "}
                (<code className="font-mono text-[12px]">{confirmSubAction.sub.id}</code>)
              </p>
              <div className="rounded-[6px] border border-zinc-200 bg-zinc-50 p-3 text-[13px] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-600">Current charge</span>
                  <span className="tabular-nums font-medium text-zinc-950">
                    {formatUsdPerMonth(confirmSubAction.sub.billing_amount.value)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-600">Estimated savings</span>
                  <span className="tabular-nums font-medium text-emerald-700">
                    {formatUsdPerMonth(confirmSubAction.sub.potential_monthly_savings.value)} (
                    {formatUsd(Number(confirmSubAction.sub.potential_monthly_savings.value) * 12)}/yr)
                  </span>
                </div>
              </div>
            </div>
          ) : null
        }
        cancelLabel="Keep subscription"
        confirmLabel={
          confirmSubAction?.action === "CANCEL_UNUSED"
            ? "Confirm cancellation"
            : "Confirm downgrade"
        }
        confirmTone={confirmSubAction?.action === "CANCEL_UNUSED" ? "danger" : "primary"}
        busy={Boolean(confirmSubAction && optimizingSubId === confirmSubAction.sub.id)}
        onClose={() => setConfirmSubAction(null)}
        onConfirm={() => {
          if (confirmSubAction) {
            handleOptimizeSubscription(confirmSubAction.sub, confirmSubAction.action);
          }
        }}
      />
    </section>
  );
}
