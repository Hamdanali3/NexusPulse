"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Lock,
  RotateCcw,
  ShoppingBag,
  UserCheck,
} from "lucide-react";
import type { NexusPulseState } from "@/lib/paypal/paypal-sandbox-mirror";
import type {
  PayPalExecutionMode,
  PayPalLiveTelemetry,
  PayPalSandboxAccountConfig,
} from "@/lib/paypal/paypal-types";
import { formatSignedUsd, formatUsd } from "@/lib/format";
import { type UserProfile } from "@/lib/auth/auth-types";
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
import ToastNotificationContainer, {
  type ToastMessage,
  type ToastType,
} from "@/components/common/ToastNotification";
import { StatusDot, WorkspaceSkeleton } from "@/components/ui";

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
    return <WorkspaceSkeleton />;
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
        className="flex-1 mx-auto w-full max-w-[1200px] px-4 sm:px-6 pt-8 pb-8 space-y-16"
      >
        {/* FEATURE PAGE HEADER (shown when a specific tool tab is selected) */}
        {activeTab !== "overview" && (
          <FeaturePageHeader tab={activeTab} onNavigate={navigateTo} />
        )}

        {/* MOBILE / TABLET WORKSPACE NAVIGATION (clean quick switch when inside tools) */}
        <div
          role="tablist"
          aria-label="Workspace navigation"
          className="flex lg:hidden flex-wrap items-center justify-between gap-2 border-b border-zinc-200 pb-3"
        >
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "overview"}
              onClick={() => navigateTo("overview")}
              className={`inline-flex h-8 items-center gap-1.5 rounded-[6px] px-3 text-[13px] font-medium transition-colors ${
                activeTab === "overview"
                  ? "bg-zinc-950 text-white"
                  : "bg-white text-zinc-700 hover:bg-zinc-50 border border-zinc-200"
              }`}
            >
              <span>Overview</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab !== "overview"}
              onClick={() => {
                if (activeTab === "overview") navigateTo("channel3");
              }}
              className={`inline-flex h-8 items-center gap-1.5 rounded-[6px] px-3 text-[13px] font-medium transition-colors ${
                activeTab !== "overview"
                  ? "bg-zinc-950 text-white"
                  : "bg-white text-zinc-700 hover:bg-zinc-50 border border-zinc-200"
              }`}
            >
              <span>Tools</span>
            </button>

            <Link
              href="/about"
              className="inline-flex h-8 items-center rounded-[6px] px-3 text-[13px] font-medium bg-white text-zinc-700 hover:bg-zinc-50 border border-zinc-200"
            >
              About
            </Link>

            <Link
              href="/contact"
              className="inline-flex h-8 items-center rounded-[6px] px-3 text-[13px] font-medium bg-white text-zinc-700 hover:bg-zinc-50 border border-zinc-200"
            >
              Contact
            </Link>
          </div>

          {activeTab !== "overview" && (
            <div className="flex flex-wrap items-center gap-1 text-[12px] font-medium bg-zinc-100 p-1 rounded-[6px]">
              {[
                { id: "channel3", label: "Price watch" },
                { id: "bounties", label: "Tasks" },
                { id: "bryntum", label: "Escrow" },
                { id: "aggrid", label: "Ledger" },
              ].map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => navigateTo(sub.id as WorkspaceTabId)}
                  className={`px-2 py-1 rounded-[4px] font-medium transition-colors ${
                    activeTab === sub.id
                      ? "bg-white text-zinc-950"
                      : "text-zinc-600 hover:text-zinc-950"
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* OVERVIEW: HEADLINE -> PROOF UI -> 3-COLUMN CAPABILITIES -> BUILT WITH */}
        {activeTab === "overview" && (
          <>
            {/* 1. Calm Hero */}
            <section
              aria-labelledby="product-hero-heading"
              className="pt-4 sm:pt-8 max-w-2xl"
            >
              <h1
                id="product-hero-heading"
                className="np-h1"
              >
                Spend smarter. Pay people fairly. Release money when work is done.
              </h1>

              <p className="mt-4 text-[16px] text-zinc-600 leading-[1.55] max-w-xl">
                Find savings in your subscriptions, track prices on things you want, and hold payments until the work is verified. Built on PayPal.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-5">
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById("spending-review-panel");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                    const input = document.getElementById("gemini-agent-prompt-input") as HTMLInputElement | null;
                    if (input) input.focus({ preventScroll: true });
                  }}
                  className="inline-flex h-10 items-center gap-2 rounded-[6px] bg-zinc-950 hover:bg-zinc-800 px-4 text-[13px] font-medium text-white transition-colors"
                >
                  <span>Try the demo</span>
                  <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
                </button>

                <Link
                  href="/about"
                  className="inline-flex items-center gap-1 text-[13px] font-medium text-zinc-700 hover:text-indigo-600 transition-colors"
                >
                  <span>How it works</span>
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                </Link>
              </div>
            </section>

            {/* 2. Proof: Single Focused Spending Review Workspace + 4 Clean KPI Numbers */}
            <section
              id="spending-review-panel"
              aria-labelledby="gemini-console-heading"
              className="rounded-[12px] border border-zinc-200 bg-white overflow-hidden"
            >
              {/* 4 KPI Numbers Max — no corner icons, tabular 28px/600 values */}
              <div
                id="kpi-telemetry-ribbon"
                aria-label="Key account numbers"
                className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-zinc-200 border-b border-zinc-200"
              >
                <button
                  type="button"
                  onClick={() => navigateTo("channel3")}
                  className="p-5 text-left hover:bg-zinc-50 transition-colors"
                >
                  <div className="text-[13px] font-medium text-zinc-600">
                    Annual savings
                  </div>
                  <div className="mt-1.5 text-[28px] leading-tight font-semibold text-zinc-950 tabular-nums tracking-[-0.015em]">
                    {formatUsd(appState.totalSavedByAiUsd + annualSubSavings)}
                  </div>
                  <div className="mt-1 text-[12px] font-medium text-emerald-700 tabular-nums">
                    +{formatUsd(appState.totalSavedByAiUsd)} realized
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => navigateTo("bounties")}
                  className="p-5 text-left hover:bg-zinc-50 transition-colors"
                >
                  <div className="text-[13px] font-medium text-zinc-600">
                    Verified payouts
                  </div>
                  <div className="mt-1.5 text-[28px] leading-tight font-semibold text-zinc-950 tabular-nums tracking-[-0.015em]">
                    {formatUsd(appState.totalEarnedFromBountiesUsd)}
                  </div>
                  <div className="mt-1 text-[12px] text-zinc-600">
                    Sent to contributors
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => navigateTo("bryntum")}
                  className="p-5 text-left hover:bg-zinc-50 transition-colors"
                >
                  <div className="text-[13px] font-medium text-zinc-600">
                    Held in escrow
                  </div>
                  <div className="mt-1.5 text-[28px] leading-tight font-semibold text-zinc-950 tabular-nums tracking-[-0.015em]">
                    {formatUsd(appState.totalEscrowProtectedUsd)}
                  </div>
                  <div className="mt-1 text-[12px] text-zinc-600">
                    Released on delivery proof
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => navigateTo("aggrid")}
                  className="p-5 text-left hover:bg-zinc-50 transition-colors"
                >
                  <div className="text-[13px] font-medium text-zinc-600">
                    {appState.walletBalanceUsd < 0 ? "Net balance" : "Wallet balance"}
                  </div>
                  <div
                    className={`mt-1.5 text-[28px] leading-tight font-semibold tabular-nums tracking-[-0.015em] ${
                      appState.walletBalanceUsd < 0 ? "text-red-700" : "text-zinc-950"
                    }`}
                  >
                    {formatUsd(appState.walletBalanceUsd)}
                  </div>
                  <div className="mt-1 text-[12px] text-zinc-600">
                    Current ledger total
                  </div>
                </button>
              </div>

              {/* Spending Review Prompt */}
              <div className="p-5 sm:p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 id="gemini-console-heading" className="text-[15px] font-semibold text-zinc-950">
                      Spending review
                    </h2>
                    <p className="text-[13px] text-zinc-600 mt-0.5">
                      Ask for a subscription check, target-price recommendation, or escrow summary.
                    </p>
                  </div>

                  {agentResponse && (
                    <button
                      type="button"
                      onClick={() => {
                        setAgentResponse(null);
                        setTurnCount(0);
                      }}
                      className="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-zinc-200 bg-white hover:bg-zinc-50 px-2.5 text-[12px] font-medium text-zinc-700 transition-colors"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Clear</span>
                    </button>
                  )}
                </div>

                <form
                  onSubmit={(e) => handleRunAgentInteraction(undefined, e)}
                  className="space-y-3"
                >
                  <div className="flex flex-col sm:flex-row gap-2">
                    <label htmlFor="gemini-agent-prompt-input" className="visually-hidden">
                      Ask what to review in your spending
                    </label>
                    <input
                      id="gemini-agent-prompt-input"
                      type="text"
                      value={agentPrompt}
                      onChange={(e) => setAgentPrompt(e.target.value)}
                      className="flex-1 h-10 rounded-[6px] border border-zinc-200 bg-white px-3 text-[14px] text-zinc-950 placeholder:text-zinc-500 focus:border-indigo-600"
                      placeholder="Review unused subscriptions, price targets, or escrow holds..."
                    />
                    <button
                      type="submit"
                      disabled={agentRunning}
                      className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[6px] bg-zinc-950 hover:bg-zinc-800 px-4 text-[13px] font-medium text-white transition-colors shrink-0 disabled:opacity-50"
                    >
                      <span>{agentRunning ? "Reviewing..." : "Review my spending"}</span>
                      <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-[12px]">
                    <span className="text-zinc-600 mr-1">Prompts:</span>
                    {[
                      {
                        label: "Check subscriptions",
                        prompt: "Optimize my unused PayPal subscription and downgrade idle GPU plan to save money",
                      },
                      {
                        label: "Review price watch",
                        prompt: "Buy the NVIDIA Jetson Orin Nano deal on Channel3 via PayPal Order v2",
                      },
                      {
                        label: "List open tasks",
                        prompt: "Rank open Proof-of-Human Oracle bounties by PayPal Payout reward",
                      },
                      {
                        label: "Inspect escrow holds",
                        prompt: "Audit escrow milestones and delivery verification status",
                      },
                    ].map((chip) => (
                      <button
                        key={chip.label}
                        type="button"
                        onClick={() => handleRunAgentInteraction(chip.prompt)}
                        className="rounded-[6px] border border-zinc-200 bg-[#fafafa] hover:bg-zinc-100 px-2.5 py-1 text-[12px] text-zinc-700 hover:text-zinc-950 transition-colors font-medium"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </form>

                {agentResponse && (
                  <CfoExecutiveDocumentOutput
                    response={agentResponse}
                    onNavigate={navigateTo}
                  />
                )}
              </div>
            </section>

            {/* 3. Three Capabilities in a Plain 3-Column List (no nested card boxes) */}
            <section
              id="autonomous-engines-hub"
              aria-labelledby="capabilities-heading"
              className="space-y-6"
            >
              <div className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-200 pb-4">
                <div>
                  <h2 id="capabilities-heading" className="np-h2">
                    What you can do
                  </h2>
                  <p className="mt-1 text-[15px] text-zinc-600">
                    Open a tool directly to monitor prices, pay contributors, or manage milestone holds.
                  </p>
                </div>

                {!currentUser && (
                  <button
                    type="button"
                    onClick={() => setAuthModalOpen(true)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-[6px] border border-zinc-200 bg-white hover:bg-zinc-50 px-3.5 text-[13px] font-medium text-zinc-900 transition-colors"
                  >
                    <span>Sign in to continue</span>
                    <ArrowRight className="h-3.5 w-3.5 text-zinc-600" strokeWidth={1.5} />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Price watch */}
                <div id="engine-channel3" className="flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-[15px] font-semibold text-zinc-950">
                      <ShoppingBag className="h-4 w-4 text-zinc-700" strokeWidth={1.5} />
                      <span>Price watch</span>
                    </div>
                    <p className="text-[14px] text-zinc-600 leading-relaxed">
                      Set your maximum price on hardware and complete checkout with PayPal only once it drops.
                    </p>
                    <ul className="divide-y divide-zinc-200 border-t border-zinc-200 pt-1">
                      {appState.channel3Deals.slice(0, 2).map((deal) => (
                        <li key={deal.id} className="py-2.5 flex items-baseline justify-between gap-3 text-[13px]">
                          <span title={deal.title} className="text-zinc-900 line-clamp-2 min-w-0">
                            {deal.title}
                          </span>
                          <span className="tabular-nums font-medium text-emerald-700 shrink-0">
                            {formatUsd(deal.channel3_best_price)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!currentUser) setAuthModalOpen(true);
                        else navigateTo("channel3");
                      }}
                      className="inline-flex items-center gap-1.5 text-[13px] font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      <span>Open price watch</span>
                      <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>

                {/* Verified tasks */}
                <div id="engine-bounties" className="flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-[15px] font-semibold text-zinc-950">
                      <UserCheck className="h-4 w-4 text-zinc-700" strokeWidth={1.5} />
                      <span>Verified tasks</span>
                    </div>
                    <p className="text-[14px] text-zinc-600 leading-relaxed">
                      Post short inspection checks and send fast PayPal payouts once supporting evidence is verified.
                    </p>
                    <ul className="divide-y divide-zinc-200 border-t border-zinc-200 pt-1">
                      {appState.bounties.slice(0, 2).map((b) => (
                        <li key={b.id} className="py-2.5 flex items-baseline justify-between gap-3 text-[13px]">
                          <span title={b.title} className="text-zinc-900 line-clamp-2 min-w-0">
                            {b.title}
                          </span>
                          <span className="tabular-nums font-medium text-zinc-950 shrink-0">
                            {formatSignedUsd(b.reward.value)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!currentUser) setAuthModalOpen(true);
                        else navigateTo("bounties");
                      }}
                      className="inline-flex items-center gap-1.5 text-[13px] font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      <span>Open verified tasks</span>
                      <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>

                {/* Milestone escrow */}
                <div id="engine-bryntum" className="flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-[15px] font-semibold text-zinc-950">
                      <Lock className="h-4 w-4 text-zinc-700" strokeWidth={1.5} />
                      <span>Milestone escrow</span>
                    </div>
                    <p className="text-[14px] text-zinc-600 leading-relaxed">
                      Authorize project funds on a milestone schedule and capture payment once deliverables are confirmed.
                    </p>
                    <ul className="divide-y divide-zinc-200 border-t border-zinc-200 pt-1">
                      {appState.escrowMilestones.slice(0, 2).map((m) => (
                        <li key={m.id} className="py-2.5 flex items-baseline justify-between gap-3 text-[13px]">
                          <span title={m.project_name} className="text-zinc-900 line-clamp-2 min-w-0">
                            {m.project_name}
                          </span>
                          <span className="tabular-nums font-medium text-zinc-950 shrink-0">
                            {formatUsd(m.amount.value)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!currentUser) setAuthModalOpen(true);
                        else navigateTo("bryntum");
                      }}
                      className="inline-flex items-center gap-1.5 text-[13px] font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      <span>Open milestone escrow</span>
                      <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* 4. Quiet Built With Row */}
            <section aria-label="Built with" className="border-t border-zinc-200 pt-8">
              <div className="flex flex-wrap items-center justify-between gap-4 text-[13px] text-zinc-600">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                  <span className="text-zinc-600">Built with</span>
                  <span className="font-medium text-zinc-700">PayPal</span>
                  <span className="font-medium text-zinc-700">Google Gemini</span>
                  <span className="font-medium text-zinc-700">Supabase</span>
                  <span className="font-medium text-zinc-700">AG Grid</span>
                </div>
                <Link
                  href="/about"
                  className="text-[13px] font-medium text-zinc-700 hover:text-zinc-950 inline-flex items-center gap-1"
                >
                  <span>Architecture &amp; details</span>
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                </Link>
              </div>
            </section>
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

            {/* WEBHOOK TEST EVENTS (no sponsor/architecture blocks on the ledger page) */}
            <section
              id="webhooks-security"
              aria-labelledby="webhook-tester-heading"
              className="rounded-[12px] border border-zinc-200 bg-white p-5 space-y-4"
            >
              <div className="border-b border-zinc-200 pb-3">
                <h3 id="webhook-tester-heading" className="text-[15px] font-semibold text-zinc-950">
                  Webhook signature tests
                </h3>
                <p className="text-[13px] text-zinc-600 mt-0.5">
                  Send a signed test event to verify deduplication and ledger updates.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {[
                  { event: "PAYMENT.CAPTURE.COMPLETED", label: "Send test: payment captured" },
                  { event: "PAYMENT.PAYOUTS-ITEM.SUCCEEDED", label: "Send test: payout sent" },
                  { event: "CUSTOMER.DISPUTE.CREATED", label: "Send test: dispute opened" },
                  { event: "BILLING.SUBSCRIPTION.UPDATED", label: "Send test: plan updated" },
                ].map((item) => (
                  <button
                    key={item.event}
                    type="button"
                    disabled={webhookSimulating}
                    onClick={() => handleSimulateWebhook(item.event)}
                    className="rounded-[6px] border border-zinc-200 bg-white hover:bg-zinc-50 px-3 py-2 text-left transition-colors disabled:opacity-50"
                  >
                    <span className="block text-[13px] font-medium text-zinc-900">
                      {item.label}
                    </span>
                    <span className="block mt-0.5 font-mono text-[11px] text-zinc-600 truncate">
                      {item.event}
                    </span>
                  </button>
                ))}
              </div>

              {webhookResult && (
                <div
                  role="status"
                  aria-live="polite"
                  className="rounded-[6px] border border-zinc-200 bg-[#fafafa] px-4 py-3 text-[13px] space-y-1"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <StatusDot
                      label={`Verified (${webhookResult.verification_status})`}
                      tone="positive"
                    />
                    <span className="font-mono text-[12px] text-zinc-600">
                      {webhookResult.eventId}
                    </span>
                  </div>
                  <p className="text-[12px] text-zinc-600">
                    Event checked, deduplicated, and recorded in the ledger.
                  </p>
                </div>
              )}
            </section>
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
