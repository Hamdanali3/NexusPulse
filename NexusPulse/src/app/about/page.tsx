"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft02Icon,
  ArrowRight02Icon,
  ArrowUpRight01Icon,
  Globe02Icon,
  Mail01Icon,
  SecurityCheckIcon,
  ServerStack01Icon,
  SquareLock02Icon,
} from "@hugeicons/core-free-icons";
import { AppIcon } from "@/components/ui/Icon";
import NexusHeader from "@/components/layout/NexusHeader";
import NexusFooter from "@/components/layout/NexusFooter";
import NexusAiChatbot from "@/components/chat/NexusAiChatbot";
import ProblemSolutionComparison from "@/components/home/ProblemSolutionComparison";
import type { NexusPulseState } from "@/lib/paypal/paypal-sandbox-mirror";
import type { PayPalExecutionMode } from "@/lib/paypal/paypal-types";

const INTEGRATIONS = [
  {
    name: "PayPal",
    role: "Payments, payouts, subscriptions, and escrow",
    summary:
      "Supports authorization holds, delayed captures, recurring plan updates, invoicing, shipping tracking, and webhook verification.",
    capabilities: [
      "Orders & delayed capture authorization holds",
      "Single and batch worker payouts",
      "Recurring plan inspection and updates",
      "Signed webhook verification and idempotency keys",
    ],
  },
  {
    name: "APIMatic",
    role: "Typed server client and retry handling",
    summary:
      "Provides strongly typed server bindings with automatic token management, transient error retries, and request idempotency headers.",
    capabilities: [
      "Typed order, payment, subscription, and ledger controllers",
      "Automatic OAuth token caching",
      "Exponential retry handling on transient errors",
      "Deterministic request deduplication headers",
    ],
  },
  {
    name: "Google Gemini",
    role: "Spending summaries and evidence verification",
    summary:
      "Audits submitted field notes and images against task checklists and generates concise spending reviews and audio summaries.",
    capabilities: [
      "Spending and subscription usage review",
      "Photo and checklist verification for tasks",
      "Structured deliverable confirmation for escrow",
      "Interactive conversational workspace assistance",
    ],
  },
  {
    name: "Channel3",
    role: "Product price monitoring",
    summary:
      "Matches tracked products against buyer target price ceilings and prepares PayPal checkout when prices drop below target.",
    capabilities: [
      "SKU and product catalog lookup",
      "User-configured target price rules",
      "Pay Later installment eligibility checks",
      "Direct PayPal checkout handoff",
    ],
  },
  {
    name: "AG Grid",
    role: "Transaction ledger and audit log",
    summary:
      "High-density ledger view of orders, payouts, invoices, and webhook checks with pinned key columns, CSV export, and filtering.",
    capabilities: [
      "Pinned transaction ID and amount columns",
      "Configurable column visibility menu",
      "Unified filter bar and humanized labels",
      "One-click CSV export for accounting",
    ],
  },
  {
    name: "Bryntum",
    role: "Milestone schedule and escrow planning",
    summary:
      "Tracks scheduled delivery windows alongside payment hold status, completion progress, and carrier tracking confirmations.",
    capabilities: [
      "Interactive milestone schedule timeline",
      "Status-coded bars for scheduled, active, and captured milestones",
      "Date-range updates and completion tracking",
      "Delivery and tracking verification prior to capture",
    ],
  },
  {
    name: "Render",
    role: "Web hosting and scheduled worker blueprint",
    summary:
      "Runs the web application alongside a periodic worker that evaluates price rules and pending verification tasks.",
    capabilities: [
      "Declarative deployment configuration",
      "Managed web service and background worker",
      "Environment-scoped secret configuration",
      "Graceful health checks and rolling deploys",
    ],
  },
];

const WORKFLOW_TABS = [
  {
    id: 0,
    title: "Price watch & subscription review",
    description:
      "Track products against target prices, pay with PayPal when targets match, and review recurring plans for unused seats.",
    href: "/?tab=channel3",
    ctaLabel: "Open price watch",
    steps: [
      {
        title: "Scan recurring charges",
        detail: "Identify idle subscriptions and calculate potential monthly and annual savings.",
      },
      {
        title: "Confirm plan changes",
        detail: "Review exact plan terms and confirm downgrades or cancellations explicitly.",
      },
      {
        title: "Monitor target prices",
        detail: "Compare live merchant prices against your saved price ceiling.",
      },
      {
        title: "Complete PayPal checkout",
        detail: "Pay directly with PayPal, Pay Later where eligible, or Venmo.",
      },
    ],
  },
  {
    id: 1,
    title: "Verified tasks & payouts",
    description:
      "Verify physical-world inspections with photo and field notes, then disburse rewards via PayPal payouts.",
    href: "/?tab=bounties",
    ctaLabel: "Open verified tasks",
    steps: [
      {
        title: "Publish task criteria",
        detail: "Define the inspection location, expected turnaround time, and reward amount.",
      },
      {
        title: "Collect evidence",
        detail: "Workers attach site observations and supporting photos or receipts.",
      },
      {
        title: "Review against checklist",
        detail: "Automated verification scores evidence against every listed requirement.",
      },
      {
        title: "Disburse reward",
        detail: "Approved submissions trigger an immediate tracked payout to the recipient.",
      },
    ],
  },
  {
    id: 2,
    title: "Milestone escrow & holds",
    description:
      "Hold project funds safely in escrow until delivery schedules are updated and completion criteria pass.",
    href: "/?tab=bryntum",
    ctaLabel: "Open milestone escrow",
    steps: [
      {
        title: "Authorize funds",
        detail: "Place an authorization hold for the milestone amount without releasing payment early.",
      },
      {
        title: "Track schedule",
        detail: "Monitor start and end dates plus completion progress on the timeline.",
      },
      {
        title: "Submit deliverable",
        detail: "Attach repository links, inspection notes, or shipment tracking references.",
      },
      {
        title: "Release payment",
        detail: "Capture held funds to the provider once verification succeeds.",
      },
    ],
  },
];

const COMPARISON_ROWS = [
  {
    dimension: "Recurring subscriptions",
    manual: "Unused plans continue billing until manually audited across statements.",
    nexuspulse: "Flags idle tiers clearly and provides a confirmed downgrade or cancel flow.",
  },
  {
    dimension: "Product purchases",
    manual: "Repeatedly checking stores by hand to catch temporary discounts.",
    nexuspulse: "Monitors products against target prices and opens PayPal checkout when met.",
  },
  {
    dimension: "Field verification",
    manual: "Slow email threads and unverified status updates before paying contractors.",
    nexuspulse: "Structured task checklists with photo notes reviewed prior to payout.",
  },
  {
    dimension: "Milestone projects",
    manual: "Paying upfront without deliverable gates or withholding funds unclearly.",
    nexuspulse: "Escrow holds tied directly to milestone schedules and completion proof.",
  },
  {
    dimension: "Transaction records",
    manual: "Dispersed receipts across separate checkout, payout, and billing tools.",
    nexuspulse: "Unified searchable ledger with customizable columns and CSV export.",
  },
];

const PAPERS = [
  {
    source: "Google DeepMind",
    year: "2025–2026",
    title: "Virtual Agent Economies & Distributional AGI Safety",
    authors: "Tomašev, Franklin, Leibo et al.",
    summary:
      "Examines multi-agent economic workflows and why bounded spending mandates and explicit authorization gates help protect users.",
    links: [
      { label: "arXiv:2509.10147", href: "https://arxiv.org/abs/2509.10147" },
      { label: "arXiv:2512.16856", href: "https://arxiv.org/abs/2512.16856" },
    ],
  },
  {
    source: "Anthropic Research",
    year: "2025–2026",
    title: "The Anthropic Economic Index I & II",
    authors: "Anthropic Macroeconomics & Governance Group",
    summary:
      "Documents how software automation shifts human oversight toward supervision, quality audits, and physical-world verification.",
    links: [
      { label: "arXiv:2503.04761", href: "https://arxiv.org/abs/2503.04761" },
      { label: "arXiv:2511.15080", href: "https://arxiv.org/abs/2511.15080" },
    ],
  },
  {
    source: "MIT / Academic Consortium",
    year: "2025–2026",
    title: "Some Simple Economics of AGI & The Agentic Economy",
    authors: "Rothschild, Mobius et al.",
    summary:
      "Explores why verifiable human inspection and delegated buyer constraints remain central anchors in software-assisted markets.",
    links: [
      { label: "arXiv:2602.20946", href: "https://arxiv.org/abs/2602.20946" },
      { label: "arXiv:2505.15799", href: "https://arxiv.org/abs/2505.15799" },
    ],
  },
];

export default function AboutPage() {
  const [appState, setAppState] = useState<NexusPulseState | null>(null);
  const [activeMode, setActiveMode] = useState<PayPalExecutionMode>("mirror");
  const [preferredMode, setPreferredMode] = useState<
    "auto" | "live" | "sandbox" | "mirror"
  >("auto");
  const [databaseSource, setDatabaseSource] = useState<string>("in_memory_mirror");
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string | null>(null);
  const [activeEngineTab, setActiveEngineTab] = useState<number>(0);

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
      // Non-blocking
    }
  }, []);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

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

  const currentWorkflow = WORKFLOW_TABS[activeEngineTab] ?? WORKFLOW_TABS[0];

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa] text-zinc-950 antialiased">
      <NexusHeader
        activeTab="about"
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

      <main className="flex-1 mx-auto w-full max-w-[1200px] px-5 sm:px-8 py-10 space-y-16">
        {/* Breadcrumb & Hero */}
        <div className="space-y-6">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[13px] text-zinc-600">
            <Link
              href="/"
              className="inline-flex items-center gap-1 hover:text-zinc-950 font-medium transition-colors"
            >
              <AppIcon icon={ArrowLeft02Icon} size="xs" />
              <span>Overview</span>
            </Link>
            <span className="text-zinc-400">/</span>
            <span className="font-medium text-zinc-950">About</span>
          </nav>

          <section className="max-w-2xl space-y-4">
            <h1 className="text-[36px] sm:text-[44px] font-semibold tracking-[-0.02em] leading-[1.1] text-zinc-950">
              Built for deliberate spending and verified payouts.
            </h1>
            <p className="text-[16px] text-zinc-600 leading-relaxed">
              NexusPulse brings price tracking, subscription reviews, contractor task checks,
              and milestone escrow into one calm workspace built on PayPal.
            </p>
            <div className="pt-1 flex flex-wrap items-center gap-3">
              <Link
                href="/?tab=overview"
                className="inline-flex h-9 items-center gap-2 rounded-[6px] bg-zinc-950 hover:bg-zinc-800 px-4 text-[13px] font-medium text-white transition-colors"
              >
                <span>Try the workspace</span>
                <AppIcon icon={ArrowRight02Icon} size="sm" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex h-9 items-center gap-2 rounded-[6px] border border-zinc-200 bg-white hover:bg-zinc-50 px-4 text-[13px] font-medium text-zinc-800 transition-colors"
              >
                <AppIcon icon={Mail01Icon} size="sm" className="text-zinc-500" />
                <span>Contact team</span>
              </Link>
            </div>
          </section>

          {/* Quiet Grayscale Built With Row */}
          <div className="flex flex-wrap items-center gap-x-8 gap-y-2 border-y border-zinc-200 py-4 text-[13px] text-zinc-600">
            <span className="font-medium text-zinc-500">Built with</span>
            <span className="font-medium tracking-tight text-zinc-700">PayPal</span>
            <span className="font-medium tracking-tight text-zinc-700">Google Gemini</span>
            <span className="font-medium tracking-tight text-zinc-700">Channel3</span>
            <span className="font-medium tracking-tight text-zinc-700">AG Grid</span>
            <span className="font-medium tracking-tight text-zinc-700">Bryntum</span>
            <span className="font-medium tracking-tight text-zinc-700">Render</span>
          </div>
        </div>

        {/* Interactive Comparison Studio */}
        <ProblemSolutionComparison
          onSelectEngine={(tab) => {
            if (typeof window !== "undefined") {
              window.location.href = `/?tab=${tab}`;
            }
          }}
        />

        {/* Core Workflows */}
        <section id="engines" className="space-y-5">
          <div className="max-w-2xl space-y-1">
            <h2 className="text-[24px] font-semibold tracking-tight text-zinc-950">
              How each workflow operates
            </h2>
            <p className="text-[14px] text-zinc-600">
              Inspect the step-by-step lifecycle across purchasing, field verification, and milestone holds.
            </p>
          </div>

          <div role="tablist" aria-label="Workflow architecture tabs" className="flex flex-wrap gap-2">
            {WORKFLOW_TABS.map((tab) => {
              const isSelected = activeEngineTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isSelected}
                  type="button"
                  onClick={() => setActiveEngineTab(tab.id)}
                  className={`h-9 rounded-[6px] px-3.5 text-[13px] font-medium border transition-colors ${
                    isSelected
                      ? "border-indigo-600 bg-indigo-50/60 text-indigo-700"
                      : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700"
                  }`}
                >
                  {tab.title}
                </button>
              );
            })}
          </div>

          <div className="rounded-[12px] border border-zinc-200 bg-white p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-4">
              <div>
                <h3 className="text-[18px] font-semibold text-zinc-950">
                  {currentWorkflow.title}
                </h3>
                <p className="mt-1 text-[13px] text-zinc-600 max-w-2xl">
                  {currentWorkflow.description}
                </p>
              </div>
              <Link
                href={currentWorkflow.href}
                className="inline-flex h-9 items-center gap-1.5 rounded-[6px] border border-zinc-200 bg-white hover:bg-zinc-50 px-3.5 text-[13px] font-medium text-zinc-800 transition-colors shrink-0 self-start sm:self-center"
              >
                <span>{currentWorkflow.ctaLabel}</span>
                <AppIcon icon={ArrowRight02Icon} size="sm" className="text-zinc-500" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {currentWorkflow.steps.map((step, index) => (
                <div
                  key={step.title}
                  className="rounded-[12px] border border-zinc-200 bg-[#fafafa] p-4 space-y-2"
                >
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-[6px] border border-zinc-200 bg-white text-[12px] font-mono font-medium text-zinc-700">
                    {index + 1}
                  </span>
                  <div className="text-[14px] font-semibold text-zinc-950">{step.title}</div>
                  <p className="text-[13px] text-zinc-600 leading-relaxed">{step.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Neutral Comparison Table */}
        <section className="space-y-4">
          <div className="max-w-2xl space-y-1">
            <h2 className="text-[24px] font-semibold tracking-tight text-zinc-950">
              Manual workflow vs. NexusPulse
            </h2>
            <p className="text-[14px] text-zinc-600">
              A side-by-side summary of what changes when checks sit directly before payment release.
            </p>
          </div>

          {/* Mobile stacked comparison cards (< md): prevents table horizontal overflow at 375px */}
          <div className="md:hidden divide-y divide-zinc-200 rounded-[12px] border border-zinc-200 bg-white overflow-hidden">
            {COMPARISON_ROWS.map((row) => (
              <div key={row.dimension} className="p-4 space-y-2.5 text-[13px]">
                <div className="font-semibold text-zinc-950">{row.dimension}</div>
                <div className="space-y-1">
                  <div className="text-[12px] font-medium text-zinc-500">Manual process</div>
                  <p className="text-zinc-600 leading-relaxed">{row.manual}</p>
                </div>
                <div className="space-y-1 pt-1 border-t border-zinc-100">
                  <div className="text-[12px] font-medium text-zinc-700">With NexusPulse</div>
                  <p className="text-zinc-900 leading-relaxed">{row.nexuspulse}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block overflow-x-auto rounded-[12px] border border-zinc-200 bg-white">
            <table className="w-full text-left text-[13px] border-collapse">
              <thead className="bg-[#fafafa] border-b border-zinc-200 text-[12px] text-zinc-600">
                <tr>
                  <th scope="col" className="py-3 px-4 font-medium">Dimension</th>
                  <th scope="col" className="py-3 px-4 font-medium">Manual process</th>
                  <th scope="col" className="py-3 px-4 font-medium">With NexusPulse</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 text-zinc-700">
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.dimension} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-zinc-950 whitespace-nowrap">
                      {row.dimension}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-600 leading-relaxed">{row.manual}</td>
                    <td className="py-3.5 px-4 text-zinc-900 leading-relaxed">{row.nexuspulse}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Supporting Research Literature */}
        <section id="thesis" className="space-y-5">
          <div className="max-w-2xl space-y-1">
            <h2 className="text-[24px] font-semibold tracking-tight text-zinc-950">
              Supporting research &amp; thesis
            </h2>
            <p className="text-[14px] text-zinc-600">
              Published literature on spending guardrails, supervisory verification, and delegated payment controls.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PAPERS.map((paper) => (
              <div
                key={paper.title}
                className="rounded-[12px] border border-zinc-200 bg-white p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[12px] text-zinc-600">
                    <span className="font-medium text-zinc-800">{paper.source}</span>
                    <span className="font-mono">{paper.year}</span>
                  </div>
                  <h3 className="text-[15px] font-semibold text-zinc-950 leading-snug">
                    {paper.title}
                  </h3>
                  <p className="text-[12px] text-zinc-600 italic">{paper.authors}</p>
                  <p className="text-[13px] text-zinc-600 leading-relaxed">{paper.summary}</p>
                </div>
                <div className="pt-3 border-t border-zinc-200 flex flex-wrap gap-2">
                  {paper.links.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-[6px] border border-zinc-200 bg-[#fafafa] hover:bg-zinc-100 px-2.5 py-1 font-mono text-[12px] text-indigo-700 transition-colors"
                    >
                      <span>{link.label}</span>
                      <AppIcon icon={ArrowUpRight01Icon} size={12} />
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Technology Stack & Integrations */}
        <section id="sponsors" className="space-y-5">
          <div className="max-w-2xl space-y-1">
            <h2 className="text-[24px] font-semibold tracking-tight text-zinc-950">
              Integrations &amp; platform architecture
            </h2>
            <p className="text-[14px] text-zinc-600">
              Each integration handles a specific responsibility across checkout, verification, scheduling, and ledger auditability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {INTEGRATIONS.map((item) => (
              <div
                key={item.name}
                className="rounded-[12px] border border-zinc-200 bg-white p-5 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <h3 className="text-[15px] font-semibold text-zinc-950">{item.name}</h3>
                  <p className="text-[12px] font-medium text-indigo-700">{item.role}</p>
                  <p className="text-[13px] text-zinc-600 leading-relaxed">{item.summary}</p>
                </div>
                <ul className="pt-3 border-t border-zinc-200 space-y-1 text-[12px] text-zinc-600">
                  {item.capabilities.map((cap) => (
                    <li key={cap} className="leading-snug">
                      · {cap}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Security Architecture */}
        <section className="space-y-5">
          <div className="max-w-2xl space-y-1">
            <h2 className="text-[24px] font-semibold tracking-tight text-zinc-950">
              Security &amp; reliability safeguards
            </h2>
            <p className="text-[14px] text-zinc-600">
              Every transaction mutation validates signatures, idempotency keys, and request origins.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-[12px] border border-zinc-200 bg-white p-5 space-y-2">
              <AppIcon icon={Globe02Icon} size="sm" className="text-zinc-700" />
              <div className="text-[14px] font-semibold text-zinc-950">Scoped credentials</div>
              <p className="text-[13px] text-zinc-600 leading-relaxed">
                Supports sandbox evaluation credentials while keeping demo data isolated.
              </p>
            </div>
            <div className="rounded-[12px] border border-zinc-200 bg-white p-5 space-y-2">
              <AppIcon icon={SquareLock02Icon} size="sm" className="text-zinc-700" />
              <div className="text-[14px] font-semibold text-zinc-950">Signed webhooks</div>
              <p className="text-[13px] text-zinc-600 leading-relaxed">
                Validates SHA256withRSA headers against raw request bytes before updating ledger state.
              </p>
            </div>
            <div className="rounded-[12px] border border-zinc-200 bg-white p-5 space-y-2">
              <AppIcon icon={SecurityCheckIcon} size="sm" className="text-zinc-700" />
              <div className="text-[14px] font-semibold text-zinc-950">Idempotent retries</div>
              <p className="text-[13px] text-zinc-600 leading-relaxed">
                Applies unique PayPal-Request-Id keys across mutations to avoid duplicate charges.
              </p>
            </div>
            <div className="rounded-[12px] border border-zinc-200 bg-white p-5 space-y-2">
              <AppIcon icon={ServerStack01Icon} size="sm" className="text-zinc-700" />
              <div className="text-[14px] font-semibold text-zinc-950">Origin protection</div>
              <p className="text-[13px] text-zinc-600 leading-relaxed">
                Enforces strict same-origin request headers across mutating API routes.
              </p>
            </div>
          </div>
        </section>

        {/* Quiet Bottom Action Box */}
        <section className="rounded-[12px] border border-zinc-200 bg-white p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1 max-w-xl">
            <h2 className="text-[20px] font-semibold text-zinc-950">
              Try the live workspace or inspect the source
            </h2>
            <p className="text-[14px] text-zinc-600">
              Explore spending reviews, price alerts, task payouts, and escrow holds in one place.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              href="/?tab=overview"
              className="inline-flex h-9 items-center gap-1.5 rounded-[6px] bg-zinc-950 hover:bg-zinc-800 px-4 text-[13px] font-medium text-white transition-colors"
            >
              <span>Open workspace</span>
              <AppIcon icon={ArrowRight02Icon} size="sm" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex h-9 items-center gap-1.5 rounded-[6px] border border-zinc-200 bg-white hover:bg-zinc-50 px-4 text-[13px] font-medium text-zinc-800 transition-colors"
            >
              <span>Contact</span>
            </Link>
            <a
              href="https://github.com/Hamdanali3/NexusPulse"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-[6px] border border-zinc-200 bg-white hover:bg-zinc-50 px-4 text-[13px] font-medium text-zinc-800 transition-colors"
            >
              <span>GitHub</span>
              <AppIcon icon={ArrowUpRight01Icon} size="xs" className="text-zinc-500" />
            </a>
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
