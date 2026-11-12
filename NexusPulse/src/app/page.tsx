"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Bot,
  Calendar,
  CheckCircle2,
  Clock,
  Info,
  KeyRound,
  Layers,
  Lock,
  Mail,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  User,
  UserCheck,
} from "lucide-react";
import type { NexusPulseState } from "@/lib/paypal/paypal-sandbox-mirror";
import type {
  PayPalExecutionMode,
  PayPalLiveTelemetry,
  PayPalSandboxAccountConfig,
} from "@/lib/paypal/paypal-types";
import { formatSignedUsd, formatUsd } from "@/lib/format";
import { DEMO_EVALUATOR_ACCOUNTS, type UserProfile } from "@/lib/auth/auth-types";
import AuthModal from "@/components/auth/AuthModal";
import NexusHeader, { type WorkspaceTabId } from "@/components/layout/NexusHeader";
import NexusFooter from "@/components/layout/NexusFooter";
import NexusPulseLogo from "@/components/brand/NexusPulseLogo";
import Channel3DealHunterPanel from "@/components/sponsors/Channel3DealHunterPanel";
import ProofOfHumanBountyBoard from "@/components/bounties/ProofOfHumanBountyBoard";
import BryntumEscrowTimeline from "@/components/sponsors/BryntumEscrowTimeline";
import AgGridFinancialCommandCenter from "@/components/sponsors/AgGridFinancialCommandCenter";
import NexusAiChatbot from "@/components/chat/NexusAiChatbot";
import FeaturePageHeader from "@/components/layout/FeaturePageHeader";
import CfoExecutiveDocumentOutput from "@/components/ai/CfoExecutiveDocumentOutput";
import InteractiveFlowSimulator from "@/components/home/InteractiveFlowSimulator";
import ProblemSolutionComparison from "@/components/home/ProblemSolutionComparison";
import PersonaQuickSwitchBanner from "@/components/home/PersonaQuickSwitchBanner";
import ToastNotificationContainer, {
  type ToastMessage,
  type ToastType,
} from "@/components/common/ToastNotification";

// URL hash <-> workspace tab mapping so every feature has its own shareable "page"
// (e.g. /#deal-hunter) and the browser Back button works between features.
const TAB_TO_HASH: Record<WorkspaceTabId, string> = {
  overview: "",
  channel3: "deal-hunter",
  bounties: "human-bounties",
  bryntum: "escrow-gantt",
  aggrid: "telemetry",
};

function tabFromHashOrQuery(hash: string, search: string): WorkspaceTabId {
  try {
    const params = new URLSearchParams(search);
    const tabParam = params.get("tab") as WorkspaceTabId | null;
    if (
      tabParam &&
      ["overview", "channel3", "bounties", "bryntum", "aggrid"].includes(tabParam)
    ) {
      return tabParam;
    }
  } catch {
    // Ignore URLSearchParams errors
  }

  const clean = hash.replace(/^#/, "");
  const match = (Object.keys(TAB_TO_HASH) as WorkspaceTabId[]).find(
    (t) => TAB_TO_HASH[t] === clean && clean !== ""
  );
  if (match) return match;

  if (clean === "engine-channel3" || clean === "engine-1-heading") return "channel3";
  if (clean === "engine-bounties" || clean === "engine-2-heading") return "bounties";
  if (clean === "engine-bryntum") return "bryntum";
  if (clean === "aggrid-heading" || clean === "webhooks-security") return "aggrid";

  return "overview";
}

export default function NexusPulseHomePage() {
  const [appState, setAppState] = useState<NexusPulseState | null>(null);
  const [activeMode, setActiveMode] = useState<PayPalExecutionMode>("mirror");
  const [preferredMode, setPreferredMode] = useState<
    "auto" | "live" | "sandbox" | "mirror"
  >("auto");
  const [publicPayPalClientId, setPublicPayPalClientId] = useState<string>("");
  const [clientToken, setClientToken] = useState<string>("mirror_client_token");
  const [clientTokenIsLive, setClientTokenIsLive] = useState<boolean>(false);
  const [sandboxAccounts, setSandboxAccounts] = useState<
    PayPalSandboxAccountConfig | undefined
  >(undefined);
  const [liveTelemetry, setLiveTelemetry] = useState<PayPalLiveTelemetry | null>(null);
  const [syncingTelemetry, setSyncingTelemetry] = useState(false);
  const processedReturnRef = useRef<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<WorkspaceTabId>("overview");

  // Gemini Interactions API Console state (with multi-turn previousInteractionId continuity)
  const [agentPrompt, setAgentPrompt] = useState(
    "Perform a full Autonomous CFO & AGI Clearinghouse sweep: identify my highest-ROI PayPal subscription optimization, best Channel3 deal mandate, highest hourly Proof-of-Human Oracle bounty, and next A2A Smart Escrow milestone ready for capture."
  );
  const [agentMode, setAgentMode] = useState<"deep_cfo_audit" | "fast_agent">(
    "deep_cfo_audit"
  );
  const [agentRunning, setAgentRunning] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  const [agentResponse, setAgentResponse] = useState<{
    interactionId: string;
    previousInteractionId?: string;
    modelUsed: string;
    outputText: string;
    durationMs?: number;
    toolExecutions: Array<{
      toolName: string;
      args: Record<string, unknown>;
      resultSummary: string;
    }>;
  } | null>(null);

  // Voice Briefing state (Gemini 3.8 Flash TTS)
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string | null>(null);

  // Webhook Simulator state
  const [webhookSimulating, setWebhookSimulating] = useState(false);
  const [webhookResult, setWebhookResult] = useState<{
    verification_status: string;
    eventId: string;
    mode: string;
  } | null>(null);

  const [databaseSource, setDatabaseSource] = useState<string>("in_memory_mirror");

  // Global Task Toast Notifications (Success & Failure Feedback)
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: ToastType, title: string, message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Multi-Tenant User Authentication & Evaluator Persona State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("nexuspulse_user_session");
      if (stored) {
        const parsed = JSON.parse(stored) as UserProfile;
        if (parsed && parsed.email) {
          setCurrentUser(parsed);
        }
      }
    } catch {
      // Ignore localStorage parse errors
    }
  }, []);

  const handleLoginSuccess = useCallback((user: UserProfile) => {
    setCurrentUser(user);
    try {
      window.localStorage.setItem("nexuspulse_user_session", JSON.stringify(user));
    } catch {
      // Ignore
    }
    addToast(
      "success",
      `Project Unlocked: ${user.fullName}`,
      `Logged in as ${user.roleTitle} (${user.role}). Full clearinghouse access granted!`
    );
  }, [addToast]);

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    try {
      window.localStorage.removeItem("nexuspulse_user_session");
    } catch {
      // Ignore
    }
    setActiveTab("overview");
    addToast("info", "Signed Out", "You have signed out. Project access is now gated. Please sign in or choose a demo persona to access the engines.");
  }, [addToast]);

  const handleSwitchPersona = useCallback((key: string) => {
    const demo = DEMO_EVALUATOR_ACCOUNTS[key];
    if (demo) {
      handleLoginSuccess(demo);
    }
  }, [handleLoginSuccess]);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch("/api/state", { cache: "no-store" });
      const data = await res.json();
      if (data.state) {
        setAppState(data.state);
        setActiveMode(data.activeMode ?? "mirror");
        setPreferredMode(data.preferredMode ?? "auto");
        setDatabaseSource(data.database || "in_memory_mirror");
        if (typeof data.publicPayPalClientId === "string") {
          setPublicPayPalClientId(data.publicPayPalClientId);
        }
        if (typeof data.clientToken === "string") {
          setClientToken(data.clientToken);
        }
        if (typeof data.clientTokenIsLive === "boolean") {
          setClientTokenIsLive(data.clientTokenIsLive);
        }
        if (data.sandboxAccounts) {
          setSandboxAccounts(data.sandboxAccounts);
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSyncSandbox = useCallback(async () => {
    setSyncingTelemetry(true);
    try {
      const res = await fetch("/api/paypal/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SYNC_TELEMETRY" }),
      });
      const data = await res.json();
      if (res.ok && data.telemetry) {
        setLiveTelemetry(data.telemetry);
        if (data.state) setAppState(data.state);
        if (data.accounts) setSandboxAccounts(data.accounts);
        addToast(
          data.telemetry.connected ? "success" : "info",
          "PayPal Sandbox Synced",
          data.telemetry.connected
            ? `Synced Slot ${data.accounts?.slot ?? "013"} (${data.telemetry.liveInvoicesCount} live invoices, ${data.telemetry.disputesCount} disputes, ${data.telemetry.catalogPlansCount} billing plans).`
            : "Running in offline Mirror fallback mode."
        );
      } else {
        addToast("error", "Sync Failed", data.error || "Could not sync PayPal Sandbox telemetry.");
      }
    } catch {
      addToast("error", "Sync Error", "Network error syncing PayPal Sandbox telemetry.");
    } finally {
      setSyncingTelemetry(false);
    }
  }, [addToast]);

  const handleCreateLiveInvoice = useCallback(
    async (payload: { amountValue: string; itemName: string; recipientEmail?: string }) => {
      try {
        const res = await fetch("/api/paypal/invoices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (res.ok && data.invoice) {
          if (data.state) setAppState(data.state);
          addToast(
            "success",
            `PayPal Invoice ${data.invoice.invoice_number} Sent`,
            `Dispatched $${data.invoice.amount.value} USD via Invoicing v2 (${String(data.mode).toUpperCase()}).`
          );
          return { viewUrl: data.viewUrl as string | undefined, invoiceId: data.invoice.id as string };
        }
        addToast("error", "Invoice Failed", data.error || "Failed to send PayPal Invoice.");
        return null;
      } catch {
        addToast("error", "Invoice Error", "Network error issuing PayPal Invoice.");
        return null;
      }
    },
    [addToast]
  );

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  // Handle PayPal Sandbox Buyer Checkout return redirects (?paypal_return=approved&token=...)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const returnStatus = params.get("paypal_return");
    const subStatus = params.get("paypal_sub");
    const token = params.get("token");

    if (!returnStatus && !subStatus) return;
    const key = `${returnStatus ?? ""}:${subStatus ?? ""}:${token ?? ""}`;
    if (processedReturnRef.current === key) return;
    processedReturnRef.current = key;

    const cleanUrl = () => {
      const nextParams = new URLSearchParams(window.location.search);
      ["paypal_return", "paypal_sub", "token", "PayerID", "subscription_id", "ba_token"].forEach(
        (k) => nextParams.delete(k)
      );
      const nextSearch = nextParams.toString();
      const cleaned = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}${window.location.hash}`;
      window.history.replaceState(null, "", cleaned);
    };

    if (returnStatus === "cancelled" || subStatus === "cancelled") {
      cleanUrl();
      addToast("info", "PayPal Checkout Cancelled", "Buyer cancelled before approval in Sandbox.");
      return;
    }

    if (subStatus === "approved") {
      cleanUrl();
      addToast("success", "PayPal Subscription Approved", "Recurring Sandbox billing plan consent recorded.");
      fetchState();
      return;
    }

    if (returnStatus === "approved" && token) {
      (async () => {
        try {
          const stateRes = await fetch("/api/state", { cache: "no-store" });
          const stateData = await stateRes.json();
          const matchingMilestone = stateData?.state?.escrowMilestones?.find(
            (m: { id: string; paypal_order_id?: string }) => m.paypal_order_id === token
          );

          if (matchingMilestone) {
            const authRes = await fetch("/api/paypal/escrow", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "FINALIZE_AUTHORIZE",
                milestoneId: matchingMilestone.id,
                orderId: token,
              }),
            });
            const authData = await authRes.json();
            if (authRes.ok && authData.ok) {
              addToast(
                "success",
                "Escrow Authorization Locked",
                `Approved PayPal Order ${token} finalized as Authorization ${authData.milestone?.paypal_authorization_id ?? ""}.`
              );
            } else {
              addToast("error", "Authorization Failed", authData.error || "Could not finalize escrow authorization.");
            }
          } else {
            const capRes = await fetch("/api/paypal/orders", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                operation: "CAPTURE",
                orderId: token,
              }),
            });
            const capData = await capRes.json();
            const captured = capData.capturedOrder ?? capData.order;
            if (capRes.ok && captured) {
              addToast(
                "success",
                "PayPal Sandbox Payment Captured",
                `Order ${token} captured (${captured.capture_id ?? "SETTLED"}) into Merchant Slot 013.`
              );
            } else {
              addToast("error", "Capture Error", capData.error || `Order ${token} could not be captured.`);
            }
          }
        } catch {
          addToast("error", "PayPal Return Error", "Failed while settling approved PayPal Sandbox order.");
        } finally {
          cleanUrl();
          fetchState();
        }
      })();
    }
  }, [addToast, fetchState]);

  // Sync the active feature page with URL query/hash (deep links + Back/Forward).
  useEffect(() => {
    const syncFromUrl = () => {
      setActiveTab(tabFromHashOrQuery(window.location.hash, window.location.search));
      const hashId = window.location.hash.replace(/^#/, "");
      if (hashId) {
        requestAnimationFrame(() => {
          const el = document.getElementById(hashId);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
    };
    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    window.addEventListener("hashchange", syncFromUrl);
    return () => {
      window.removeEventListener("popstate", syncFromUrl);
      window.removeEventListener("hashchange", syncFromUrl);
    };
  }, []);

  /** Navigate to a feature page: switch view, update URL, and scroll to target section or top. */
  const navigateTo = useCallback((tab: WorkspaceTabId, sectionId?: string) => {
    if (!currentUser && tab !== "overview") {
      setAuthModalOpen(true);
      addToast(
        "info",
        "Sign In Required",
        "Please sign in or select an Evaluator Demo Persona to access the engines."
      );
      return;
    }
    setActiveTab(tab);
    const hash = sectionId || TAB_TO_HASH[tab];
    const url = `/?tab=${tab}${hash ? `#${hash}` : ""}`;
    window.history.pushState(null, "", url);
    requestAnimationFrame(() => {
      if (sectionId) {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }, [currentUser, addToast]);

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
        addToast(
          "info",
          "Gateway Mode Updated",
          `PayPal gateway mode switched to ${nextPref.toUpperCase()} (${data.activeMode ?? nextPref}).`
        );
      }
    } catch {
      addToast("error", "Gateway Update Failed", "Failed to switch PayPal execution mode.");
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
        addToast(
          "success",
          "PayPal Sandbox Connected",
          "Runtime credentials validated and hot-swapped to Live PayPal Sandbox."
        );
      } else {
        addToast(
          "error",
          "Credentials Error",
          data.error || "Failed to validate PayPal sandbox credentials."
        );
      }
    } catch {
      addToast("error", "Connection Error", "Network error saving sandbox credentials.");
    }
  }

  async function handleRunAgentInteraction(
    customPrompt?: string,
    e?: React.FormEvent
  ) {
    if (e) e.preventDefault();
    if (!currentUser) {
      setAuthModalOpen(true);
      addToast(
        "info",
        "Sign In Required",
        "Please sign in or select an Evaluator Demo Persona to run the Autonomous CFO."
      );
      return;
    }
    const promptToUse = customPrompt ?? agentPrompt;
    if (customPrompt) {
      setAgentPrompt(customPrompt);
    }
    setAgentRunning(true);
    try {
      const res = await fetch("/api/ai/interact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptToUse,
          previousInteractionId: agentResponse?.interactionId,
          mode: agentMode,
        }),
      });
      const data = await res.json();
      if (res.ok && data.interactionId) {
        setAgentResponse({
          interactionId: data.interactionId,
          previousInteractionId: data.previousInteractionId,
          modelUsed: data.modelUsed,
          outputText: data.outputText,
          durationMs: data.durationMs,
          toolExecutions: data.toolExecutions ?? [],
        });
        setTurnCount((c) => c + 1);
        if (data.state) {
          setAppState(data.state);
        }
        addToast(
          "success",
          "AI CFO Sweep Completed",
          `Gemini executed ${data.toolExecutions?.length ?? 0} tool audits in ${data.durationMs ? `${data.durationMs}ms` : "real-time"}.`
        );
      } else {
        addToast(
          "error",
          "AI CFO Sweep Failed",
          data.error || "Gemini could not complete the autonomous audit."
        );
      }
    } catch (err) {
      addToast(
        "error",
        "AI Sweep Error",
        `Network error during AI audit: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    } finally {
      setAgentRunning(false);
    }
  }

  async function handlePlayVoiceBriefing() {
    setVoiceLoading(true);
    try {
      const res = await fetch("/api/ai/voice-briefing", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.transcript) {
        setVoiceTranscript(data.transcript);
        addToast("success", "Voice CFO Briefing", "Synthesizing executive audio briefing from Gemini.");
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
      } else {
        addToast("error", "Voice Briefing Failed", data.error || "Could not synthesize audio briefing.");
      }
    } catch {
      addToast("error", "Voice Error", "Network error starting audio briefing.");
    } finally {
      setVoiceLoading(false);
    }
  }

  async function handleSimulateWebhook(eventType: string) {
    setWebhookSimulating(true);
    try {
      const res = await fetch("/api/paypal/webhooks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "paypal-transmission-id": `WH-TX-${Date.now()}`,
          "paypal-transmission-time": new Date().toISOString(),
          "paypal-transmission-sig": "SHA256withRSA-Verified-PayPal-Signature",
          "paypal-auth-algo": "SHA256withRSA",
          "paypal-cert-url":
            "https://api.sandbox.paypal.com/v1/notifications/certs/CERT-360caa42-fca2a594-1d93a270",
        },
        body: JSON.stringify({
          id: `WH-${Date.now()}`,
          event_type: eventType,
          resource: {
            id: "0VF52814937998046",
            amount: { currency_code: "USD", value: "279.00" },
          },
          summary: `Simulated ${eventType} verified via PayPal Webhook Signature Verifier`,
        }),
      });
      const data = await res.json();
      if (res.ok && data.received) {
        setWebhookResult({
          verification_status: data.verification_status,
          eventId: data.eventId,
          mode: data.mode,
        });
        if (data.state) {
          setAppState(data.state);
        }
        addToast(
          "success",
          "Webhook Verified",
          `Event ${eventType} verified via SHA256withRSA signature (ID: ${data.eventId}).`
        );
      } else {
        addToast("error", "Webhook Simulation Failed", data.error || "Signature validation failed.");
      }
    } catch {
      addToast("error", "Webhook Simulation Error", "Network error simulating PayPal webhook.");
    } finally {
      setWebhookSimulating(false);
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
        setAgentResponse(null);
        setTurnCount(0);
        addToast(
          "info",
          "Demo State Reset",
          "All mock orders, bounties, and escrow milestones restored to clean baseline."
        );
      }
    } catch {
      addToast("error", "Reset Error", "Failed to reset demo state.");
    }
  }

  if (loading || !appState) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center animate-fade-in"
      >
        <div className="mb-4 animate-bounce">
          <NexusPulseLogo size="lg" showTagline={false} />
        </div>
        <h1 className="text-base font-bold text-slate-900">
          Initializing NexusPulse Clearinghouse...
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Connecting Slot 013 PayPal Sandbox, Channel3 Catalog, Bryntum Escrow Gantt, and AG Grid Ledger
        </p>
      </div>
    );
  }

  const annualSubSavings =
    appState.subscriptions.reduce(
      (sum, s) => sum + Number(s.potential_monthly_savings.value),
      0
    ) * 12;

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50/50 text-zinc-950">
      {/* Accessibility Skip Link */}
      <a href="#main-workspace" className="skip-link visually-hidden">
        Skip to main content
      </a>

      {/* MINIMALIST HEADER */}
      <NexusHeader
        activeTab={activeTab}
        onSelectTab={navigateTo}
        activeMode={activeMode}
        preferredMode={preferredMode}
        databaseSource={databaseSource}
        sandboxAccounts={sandboxAccounts}
        voiceLoading={voiceLoading}
        voiceTranscript={voiceTranscript}
        currentUser={currentUser}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        onSwitchMode={handleSwitchMode}
        onSaveRuntimeCredentials={handleSaveRuntimeCredentials}
        onPlayVoiceBriefing={handlePlayVoiceBriefing}
        onResetDemoState={handleResetDemoState}
      />

      {/* MAIN WORKSPACE */}
      <main
        id="main-workspace"
        className="flex-1 mx-auto w-full max-w-6xl px-5 sm:px-8 pt-6 space-y-8"
      >
        {/* FEATURE PAGE HEADER (shown when a specific engine is selected) */}
        {activeTab !== "overview" && (
          <FeaturePageHeader tab={activeTab} onNavigate={navigateTo} />
        )}

        {/* HOMEPAGE-ONLY SECTIONS (hero, KPI ribbon, Gemini console) */}
        {activeTab === "overview" && (
        <>
        {/* MINIMAL STARTUP HERO */}
        <section
          aria-labelledby="product-hero-heading"
          className="relative text-center pt-8 pb-4 sm:pt-14 sm:pb-8 px-4 max-w-4xl mx-auto w-full"
        >
          {/* Subtle micro-pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600 shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>Autonomous Clearinghouse on PayPal</span>
          </div>

          {/* Clean headline */}
          <h1
            id="product-hero-heading"
            className="mt-5 text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-zinc-950 leading-[1.08] text-balance"
          >
            Autonomous commerce, task bounties &amp; escrow.
          </h1>

          {/* Crisp subheadline */}
          <p className="mt-4 text-sm sm:text-base lg:text-lg text-zinc-500 max-w-2xl mx-auto leading-relaxed text-balance">
            Connecting Google Gemini AI with PayPal smart payment rails to automate deal-hunting, physical task verification bounties, and zero-dispute milestone escrow.
          </p>

          {/* Restrained CTAs */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById("flow-simulator-heading");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              <span>Simulate Autonomous Flow</span>
            </button>
            <button
              type="button"
              onClick={() => handleRunAgentInteraction()}
              disabled={agentRunning}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 px-4 py-2.5 text-xs font-semibold text-zinc-800 shadow-2xs transition-colors"
            >
              <span>{agentRunning ? "Running CFO Sweep..." : "Run AI CFO Sweep"}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById("autonomous-engines-hub");
                if (el) {
                  el.scrollIntoView({ behavior: "smooth" });
                } else {
                  navigateTo("channel3");
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 px-4 py-2.5 text-xs font-semibold text-zinc-800 shadow-2xs transition-colors"
            >
              <span>Explore 3 Engines</span>
              <ArrowRight className="h-3.5 w-3.5 text-zinc-400" />
            </button>
          </div>
        </section>

        {/* 1-CLICK INTERACTIVE EVALUATOR PERSONAS */}
        <PersonaQuickSwitchBanner
          currentUser={currentUser}
          onSelectPersona={async (key) => handleSwitchPersona(key)}
          onOpenAuthModal={() => setAuthModalOpen(true)}
        />

        {/* INTERACTIVE PROTOCOL WALKTHROUGH SIMULATOR */}
        <InteractiveFlowSimulator
          onExploreEngines={() => navigateTo("bounties")}
        />

        {/* MINIMAL FINANCIAL TELEMETRY STRIP */}
        <section
          id="kpi-telemetry-ribbon"
          aria-label="Key Financial Performance Indicators"
          className="rounded-xl border border-zinc-200 bg-white shadow-2xs overflow-hidden w-full"
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-zinc-100">
            <button
              type="button"
              onClick={() => navigateTo("channel3")}
              className="p-5 text-left hover:bg-zinc-50/70 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-500">
                  Annual Savings
                </span>
                <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
              </div>
              <div className="mt-2 text-2xl font-bold text-zinc-950 tabular-nums tracking-tight">
                {formatUsd(appState.totalSavedByAiUsd + annualSubSavings)}
              </div>
              <div className="mt-1 text-[11px] text-zinc-600 tabular-nums">
                {formatUsd(appState.totalSavedByAiUsd)} realized
              </div>
            </button>

            <button
              type="button"
              onClick={() => navigateTo("bounties")}
              className="p-5 text-left hover:bg-zinc-50/70 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-600">
                  Bounties Paid
                </span>
                <UserCheck className="h-3.5 w-3.5 text-indigo-600" />
              </div>
              <div className="mt-2 text-2xl font-bold text-zinc-950 tabular-nums tracking-tight">
                {formatUsd(appState.totalEarnedFromBountiesUsd)}
              </div>
              <div className="mt-1 text-[11px] text-zinc-600">
                Instant PayPal Payouts
              </div>
            </button>

            <button
              type="button"
              onClick={() => navigateTo("bryntum")}
              className="p-5 text-left hover:bg-zinc-50/70 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-600">
                  Active Escrow Holds
                </span>
                <Lock className="h-3.5 w-3.5 text-indigo-600" />
              </div>
              <div className="mt-2 text-2xl font-bold text-zinc-950 tabular-nums tracking-tight">
                {formatUsd(appState.totalEscrowProtectedUsd)}
              </div>
              <div className="mt-1 text-[11px] text-zinc-600">
                PayPal Orders v2 Auth
              </div>
            </button>

            <button
              type="button"
              onClick={() => navigateTo("aggrid")}
              className="p-5 text-left hover:bg-zinc-50/70 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-600">
                  {appState.walletBalanceUsd < 0 ? "Net balance" : "Wallet balance"}
                </span>
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              </div>
              <div
                className={`mt-2 text-2xl font-bold tabular-nums tracking-tight ${
                  appState.walletBalanceUsd < 0 ? "text-red-700" : "text-zinc-950"
                }`}
              >
                {formatUsd(appState.walletBalanceUsd)}
              </div>
              <div className="mt-1 text-[11px] text-zinc-600">
                Verified Ledger Balance
              </div>
            </button>
          </div>
        </section>

        {/* INTERACTIVE AI CFO COMMAND BAR */}
        <section
          aria-labelledby="gemini-console-heading"
          className="rounded-xl border border-zinc-200 bg-white p-5 shadow-2xs w-full"
        >
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-indigo-600" />
              <h2 id="gemini-console-heading" className="text-xs font-semibold text-zinc-950">
                Autonomous CFO
              </h2>
              <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] text-zinc-600 font-medium">
                gemini-4-argon
              </span>
              {turnCount > 0 && (
                <span className="rounded bg-emerald-50 text-emerald-700 font-mono text-[10px] px-1.5 py-0.5 font-medium">
                  Turn #{turnCount}
                </span>
              )}
            </div>

            {agentResponse && (
              <button
                type="button"
                onClick={() => {
                  setAgentResponse(null);
                  setTurnCount(0);
                }}
                className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 px-2 py-1 text-xs text-zinc-600 transition"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          <form
            onSubmit={(e) => handleRunAgentInteraction(undefined, e)}
            className="mt-3 space-y-2.5"
          >
            <div className="flex flex-col sm:flex-row gap-2">
              <label htmlFor="gemini-agent-prompt-input" className="visually-hidden">
                Ask your Autonomous CFO
              </label>
              <input
                id="gemini-agent-prompt-input"
                type="text"
                value={agentPrompt}
                onChange={(e) => setAgentPrompt(e.target.value)}
                className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:border-indigo-500 shadow-2xs"
                placeholder="Ask your Autonomous CFO to audit subscriptions, buy deals, or verify escrow..."
              />
              <button
                type="submit"
                disabled={agentRunning}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 px-3.5 py-2 text-xs font-medium text-white shadow-2xs transition shrink-0"
              >
                <Sparkles className="h-3 w-3 text-indigo-400" />
                <span>{agentRunning ? "Running..." : "Run AI Sweep"}</span>
              </button>
            </div>

            {/* Quick Action Chips */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-zinc-400 text-[11px]">Quick:</span>
              {[
                { label: "Audit Subscriptions", prompt: "Optimize my unused PayPal subscription and downgrade idle GPU plan to save money" },
                { label: "Best Deal", prompt: "Buy the NVIDIA Jetson Orin Nano deal on Channel3 via PayPal Order v2" },
                { label: "Top Bounties", prompt: "Rank open Proof-of-Human Oracle bounties by hourly PayPal Payout yield" },
                { label: "Verify Escrow", prompt: "Audit A2A Smart Escrow milestones and Dispute Shield tracking status" },
              ].map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => handleRunAgentInteraction(chip.prompt)}
                  className="rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 px-2 py-0.5 text-[11px] text-zinc-600 hover:text-zinc-950 transition font-medium"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </form>

          {/* Autonomous AI CFO Formatted Document Output */}
          {agentResponse && (
            <CfoExecutiveDocumentOutput
              response={agentResponse}
              onNavigate={navigateTo}
            />
          )}
        </section>
        </>
        )}

        {/* MOBILE / TABLET WORKSPACE NAVIGATION */}
        <div
          role="tablist"
          aria-label="NexusPulse Main Navigation"
          className="flex lg:hidden flex-wrap items-center justify-between gap-2 border-b border-zinc-200 pb-3"
        >
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "overview"}
              onClick={() => navigateTo("overview")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === "overview"
                  ? "bg-zinc-950 text-white"
                  : "bg-white text-zinc-700 hover:bg-zinc-50 border border-zinc-200"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Overview</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab !== "overview"}
              onClick={() => {
                if (activeTab === "overview") {
                  navigateTo("channel3");
                }
              }}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeTab !== "overview"
                  ? "bg-zinc-950 text-white"
                  : "bg-white text-zinc-700 hover:bg-zinc-50 border border-zinc-200"
              }`}
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>Engines</span>
            </button>

            <Link
              href="/about"
              className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold bg-white text-zinc-700 hover:bg-zinc-50 border border-zinc-200"
            >
              <Info className="h-3.5 w-3.5 text-indigo-600" />
              <span>About</span>
            </Link>

            <Link
              href="/contact"
              className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold bg-white text-zinc-700 hover:bg-zinc-50 border border-zinc-200"
            >
              <Mail className="h-3.5 w-3.5 text-zinc-600" />
              <span>Contact</span>
            </Link>
          </div>

          {/* Quick Engine Selector Pill on Mobile when in Engines */}
          {activeTab !== "overview" && (
            <div className="flex items-center gap-1 text-[11px] font-medium bg-zinc-100 p-1 rounded-lg">
              {[
                { id: "channel3", label: "Deals" },
                { id: "bounties", label: "Bounties" },
                { id: "bryntum", label: "Escrow" },
                { id: "aggrid", label: "Ledger" },
              ].map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => navigateTo(sub.id as WorkspaceTabId)}
                  className={`px-2 py-0.5 rounded font-semibold transition ${
                    activeTab === sub.id
                      ? "bg-white text-zinc-950 shadow-2xs"
                      : "text-zinc-600 hover:text-zinc-950"
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* OVERVIEW TAB: 3-ENGINE HUB & PROBLEM-SOLUTION MATRIX */}
        {activeTab === "overview" && (
          <>
          <section
            id="autonomous-engines-hub"
            aria-label="NexusPulse 3-Engine Clearinghouse Hub"
            className="space-y-4 pt-2"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-zinc-950 tracking-tight">
                  Autonomous Engines
                </h2>
                <p className="text-xs text-zinc-500">
                  Three automated financial protocols connecting Gemini AI with PayPal.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Engine 01 Card */}
              <div
                id="engine-channel3"
                className="rounded-xl border border-zinc-200 bg-white p-5 shadow-2xs hover:border-zinc-300 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-900">
                      <ShoppingBag className="h-4 w-4 text-indigo-600" />
                      Deal Hunter
                    </span>
                    <span className="text-[11px] font-mono text-zinc-500 font-medium">100M+ SKUs</span>
                  </div>

                  <p className="mt-2 text-xs text-zinc-500 leading-relaxed">
                    Automated price drop monitoring with instant PayPal v6 checkout and SaaS plan downgrades.
                  </p>

                  {/* Compact Deal Previews */}
                  <div className="mt-4 space-y-2">
                    {appState.channel3Deals.slice(0, 2).map((deal) => (
                      <div
                        key={deal.id}
                        className="rounded-lg border border-zinc-100 bg-zinc-50/60 p-2.5 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <div
                            title={deal.title}
                            className="font-medium text-zinc-900 line-clamp-2 leading-snug"
                          >
                            {deal.title}
                          </div>
                          <div className="text-[11px] text-zinc-600 tabular-nums">
                            Retail: {formatUsd(deal.retail_price)}
                          </div>
                        </div>
                        <div className="text-right shrink-0 tabular-nums">
                          <div className="font-bold text-emerald-700">
                            {formatUsd(deal.channel3_best_price)}
                          </div>
                          <span className="text-[10px] text-zinc-600">
                            Save {deal.savings_percent}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!currentUser) setAuthModalOpen(true);
                    else navigateTo("channel3");
                  }}
                  className="mt-5 w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 py-2 text-xs font-semibold text-zinc-800 transition-colors shadow-2xs"
                >
                  <span>{currentUser ? "Open Deal Hunter" : "Sign In to Access Deal Hunter"}</span>
                  <ArrowRight className="h-3 w-3 text-zinc-400" />
                </button>
              </div>

              {/* Engine 02 Card */}
              <div
                id="engine-bounties"
                className="rounded-xl border border-zinc-200 bg-white p-5 shadow-2xs hover:border-zinc-300 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-900">
                      <UserCheck className="h-4 w-4 text-emerald-600" />
                      Human Bounties
                    </span>
                    <span className="text-[11px] font-mono text-zinc-500 font-medium">Instant Payouts</span>
                  </div>

                  <p className="mt-2 text-xs text-zinc-500 leading-relaxed">
                    Physical verification tasks audited by Gemini AI with immediate PayPal disbursements.
                  </p>

                  {/* Compact Bounty Previews */}
                  <div className="mt-4 space-y-2">
                    {appState.bounties.slice(0, 2).map((b) => (
                      <div
                        key={b.id}
                        className="rounded-lg border border-zinc-100 bg-zinc-50/60 p-2.5 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <div
                            title={b.title}
                            className="font-medium text-zinc-900 line-clamp-2 leading-snug"
                          >
                            {b.title}
                          </div>
                          <div className="text-[11px] text-zinc-600">
                            ~{b.estimated_seconds}s check
                          </div>
                        </div>
                        <div className="text-right shrink-0 tabular-nums">
                          <div className="font-bold text-emerald-700">
                            {formatSignedUsd(b.reward.value)}
                          </div>
                          <span className="text-[10px] text-zinc-600">
                            PayPal Payout
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!currentUser) setAuthModalOpen(true);
                    else navigateTo("bounties");
                  }}
                  className="mt-5 w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 py-2 text-xs font-semibold text-zinc-800 transition-colors shadow-2xs"
                >
                  <span>{currentUser ? "Explore Bounties" : "Sign In to Claim Bounties"}</span>
                  <ArrowRight className="h-3 w-3 text-zinc-400" />
                </button>
              </div>

              {/* Engine 03 Card */}
              <div
                id="engine-bryntum"
                className="rounded-xl border border-zinc-200 bg-white p-5 shadow-2xs hover:border-zinc-300 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-900">
                      <Lock className="h-4 w-4 text-indigo-600" />
                      Smart Escrow
                    </span>
                    <span className="text-[11px] font-mono text-zinc-500 font-medium">Dispute Shield</span>
                  </div>

                  <p className="mt-2 text-xs text-zinc-500 leading-relaxed">
                    PayPal authorization holds released on deliverable proof with automated shipment tracking.
                  </p>

                  {/* Compact Escrow Previews */}
                  <div className="mt-4 space-y-2">
                    {appState.escrowMilestones.slice(0, 2).map((m) => (
                      <div
                        key={m.id}
                        className="rounded-lg border border-zinc-100 bg-zinc-50/60 p-2.5 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <div
                            title={m.project_name}
                            className="font-medium text-zinc-900 line-clamp-2 leading-snug"
                          >
                            {m.project_name}
                          </div>
                          <div className="text-[11px] text-zinc-600">
                            Progress: {m.progress_percent}%
                          </div>
                        </div>
                        <div className="text-right shrink-0 tabular-nums">
                          <div className="font-bold text-zinc-900">
                            {formatUsd(m.amount.value)}
                          </div>
                          <span className="text-[10px] text-zinc-600">
                            {m.status === "AI_VERIFIED_CAPTURED" ? "Captured" : "Scheduled"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!currentUser) setAuthModalOpen(true);
                    else navigateTo("bryntum");
                  }}
                  className="mt-5 w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 py-2 text-xs font-semibold text-zinc-800 transition-colors shadow-2xs"
                >
                  <span>{currentUser ? "View Escrow Gantt" : "Sign In to View Escrow Gantt"}</span>
                  <ArrowRight className="h-3 w-3 text-zinc-400" />
                </button>
              </div>
            </div>
          </section>

          {/* PROBLEM & SOLUTION COMPARISON MATRIX */}
          <ProblemSolutionComparison onSelectEngine={navigateTo} />
          </>
        )}

        {/* DEDICATED ENGINE 1 TAB */}
        {activeTab === "channel3" && (
          <div id="engine-channel3-workspace" className="nexus-fade-in">
            <Channel3DealHunterPanel
              deals={appState.channel3Deals}
              activeMode={activeMode}
              publicPayPalClientId={publicPayPalClientId}
              clientToken={clientToken}
              clientTokenIsLive={clientTokenIsLive}
              sandboxBuyerEmail={sandboxAccounts?.buyerEmail}
              onStateUpdated={fetchState}
            />
          </div>
        )}

        {/* DEDICATED ENGINE 2 TAB */}
        {activeTab === "bounties" && (
          <div id="engine-bounties-workspace" className="nexus-fade-in">
            <ProofOfHumanBountyBoard
              bounties={appState.bounties}
              payouts={appState.payouts}
              activeMode={activeMode}
              sandboxBuyerEmail={sandboxAccounts?.buyerEmail}
              onStateUpdated={fetchState}
            />
          </div>
        )}

        {/* DEDICATED ENGINE 3 TAB */}
        {activeTab === "bryntum" && (
          <div id="engine-bryntum-workspace" className="nexus-fade-in">
            <BryntumEscrowTimeline
              milestones={appState.escrowMilestones}
              subscriptions={appState.subscriptions}
              activeMode={activeMode}
              onStateUpdated={fetchState}
            />
          </div>
        )}

        {/* DEDICATED AG GRID TELEMETRY TAB */}
        {activeTab === "aggrid" && (
          <div id="aggrid-heading" className="nexus-fade-in space-y-6">
            <AgGridFinancialCommandCenter
              state={appState}
              activeMode={activeMode}
              liveTelemetry={liveTelemetry}
              syncingTelemetry={syncingTelemetry}
              sandboxBuyerEmail={sandboxAccounts?.buyerEmail}
              onSyncSandbox={handleSyncSandbox}
              onCreateLiveInvoice={handleCreateLiveInvoice}
              onAskGeminiAboutLedger={(prompt) => {
                handleRunAgentInteraction(prompt);
              }}
            />

            {/* PAYPAL WEBHOOKS V1 SIGNATURE VERIFIER & APIMATIC SDK INSPECTOR */}
            <div id="webhooks-security" className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition-all space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      PayPal Webhooks v1 Security
                    </span>
                    <h3 className="mt-1 text-base font-bold text-slate-900">
                      Webhook Signature Verifier
                    </h3>
                    <p className="text-xs text-slate-600">
                      Simulate and verify live PayPal events with SHA256withRSA signature validation.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    "PAYMENT.CAPTURE.COMPLETED",
                    "PAYMENT.PAYOUTS-ITEM.SUCCEEDED",
                    "CUSTOMER.DISPUTE.CREATED",
                    "BILLING.SUBSCRIPTION.UPDATED",
                  ].map((evt) => (
                    <button
                      key={evt}
                      type="button"
                      disabled={webhookSimulating}
                      onClick={() => handleSimulateWebhook(evt)}
                      className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-indigo-400 hover:shadow-xs px-3 py-1.5 font-mono text-xs text-slate-800 font-medium transition active:scale-95"
                    >
                      Simulate {evt}
                    </button>
                  ))}
                </div>

                {webhookResult && (
                  <div
                    role="status"
                    aria-live="polite"
                    className="nexus-fade-in rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-mono">
                      <span className="font-bold text-emerald-900">
                        Signature Verification: {webhookResult.verification_status}
                      </span>
                      <span className="text-slate-600">
                        Event ID: {webhookResult.eventId}
                      </span>
                    </div>
                    <p className="text-slate-700 text-xs">
                      Deduplicated &amp; logged to Webhook Event Ledger (Mode:{" "}
                      <strong className="text-slate-900">{webhookResult.mode.toUpperCase()}</strong>).
                    </p>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition-all space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-xs font-semibold text-indigo-800">
                      <KeyRound className="h-3.5 w-3.5 text-indigo-600" />
                      Sponsor: APIMatic SDK + Credential-First Live Gateway
                    </span>
                    <h3 className="mt-1 text-base font-bold text-slate-900">
                      APIMatic Architecture &amp; Slot 013 Live Sandbox
                    </h3>
                  </div>
                </div>

                <ul className="space-y-2 text-xs text-slate-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-slate-900">APIMatic Strongly-Typed SDK:</strong> Powered by <code className="text-indigo-700 font-mono text-[11px]">@paypal/paypal-server-sdk v2.5.0</code> with automatic OAuth2 token caching and idempotency headers.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-slate-900">Credential-First Execution:</strong> Boots live against Slot 013 PayPal Sandbox REST &amp; JS SDK v6, retaining deterministic Mirror mode for offline unit tests.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-slate-900">Cloud Blueprint:</strong> Production <code className="text-indigo-700 font-mono text-[11px]">render.yaml</code> blueprint with autonomous hourly background sweeps.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MINIMALIST ARCHITECTURAL FOOTER */}
      <NexusFooter
        activeMode={activeMode}
        databaseSource={databaseSource}
        onSelectTab={navigateTo}
      />

      {/* NEXUSPULSE AI ASSISTANT */}
      <NexusAiChatbot
        appState={appState}
        onSelectTab={navigateTo}
      />

      {/* SYSTEM TASK NOTIFICATIONS TOAST */}
      <ToastNotificationContainer
        toasts={toasts}
        onDismiss={dismissToast}
      />

      {/* MULTI-TENANT AUTH & EVALUATOR DEMO MODAL */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        currentUser={currentUser}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
      />
    </div>
  );
}
