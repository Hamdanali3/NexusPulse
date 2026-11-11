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
          className={`rounded-xl border px-4 py-3 text-xs flex items-center justify-between shadow-xs transition-all ${
            statusBanner.type === "success"
              ? "border-emerald-300 bg-emerald-50 text-emerald-900"
              : "border-rose-300 bg-rose-50 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2">
            {statusBanner.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span className="font-semibold">{statusBanner.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusBanner(null)}
            className={`text-xs font-bold px-2 py-0.5 rounded transition ${
              statusBanner.type === "success"
                ? "text-emerald-700 hover:text-emerald-950 hover:bg-emerald-100"
                : "text-rose-700 hover:text-rose-950 hover:bg-rose-100"
            }`}
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                Proof-of-Human Micro-Tasks
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 border border-sky-200 px-2.5 py-0.5 text-xs font-semibold text-sky-800">
                <DollarSign className="h-3 w-3 text-sky-600" />
                PayPal Payouts v1
              </span>
            </div>
            <h3 id="engine-2-heading" className="mt-1.5 text-lg font-bold text-slate-950">
              Engine 2: 60-Second Verification Bounties
            </h3>
            <p className="text-xs text-slate-600">
              Submit physical verification data reviewed by Gemini AI for instant PayPal and Venmo payouts.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 text-xs bg-slate-50 border border-slate-200 p-1 rounded-lg">
            <span className="text-slate-500 font-semibold px-1.5 flex items-center gap-1">
              <Filter className="h-3 w-3" /> Status:
            </span>
            <button
              type="button"
              onClick={() => setBountyFilter("ALL")}
              className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                bountyFilter === "ALL"
                  ? "bg-slate-900 text-white font-bold"
                  : "text-slate-600 hover:text-slate-950 hover:bg-white"
              }`}
            >
              All ({bounties.length})
            </button>
            <button
              type="button"
              onClick={() => setBountyFilter("OPEN")}
              className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                bountyFilter === "OPEN"
                  ? "bg-sky-600 text-white font-bold"
                  : "text-slate-600 hover:text-slate-950 hover:bg-white"
              }`}
            >
              Open ({bounties.filter((b) => b.status === "OPEN").length})
            </button>
            <button
              type="button"
              onClick={() => setBountyFilter("PAID")}
              className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                bountyFilter === "PAID"
                  ? "bg-emerald-600 text-white font-bold"
                  : "text-slate-600 hover:text-slate-950 hover:bg-white"
              }`}
            >
              Paid Out ({bounties.filter((b) => b.status === "PAID_OUT").length})
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
                  className={`rounded-xl border p-4 transition-all duration-200 cursor-pointer shadow-xs hover:scale-[1.01] ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-50/50 shadow-md ring-2 ring-emerald-500/20"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-slate-100 border border-slate-300 px-2 py-0.5 font-mono text-xs font-bold text-slate-900 shadow-2xs">
                          {bounty.id}
                        </span>
                        <span className="rounded-full bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-xs font-bold text-indigo-700">
                          {bounty.category.replace(/_/g, " ")}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-medium">
                          <MapPin className="h-3 w-3 text-slate-400" />
                          {bounty.location_scope}
                        </span>
                      </div>
                      <h4 className="mt-1.5 text-sm font-bold text-slate-950">
                        {bounty.title}
                      </h4>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Requester:{" "}
                        <strong className="text-slate-800 font-semibold">
                          {bounty.requester_agent}
                        </strong>{" "}
                        ({bounty.requester_org})
                      </p>
                    </div>

                    <div className="text-right shrink-0 tabular-nums">
                      <div className="text-lg font-extrabold text-emerald-600">
                        +${bounty.reward.value}
                      </div>
                      <div className="inline-flex items-center gap-1 text-xs text-slate-500 font-medium">
                        <Clock className="h-3 w-3" />~{bounty.estimated_seconds}s
                        {" · "}
                        <span className="text-emerald-700 font-bold">
                          ~${hourlyYield.toLocaleString()}/hr
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-600 truncate max-w-[65%] font-medium">
                      {bounty.prompt_instructions}
                    </span>
                    {isPaid ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 text-xs font-bold text-emerald-800 shrink-0">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        PAID ({bounty.payout_batch_id})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 border border-sky-300 px-2.5 py-0.5 text-xs font-bold text-sky-800 shrink-0">
                        OPEN FOR ORACLE
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Live Oracle Submission & Instant PayPal Payout Console */}
          <div className="lg:col-span-6">
            {selectedBounty && (
              <form
                onSubmit={handleSubmitAndPayout}
                className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 shadow-xs"
              >
                <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                      Oracle Verification &amp; Instant Payout Console
                    </span>
                    <h4 className="mt-0.5 text-base font-bold text-slate-950">
                      {selectedBounty.title}
                    </h4>
                  </div>
                  <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-right tabular-nums shrink-0 shadow-2xs">
                    <div className="text-[11px] font-semibold text-emerald-800">
                      Instant Reward
                    </div>
                    <div className="text-base font-extrabold text-emerald-700">
                      ${selectedBounty.reward.value}{" "}
                      {selectedBounty.reward.currency_code}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-slate-800">
                    Verification Rubric (Evaluated by Gemini 3.8 Flash Interactions API):
                  </div>
                  <ul className="space-y-1">
                    {selectedBounty.verification_criteria.map(
                      (criterion, idx) => (
                        <li
                          key={idx}
                          className="flex items-center gap-2 text-xs text-slate-700 font-medium"
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
                    className="block text-xs font-bold text-slate-800 mb-1.5"
                  >
                    Human Ground-Truth Telemetry / Audit Evidence:
                  </label>
                  <textarea
                    id="bounty-evidence-textarea"
                    rows={4}
                    value={evidenceText}
                    onChange={(e) => setEvidenceText(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-900 leading-relaxed shadow-xs focus:border-emerald-500"
                    placeholder="Enter your ground-truth observation, sensor telemetry, or code review findings..."
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="bounty-recipient-email"
                    className="block text-xs font-bold text-slate-800 mb-1"
                  >
                    PayPal / Venmo Payout Recipient Account (Email / Handle):
                  </label>
                  <input
                    id="bounty-recipient-email"
                    type="text"
                    autoComplete="email"
                    value={receiverEmail}
                    onChange={(e) => setReceiverEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 shadow-xs focus:border-emerald-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
                >
                  <Sparkles className="h-4 w-4" />
                  {submitting
                    ? "Gemini 3.8 Flash Auditing & Processing Payout..."
                    : `Verify Evidence & Trigger Instant $${selectedBounty.reward.value} PayPal Payout`}
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
                        className={`rounded-xl border p-3.5 space-y-2 text-xs shadow-xs nexus-fade-in ${
                          passed
                            ? "border-emerald-300 bg-emerald-50"
                            : "border-rose-300 bg-rose-50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`inline-flex items-center gap-1.5 font-bold ${
                              passed ? "text-emerald-900" : "text-rose-900"
                            }`}
                          >
                            {passed ? (
                              <Award className="h-4 w-4 text-emerald-700" />
                            ) : (
                              <XCircle className="h-4 w-4 text-rose-700" />
                            )}
                            Oracle Score: {result.score}/100 ({passed ? "PASSED" : "FAILED / REJECTED"})
                          </span>
                          <span className="font-mono text-xs text-slate-600 font-semibold">
                            Model: {result.gemini_model}
                          </span>
                        </div>
                        <p className={`text-xs leading-relaxed ${passed ? "text-slate-700" : "text-rose-800"}`}>
                          {result.reasoning}
                        </p>
                        {passed && (lastResult?.payout_batch_id || selectedBounty.payout_batch_id) && (
                          <div className="pt-2 border-t border-emerald-200 flex items-center justify-between text-xs text-emerald-900 font-mono font-semibold">
                            <span>
                              PayPal Payout Batch:{" "}
                              {lastResult?.payout_batch_id ?? selectedBounty.payout_batch_id}
                            </span>
                            <span className="text-emerald-700 font-bold">Status: SETTLED</span>
                          </div>
                        )}
                        {!passed && (
                          <div className="pt-1.5 border-t border-rose-200 text-rose-700 text-[11px] font-semibold">
                            Payout withheld. Please revise your ground-truth telemetry to address the criteria.
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
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Send className="h-4 w-4 text-emerald-600" />
            <h4 className="text-sm font-bold text-slate-950">
              PayPal Payouts v1 Settlement Feed (Human Oracle Income Stream)
            </h4>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Idempotent Sender Batch IDs • Instant Global Settlement
          </span>
        </div>

        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
          {payouts.map((p) => (
            <div
              key={p.payout_batch_id}
              className="rounded-xl border border-slate-200 bg-white hover:border-slate-300 p-3.5 text-xs space-y-1.5 shadow-xs transition hover:scale-[1.02]"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-emerald-700">
                  {p.payout_batch_id}
                </span>
                <span className="rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-bold text-emerald-800">
                  {p.batch_status}
                </span>
              </div>
              <div className="flex items-baseline justify-between tabular-nums">
                <span className="text-slate-600 truncate max-w-[65%] font-medium">
                  {p.receiver}
                </span>
                <span className="text-sm font-extrabold text-slate-950">
                  +${p.amount.value} {p.amount.currency_code}
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate font-medium">{p.note}</p>
              <div className="flex items-center justify-between text-xs text-slate-500 font-mono pt-1 border-t border-slate-100">
                <span>ReqID: {p.paypal_request_id.slice(0, 14)}...</span>
                <span className="font-bold text-slate-700">Mode: {p.mode.toUpperCase()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
