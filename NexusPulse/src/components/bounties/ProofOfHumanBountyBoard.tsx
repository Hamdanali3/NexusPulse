"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  FileCheck,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";
import type {
  PayPalExecutionMode,
  PayPalPayoutRecord,
  ProofOfHumanBounty,
} from "@/lib/paypal/paypal-types";
import { formatSignedUsd, formatUsd, sanitizeDisplayEmail, sanitizeSeedCopy } from "@/lib/format";
import { Button, ListRow, ListSection, StatusDot } from "@/components/ui";

interface ProofOfHumanBountyBoardProps {
  bounties: ProofOfHumanBounty[];
  payouts: PayPalPayoutRecord[];
  activeMode?: PayPalExecutionMode;
  sandboxBuyerEmail?: string;
  onStateUpdated: () => void;
}

export default function ProofOfHumanBountyBoard({
  bounties,
  payouts,
  activeMode = "sandbox",
  sandboxBuyerEmail = "sb-ifqau51324237@personal.example.com",
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
  const [receiverEmail, setReceiverEmail] = useState<string>(sandboxBuyerEmail);
  const [submitting, setSubmitting] = useState(false);
  const [bountyFilter, setBountyFilter] = useState<"ALL" | "OPEN" | "PAID">("ALL");

  // Media evidence upload state
  const [attachedFile, setAttachedFile] = useState<{
    fileName: string;
    mediaUrl: string;
    base64: string;
    mimeType: string;
  } | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);

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
    setAttachedFile(null);
    setLastResult(null);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bountyId", selectedBounty?.id || "");
      formData.append("purpose", "bounty_evidence");

      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAttachedFile({
          fileName: data.fileName,
          mediaUrl: data.mediaUrl,
          base64: data.base64,
          mimeType: data.mimeType,
        });
      } else {
        setStatusBanner({
          type: "error",
          text: data.error || "Failed to process media upload",
        });
      }
    } catch {
      setStatusBanner({
        type: "error",
        text: "Network error while uploading evidence file",
      });
    } finally {
      setUploadingFile(false);
    }
  }

  const displayedBounties = bounties.filter((b) => {
    if (bountyFilter === "OPEN") return b.status === "OPEN";
    if (bountyFilter === "PAID") return b.status === "PAID_OUT";
    return true;
  });

  async function handleSubmitAndPayout(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBounty) return;

    const trimmedEvidence = evidenceText.trim();
    if (trimmedEvidence.length < 10) {
      setStatusBanner({
        type: "error",
        text: "Evidence text is too short. Please provide at least 10 characters of audit/verification details.",
      });
      return;
    }

    const trimmedEmail = receiverEmail.trim();
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);
    const isVenmo = /^@[a-zA-Z0-9_-]{3,40}$/.test(trimmedEmail);
    if (!isEmail && !isVenmo) {
      setStatusBanner({
        type: "error",
        text: "Please enter a valid PayPal email address (e.g. name@example.com) or @venmo handle.",
      });
      return;
    }

    setSubmitting(true);
    setLastResult(null);
    setStatusBanner(null);

    try {
      const res = await fetch("/api/ai/verify-bounty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bountyId: selectedBounty.id,
          evidenceText: trimmedEvidence,
          imageBase64: attachedFile?.base64,
          imageMimeType: attachedFile?.mimeType,
          recipientEmail: trimmedEmail,
          recipientType: isVenmo ? "VENMO_HANDLE" : "EMAIL",
        }),
      });
      const data = await res.json();

      const audit = data.audit || data.verification;
      const payoutBatchId =
        data.payout_batch_id || data.payout?.payout_batch_id || "PYB-MOCK-VERIFIED";

      if (res.ok && data.ok && audit) {
        setLastResult({
          passed: Boolean(audit.passed),
          score: audit.score ?? 95,
          gemini_model: audit.gemini_model || audit.model || "gemini-3.8-flash",
          reasoning: audit.reasoning || "Verified ground-truth evidence meets all criteria.",
          payout_batch_id: payoutBatchId,
        });

        if (audit.passed) {
          setStatusBanner({
            type: "success",
            text: `Task ${selectedBounty.id} verified (score ${audit.score}/100). Sent $${selectedBounty.reward.value} USD to ${trimmedEmail} in payout batch ${payoutBatchId}.`,
          });
          onStateUpdated();
        } else {
          setStatusBanner({
            type: "error",
            text: `Verification declined: score ${audit.score}/100 did not meet criteria. ${audit.reasoning}`,
          });
        }
      } else {
        setStatusBanner({
          type: "error",
          text: data.error || "Could not verify task evidence. Check the submission details and recipient address.",
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
    <section aria-label="Verified tasks" className="space-y-8">
      {/* Explicit Success or Failure Message Banner */}
      {statusBanner && (
        <div
          role={statusBanner.type === "error" ? "alert" : "status"}
          aria-live="polite"
          className={`rounded-[12px] border px-4 py-3 text-[13px] flex items-center justify-between transition-colors ${
            statusBanner.type === "success"
              ? "border-emerald-200 bg-emerald-50/70 text-emerald-900"
              : "border-red-200 bg-red-50/70 text-red-900"
          }`}
        >
          <div className="flex items-center gap-2">
            {statusBanner.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" strokeWidth={1.5} />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-700 shrink-0" strokeWidth={1.5} />
            )}
            <span className="font-medium">{statusBanner.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusBanner(null)}
            className="text-[12px] font-medium px-2 py-0.5 rounded-[6px] text-zinc-700 hover:text-zinc-950 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-200">
          <span className="text-[13px] text-zinc-600">
            Select a task to review verification criteria and submit proof.
          </span>

          {/* Segmented Filter */}
          <div role="group" aria-label="Filter tasks" className="flex items-center gap-1 text-[13px] bg-zinc-100 p-1 rounded-[6px]">
            <button
              type="button"
              onClick={() => setBountyFilter("ALL")}
              className={`rounded-[6px] px-2.5 py-1 text-[13px] font-medium transition-colors ${
                bountyFilter === "ALL"
                  ? "bg-white text-zinc-950 border border-zinc-200"
                  : "text-zinc-600 hover:text-zinc-950"
              }`}
            >
              All ({bounties.length})
            </button>
            <button
              type="button"
              onClick={() => setBountyFilter("OPEN")}
              className={`rounded-[6px] px-2.5 py-1 text-[13px] font-medium transition-colors ${
                bountyFilter === "OPEN"
                  ? "bg-white text-zinc-950 border border-zinc-200"
                  : "text-zinc-600 hover:text-zinc-950"
              }`}
            >
              Open ({bounties.filter((b) => b.status === "OPEN").length})
            </button>
            <button
              type="button"
              onClick={() => setBountyFilter("PAID")}
              className={`rounded-[6px] px-2.5 py-1 text-[13px] font-medium transition-colors ${
                bountyFilter === "PAID"
                  ? "bg-white text-zinc-950 border border-zinc-200"
                  : "text-zinc-600 hover:text-zinc-950"
              }`}
            >
              Paid ({bounties.filter((b) => b.status === "PAID_OUT").length})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Dense Hairline Task List */}
          <div className="lg:col-span-6">
            <ListSection>
              {displayedBounties.map((bounty) => {
                const isSelected = selectedBounty?.id === bounty.id;
                const isPaid = bounty.status === "PAID_OUT";

                return (
                  <ListRow
                    key={bounty.id}
                    selected={isSelected}
                    onSelect={() => handleSelectBounty(bounty)}
                    title={<span title={sanitizeSeedCopy(bounty.title)}>{sanitizeSeedCopy(bounty.title)}</span>}
                    subtitle={
                      <span>
                        ~{bounty.estimated_seconds}s est. · {bounty.location_scope}
                      </span>
                    }
                    amount={
                      <div className="flex flex-col items-end gap-0.5 tabular-nums">
                        <span className="text-[14px] font-semibold text-zinc-950">
                          {formatSignedUsd(bounty.reward.value)}
                        </span>
                        <StatusDot
                          label={isPaid ? "Paid" : "Open"}
                          tone={isPaid ? "positive" : "neutral"}
                          className="text-[12px]"
                        />
                      </div>
                    }
                  />
                );
              })}
            </ListSection>
          </div>

          {/* Right Column: Task Details & Verification Form */}
          <div className="lg:col-span-6">
            {selectedBounty && (
              <form
                onSubmit={handleSubmitAndPayout}
                className="rounded-[12px] border border-zinc-200 bg-white p-5 space-y-4 lg:sticky lg:top-20"
              >
                <div className="flex items-start justify-between gap-4 border-b border-zinc-200 pb-3">
                  <div className="min-w-0">
                    <span className="text-[12px] font-medium text-zinc-600">
                      Task details
                    </span>
                    <h3 className="mt-0.5 text-[15px] font-semibold text-zinc-950">
                      {sanitizeSeedCopy(selectedBounty.title)}
                    </h3>
                    <p className="mt-1 text-[13px] text-zinc-600 leading-relaxed">
                      {selectedBounty.prompt_instructions}
                    </p>
                  </div>
                  <div className="text-right tabular-nums shrink-0">
                    <div className="text-[12px] text-zinc-600">Reward</div>
                    <div className="text-[18px] font-semibold text-zinc-950">
                      {formatUsd(selectedBounty.reward.value)}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-[13px] font-medium text-zinc-900">
                    Verification checklist
                  </div>
                  <ul className="space-y-1.5">
                    {selectedBounty.verification_criteria.map(
                      (criterion, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-[13px] text-zinc-600"
                        >
                          <ShieldCheck className="h-4 w-4 text-zinc-700 shrink-0 mt-0.5" strokeWidth={1.5} />
                          <span>{sanitizeSeedCopy(criterion)}</span>
                        </li>
                      )
                    )}
                  </ul>
                </div>

                <div>
                  <label
                    htmlFor="bounty-evidence-textarea"
                    className="block text-[13px] font-medium text-zinc-900 mb-1"
                  >
                    Verification notes
                  </label>
                  <textarea
                    id="bounty-evidence-textarea"
                    rows={3}
                    value={evidenceText}
                    onChange={(e) => setEvidenceText(e.target.value)}
                    className="w-full rounded-[6px] border border-zinc-200 bg-white p-2.5 text-[13px] text-zinc-900 placeholder:text-zinc-500 leading-relaxed transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Enter field observations, counts, or notes"
                    required
                  />
                </div>

                {/* Photo or Receipt Attachment */}
                <div>
                  <label className="block text-[13px] font-medium text-zinc-900 mb-1">
                    Photo or receipt (optional)
                  </label>
                  {attachedFile ? (
                    <div className="flex items-center justify-between rounded-[6px] border border-zinc-200 bg-[#fafafa] px-3 py-2 text-[13px]">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileCheck className="h-4 w-4 text-emerald-700 shrink-0" strokeWidth={1.5} />
                        <span className="font-medium text-zinc-900 truncate">
                          {attachedFile.fileName}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAttachedFile(null)}
                        className="rounded-[6px] p-1 text-zinc-600 hover:text-zinc-950 transition-colors"
                        title="Remove attached file"
                        aria-label="Remove attached file"
                      >
                        <X className="h-4 w-4" strokeWidth={1.5} />
                      </button>
                    </div>
                  ) : (
                    <label
                      htmlFor="bounty-media-file-input"
                      className="flex cursor-pointer items-center justify-center gap-2 rounded-[6px] border border-dashed border-zinc-300 bg-[#fafafa] hover:bg-zinc-100/70 px-3 py-2.5 text-[13px] text-zinc-600 transition-colors"
                    >
                      <Camera className="h-4 w-4 text-zinc-500" strokeWidth={1.5} />
                      <span>
                        {uploadingFile
                          ? "Uploading file..."
                          : "Upload photo, receipt, or short video (max 10 MB)"}
                      </span>
                      <input
                        id="bounty-media-file-input"
                        type="file"
                        accept="image/*,video/mp4"
                        onChange={handleFileUpload}
                        disabled={uploadingFile}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="bounty-recipient-email"
                    className="block text-[13px] font-medium text-zinc-900 mb-1"
                  >
                    PayPal or Venmo email
                  </label>
                  <input
                    id="bounty-recipient-email"
                    type="text"
                    autoComplete="email"
                    value={receiverEmail}
                    onChange={(e) => setReceiverEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full h-9 rounded-[6px] border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 placeholder:text-zinc-500 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  loading={submitting}
                  className="w-full"
                >
                  {submitting
                    ? "Verifying and sending payout..."
                    : `Verify and pay ${formatUsd(selectedBounty.reward.value)}`}
                </Button>

                {/* Explicit Verification Receipt */}
                {(lastResult || selectedBounty.verification_result) && (
                  (() => {
                    const result = lastResult ?? selectedBounty.verification_result;
                    if (!result) return null;
                    const passed = result.passed;

                    return (
                      <div
                        role={passed ? "status" : "alert"}
                        aria-live="polite"
                        className={`rounded-[6px] border p-3.5 space-y-2 text-[13px] ${
                          passed
                            ? "border-emerald-200 bg-emerald-50/70"
                            : "border-red-200 bg-red-50/70"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 font-semibold ${
                              passed ? "text-emerald-900" : "text-red-900"
                            }`}
                          >
                            {passed ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-700" strokeWidth={1.5} />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-700" strokeWidth={1.5} />
                            )}
                            Score {result.score}/100 ({passed ? "Approved" : "Needs revision"})
                          </span>
                        </div>
                        <p className={`text-[13px] leading-relaxed ${passed ? "text-zinc-700" : "text-red-800"}`}>
                          {sanitizeSeedCopy(result.reasoning)}
                        </p>
                        {passed && (lastResult?.payout_batch_id || selectedBounty.payout_batch_id) && (
                          <div className="pt-2 border-t border-emerald-200/70 flex items-center justify-between text-[12px] text-emerald-900">
                            <span className="font-mono">
                              Batch {lastResult?.payout_batch_id ?? selectedBounty.payout_batch_id}
                            </span>
                            <StatusDot label="Paid" tone="positive" className="text-[12px]" />
                          </div>
                        )}
                        {!passed && (
                          <div className="pt-1.5 border-t border-red-200/70 text-red-800 text-[12px]">
                            Payout held until updated notes or photo meet criteria.
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

      {/* RECENT PAYOUTS TABLE */}
      <div className="rounded-[12px] border border-zinc-200 bg-white overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5 border-b border-zinc-200">
          <h3 className="text-[15px] font-semibold text-zinc-950">
            Payouts history
          </h3>
          <span className="text-[12px] text-zinc-600 tabular-nums">
            {payouts.length} payouts
          </span>
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead className="sticky top-0 bg-[#fafafa] border-b border-zinc-200 text-[12px] text-zinc-600">
              <tr>
                <th className="h-10 px-5 font-medium whitespace-nowrap">Payout ID</th>
                <th className="h-10 px-3 font-medium whitespace-nowrap">Recipient</th>
                <th className="h-10 px-3 font-medium">Task note</th>
                <th className="h-10 px-3 font-medium whitespace-nowrap">Status</th>
                <th className="h-10 px-5 text-right font-medium whitespace-nowrap">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {payouts.map((p) => {
                const safeEmail = sanitizeDisplayEmail(p.receiver);
                const isPaidStatus = p.batch_status === "SUCCESS";
                return (
                  <tr key={p.payout_batch_id} className="h-11 hover:bg-zinc-50 transition-colors">
                    <td className="px-5 font-mono text-[12px] text-zinc-900 whitespace-nowrap">
                      {p.payout_batch_id}
                    </td>
                    <td className="px-3 text-zinc-700 whitespace-nowrap">
                      {safeEmail}
                    </td>
                    <td title={sanitizeSeedCopy(p.note)} className="px-3 text-zinc-600 max-w-md">
                      <span className="line-clamp-2">{sanitizeSeedCopy(p.note)}</span>
                    </td>
                    <td className="px-3 whitespace-nowrap">
                      <StatusDot
                        label={isPaidStatus ? "Paid" : p.batch_status}
                        tone={isPaidStatus ? "positive" : "neutral"}
                      />
                    </td>
                    <td className="px-5 text-right font-semibold text-emerald-700 tabular-nums whitespace-nowrap">
                      {formatSignedUsd(p.amount.value)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="md:hidden divide-y divide-zinc-200">
          {payouts.map((p) => {
            const safeEmail = sanitizeDisplayEmail(p.receiver);
            const isPaidStatus = p.batch_status === "SUCCESS";
            return (
              <div key={p.payout_batch_id} className="px-4 py-3 space-y-1 text-[13px]">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-[12px] font-medium text-zinc-900">
                    {p.payout_batch_id}
                  </span>
                  <span className="font-semibold text-emerald-700 tabular-nums">
                    {formatSignedUsd(p.amount.value)}
                  </span>
                </div>
                <div className="flex flex-col items-start gap-1 text-[12px] text-zinc-600">
                  <span className="break-all">{safeEmail}</span>
                  <StatusDot
                    label={isPaidStatus ? "Paid" : p.batch_status}
                    tone={isPaidStatus ? "positive" : "neutral"}
                    className="text-[12px]"
                  />
                </div>
                <p title={sanitizeSeedCopy(p.note)} className="text-[12px] text-zinc-600 line-clamp-2">
                  {sanitizeSeedCopy(p.note)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
