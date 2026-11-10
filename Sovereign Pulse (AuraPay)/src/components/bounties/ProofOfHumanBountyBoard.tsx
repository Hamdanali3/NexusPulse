"use client";

import React, { useState } from "react";
import {
  Award,
  CheckCircle2,
  Clock,
  DollarSign,
  MapPin,
  Send,
  ShieldCheck,
  Sparkles,
  UserCheck,
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
    "sb-buyer-sovereign@personal.example.com"
  );
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<{
    passed: boolean;
    score: number;
    gemini_model: string;
    reasoning: string;
    payout_batch_id?: string;
    amount?: string;
  } | null>(null);

  function handleSelectBounty(bounty: ProofOfHumanBounty) {
    setSelectedBountyId(bounty.id);
    setEvidenceText(bounty.sample_evidence_text);
    setLastResult(null);
  }

  async function handleSubmitAndPayout(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBounty) return;
    setSubmitting(true);
    setLastResult(null);
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
      if (data.verification) {
        setLastResult({
          passed: data.verification.passed,
          score: data.verification.score,
          gemini_model: data.verification.model,
          reasoning: data.verification.reasoning,
          payout_batch_id: data.payout?.payout_batch_id,
          amount: data.payout?.amount?.value,
        });
        onStateUpdated();
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                <UserCheck className="h-3.5 w-3.5" />
                50-Year AGI Bridge: Proof-of-Human Oracle Protocol
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 border border-sky-500/30 px-2.5 py-0.5 text-[11px] font-medium text-sky-300">
                <DollarSign className="h-3 w-3" />
                PayPal Payouts v1 API (POST /v1/payments/payouts)
              </span>
            </div>
            <h3 className="mt-1.5 text-lg font-bold text-white">
              Engine 2: Proof-of-Human Oracle Micro-Bounties &amp; Instant PayPal Payouts
            </h3>
            <p className="text-xs text-slate-400">
              Enterprise AI agents post real-time bounties for scarce physical-world telemetry, security audits, and cultural nuance. Gemini 3.8 Flash verifies submissions in &lt;2 seconds and triggers instant PayPal/Venmo disbursements.
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Bounty Cards */}
          <div className="lg:col-span-6 space-y-3">
            {bounties.map((bounty) => {
              const isSelected = selectedBounty?.id === bounty.id;
              const isPaid = bounty.status === "PAID_OUT";

              return (
                <div
                  key={bounty.id}
                  onClick={() => handleSelectBounty(bounty)}
                  className={`rounded-xl border p-4 transition cursor-pointer ${
                    isSelected
                      ? "border-emerald-500/60 bg-emerald-950/20 shadow-lg shadow-emerald-950/30"
                      : "border-slate-800 bg-slate-950/80 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-slate-300">
                          {bounty.id}
                        </span>
                        <span className="rounded-full bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-semibold text-indigo-300">
                          {bounty.category.replace(/_/g, " ")}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                          <MapPin className="h-3 w-3 text-slate-500" />
                          {bounty.location_scope}
                        </span>
                      </div>
                      <h4 className="mt-1.5 text-sm font-bold text-white">
                        {bounty.title}
                      </h4>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        Requester:{" "}
                        <strong className="text-slate-200">
                          {bounty.requester_agent}
                        </strong>{" "}
                        ({bounty.requester_org})
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-lg font-extrabold text-emerald-400">
                        +${bounty.reward.value}
                      </div>
                      <div className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                        <Clock className="h-3 w-3" />~{bounty.estimated_seconds}s
                        task
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 truncate max-w-[65%]">
                      {bounty.prompt_instructions}
                    </span>
                    {isPaid ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-300 shrink-0">
                        <CheckCircle2 className="h-3 w-3" />
                        PAID ({bounty.payout_batch_id})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 border border-sky-500/30 px-2.5 py-0.5 text-[10px] font-semibold text-sky-300 shrink-0">
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
                className="rounded-xl border border-slate-800 bg-slate-950/90 p-5 space-y-4"
              >
                <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
                      Oracle Verification &amp; Instant Payout Console
                    </span>
                    <h4 className="mt-0.5 text-base font-bold text-white">
                      {selectedBounty.title}
                    </h4>
                  </div>
                  <div className="rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 text-right">
                    <div className="text-[10px] text-emerald-300">
                      Instant Reward
                    </div>
                    <div className="text-base font-extrabold text-emerald-400">
                      ${selectedBounty.reward.value}{" "}
                      {selectedBounty.reward.currency_code}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-slate-300">
                    Verification Rubric (Evaluated by Gemini 3.8 Flash Interactions API):
                  </div>
                  <ul className="space-y-1">
                    {selectedBounty.verification_criteria.map(
                      (criterion, idx) => (
                        <li
                          key={idx}
                          className="flex items-center gap-2 text-xs text-slate-400"
                        >
                          <ShieldCheck className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                          <span>{criterion}</span>
                        </li>
                      )
                    )}
                  </ul>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Human Ground-Truth Telemetry / Audit Evidence:
                  </label>
                  <textarea
                    rows={4}
                    value={evidenceText}
                    onChange={(e) => setEvidenceText(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-xs text-white leading-relaxed focus:border-emerald-500 focus:outline-none"
                    placeholder="Enter your ground-truth observation, sensor telemetry, or code review findings..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    PayPal / Venmo Payout Recipient Email:
                  </label>
                  <input
                    type="email"
                    value={receiverEmail}
                    onChange={(e) => setReceiverEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/25 transition cursor-pointer"
                >
                  <Sparkles className="h-4 w-4" />
                  {submitting
                    ? "Gemini 3.8 Flash Verifying & Executing PayPal Payout..."
                    : `Verify Evidence & Trigger Instant $${selectedBounty.reward.value} PayPal Payout`}
                </button>

                {/* Verification & Payout Receipt */}
                {(lastResult || selectedBounty.verification_result) && (
                  <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/25 p-3.5 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 font-bold text-emerald-300">
                        <Award className="h-4 w-4 text-emerald-400" />
                        Oracle Score:{" "}
                        {lastResult?.score ??
                          selectedBounty.verification_result?.score}
                        /100 (PASSED)
                      </span>
                      <span className="font-mono text-[11px] text-indigo-300">
                        Model:{" "}
                        {lastResult?.gemini_model ??
                          selectedBounty.verification_result?.gemini_model}
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      {lastResult?.reasoning ??
                        selectedBounty.verification_result?.reasoning}
                    </p>
                    {(lastResult?.payout_batch_id ||
                      selectedBounty.payout_batch_id) && (
                      <div className="pt-2 border-t border-emerald-500/20 flex items-center justify-between text-[11px] text-emerald-300 font-mono">
                        <span>
                          PayPal Payout Batch:{" "}
                          {lastResult?.payout_batch_id ??
                            selectedBounty.payout_batch_id}
                        </span>
                        <span>Status: SUCCESS (Settled)</span>
                      </div>
                    )}
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      </div>

      {/* RECENT PAYPAL PAYOUTS V1 BATCH HISTORY */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Send className="h-4 w-4 text-emerald-400" />
            <h4 className="text-sm font-bold text-white">
              PayPal Payouts v1 Settlement Feed (Human Oracle Income Stream)
            </h4>
          </div>
          <span className="text-xs text-slate-400">
            Idempotent Sender Batch IDs • Instant Global Settlement
          </span>
        </div>

        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
          {payouts.map((p) => (
            <div
              key={p.payout_batch_id}
              className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 text-xs space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-emerald-400">
                  {p.payout_batch_id}
                </span>
                <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                  {p.batch_status}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-slate-400 truncate max-w-[65%]">
                  {p.receiver}
                </span>
                <span className="text-sm font-extrabold text-white">
                  +${p.amount.value} {p.amount.currency_code}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">{p.note}</p>
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-800/70">
                <span>ReqID: {p.paypal_request_id.slice(0, 14)}...</span>
                <span>Mode: {p.mode.toUpperCase()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
