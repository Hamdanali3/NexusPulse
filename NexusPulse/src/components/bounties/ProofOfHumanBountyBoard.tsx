"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  Award,
  CheckCircle2,
  Clock,
  DollarSign,
  Filter,
  MapPin,
  Send,
  ShieldCheck,
  Sparkles,
  UserCheck,
  XCircle,
} from "lucide-react";
import type {
  PayPalPayoutRecord,
  ProofOfHumanBounty,
} from "@/lib/paypal/paypal-types";

interface ProofOfHumanBountyBoardProps {
  bounties: ProofOfHumanBounty[];
  payouts: PayPalPayoutRecord[];
  onStateUpdated: () => void;
}

export default function ProofOfHumanBountyBoard({
  bounties,
  payouts,
  onStateUpdated,
}: ProofOfHumanBountyBoardProps) {
  const [selectedBountyId, setSelectedBountyId] = useState<string>(
    bounties.find((b) => b.status === "OPEN")?.id ??
      bounties[0]?.id ??
      "BOUNTY-101"
  );
  const selectedBounty =
    bounties.find((b) => b.id === selectedBountyId) ?? bounties[0] ?? null;

  const [evidenceText, setEvidenceText] = useState<string>(
    selectedBounty?.sample_evidence_text ?? ""
  );
  const [receiverEmail, setReceiverEmail] = useState<string>(
    "sb-buyer-nexus@personal.example.com"
  );
  const [submitting, setSubmitting] = useState(false);
  const [bountyFilter, setBountyFilter] = useState<"ALL" | "OPEN" | "PAID">("ALL");

  const [lastResult, setLastResult] = useState<{
    passed: boolean;
    score: number;
    gemini_model: string;
    reasoning: string;
    payout_batch_id?: string;
  } | null>(null);

  // Success and Failure Notification Banner
  const [statusBanner, setStatusBanner] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  function handleSelectBounty(b: ProofOfHumanBounty) {
    setSelectedBountyId(b.id);
    setEvidenceText(b.sample_evidence_text);
    setLastResult(null);
  }

  const displayedBounties = bounties.filter((b) => {
    if (bountyFilter === "OPEN") return b.status === "OPEN";
    if (bountyFilter === "PAID") return b.status === "PAID_OUT";
    return true;
  });

  async function handleSubmitAndPayout(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBounty) return;
    setSubmitting(true);
    setLastResult(null);
    setStatusBanner(null);

    try {
      const res = await fetch("/api/ai/verify-bounty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bountyId: selectedBounty.id,
          evidenceText,
          recipientEmail: receiverEmail,
        }),
      });
      const data = await res.json();

      if (res.ok && data.ok && data.audit) {
        setLastResult({
          passed: data.audit.passed,
          score: data.audit.score,
          gemini_model: data.audit.gemini_model,
          reasoning: data.audit.reasoning,
          payout_batch_id: data.payout_batch_id,
        });

        if (data.audit.passed) {
          setStatusBanner({
            type: "success",
            text: `Bounty Verified & Paid! Gemini 3.8 Flash scored ${data.audit.score}/100. PayPal Payout Batch #${data.payout_batch_id} settled $${selectedBounty.reward.value} USD to ${receiverEmail}.`,
          });
          onStateUpdated();
        } else {
          setStatusBanner({
            type: "error",
            text: `Verification Rejected: Score ${data.audit.score}/100 is below the 70-point threshold. Reason: ${data.audit.reasoning}`,
          });
        }
      } else {
        setStatusBanner({
          type: "error",
          text: data.error || "Bounty verification failed. Please check evidence text and email format.",
        });
      }
    } catch (err) {
      setStatusBanner({
        type: "error",
        text: `Submission error: ${err instanceof Error ? err.message : "Network failure"}`,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section aria-labelledby="engine-2-heading" className="space-y-6">
      {/* Explicit Success or Failure Message Banner */}
      {statusBanner && (
        <div
          role={statusBanner.type === "error" ? "alert" : "status"}
          aria-live="polite"
          className={`rounded-xl border px-4 py-3 text-xs flex items-center justify-between shadow-2xs transition-all ${
            statusBanner.type === "success"
              ? "border-emerald-200 bg-emerald-50/80 text-emerald-900"
              : "border-rose-200 bg-rose-50/80 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2">
            {statusBanner.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{statusBanner.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusBanner(null)}
            className="text-xs font-semibold px-2 py-0.5 rounded text-zinc-600 hover:text-zinc-900 transition"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-100">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700">
                <UserCheck className="h-3 w-3 text-zinc-500" />
                Proof-of-Human
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700">
                <DollarSign className="h-3 w-3 text-zinc-500" />
                PayPal Payouts v1
              </span>
            </div>
            <h3 id="engine-2-heading" className="mt-1.5 text-base font-semibold text-zinc-900">
              60-Second Verification Bounties
            </h3>
            <p className="text-xs text-zinc-500">
              Human ground-truth verification audited by Gemini AI with instant PayPal payouts.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 text-xs bg-zinc-100/80 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setBountyFilter("ALL")}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                bountyFilter === "ALL"
                  ? "bg-white text-zinc-900 shadow-2xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              All ({bounties.length})
            </button>
            <button
              type="button"
              onClick={() => setBountyFilter("OPEN")}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                bountyFilter === "OPEN"
                  ? "bg-white text-zinc-900 shadow-2xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              Open ({bounties.filter((b) => b.status === "OPEN").length})
            </button>
            <button
              type="button"
              onClick={() => setBountyFilter("PAID")}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                bountyFilter === "PAID"
                  ? "bg-white text-zinc-900 shadow-2xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              Paid ({bounties.filter((b) => b.status === "PAID_OUT").length})
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Bounty Cards */}
          <div className="lg:col-span-6 space-y-3">
            {displayedBounties.map((bounty) => {
              const isSelected = selectedBounty?.id === bounty.id;
              const isPaid = bounty.status === "PAID_OUT";
              const hourlyYield = Math.round(
                (Number(bounty.reward.value) / Math.max(15, bounty.estimated_seconds)) * 3600
              );

              return (
                <div
                  key={bounty.id}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  onClick={() => handleSelectBounty(bounty)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSelectBounty(bounty);
                    }
                  }}
                  className={`rounded-xl border p-4 transition cursor-pointer shadow-2xs ${
                    isSelected
                      ? "border-indigo-600 bg-indigo-50/20 ring-1 ring-indigo-500/20"
                      : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[11px] font-medium text-zinc-700">
                          {bounty.id}
                        </span>
                        <span className="text-[11px] text-zinc-500">
                          {bounty.category.replace(/_/g, " ")}
                        </span>
                        <span className="inline-flex items-center gap-0.5 text-[11px] text-zinc-400">
                          <MapPin className="h-3 w-3" />
                          {bounty.location_scope}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-zinc-900 leading-snug">
                        {bounty.title}
                      </h4>
                      <p className="text-[11px] text-zinc-500">
                        {bounty.requester_agent} · {bounty.requester_org}
                      </p>
                    </div>

                    <div className="text-right shrink-0 tabular-nums">
                      <div className="text-base font-bold text-zinc-900">
                        +${bounty.reward.value}
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        ~{bounty.estimated_seconds}s · ~${hourlyYield.toLocaleString()}/hr
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-zinc-100 flex items-center justify-between text-xs">
                    <span className="text-zinc-500 truncate max-w-[65%]">
                      {bounty.prompt_instructions}
                    </span>
                    {isPaid ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 shrink-0">
                        <CheckCircle2 className="h-3 w-3" />
                        Paid
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700 shrink-0">
                        Open
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Live Oracle Submission Console */}
          <div className="lg:col-span-6">
            {selectedBounty && (
              <form
                onSubmit={handleSubmitAndPayout}
                className="rounded-xl border border-zinc-200 bg-white p-5 space-y-4 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-3 border-b border-zinc-100 pb-3">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                      Oracle Verification &amp; Payout
                    </span>
                    <h4 className="mt-0.5 text-sm font-semibold text-zinc-900">
                      {selectedBounty.title}
                    </h4>
                  </div>
                  <div className="rounded-lg bg-zinc-50 border border-zinc-200 px-2.5 py-1 text-right tabular-nums shrink-0">
                    <div className="text-[10px] text-zinc-500">Reward</div>
                    <div className="text-sm font-bold text-zinc-900">
                      ${selectedBounty.reward.value}{" "}
                      <span className="text-[10px] font-normal text-zinc-500">{selectedBounty.reward.currency_code}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-xs font-medium text-zinc-700">
                    Gemini AI Verification Criteria:
                  </div>
                  <ul className="space-y-1">
                    {selectedBounty.verification_criteria.map(
                      (criterion, idx) => (
                        <li
                          key={idx}
                          className="flex items-center gap-2 text-xs text-zinc-600"
                        >
                          <ShieldCheck className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                          <span>{criterion}</span>
                        </li>
                      )
                    )}
                  </ul>
                </div>

                <div>
                  <label
                    htmlFor="bounty-evidence-textarea"
                    className="block text-xs font-medium text-zinc-700 mb-1"
                  >
                    Evidence / Audit Data:
                  </label>
                  <textarea
                    id="bounty-evidence-textarea"
                    rows={3}
                    value={evidenceText}
                    onChange={(e) => setEvidenceText(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 bg-white p-2.5 text-xs text-zinc-900 leading-relaxed transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                    placeholder="Enter observation, sensor data, or proof..."
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="bounty-recipient-email"
                    className="block text-xs font-medium text-zinc-700 mb-1"
                  >
                    PayPal / Venmo Account:
                  </label>
                  <input
                    id="bounty-recipient-email"
                    type="text"
                    autoComplete="email"
                    value={receiverEmail}
                    onChange={(e) => setReceiverEmail(e.target.value)}
                    className="w-full h-8 rounded-lg border border-zinc-200 bg-white px-2.5 text-xs text-zinc-900 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 px-4 text-xs font-medium text-white transition disabled:opacity-50"
                >
                  <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                  {submitting
                    ? "Auditing & Processing..."
                    : `Verify & Settle $${selectedBounty.reward.value} USD`}
                </button>

                {/* Explicit SUCCESS or FAILURE Receipt */}
                {(lastResult || selectedBounty.verification_result) && (
                  (() => {
                    const result = lastResult ?? selectedBounty.verification_result;
                    if (!result) return null;
                    const passed = result.passed;

                    return (
                      <div
                        role={passed ? "status" : "alert"}
                        aria-live="polite"
                        className={`rounded-xl border p-3.5 space-y-2 text-xs shadow-2xs nexus-fade-in ${
                          passed
                            ? "border-emerald-200 bg-emerald-50/80"
                            : "border-rose-200 bg-rose-50/80"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`inline-flex items-center gap-1.5 font-semibold ${
                              passed ? "text-emerald-900" : "text-rose-900"
                            }`}
                          >
                            {passed ? (
                              <Award className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-rose-600" />
                            )}
                            Score: {result.score}/100 ({passed ? "PASSED" : "REJECTED"})
                          </span>
                          <span className="font-mono text-[11px] text-zinc-500">
                            {result.gemini_model}
                          </span>
                        </div>
                        <p className={`text-xs leading-relaxed ${passed ? "text-zinc-700" : "text-rose-800"}`}>
                          {result.reasoning}
                        </p>
                        {passed && (lastResult?.payout_batch_id || selectedBounty.payout_batch_id) && (
                          <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between text-xs text-emerald-900 font-mono">
                            <span>
                              Batch: {lastResult?.payout_batch_id ?? selectedBounty.payout_batch_id}
                            </span>
                            <span className="font-semibold text-emerald-700">SETTLED</span>
                          </div>
                        )}
                        {!passed && (
                          <div className="pt-1.5 border-t border-rose-200/60 text-rose-700 text-[11px]">
                            Payout withheld. Please revise telemetry to meet criteria.
                          </div>
                        )}
                      </div>
                    );
                  })()
                )}
              </form>
            )}
          </div>
        </div>
      </div>

      {/* RECENT PAYPAL PAYOUTS V1 BATCH HISTORY */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <Send className="h-4 w-4 text-zinc-500" />
            <h4 className="text-sm font-semibold text-zinc-900">
              PayPal Payouts Feed
            </h4>
          </div>
          <span className="text-xs text-zinc-400">
            Idempotent Batch Settlements
          </span>
        </div>

        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
          {payouts.map((p) => (
            <div
              key={p.payout_batch_id}
              className="rounded-xl border border-zinc-200 bg-white hover:border-zinc-300 p-3.5 text-xs space-y-1.5 shadow-2xs transition"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-medium text-zinc-900">
                  {p.payout_batch_id}
                </span>
                <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700">
                  {p.batch_status}
                </span>
              </div>
              <div className="flex items-baseline justify-between tabular-nums">
                <span className="text-zinc-500 truncate max-w-[65%]">
                  {p.receiver}
                </span>
                <span className="text-sm font-bold text-zinc-900">
                  +${p.amount.value} <span className="text-[10px] font-normal text-zinc-400">{p.amount.currency_code}</span>
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 truncate">{p.note}</p>
              <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono pt-1 border-t border-zinc-100">
                <span>ReqID: {p.paypal_request_id.slice(0, 12)}...</span>
                <span className="font-medium text-zinc-600">{p.mode.toUpperCase()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
