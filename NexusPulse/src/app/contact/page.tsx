"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Bot,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  ExternalLink,
  FileText,
  Gavel,
  Hash,
  HelpCircle,
  KeyRound,
  LifeBuoy,
  Lock,
  Mail,
  MessageSquare,
  RefreshCw,
  Send,
  ShieldCheck,
  Terminal,
  User,
  Zap,
} from "lucide-react";
import NexusHeader from "@/components/layout/NexusHeader";
import NexusFooter from "@/components/layout/NexusFooter";
import NexusAiChatbot from "@/components/chat/NexusAiChatbot";
import type { NexusPulseState } from "@/lib/paypal/paypal-sandbox-mirror";
import type { PayPalExecutionMode } from "@/lib/paypal/paypal-types";
import {
  type ContactFormData,
  type ContactInquirerRole,
  type ContactInquiryType,
  type ContactUrgency,
  validateContactForm,
} from "@/lib/security/validation";

interface SubmitSuccessData {
  ticketId: string;
  receivedAt: string;
  estimatedSla: string;
  routedTo?: string;
  mailtoUrl?: string;
  summary: {
    fullName: string;
    email: string;
    inquiryType: string;
    role: string;
    urgency: string;
    subject: string;
    referenceId?: string;
  };
  message: string;
}

const FAQ_ITEMS = [
  {
    q: "How can PayPal Hackathon judges test with Slot 013 or their own Sandbox credentials?",
    a: "NexusPulse boots Credential-First in Live PayPal Sandbox mode (Slot 013) whenever .env.local credentials are set, and judges can also open the PayPal Sandbox drawer in the top navigation bar to hot-swap Client ID & Secret or switch to offline Mirror Mode at runtime.",
  },
  {
    q: "What are the pre-configured Slot 013 Sandbox test accounts for verification?",
    a: "Personal Buyer (AEME4VE2LQ8D8): sb-ifqau51324237@personal.example.com. Business Merchant (6NGH9RSQMDEUJ): sb-mokyu51324247@business.example.com. Both Slot 013 Sandbox accounts are active for Orders v2, JS SDK v6, Payouts v1, Invoicing v2, and Subscriptions v1.",
  },
  {
    q: "How fast are Proof-of-Human bounties verified and paid?",
    a: "Google Gemini 3.8 Flash audits photo and textual evidence in under 2 seconds via @google/genai structured outputs. Upon verification, PayPal Payouts v1 executes instant single-item payouts directly to the contributor's PayPal or Venmo account.",
  },
  {
    q: "How does A2A Smart Escrow prevent chargebacks and disputes?",
    a: "NexusPulse holds project milestone funds using PayPal Orders v2 intent: 'AUTHORIZE'. When deliverables are verified, funds are captured and PayPal Shipment Trackers API v2 attaches proof telemetry, activating PayPal's seller & buyer dispute protections.",
  },
  {
    q: "Is submitted contact information secure?",
    a: "All submissions are protected by Fetch Metadata resource isolation (Sec-Fetch-Site), sanitized against XSS, validated against strict schemas, and stored with unique cryptographic tracking IDs. No sensitive credentials are ever transmitted through this form.",
  },
];

const PRESETS = [
  {
    id: "judge",
    label: "⚖️ Hackathon Judge Review",
    data: {
      fullName: "PayPal AI Hackathon Judge",
      email: "judge-evaluator@hackathon.paypal.com",
      role: "judge" as ContactInquirerRole,
      inquiryType: "hackathon_judging" as ContactInquiryType,
      urgency: "urgent_judge" as ContactUrgency,
      subject: "Judge Review: Evaluating Dual-Mode Parity & APIMatic Controllers",
      referenceId: "PAYPAL-AI-HACK-2026",
      message:
        "Hello NexusPulse Team, I am evaluating your project for the PayPal AI Hackathon. I am testing the Google Gemini CFO sweep, Channel3 Deal Hunter with PayPal JS SDK v6, Proof-of-Human Payouts v1, and Bryntum Escrow timeline. Please provide any additional judge documentation if required.",
    },
  },
  {
    id: "developer",
    label: "💻 Developer / APIMatic SDK",
    data: {
      fullName: "Autonomous Agent Developer",
      email: "developer@agentic-systems.io",
      role: "developer" as ContactInquirerRole,
      inquiryType: "developer_api" as ContactInquiryType,
      urgency: "high" as ContactUrgency,
      subject: "Integration Query: Utilizing @paypal/paypal-server-sdk v2.5.0 with A2A Escrow",
      referenceId: "API-DEV-9021",
      message:
        "We are building autonomous agents that need to lock milestone funds before initiating long-running compute jobs. How can we import your Orders v2 AUTHORIZE flow and Bryntum Gantt dependencies into our agent framework?",
    },
  },
  {
    id: "security",
    label: "🛡️ Security & Dispute Shield",
    data: {
      fullName: "Security Auditor",
      email: "sec-ops@fintech-auditing.org",
      role: "merchant" as ContactInquirerRole,
      inquiryType: "security_disclosure" as ContactInquiryType,
      urgency: "normal" as ContactUrgency,
      subject: "Inquiry on SHA256withRSA Webhook Signature Verification and Idempotency",
      referenceId: "SEC-AUDIT-440",
      message:
        "We reviewed your implementation of POST /v1/notifications/verify-webhook-signature and the PayPal-Request-Id idempotency headers. We would like to confirm your testing coverage for replay attack mitigation.",
    },
  },
];

export default function ContactPage() {
  const [appState, setAppState] = useState<NexusPulseState | null>(null);
  const [activeMode, setActiveMode] = useState<PayPalExecutionMode>("mirror");
  const [preferredMode, setPreferredMode] = useState<
    "auto" | "live" | "sandbox" | "mirror"
  >("auto");
  const [databaseSource, setDatabaseSource] = useState<string>("in_memory_mirror");
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<ContactFormData>({
    fullName: "",
    email: "",
    inquiryType: "general",
    role: "judge",
    urgency: "normal",
    subject: "",
    referenceId: "",
    message: "",
    agreedToTerms: false,
    honeypot: "",
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<SubmitSuccessData | null>(null);
  const [copiedTicket, setCopiedTicket] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Sync state with backend
  const fetchState = useCallback(async () => {
    try {
      const res = await fetch("/api/state", { cache: "no-store" });
      const data = await res.json();
      if (data.state) {
        setAppState(data.state);
        setActiveMode(data.activeMode ?? "mirror");
        setPreferredMode(data.preferredMode ?? "auto");
        setDatabaseSource(data.database || "in_memory_mirror");
      }
    } catch {
      // Non-blocking fallback
    }
  }, []);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  // Live validation on field changes
  const runLiveValidation = (currentData: ContactFormData) => {
    const res = validateContactForm(currentData);
    const errs: Record<string, string> = {};
    for (const [key, msg] of Object.entries(res.errors)) {
      if (msg) errs[key] = msg;
    }
    setFieldErrors(errs);
    return res;
  };

  const handleFieldChange = (
    field: keyof ContactFormData,
    value: unknown
  ) => {
    const next = { ...formData, [field]: value };
    setFormData(next);
    if (touched[field]) {
      runLiveValidation(next);
    }
    if (submitError) setSubmitError(null);
  };

  const handleBlur = (field: keyof ContactFormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    runLiveValidation(formData);
  };

  const handleApplyPreset = (presetKey: string) => {
    const target = PRESETS.find((p) => p.id === presetKey);
    if (!target) return;
    const next: ContactFormData = {
      ...formData,
      ...target.data,
      agreedToTerms: true,
    };
    setFormData(next);
    setTouched({
      fullName: true,
      email: true,
      role: true,
      inquiryType: true,
      urgency: true,
      subject: true,
      message: true,
      agreedToTerms: true,
    });
    setFieldErrors({});
    if (submitError) setSubmitError(null);
  };

  const handleResetForm = () => {
    setFormData({
      fullName: "",
      email: "",
      inquiryType: "general",
      role: "judge",
      urgency: "normal",
      subject: "",
      referenceId: "",
      message: "",
      agreedToTerms: false,
      honeypot: "",
    });
    setTouched({});
    setFieldErrors({});
    setSubmitError(null);
    setSuccessData(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      fullName: true,
      email: true,
      role: true,
      inquiryType: true,
      urgency: true,
      subject: true,
      message: true,
      agreedToTerms: true,
    });

    const validation = runLiveValidation(formData);
    if (!validation.valid) {
      setSubmitError("Please correct the highlighted errors before submitting.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        setSubmitError(
          result.error ||
            "Unable to submit inquiry. Please review the form and try again."
        );
        if (result.errors) {
          setFieldErrors(result.errors);
        }
        return;
      }

      setSuccessData(result);
    } catch {
      setSubmitError(
        "Network connection error while contacting the clearinghouse desk. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyTicketId = () => {
    if (!successData?.ticketId) return;
    navigator.clipboard.writeText(successData.ticketId);
    setCopiedTicket(true);
    setTimeout(() => setCopiedTicket(false), 2000);
  };

  // Header Handlers
  async function handleSwitchMode(nextPref: "auto" | "live" | "sandbox" | "mirror") {
    setPreferredMode(nextPref);
    try {
      const res = await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferredMode: nextPref }),
      });
      const data = await res.json();
      if (data.state) {
        setAppState(data.state);
        setActiveMode(data.activeMode ?? "mirror");
      }
    } catch {
      // Non-blocking
    }
  }

  async function handleSaveRuntimeCredentials(
    clientId: string,
    clientSecret: string
  ) {
    try {
      const res = await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          clientSecret,
          preferredMode: "sandbox",
        }),
      });
      const data = await res.json();
      if (data.state) {
        setAppState(data.state);
        setActiveMode(data.activeMode ?? "sandbox");
        setPreferredMode("sandbox");
      }
    } catch {
      // Non-blocking
    }
  }

  async function handlePlayVoiceBriefing() {
    setVoiceLoading(true);
    try {
      const res = await fetch("/api/ai/voice-briefing", { method: "POST" });
      const data = await res.json();
      if (data.transcript) {
        setVoiceTranscript(data.transcript);
        if (data.audioBase64) {
          const audio = new Audio(
            `data:${data.mimeType || "audio/wav"};base64,${data.audioBase64}`
          );
          audio.play().catch(() => {});
        } else if (typeof window !== "undefined" && "speechSynthesis" in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(data.transcript);
          utterance.rate = 1.04;
          window.speechSynthesis.speak(utterance);
        }
      }
    } finally {
      setVoiceLoading(false);
    }
  }

  async function handleResetDemoState() {
    try {
      const res = await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RESET_STATE" }),
      });
      const data = await res.json();
      if (data.state) {
        setAppState(data.state);
      }
    } catch {
      // Non-blocking
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 text-zinc-950 antialiased">
      {/* Header */}
      <NexusHeader
        activeTab="contact"
        activeMode={activeMode}
        preferredMode={preferredMode}
        databaseSource={databaseSource}
        voiceLoading={voiceLoading}
        voiceTranscript={voiceTranscript}
        onSwitchMode={handleSwitchMode}
        onSaveRuntimeCredentials={handleSaveRuntimeCredentials}
        onPlayVoiceBriefing={handlePlayVoiceBriefing}
        onResetDemoState={handleResetDemoState}
      />

      {/* Main Content */}
      <main className="flex-1 mx-auto w-full max-w-5xl px-5 sm:px-8 py-8 space-y-8">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-zinc-500">
          <Link
            href="/"
            className="inline-flex items-center gap-1 hover:text-zinc-900 font-medium transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Overview</span>
          </Link>
          <span className="text-zinc-300">/</span>
          <span className="font-medium text-zinc-900">Contact &amp; Judge Desk</span>
        </nav>

        {/* Hero Section */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-xs">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-0.5 text-xs font-medium text-zinc-700">
              <span className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
              <span>Judge &amp; Developer Desk</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950">
              Contact NexusPulse
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
              Direct channel for <strong>PayPal AI Hackathon judges</strong>, developers integrating{" "}
              <strong>PayPal SDKs</strong>, oracle contributors, and partners deploying{" "}
              <strong>Smart Escrow</strong>. Every inquiry is logged with an SLA guarantee.
            </p>

            {/* SLA Badges */}
            <div className="pt-2 flex flex-wrap items-center gap-2.5 text-xs">
              <div className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-emerald-800 text-[11px] font-medium">
                <Clock className="h-3 w-3 text-emerald-600" />
                <span>Judge Review SLA: &lt; 2 Hours</span>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-2.5 py-1 text-zinc-700 text-[11px] font-medium">
                <ShieldCheck className="h-3 w-3 text-zinc-500" />
                <span>Cryptographic Inquiry Receipt</span>
              </div>
            </div>
          </div>
        </section>

        {/* Main 2-Column Grid: Form on Left, Verification & Direct Channels on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Contact Form / Confirmation */}
          <div className="lg:col-span-8 space-y-6">
            {/* Quick-Fill Presets for Judges & Developers */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-amber-500" />
                  Quick-Fill Presets for Instant Testing
                </span>
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="text-xs text-slate-500 hover:text-slate-800 transition inline-flex items-center gap-1 font-medium"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Reset Form</span>
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset.id)}
                    className="rounded-lg border border-slate-200 bg-slate-50 hover:bg-sky-50 hover:border-sky-300 px-3 py-1.5 text-xs font-medium text-slate-800 transition active:scale-95 shadow-xs"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Form or Success State */}
            {successData ? (
              <div className="nexus-fade-in rounded-2xl border border-emerald-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                      Inquiry Dispatched Successfully
                    </span>
                    <h2 className="text-xl font-extrabold text-slate-950">
                      Thank You, {successData.summary.fullName}!
                    </h2>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {successData.message}
                    </p>
                  </div>
                </div>

                {/* Ticket Details Box */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
                    <div>
                      <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
                        Clearinghouse Tracking Ticket
                      </span>
                      <div className="font-mono text-base font-bold text-slate-950">
                        {successData.ticketId}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={copyTicketId}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs transition"
                    >
                      {copiedTicket ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 text-slate-500" />
                          <span>Copy Ticket ID</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500">Contact Email:</span>
                      <p className="font-semibold text-slate-800">{successData.summary.email}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Estimated Response SLA:</span>
                      <p className="font-semibold text-emerald-700">{successData.estimatedSla}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Category:</span>
                      <p className="font-semibold text-slate-800 uppercase">{successData.summary.inquiryType.replace(/_/g, " ")}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Subject:</span>
                      <p className="font-semibold text-slate-800">{successData.summary.subject}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Dispatched To:</span>
                      <p className="font-semibold text-indigo-700 font-mono">
                        {successData.routedTo || "hamdanaly651@gmail.com"}
                      </p>
                    </div>
                    {successData.summary.referenceId && (
                      <div className="sm:col-span-2">
                        <span className="text-slate-500">Transaction / Reference ID:</span>
                        <p className="font-mono font-semibold text-slate-800">{successData.summary.referenceId}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <a
                    href={
                      successData.mailtoUrl ||
                      `mailto:hamdanaly651@gmail.com?subject=${encodeURIComponent(
                        `[NexusPulse Inquiry #${successData.ticketId}] ${successData.summary.subject}`
                      )}`
                    }
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    <span>Send Email Copy to hamdanaly651@gmail.com</span>
                  </a>
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-5 py-2.5 text-xs font-bold text-slate-800 shadow-xs transition"
                  >
                    Submit Another Inquiry
                  </button>
                  <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition"
                  >
                    <span>Return to Overview</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                noValidate
                className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-5"
              >
                {/* Honeypot field (hidden from legitimate users) */}
                <input
                  type="text"
                  name="website_url_hp"
                  value={formData.honeypot || ""}
                  onChange={(e) => handleFieldChange("honeypot", e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="hidden"
                />

                {/* Form Header */}
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-sky-600" />
                    <span>Send a Validated Communications Request</span>
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Fields marked with an asterisk (<span className="text-rose-500">*</span>) are mandatory and validated against RFC standards.
                  </p>
                </div>

                {/* Submit Error Banner */}
                {submitError && (
                  <div
                    role="alert"
                    className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800 flex items-start gap-2.5"
                  >
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <strong className="font-bold">Submission Blocked:</strong>
                      <p>{submitError}</p>
                    </div>
                  </div>
                )}

                {/* Grid: Full Name & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="contact-fullName"
                      className="text-xs font-semibold text-slate-800 flex items-center justify-between"
                    >
                      <span className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-slate-500" />
                        Full Name / Organization <span className="text-rose-500">*</span>
                      </span>
                      {touched.fullName && !fieldErrors.fullName && formData.fullName.length >= 2 && (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      )}
                    </label>
                    <input
                      id="contact-fullName"
                      type="text"
                      required
                      placeholder="e.g. Jane Doe (PayPal Evaluator)"
                      value={formData.fullName}
                      onChange={(e) => handleFieldChange("fullName", e.target.value)}
                      onBlur={() => handleBlur("fullName")}
                      aria-invalid={Boolean(touched.fullName && fieldErrors.fullName)}
                      aria-describedby={fieldErrors.fullName ? "fullName-error" : undefined}
                      className={`w-full rounded-lg border px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 shadow-xs transition ${
                        touched.fullName && fieldErrors.fullName
                          ? "border-rose-400 focus:border-rose-500 focus:ring-rose-200 bg-rose-50/30"
                          : touched.fullName && !fieldErrors.fullName && formData.fullName
                            ? "border-emerald-400 focus:border-emerald-500 focus:ring-emerald-200 bg-white"
                            : "border-slate-200 focus:border-sky-500 focus:ring-sky-100 bg-white"
                      }`}
                    />
                    {touched.fullName && fieldErrors.fullName && (
                      <p id="fullName-error" role="alert" className="text-[11px] font-medium text-rose-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {fieldErrors.fullName}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="contact-email"
                      className="text-xs font-semibold text-slate-800 flex items-center justify-between"
                    >
                      <span className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-slate-500" />
                        Email Address <span className="text-rose-500">*</span>
                      </span>
                      {touched.email && !fieldErrors.email && formData.email.includes("@") && (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      )}
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      placeholder="name@company.com"
                      value={formData.email}
                      onChange={(e) => handleFieldChange("email", e.target.value)}
                      onBlur={() => handleBlur("email")}
                      aria-invalid={Boolean(touched.email && fieldErrors.email)}
                      aria-describedby={fieldErrors.email ? "email-error" : undefined}
                      className={`w-full rounded-lg border px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 shadow-xs transition ${
                        touched.email && fieldErrors.email
                          ? "border-rose-400 focus:border-rose-500 focus:ring-rose-200 bg-rose-50/30"
                          : touched.email && !fieldErrors.email && formData.email
                            ? "border-emerald-400 focus:border-emerald-500 focus:ring-emerald-200 bg-white"
                            : "border-slate-200 focus:border-sky-500 focus:ring-sky-100 bg-white"
                      }`}
                    />
                    {touched.email && fieldErrors.email && (
                      <p id="email-error" role="alert" className="text-[11px] font-medium text-rose-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>
                </div>

                {/* Grid: Role & Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Inquirer Role */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="contact-role"
                      className="text-xs font-semibold text-slate-800 flex items-center gap-1.5"
                    >
                      <Building2 className="h-3.5 w-3.5 text-slate-500" />
                      Your Primary Role <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="contact-role"
                        value={formData.role}
                        onChange={(e) =>
                          handleFieldChange("role", e.target.value as ContactInquirerRole)
                        }
                        onBlur={() => handleBlur("role")}
                        className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 pr-8 text-xs text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100 shadow-xs"
                      >
                        <option value="judge">⚖️ Hackathon Judge / Evaluator</option>
                        <option value="developer">💻 AI Agent Developer / Engineer</option>
                        <option value="merchant">🏪 Enterprise Merchant / Business</option>
                        <option value="oracle_worker">👤 Proof-of-Human Contributor</option>
                        <option value="investor_researcher">🔬 Researcher / Venture Capital</option>
                        <option value="other">🌐 General Inquirer</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    </div>
                  </div>

                  {/* Category */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="contact-inquiryType"
                      className="text-xs font-semibold text-slate-800 flex items-center gap-1.5"
                    >
                      <HelpCircle className="h-3.5 w-3.5 text-slate-500" />
                      Inquiry Category <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="contact-inquiryType"
                        value={formData.inquiryType}
                        onChange={(e) =>
                          handleFieldChange("inquiryType", e.target.value as ContactInquiryType)
                        }
                        onBlur={() => handleBlur("inquiryType")}
                        className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 pr-8 text-xs text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100 shadow-xs"
                      >
                        <option value="general">General Collaboration / Inquiries</option>
                        <option value="hackathon_judging">PayPal Hackathon Judging &amp; Verification</option>
                        <option value="developer_api">APIMatic SDK &amp; Developer Integration</option>
                        <option value="oracle_bounties">Engine 2: Proof-of-Human Tasks &amp; Payouts</option>
                        <option value="enterprise_escrow">Engine 3: A2A Smart Escrow Deployment</option>
                        <option value="security_disclosure">Security, Webhooks &amp; Bug Disclosure</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    </div>
                  </div>
                </div>

                {/* Priority / Urgency Selection Pills */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-500" />
                    Response Urgency SLA Target
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {[
                      {
                        id: "urgent_judge" as ContactUrgency,
                        title: "Judge Expedited (<2h)",
                        desc: "Reserved for Hackathon judges & evaluations",
                        badge: "Highest Priority",
                        style:
                          formData.urgency === "urgent_judge"
                            ? "border-sky-500 bg-sky-50/80 text-sky-950 ring-2 ring-sky-200"
                            : "border-slate-200 bg-slate-50/60 hover:bg-slate-100 text-slate-700",
                      },
                      {
                        id: "high" as ContactUrgency,
                        title: "High Priority (<12h)",
                        desc: "Technical integration blockers & escrow holds",
                        badge: "Expedited",
                        style:
                          formData.urgency === "high"
                            ? "border-indigo-500 bg-indigo-50/80 text-indigo-950 ring-2 ring-indigo-200"
                            : "border-slate-200 bg-slate-50/60 hover:bg-slate-100 text-slate-700",
                      },
                      {
                        id: "normal" as ContactUrgency,
                        title: "Standard (24-48h)",
                        desc: "General inquiries, feedback & partnerships",
                        badge: "Standard SLA",
                        style:
                          formData.urgency === "normal"
                            ? "border-slate-800 bg-slate-100 text-slate-950 ring-2 ring-slate-300"
                            : "border-slate-200 bg-slate-50/60 hover:bg-slate-100 text-slate-700",
                      },
                    ].map((urg) => (
                      <button
                        key={urg.id}
                        type="button"
                        onClick={() => handleFieldChange("urgency", urg.id)}
                        className={`rounded-xl border p-3 text-left transition shadow-xs ${urg.style}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs">{urg.title}</span>
                          <span className="text-[10px] uppercase font-mono font-semibold opacity-75">
                            {urg.badge}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] opacity-80 leading-snug">{urg.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grid: Subject & Reference ID */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  {/* Subject */}
                  <div className="sm:col-span-8 space-y-1.5">
                    <label
                      htmlFor="contact-subject"
                      className="text-xs font-semibold text-slate-800 flex items-center justify-between"
                    >
                      <span className="flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-slate-500" />
                        Inquiry Subject <span className="text-rose-500">*</span>
                      </span>
                      {touched.subject && !fieldErrors.subject && formData.subject.length >= 4 && (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      )}
                    </label>
                    <input
                      id="contact-subject"
                      type="text"
                      required
                      placeholder="e.g. PayPal Orders v2 AUTHORIZE hold testing feedback"
                      value={formData.subject}
                      onChange={(e) => handleFieldChange("subject", e.target.value)}
                      onBlur={() => handleBlur("subject")}
                      aria-invalid={Boolean(touched.subject && fieldErrors.subject)}
                      aria-describedby={fieldErrors.subject ? "subject-error" : undefined}
                      className={`w-full rounded-lg border px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 shadow-xs transition ${
                        touched.subject && fieldErrors.subject
                          ? "border-rose-400 focus:border-rose-500 focus:ring-rose-200 bg-rose-50/30"
                          : touched.subject && !fieldErrors.subject && formData.subject
                            ? "border-emerald-400 focus:border-emerald-500 focus:ring-emerald-200 bg-white"
                            : "border-slate-200 focus:border-sky-500 focus:ring-sky-100 bg-white"
                      }`}
                    />
                    {touched.subject && fieldErrors.subject && (
                      <p id="subject-error" role="alert" className="text-[11px] font-medium text-rose-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {fieldErrors.subject}
                      </p>
                    )}
                  </div>

                  {/* Reference ID (Optional) */}
                  <div className="sm:col-span-4 space-y-1.5">
                    <label
                      htmlFor="contact-referenceId"
                      className="text-xs font-semibold text-slate-800 flex items-center gap-1.5"
                    >
                      <Hash className="h-3.5 w-3.5 text-slate-500" />
                      Ref / Order ID <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      id="contact-referenceId"
                      type="text"
                      placeholder="e.g. 5O190127TN..."
                      value={formData.referenceId || ""}
                      onChange={(e) => handleFieldChange("referenceId", e.target.value)}
                      onBlur={() => handleBlur("referenceId")}
                      aria-invalid={Boolean(touched.referenceId && fieldErrors.referenceId)}
                      aria-describedby={fieldErrors.referenceId ? "referenceId-error" : undefined}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100 shadow-xs"
                    />
                    {touched.referenceId && fieldErrors.referenceId && (
                      <p id="referenceId-error" role="alert" className="text-[11px] font-medium text-rose-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {fieldErrors.referenceId}
                      </p>
                    )}
                  </div>
                </div>

                {/* Message Body */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label
                      htmlFor="contact-message"
                      className="font-semibold text-slate-800 flex items-center gap-1.5"
                    >
                      <MessageSquare className="h-3.5 w-3.5 text-slate-500" />
                      Detailed Message <span className="text-rose-500">*</span>
                    </label>
                    <span
                      className={`font-mono text-[11px] ${
                        formData.message.length > 2400
                          ? "text-rose-600 font-bold"
                          : formData.message.length < 15
                            ? "text-slate-400"
                            : "text-slate-500"
                      }`}
                    >
                      {formData.message.length} / 2500
                    </span>
                  </div>
                  <textarea
                    id="contact-message"
                    required
                    rows={5}
                    placeholder="Provide detailed feedback, integration requirements, bounty verification queries, or judge review notes..."
                    value={formData.message}
                    onChange={(e) => handleFieldChange("message", e.target.value)}
                    onBlur={() => handleBlur("message")}
                    aria-invalid={Boolean(touched.message && fieldErrors.message)}
                    aria-describedby={fieldErrors.message ? "message-error" : undefined}
                    className={`w-full rounded-lg border p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 shadow-xs transition leading-relaxed ${
                      touched.message && fieldErrors.message
                        ? "border-rose-400 focus:border-rose-500 focus:ring-rose-200 bg-rose-50/30"
                        : touched.message && !fieldErrors.message && formData.message.length >= 15
                          ? "border-emerald-400 focus:border-emerald-500 focus:ring-emerald-200 bg-white"
                          : "border-slate-200 focus:border-sky-500 focus:ring-sky-100 bg-white"
                    }`}
                  />
                  {touched.message && fieldErrors.message && (
                    <p id="message-error" role="alert" className="text-[11px] font-medium text-rose-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {fieldErrors.message}
                    </p>
                  )}
                </div>

                {/* Consent & Data Policy Checkbox */}
                <div className="pt-1">
                  <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={formData.agreedToTerms}
                      onChange={(e) => handleFieldChange("agreedToTerms", e.target.checked)}
                      onBlur={() => handleBlur("agreedToTerms")}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-sky-500"
                    />
                    <span className="leading-snug">
                      I authorize the NexusPulse team to process this inquiry and securely contact me regarding my request. No credentials or passwords will ever be requested.
                    </span>
                  </label>
                  {touched.agreedToTerms && fieldErrors.agreedToTerms && (
                    <p role="alert" className="mt-1 text-[11px] font-medium text-rose-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {fieldErrors.agreedToTerms}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Protected by Fetch Metadata Isolation &amp; CSRF Guards</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-950 hover:bg-slate-800 disabled:opacity-50 px-6 py-3 text-xs font-bold text-white shadow-sm transition active:scale-95 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin text-sky-400" />
                        <span>Transmitting to Operations Desk...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 text-sky-400" />
                        <span>Submit Secure Inquiry</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* RIGHT COLUMN: Direct Channels, Judge SLA & Sandbox Info */}
          <div className="lg:col-span-4 space-y-6">
            {/* Direct Contact Channel */}
            <div className="rounded-[12px] border border-zinc-200 bg-white p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-950">
                  <Mail className="h-4 w-4 text-indigo-600" />
                  <span>Lead Developer &amp; Direct Desk</span>
                </div>
                <span className="rounded-full bg-emerald-100 border border-emerald-200 px-2 py-0.5 text-[10px] font-mono font-semibold text-emerald-800 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                All hackathon evaluations, technical feedback, and partner inquiries are routed directly to lead engineer:
              </p>
              <div className="rounded-xl border border-indigo-100 bg-white p-3.5 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500">Official Creator Email</span>
                  <span className="text-[10px] font-mono text-indigo-600 font-semibold">
                    Direct Routing
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200/80">
                  <span className="font-mono text-xs font-bold text-slate-950 select-all">
                    hamdanaly651@gmail.com
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof navigator !== "undefined" && navigator.clipboard) {
                        navigator.clipboard.writeText("hamdanaly651@gmail.com");
                        setCopiedEmail(true);
                        setTimeout(() => setCopiedEmail(false), 2000);
                      }
                    }}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white hover:bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700 transition"
                  >
                    {copiedEmail ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-600" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 text-slate-500" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <a
                  href="mailto:hamdanaly651@gmail.com?subject=PayPal%20AI%20Hackathon%20Inquiry%20-%20NexusPulse"
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-3 py-2 text-xs font-bold text-white shadow-xs transition"
                >
                  <Send className="h-3 w-3 text-indigo-200" />
                  <span>Send Direct Email to hamdanaly651@gmail.com</span>
                </a>
              </div>
            </div>

            {/* Hackathon Judge VIP Channel */}
            <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-900">
                <Gavel className="h-4 w-4 text-sky-600" />
                <span>PayPal Hackathon Judge Desk</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                If you are reviewing NexusPulse for the hackathon and require live verification assistance, direct credential provisioning, or code walkthroughs:
              </p>
              <div className="space-y-2 text-xs">
                <div className="rounded-lg bg-white p-3 border border-sky-100 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-500">Expedited Judge Response SLA</span>
                  <div className="font-bold text-sky-950 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Under 2 Hours Direct Escalation
                  </div>
                </div>
                <div className="rounded-lg bg-white p-3 border border-sky-100 space-y-1 text-slate-700">
                  <span className="text-[11px] font-semibold text-slate-500">Slot 013 Sandbox Accounts</span>
                  <p className="font-mono text-[11px] text-slate-800 break-all">
                    Buyer: sb-ifqau51324237@personal.example.com
                  </p>
                  <p className="font-mono text-[11px] text-slate-800 break-all">
                    Merchant: sb-mokyu51324247@business.example.com
                  </p>
                </div>
              </div>
            </div>

            {/* Developer & Open Source Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-900">
                <Terminal className="h-4 w-4 text-indigo-600" />
                <span>Developer &amp; Open Source</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Explore the open source codebase, test suite, and APIMatic controller bindings directly on GitHub.
              </p>
              <div className="space-y-2 text-xs">
                <a
                  href="https://github.com/Hamdanali3/NexusPulse"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg border border-slate-200 p-2.5 hover:bg-slate-50 text-slate-800 transition font-medium"
                >
                  <span className="flex items-center gap-2">
                    <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                    GitHub Repository
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">Hamdanali3/NexusPulse</span>
                </a>
                <Link
                  href="/about"
                  className="flex items-center justify-between rounded-lg border border-slate-200 p-2.5 hover:bg-slate-50 text-slate-800 transition font-medium"
                >
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-zinc-700" strokeWidth={1.5} />
                    Product architecture &amp; documentation
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                </Link>
              </div>
            </div>

            {/* Cryptographic & Security Assurances */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-900">
                <Lock className="h-4 w-4 text-emerald-600" />
                <span>Dispute Shield &amp; Security</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>SHA256withRSA:</strong> Webhook signature verification verified via raw bytes.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Idempotency:</strong> Every transaction includes strict <code>PayPal-Request-Id</code>.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Data Hygiene:</strong> Inputs strictly sanitized against script injection.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-10 shadow-xs space-y-6">
          <div className="max-w-2xl space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600 flex items-center gap-1.5">
              <LifeBuoy className="h-3.5 w-3.5" />
              Frequently Asked Questions
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-950">
              Clear Answers for Evaluators &amp; Partners
            </h2>
            <p className="text-xs text-slate-500">
              Common questions regarding our PayPal developer architecture, Gemini verification, and sandbox testing.
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div key={index} className="py-4">
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full flex items-center justify-between text-left text-xs sm:text-sm font-bold text-slate-900 hover:text-sky-600 transition"
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      className={`h-4 w-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-sky-600" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <p className="nexus-fade-in mt-2 text-xs text-slate-600 leading-relaxed">
                      {item.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Footer */}
      <NexusFooter
        activeMode={activeMode}
        databaseSource={databaseSource}
      />

      {/* AI Assistant Chatbot */}
      <NexusAiChatbot
        appState={appState}
        onSelectTab={(tabId) => {
          if (typeof window !== "undefined") {
            window.location.href = tabId === "overview" ? "/" : `/?tab=${tabId}`;
          }
        }}
      />
    </div>
  );
}
