"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircleIcon,
  ArrowDown01Icon,
  ArrowLeft02Icon,
  ArrowRight02Icon,
  ArrowUpRight01Icon,
  CheckmarkCircle02Icon,
  Copy01Icon,
  Mail01Icon,
  SecurityCheckIcon,
  SentIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { AppIcon } from "@/components/ui/Icon";
import NexusHeader from "@/components/layout/NexusHeader";
import NexusFooter from "@/components/layout/NexusFooter";
import NexusAiChatbot from "@/components/chat/NexusAiChatbot";
import { Button } from "@/components/ui";
import type { NexusPulseState } from "@/lib/paypal/paypal-sandbox-mirror";
import type { PayPalExecutionMode } from "@/lib/paypal/paypal-types";
import {
  type ContactFormData,
  type ContactInquirerRole,
  type ContactInquiryType,
  type ContactUrgency,
  validateContactForm,
} from "@/lib/security/validation";

const SUPPORT_EMAIL = "support@nexuspulse.example";

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
    q: "How do I test NexusPulse with sandbox accounts?",
    a: "Sign in using a sample profile from the Sign in dialog or open the Workspace menu in the header to enter your own sandbox Client ID and Secret.",
  },
  {
    q: "How are verified tasks checked before payout release?",
    a: "Submitted task notes and optional uploaded photos or receipts are checked against the listed task requirements prior to sending the payout.",
  },
  {
    q: "How does milestone escrow hold funds safely?",
    a: "Project milestones use PayPal authorization holds so funds are reserved on the order without releasing payment until work criteria are confirmed.",
  },
  {
    q: "How is contact data protected?",
    a: "Form inputs are validated, sanitized before recording, and protected by strict same-origin request headers. Never share passwords or private keys here.",
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

  const [formData, setFormData] = useState<ContactFormData>({
    fullName: "",
    email: "",
    inquiryType: "general",
    role: "developer",
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

  const runLiveValidation = (currentData: ContactFormData) => {
    const res = validateContactForm(currentData);
    const errs: Record<string, string> = {};
    for (const [key, msg] of Object.entries(res.errors)) {
      if (msg) errs[key] = msg;
    }
    setFieldErrors(errs);
    return res;
  };

  const handleFieldChange = (field: keyof ContactFormData, value: unknown) => {
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

  const handleResetForm = () => {
    setFormData({
      fullName: "",
      email: "",
      inquiryType: "general",
      role: "developer",
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
      setSubmitError("Please review the highlighted fields before submitting.");
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
          result.error || "Unable to submit message. Please check your entries and try again."
        );
        if (result.errors) {
          setFieldErrors(result.errors);
        }
        return;
      }

      setSuccessData(result);
    } catch {
      setSubmitError("Network error while sending your message. Please try again.");
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

  async function handleSaveRuntimeCredentials(clientId: string, clientSecret: string) {
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

  const inputBaseClass =
    "w-full h-9 rounded-[6px] border px-3 text-[13px] text-zinc-900 placeholder:text-zinc-500 transition-colors focus:outline-none focus:ring-2";

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa] text-zinc-950 antialiased">
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

      <main className="flex-1 mx-auto w-full max-w-[1200px] px-5 sm:px-8 py-10 space-y-12">
        {/* Breadcrumb & Page Header */}
        <div className="space-y-4">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[13px] text-zinc-600">
            <Link
              href="/"
              className="inline-flex items-center gap-1 hover:text-zinc-950 font-medium transition-colors"
            >
              <AppIcon icon={ArrowLeft02Icon} size="xs" />
              <span>Overview</span>
            </Link>
            <span className="text-zinc-400">/</span>
            <span className="font-medium text-zinc-950">Contact</span>
          </nav>

          <section className="max-w-2xl space-y-2">
            <h1 className="text-[34px] sm:text-[42px] font-semibold tracking-[-0.02em] leading-[1.1] text-zinc-950">
              Contact support
            </h1>
            <p className="text-[15px] text-zinc-600 leading-relaxed">
              Send product questions, integration requests, or evaluation feedback directly to our team.
            </p>
          </section>
        </div>

        {/* 2-Column Grid: Clean Form (Left) + Support Email & Collapsed Reviewer Info (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: Single Clean Form */}
          <div className="lg:col-span-8">
            {successData ? (
              <div className="rounded-[12px] border border-zinc-200 bg-white p-6 sm:p-8 space-y-6">
                <div className="flex items-start gap-3">
                  <AppIcon
                    icon={CheckmarkCircle02Icon}
                    size="lg"
                    className="text-emerald-700 mt-0.5"
                  />
                  <div className="space-y-1">
                    <h2 className="text-[20px] font-semibold text-zinc-950">
                      Inquiry received, {successData.summary.fullName}
                    </h2>
                    <p className="text-[14px] text-zinc-600 leading-relaxed">
                      {successData.message}
                    </p>
                  </div>
                </div>

                <div className="rounded-[6px] border border-zinc-200 bg-[#fafafa] p-4 space-y-3 text-[13px]">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-200">
                    <div>
                      <span className="text-[12px] text-zinc-600 block">Tracking reference</span>
                      <span className="font-mono font-semibold text-zinc-950">
                        {successData.ticketId}
                      </span>
                    </div>
                    <Button type="button" variant="secondary" size="sm" onClick={copyTicketId}>
                      {copiedTicket ? (
                        <>
                          <AppIcon icon={Tick02Icon} size="xs" className="text-emerald-700" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <AppIcon icon={Copy01Icon} size="xs" className="text-zinc-600" />
                          <span>Copy ID</span>
                        </>
                      )}
                    </Button>
                  </div>

                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
                    <div>
                      <dt className="text-[12px] text-zinc-600">Reply email</dt>
                      <dd className="font-medium text-zinc-900">{successData.summary.email}</dd>
                    </div>
                    <div>
                      <dt className="text-[12px] text-zinc-600">Target response time</dt>
                      <dd className="font-medium text-emerald-700">{successData.estimatedSla}</dd>
                    </div>
                    <div>
                      <dt className="text-[12px] text-zinc-600">Topic</dt>
                      <dd className="font-medium text-zinc-900">
                        {successData.summary.inquiryType.replace(/_/g, " ")}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[12px] text-zinc-600">Routed to</dt>
                      <dd className="font-mono text-[12px] text-zinc-900">{SUPPORT_EMAIL}</dd>
                    </div>
                  </dl>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Button type="button" variant="secondary" onClick={handleResetForm}>
                    Send another message
                  </Button>
                  <Link
                    href="/"
                    className="inline-flex h-9 items-center gap-1.5 rounded-[6px] bg-zinc-950 hover:bg-zinc-800 px-4 text-[13px] font-medium text-white transition-colors"
                  >
                    <span>Return to workspace</span>
                    <AppIcon icon={ArrowRight02Icon} size="sm" />
                  </Link>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                noValidate
                className="rounded-[12px] border border-zinc-200 bg-white p-6 sm:p-8 space-y-5"
              >
                {/* Honeypot */}
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

                <div className="border-b border-zinc-200 pb-4">
                  <h2 className="text-[18px] font-semibold text-zinc-950">
                    Send a message
                  </h2>
                  <p className="mt-1 text-[13px] text-zinc-600">
                    Fields marked with an asterisk (<span className="text-red-700">*</span>) are required.
                  </p>
                </div>

                {submitError && (
                  <div
                    role="alert"
                    className="rounded-[6px] border border-red-200 bg-red-50/70 p-3.5 text-[13px] text-red-900 flex items-start gap-2.5"
                  >
                    <AppIcon icon={AlertCircleIcon} size="sm" className="text-red-700 mt-0.5" />
                    <span>{submitError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="contact-fullName"
                      className="text-[13px] font-medium text-zinc-900 block"
                    >
                      Name or organization <span className="text-red-700">*</span>
                    </label>
                    <input
                      id="contact-fullName"
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={formData.fullName}
                      onChange={(e) => handleFieldChange("fullName", e.target.value)}
                      onBlur={() => handleBlur("fullName")}
                      aria-invalid={Boolean(touched.fullName && fieldErrors.fullName)}
                      aria-describedby={fieldErrors.fullName ? "fullName-error" : undefined}
                      className={`${inputBaseClass} ${
                        touched.fullName && fieldErrors.fullName
                          ? "border-red-500 focus:border-red-600 focus:ring-red-500/15 bg-white"
                          : "border-zinc-200 focus:border-indigo-500 focus:ring-indigo-500/20 bg-white"
                      }`}
                    />
                    {touched.fullName && fieldErrors.fullName && (
                      <p id="fullName-error" role="alert" className="text-[12px] text-red-700">
                        {fieldErrors.fullName}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="contact-email"
                      className="text-[13px] font-medium text-zinc-900 block"
                    >
                      Email address <span className="text-red-700">*</span>
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
                      className={`${inputBaseClass} ${
                        touched.email && fieldErrors.email
                          ? "border-red-500 focus:border-red-600 focus:ring-red-500/15 bg-white"
                          : "border-zinc-200 focus:border-indigo-500 focus:ring-indigo-500/20 bg-white"
                      }`}
                    />
                    {touched.email && fieldErrors.email && (
                      <p id="email-error" role="alert" className="text-[12px] text-red-700">
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="contact-role"
                      className="text-[13px] font-medium text-zinc-900 block"
                    >
                      Role <span className="text-red-700">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="contact-role"
                        value={formData.role}
                        onChange={(e) =>
                          handleFieldChange("role", e.target.value as ContactInquirerRole)
                        }
                        onBlur={() => handleBlur("role")}
                        className="w-full h-9 appearance-none rounded-[6px] border border-zinc-200 bg-white px-3 pr-8 text-[13px] text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      >
                        <option value="developer">Engineer or developer</option>
                        <option value="merchant">Business or finance</option>
                        <option value="judge">Reviewer or evaluator</option>
                        <option value="oracle_worker">Task contributor</option>
                        <option value="investor_researcher">Researcher</option>
                        <option value="other">Other</option>
                      </select>
                      <AppIcon
                        icon={ArrowDown01Icon}
                        size="sm"
                        className="pointer-events-none absolute right-2.5 top-2.5 text-zinc-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="contact-inquiryType"
                      className="text-[13px] font-medium text-zinc-900 block"
                    >
                      Topic <span className="text-red-700">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="contact-inquiryType"
                        value={formData.inquiryType}
                        onChange={(e) =>
                          handleFieldChange("inquiryType", e.target.value as ContactInquiryType)
                        }
                        onBlur={() => handleBlur("inquiryType")}
                        className="w-full h-9 appearance-none rounded-[6px] border border-zinc-200 bg-white px-3 pr-8 text-[13px] text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      >
                        <option value="general">General inquiry</option>
                        <option value="developer_api">API or integration support</option>
                        <option value="oracle_bounties">Verified tasks and payouts</option>
                        <option value="enterprise_escrow">Milestone escrow</option>
                        <option value="hackathon_judging">Evaluator review</option>
                        <option value="security_disclosure">Security inquiry</option>
                      </select>
                      <AppIcon
                        icon={ArrowDown01Icon}
                        size="sm"
                        className="pointer-events-none absolute right-2.5 top-2.5 text-zinc-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Priority */}
                <div className="space-y-1.5">
                  <span className="text-[13px] font-medium text-zinc-900 block">
                    Priority
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { id: "normal" as ContactUrgency, title: "Standard (24–48h)", desc: "General requests" },
                      { id: "high" as ContactUrgency, title: "High (<12h)", desc: "Integration issues" },
                      { id: "urgent_judge" as ContactUrgency, title: "Urgent (<2h)", desc: "Time-sensitive reviews" },
                    ].map((urg) => {
                      const active = formData.urgency === urg.id;
                      return (
                        <button
                          key={urg.id}
                          type="button"
                          onClick={() => handleFieldChange("urgency", urg.id)}
                          className={`rounded-[6px] border px-3 py-2 text-left transition-colors ${
                            active
                              ? "border-indigo-600 bg-indigo-50/50 text-zinc-950"
                              : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700"
                          }`}
                        >
                          <div className="text-[13px] font-medium text-zinc-950">{urg.title}</div>
                          <div className="text-[12px] text-zinc-600">{urg.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  <div className="sm:col-span-8 space-y-1.5">
                    <label
                      htmlFor="contact-subject"
                      className="text-[13px] font-medium text-zinc-900 block"
                    >
                      Subject <span className="text-red-700">*</span>
                    </label>
                    <input
                      id="contact-subject"
                      type="text"
                      required
                      placeholder="Brief summary of your question"
                      value={formData.subject}
                      onChange={(e) => handleFieldChange("subject", e.target.value)}
                      onBlur={() => handleBlur("subject")}
                      aria-invalid={Boolean(touched.subject && fieldErrors.subject)}
                      aria-describedby={fieldErrors.subject ? "subject-error" : undefined}
                      className={`${inputBaseClass} ${
                        touched.subject && fieldErrors.subject
                          ? "border-red-500 focus:border-red-600 focus:ring-red-500/15 bg-white"
                          : "border-zinc-200 focus:border-indigo-500 focus:ring-indigo-500/20 bg-white"
                      }`}
                    />
                    {touched.subject && fieldErrors.subject && (
                      <p id="subject-error" role="alert" className="text-[12px] text-red-700">
                        {fieldErrors.subject}
                      </p>
                    )}
                  </div>

                  <div className="sm:col-span-4 space-y-1.5">
                    <label
                      htmlFor="contact-referenceId"
                      className="text-[13px] font-medium text-zinc-900 block"
                    >
                      Reference ID <span className="text-zinc-500 font-normal">(optional)</span>
                    </label>
                    <input
                      id="contact-referenceId"
                      type="text"
                      placeholder="Order or escrow ID"
                      value={formData.referenceId || ""}
                      onChange={(e) => handleFieldChange("referenceId", e.target.value)}
                      onBlur={() => handleBlur("referenceId")}
                      aria-invalid={Boolean(touched.referenceId && fieldErrors.referenceId)}
                      aria-describedby={fieldErrors.referenceId ? "referenceId-error" : undefined}
                      className="w-full h-9 rounded-[6px] border border-zinc-200 bg-white px-3 text-[13px] font-mono text-zinc-900 placeholder:font-sans placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                    {touched.referenceId && fieldErrors.referenceId && (
                      <p id="referenceId-error" role="alert" className="text-[12px] text-red-700">
                        {fieldErrors.referenceId}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[13px]">
                    <label htmlFor="contact-message" className="font-medium text-zinc-900">
                      Message <span className="text-red-700">*</span>
                    </label>
                    <span
                      className={`font-mono text-[12px] tabular-nums ${
                        formData.message.length > 2400 ? "text-red-700" : "text-zinc-600"
                      }`}
                    >
                      {formData.message.length} / 2500
                    </span>
                  </div>
                  <textarea
                    id="contact-message"
                    required
                    rows={5}
                    placeholder="Share context, relevant order IDs, or steps to reproduce"
                    value={formData.message}
                    onChange={(e) => handleFieldChange("message", e.target.value)}
                    onBlur={() => handleBlur("message")}
                    aria-invalid={Boolean(touched.message && fieldErrors.message)}
                    aria-describedby={fieldErrors.message ? "message-error" : undefined}
                    className={`w-full rounded-[6px] border p-3 text-[13px] text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-2 leading-relaxed ${
                      touched.message && fieldErrors.message
                        ? "border-red-500 focus:border-red-600 focus:ring-red-500/15 bg-white"
                        : "border-zinc-200 focus:border-indigo-500 focus:ring-indigo-500/20 bg-white"
                    }`}
                  />
                  {touched.message && fieldErrors.message && (
                    <p id="message-error" role="alert" className="text-[12px] text-red-700">
                      {fieldErrors.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="flex items-start gap-2.5 text-[13px] text-zinc-600 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={formData.agreedToTerms}
                      onChange={(e) => handleFieldChange("agreedToTerms", e.target.checked)}
                      onBlur={() => handleBlur("agreedToTerms")}
                      className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="leading-snug">
                      I agree to let NexusPulse use these details to respond to my inquiry.
                    </span>
                  </label>
                  {touched.agreedToTerms && fieldErrors.agreedToTerms && (
                    <p role="alert" className="mt-1 text-[12px] text-red-700">
                      {fieldErrors.agreedToTerms}
                    </p>
                  )}
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200">
                  <div className="text-[12px] text-zinc-600 flex items-center gap-1.5">
                    <AppIcon icon={SecurityCheckIcon} size="sm" className="text-zinc-600" />
                    <span>Do not include passwords or API secrets.</span>
                  </div>

                  <Button type="submit" variant="primary" loading={isSubmitting}>
                    <AppIcon icon={SentIcon} size="sm" />
                    <span>{isSubmitting ? "Sending..." : "Send message"}</span>
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* RIGHT: Direct Support Email & Collapsed For Reviewers */}
          <div className="lg:col-span-4 space-y-5">
            <div className="rounded-[12px] border border-zinc-200 bg-white p-5 space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[14px] font-semibold text-zinc-950">
                  <AppIcon icon={Mail01Icon} size="sm" className="text-zinc-700" />
                  <span>Direct support</span>
                </div>
                <p className="text-[13px] text-zinc-600 leading-relaxed">
                  Reach our team by email for account assistance or technical feedback.
                </p>
              </div>

              <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-[6px] bg-[#fafafa] border border-zinc-200">
                <span className="font-mono text-[12px] font-medium text-zinc-900 select-all">
                  {SUPPORT_EMAIL}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof navigator !== "undefined" && navigator.clipboard) {
                      navigator.clipboard.writeText(SUPPORT_EMAIL);
                      setCopiedEmail(true);
                      setTimeout(() => setCopiedEmail(false), 2000);
                    }
                  }}
                  className="inline-flex items-center gap-1 rounded-[6px] border border-zinc-200 bg-white hover:bg-zinc-50 px-2 py-1 text-[12px] font-medium text-zinc-700 transition-colors"
                >
                  {copiedEmail ? (
                    <>
                      <AppIcon icon={Tick02Icon} size={12} className="text-emerald-700" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <AppIcon icon={Copy01Icon} size={12} className="text-zinc-500" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <a
                href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("NexusPulse Support Inquiry")}`}
                className="w-full inline-flex h-9 items-center justify-center gap-1.5 rounded-[6px] border border-zinc-200 bg-white hover:bg-zinc-50 px-3 text-[13px] font-medium text-zinc-900 transition-colors"
              >
                <AppIcon icon={Mail01Icon} size="sm" className="text-zinc-600" />
                <span>Email {SUPPORT_EMAIL}</span>
              </a>

              <div className="pt-3 border-t border-zinc-200 space-y-2 text-[13px]">
                <a
                  href="https://github.com/Hamdanali3/NexusPulse"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between text-zinc-700 hover:text-zinc-950 transition-colors"
                >
                  <span>Source repository</span>
                  <AppIcon icon={ArrowUpRight01Icon} size="xs" className="text-zinc-500" />
                </a>
                <Link
                  href="/about"
                  className="flex items-center justify-between text-zinc-700 hover:text-zinc-950 transition-colors"
                >
                  <span>Architecture &amp; documentation</span>
                  <AppIcon icon={ArrowRight02Icon} size="xs" className="text-zinc-500" />
                </Link>
              </div>
            </div>

            {/* Collapsed Reviewer & Sandbox Credentials Disclosure */}
            <details className="rounded-[12px] border border-zinc-200 bg-white p-5">
              <summary className="cursor-pointer list-none flex items-center justify-between text-[14px] font-semibold text-zinc-950">
                <span>For reviewers</span>
                <AppIcon icon={ArrowDown01Icon} size="sm" className="text-zinc-500" />
              </summary>
              <div className="mt-4 pt-4 border-t border-zinc-200 space-y-3 text-[12px] text-zinc-600">
                <p className="leading-relaxed">
                  Use the pre-configured sandbox test accounts below when evaluating checkout,
                  payouts, or escrow flows.
                </p>
                <div className="space-y-1.5 rounded-[6px] border border-zinc-200 bg-[#fafafa] p-3 font-mono text-zinc-800 break-all">
                  <div>
                    <span className="text-zinc-600">Buyer: </span>
                    sb-ifqau51324237@personal.example.com
                  </div>
                  <div>
                    <span className="text-zinc-600">Merchant: </span>
                    sb-mokyu51324247@business.example.com
                  </div>
                </div>
                <p className="text-[12px] text-zinc-600">
                  Evaluators can also add custom sandbox keys inside the Workspace menu in the header.
                </p>
              </div>
            </details>
          </div>
        </div>

        {/* Concise FAQ Section */}
        <section className="rounded-[12px] border border-zinc-200 bg-white p-6 sm:p-8 space-y-4">
          <h2 className="text-[18px] font-semibold text-zinc-950">
            Frequently asked questions
          </h2>

          <div className="divide-y divide-zinc-200">
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div key={item.q} className="py-3.5">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full flex items-center justify-between gap-4 text-left text-[14px] font-medium text-zinc-950 hover:text-indigo-700 transition-colors"
                  >
                    <span>{item.q}</span>
                    <AppIcon
                      icon={ArrowDown01Icon}
                      size="sm"
                      className={`text-zinc-500 transition-transform duration-150 ${
                        isOpen ? "rotate-180 text-indigo-600" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <p className="mt-2 text-[13px] text-zinc-600 leading-relaxed">
                      {item.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <NexusFooter activeMode={activeMode} databaseSource={databaseSource} />

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
