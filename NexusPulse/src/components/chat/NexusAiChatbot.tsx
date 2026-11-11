"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Maximize2,
  Minimize2,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import type { WorkspaceTabId } from "@/components/layout/NexusHeader";
import type { NexusPulseState } from "@/lib/paypal/paypal-sandbox-mirror";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  keySource?: "personal_byok" | "platform_default";
  isError?: boolean;
  retryText?: string;
  timestamp: string;
}

interface NexusAiChatbotProps {
  appState: NexusPulseState | null;
  onSelectTab: (tab: WorkspaceTabId, sectionId?: string) => void;
}

const BYOK_STORAGE_KEY = "nexuspulse_user_groq_api_key";

const DEFAULT_SUGGESTIONS = [
  "What is NexusPulse and how do the 3 engines work?",
  "What is my current wallet balance & total savings?",
  "How does Engine 1 find deals on Channel3?",
  "How do I claim a Proof-of-Human bounty in Engine 2?",
  "Explain Engine 3 Smart Escrow & Dispute Shield",
  "List all PayPal REST APIs and SDKs integrated",
];

function createWelcomeMessage(): Message {
  return {
    id: "welcome",
    role: "assistant",
    content: `Hello! I am the **NexusPulse AI Assistant**, your intelligent guide for the **NexusPulse Autonomous Financial Clearinghouse**.

I have real-time visibility into your workspace telemetry and can help you:
- **Monitor & Execute Deals**: Explore **Engine 1 (Channel3 Deal Hunter)** and create custom price mandates ([Open Engine 1](/?tab=channel3#engine-channel3)).
- **Claim Oracle Bounties**: Submit verification evidence in **Engine 2 (Proof-of-Human Bounties)** for instant PayPal Payouts ([Open Engine 2](/?tab=bounties#engine-bounties)).
- **Manage Smart Escrow**: Audit **PayPal Orders v2 \`AUTHORIZE\`** holds and subscriptions on the **Bryntum Gantt Timeline** ([Open Engine 3](/?tab=bryntum#engine-bryntum)).
- **Inspect Financial Telemetry**: Search transactions, invoices, and webhooks in the **AG Grid Command Center** ([Open AG Grid Ledger](/?tab=aggrid#aggrid-heading)).

How can I assist you today?`,
    keySource: "platform_default",
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };
}

export default function NexusAiChatbot({
  appState,
  onSelectTab,
}: NexusAiChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([createWelcomeMessage()]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Bring Your Own Groq API Key (BYOK) state
  const [showKeySettings, setShowKeySettings] = useState(false);
  const [savedApiKey, setSavedApiKey] = useState<string>("");
  const [keyInput, setKeyInput] = useState<string>("");
  const [showKeyText, setShowKeyText] = useState(false);
  const [validatingKey, setValidatingKey] = useState(false);
  const [keyStatusMessage, setKeyStatusMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load saved BYOK key from browser storage on mount
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(BYOK_STORAGE_KEY);
      if (stored && stored.startsWith("gsk_")) {
        setSavedApiKey(stored);
        setKeyInput(stored);
      }
    } catch {
      // Ignore storage access errors in restricted environments
    }
  }, []);

  useEffect(() => {
    if (isOpen && !showKeySettings) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, showKeySettings]);

  function maskApiKey(key: string): string {
    if (!key || key.length < 12) return "••••••••";
    return `${key.slice(0, 7)}••••••••••••${key.slice(-4)}`;
  }

  async function handleSaveAndValidateKey(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = keyInput.trim();
    if (!trimmed) {
      setKeyStatusMessage({
        type: "error",
        text: "Please enter a Groq API key (starts with gsk_...) before saving.",
      });
      return;
    }

    setValidatingKey(true);
    setKeyStatusMessage(null);

    try {
      const res = await fetch("/api/ai/chatbot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-groq-api-key": trimmed,
        },
        body: JSON.stringify({
          action: "VALIDATE_KEY",
        }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        try {
          window.localStorage.setItem(BYOK_STORAGE_KEY, trimmed);
        } catch {
          // Ignore storage error
        }
        setSavedApiKey(trimmed);
        setKeyStatusMessage({
          type: "success",
          text:
            data.message ||
            "Personal Groq API key verified and connected. Your chatbot requests now use your personal credentials.",
        });
      } else {
        setKeyStatusMessage({
          type: "error",
          text:
            data.error ||
            "Key validation failed. Please check that your Groq API key is valid and active.",
        });
      }
    } catch {
      setKeyStatusMessage({
        type: "error",
        text: "Network error while verifying the API key. Please try again.",
      });
    } finally {
      setValidatingKey(false);
    }
  }

  function handleRemoveApiKey() {
    try {
      window.localStorage.removeItem(BYOK_STORAGE_KEY);
    } catch {
      // Ignore storage error
    }
    setSavedApiKey("");
    setKeyInput("");
    setShowKeyText(false);
    setKeyStatusMessage({
      type: "info",
      text: "Personal API key removed. Reverted to NexusPulse's default platform AI configuration.",
    });
  }

  async function handleSendMessage(textToSend?: string) {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputValue("");
    setIsLoading(true);

    try {
      const historyPayload = newMessages.slice(-8).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (savedApiKey) {
        headers["x-groq-api-key"] = savedApiKey;
      }

      const res = await fetch("/api/ai/chatbot", {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "CHAT",
          message: text,
          history: historyPayload,
          stateContext: appState,
        }),
      });

      const data = await res.json();
      if (res.ok && data.reply) {
        const assistantMsg: Message = {
          id: `bot-${Date.now()}`,
          role: "assistant",
          content: data.reply,
          keySource: data.keySource ?? (savedApiKey ? "personal_byok" : "platform_default"),
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        if (data.byokError) {
          setKeyStatusMessage({
            type: "error",
            text: data.error,
          });
        }
        throw new Error(data.error || "Unable to complete your request right now.");
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Network connection error";
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: `**Request Notice**: ${errMsg}`,
        isError: true,
        retryText: text,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleClearChat() {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: "assistant",
        content: `Conversation history cleared. How can I assist you with **NexusPulse**, our three financial engines, or your live PayPal telemetry?`,
        keySource: savedApiKey ? "personal_byok" : "platform_default",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  }

  function handleCopyMessage(id: string, content: string) {
    const clean = content.replace(/\[ACTION:NAVIGATE:[a-zA-Z0-9_-]+\]/g, "").trim();
    navigator.clipboard?.writeText(clean).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  }

  /**
   * Internal link navigation handler:
   * Resolves URLs like `/?tab=channel3#engine-channel3` or `/#deal-hunter`
   * to switch tabs immediately and scroll smoothly to the target section.
   */
  function handleInternalNavigation(href: string) {
    try {
      const url = new URL(href, window.location.origin);
      const tabParam = url.searchParams.get("tab") as WorkspaceTabId | null;
      const hash = url.hash.replace(/^#/, "");

      const hashToTab: Record<string, WorkspaceTabId> = {
        "deal-hunter": "channel3",
        "engine-channel3": "channel3",
        "engine-1-heading": "channel3",
        "human-bounties": "bounties",
        "engine-bounties": "bounties",
        "engine-2-heading": "bounties",
        "escrow-gantt": "bryntum",
        "engine-bryntum": "bryntum",
        telemetry: "aggrid",
        "aggrid-heading": "aggrid",
        "webhooks-security": "aggrid",
        "main-workspace": "overview",
        "gemini-console-heading": "overview",
        "kpi-telemetry-ribbon": "overview",
      };

      const targetTab: WorkspaceTabId =
        tabParam && ["overview", "channel3", "bounties", "bryntum", "aggrid"].includes(tabParam)
          ? tabParam
          : hashToTab[hash] ?? "overview";

      onSelectTab(targetTab, hash || undefined);
      if (!isExpanded) {
        setIsOpen(false);
      }
    } catch {
      onSelectTab("overview");
    }
  }

  function renderFormattedContent(text: string) {
    const actionRegex = /\[ACTION:NAVIGATE:([a-zA-Z0-9_-]+)\]/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = actionRegex.exec(text)) !== null) {
      const preText = text.slice(lastIndex, match.index);
      if (preText) {
        parts.push(
          <React.Fragment key={`md-${lastIndex}`}>
            {renderRichMarkdown(preText)}
          </React.Fragment>
        );
      }

      const targetTab = match[1] as WorkspaceTabId;
      const labelMap: Record<string, string> = {
        channel3: "Open Engine 1: Deal Hunter",
        bounties: "Open Engine 2: Human Bounties",
        bryntum: "Open Engine 3: Escrow Gantt",
        aggrid: "Open AG Grid Telemetry",
        overview: "View Clearinghouse Overview",
      };

      parts.push(
        <div key={`action-${match.index}`} className="pt-1.5">
          <button
            type="button"
            onClick={() => {
              onSelectTab(targetTab);
              if (!isExpanded) setIsOpen(false);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition hover:scale-105 active:scale-95"
          >
            <span>{labelMap[targetTab] || `Navigate to ${targetTab}`}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      );

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(
        <React.Fragment key={`md-end-${lastIndex}`}>
          {renderRichMarkdown(text.slice(lastIndex))}
        </React.Fragment>
      );
    }

    return parts;
  }

  function renderRichMarkdown(content: string) {
    const lines = content.split("\n");
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // 1. Fenced code block ```
      if (line.trim().startsWith("```")) {
        const codeLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].trim().startsWith("```")) {
          codeLines.push(lines[i]);
          i++;
        }
        i++; // skip closing ```
        elements.push(
          <pre
            key={`code-${i}`}
            className="my-2 overflow-x-auto rounded-lg bg-slate-900 p-2.5 font-mono text-[11px] text-slate-100"
          >
            <code>{codeLines.join("\n")}</code>
          </pre>
        );
        continue;
      }

      // 2. Markdown Table (| ... |)
      if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
        const tableLines: string[] = [];
        while (
          i < lines.length &&
          lines[i].trim().startsWith("|") &&
          lines[i].trim().endsWith("|")
        ) {
          tableLines.push(lines[i].trim());
          i++;
        }
        if (tableLines.length >= 2) {
          const parseRow = (r: string) =>
            r
              .slice(1, -1)
              .split("|")
              .map((c) => c.trim());
          const headerCells = parseRow(tableLines[0]);
          const bodyRows = tableLines
            .slice(1)
            .filter((r) => !/^\|[\s:|-]+\|$/.test(r))
            .map(parseRow);

          elements.push(
            <div
              key={`table-${i}`}
              className="my-2 overflow-x-auto rounded-lg border border-slate-200 bg-white"
            >
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-800">
                    {headerCells.map((h, hIdx) => (
                      <th key={hIdx} className="px-2.5 py-1.5 font-bold whitespace-nowrap">
                        {renderInlineStyles(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bodyRows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-50/80">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="px-2.5 py-1.5 text-slate-700 align-top">
                          {renderInlineStyles(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
          continue;
        }
      }

      if (!line.trim()) {
        elements.push(<div key={`sp-${i}`} className="h-1" />);
        i++;
        continue;
      }

      if (line.startsWith("### ")) {
        elements.push(
          <h4 key={`h4-${i}`} className="text-xs font-extrabold text-slate-950 mt-2">
            {renderInlineStyles(line.replace("### ", ""))}
          </h4>
        );
        i++;
        continue;
      }

      if (line.startsWith("## ")) {
        elements.push(
          <h3 key={`h3-${i}`} className="text-sm font-extrabold text-slate-950 mt-2.5">
            {renderInlineStyles(line.replace("## ", ""))}
          </h3>
        );
        i++;
        continue;
      }

      if (line.startsWith("> ")) {
        elements.push(
          <blockquote
            key={`bq-${i}`}
            className="border-l-2 border-sky-500 bg-sky-50/60 pl-2.5 py-1 text-[11px] text-slate-700 rounded-r"
          >
            {renderInlineStyles(line.slice(2))}
          </blockquote>
        );
        i++;
        continue;
      }

      if (line.startsWith("- ") || line.startsWith("* ")) {
        elements.push(
          <div key={`ul-${i}`} className="flex items-start gap-1.5 pl-1">
            <span className="text-sky-600 font-bold shrink-0">•</span>
            <span>{renderInlineStyles(line.slice(2))}</span>
          </div>
        );
        i++;
        continue;
      }

      if (/^\d+\.\s/.test(line)) {
        const numMatch = line.match(/^(\d+\.)\s(.*)/);
        if (numMatch) {
          elements.push(
            <div key={`ol-${i}`} className="flex items-start gap-1.5 pl-1">
              <span className="text-slate-900 font-bold shrink-0">{numMatch[1]}</span>
              <span>{renderInlineStyles(numMatch[2])}</span>
            </div>
          );
          i++;
          continue;
        }
      }

      elements.push(<p key={`p-${i}`}>{renderInlineStyles(line)}</p>);
      i++;
    }

    return <div className="space-y-1.5 leading-relaxed text-xs">{elements}</div>;
  }

  function renderInlineStyles(text: string) {
    // Tokenize Markdown links [label](url), bold **text**, and inline code `code`
    const tokenRegex = /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|`[^`]+`)/g;
    const parts = text.split(tokenRegex);

    return parts.map((part, i) => {
      const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        const label = linkMatch[1];
        const href = linkMatch[2];
        const isInternal = href.startsWith("/") || href.startsWith("#");

        if (isInternal) {
          return (
            <a
              key={i}
              href={href}
              onClick={(e) => {
                e.preventDefault();
                handleInternalNavigation(href);
              }}
              className="inline-flex items-center gap-0.5 font-bold text-sky-700 hover:text-sky-900 underline decoration-sky-400 underline-offset-2 transition"
            >
              <span>{label}</span>
              <ArrowRight className="h-3 w-3 inline" />
            </a>
          );
        }

        return (
          <a
            key={i}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 font-bold text-sky-700 hover:text-sky-900 underline decoration-sky-400 underline-offset-2"
          >
            <span>{label}</span>
            <ExternalLink className="h-2.5 w-2.5 inline" />
          </a>
        );
      }

      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-bold text-slate-950">
            {part.slice(2, -2)}
          </strong>
        );
      }

      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={i}
            className="rounded bg-slate-100 border border-slate-200 px-1 py-0.5 font-mono text-[11px] text-indigo-700 font-semibold"
          >
            {part.slice(1, -1)}
          </code>
        );
      }

      return part;
    });
  }

  return (
    <>
      {/* Floating Trigger Button (Bottom Right) */}
      <aside aria-label="NexusPulse AI Assistant Trigger">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`fixed bottom-5 right-5 z-50 inline-flex items-center gap-2.5 rounded-full p-2.5 sm:px-4 sm:py-2.5 shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 ${
            isOpen
              ? "bg-slate-900 text-white ring-2 ring-sky-400"
              : "bg-slate-950 text-white hover:bg-slate-800 border border-slate-700"
          }`}
          title="Open NexusPulse AI Assistant"
          aria-expanded={isOpen}
          aria-haspopup="dialog"
        >
          <div className="relative flex items-center justify-center">
            <span className="absolute -inset-1 rounded-full bg-sky-500 opacity-60 animate-ping" />
            <div className="relative h-6 w-6 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-bold leading-tight">NexusPulse AI</span>
            <span className="text-[10px] text-sky-300 leading-tight flex items-center gap-1 font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {savedApiKey ? "Personal Key Active" : "Intelligent Assistant"}
            </span>
          </div>
        </button>
      </aside>

      {/* Slide-over / Modal Chatbot Panel */}
      {isOpen && (
        <section
          role="dialog"
          aria-label="NexusPulse AI Assistant Window"
          aria-modal="true"
          className={`fixed z-50 flex flex-col rounded-2xl border border-slate-200 bg-white/98 shadow-2xl backdrop-blur-2xl transition-all duration-300 animate-cascade-1 ${
            isExpanded
              ? "inset-4 sm:inset-8"
              : "bottom-20 right-4 sm:right-6 w-[94vw] sm:w-[480px] h-[610px] max-h-[85vh]"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50/90 rounded-t-2xl">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-xs">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-extrabold text-slate-950">
                    NexusPulse AI Assistant
                  </h3>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 text-[10px] font-bold text-emerald-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Online
                  </span>
                </div>
                <p className="text-[10px] text-slate-600">
                  {savedApiKey
                    ? `Personal API Key Connected (${maskApiKey(savedApiKey)})`
                    : "Autonomous Financial Clearinghouse Assistant"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-500">
              <button
                type="button"
                onClick={() => setShowKeySettings((prev) => !prev)}
                title="Bring Your Own Groq API Key (BYOK) Settings"
                aria-expanded={showKeySettings}
                className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold transition ${
                  showKeySettings
                    ? "bg-sky-600 text-white shadow-xs"
                    : savedApiKey
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                <KeyRound className="h-3 w-3" />
                <span>{savedApiKey ? "Key Active" : "API Key"}</span>
              </button>
              <button
                type="button"
                onClick={handleClearChat}
                title="Clear conversation"
                className="rounded-lg p-1.5 hover:bg-slate-200/60 hover:text-slate-800 transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsExpanded((prev) => !prev)}
                title={isExpanded ? "Restore size" : "Maximize"}
                className="hidden sm:inline-flex rounded-lg p-1.5 hover:bg-slate-200/60 hover:text-slate-800 transition"
              >
                {isExpanded ? (
                  <Minimize2 className="h-3.5 w-3.5" />
                ) : (
                  <Maximize2 className="h-3.5 w-3.5" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close chat"
                className="rounded-lg p-1.5 hover:bg-slate-200/60 hover:text-slate-800 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Bring Your Own Groq API Key (BYOK) Configuration Panel */}
          {showKeySettings && (
            <div className="border-b border-slate-200 bg-slate-50/95 p-4 space-y-3 animate-cascade-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-sky-600" />
                    <h4 className="text-xs font-extrabold text-slate-950">
                      Connect Your Own Groq API Key (BYOK)
                    </h4>
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-600 leading-relaxed">
                    Optionally connect your personal Groq API key to run assistant queries through your own account. If left empty, NexusPulse automatically uses its default platform AI configuration.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowKeySettings(false)}
                  className="rounded-md p-1 text-slate-400 hover:text-slate-700"
                  title="Close API Key Settings"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px]">
                <span className="font-semibold text-slate-700">Connection Status:</span>
                {savedApiKey ? (
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Personal API Key Active ({maskApiKey(savedApiKey)})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-semibold text-sky-700">
                    <Sparkles className="h-3 w-3" />
                    Using Default Platform AI
                  </span>
                )}
              </div>

              <form onSubmit={handleSaveAndValidateKey} className="space-y-2">
                <label
                  htmlFor="byok-groq-key-input"
                  className="block text-[11px] font-bold text-slate-800"
                >
                  Personal Groq API Key
                </label>
                <div className="relative flex items-center">
                  <input
                    id="byok-groq-key-input"
                    type={showKeyText ? "text" : "password"}
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder="gsk_••••••••••••••••••••••••••••••••••••••••"
                    autoComplete="off"
                    spellCheck={false}
                    className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-9 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKeyText((prev) => !prev)}
                    title={showKeyText ? "Hide API Key" : "Show API Key"}
                    className="absolute right-2.5 text-slate-400 hover:text-slate-700"
                  >
                    {showKeyText ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={validatingKey || !keyInput.trim()}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 disabled:bg-slate-300 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>
                      {validatingKey
                        ? "Validating Key..."
                        : savedApiKey
                        ? "Update & Verify Key"
                        : "Save & Verify Key"}
                    </span>
                  </button>

                  {savedApiKey && (
                    <button
                      type="button"
                      onClick={handleRemoveApiKey}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 text-xs font-bold text-rose-800 transition"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Remove Key</span>
                    </button>
                  )}
                </div>
              </form>

              {keyStatusMessage && (
                <div
                  role="status"
                  className={`flex items-start gap-2 rounded-lg border p-2.5 text-[11px] leading-relaxed ${
                    keyStatusMessage.type === "success"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                      : keyStatusMessage.type === "error"
                      ? "border-rose-200 bg-rose-50 text-rose-900"
                      : "border-sky-200 bg-sky-50 text-sky-900"
                  }`}
                >
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>{keyStatusMessage.text}</span>
                </div>
              )}

              <p className="text-[10px] text-slate-500 leading-normal">
                <strong>Account &amp; Rate Limit Notice:</strong> Using a personal API key routes requests through your own Groq account and is subject to your account&apos;s applicable usage limits, pricing, and rate policies. Your key is stored locally in your browser and transmitted securely over HTTPS headers.
              </p>
            </div>
          )}

          {/* Quick Suggestion Pills */}
          <div className="border-b border-slate-100 bg-white/80 px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[11px]">
            <span className="text-slate-500 font-semibold uppercase text-[10px] shrink-0 mr-1">
              Ask:
            </span>
            {DEFAULT_SUGGESTIONS.map((sug, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSendMessage(sug)}
                disabled={isLoading}
                className="shrink-0 rounded-full border border-slate-200 bg-slate-50 hover:bg-sky-50 hover:border-sky-300 px-2.5 py-0.5 text-slate-700 hover:text-sky-900 transition whitespace-nowrap shadow-2xs"
              >
                {sug}
              </button>
            ))}
          </div>

          {/* Chat Message Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {messages.map((m) => {
              const isUser = m.role === "user";
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[90%] rounded-2xl p-3.5 shadow-xs ${
                      isUser
                        ? "bg-slate-950 text-white rounded-br-xs text-xs"
                        : m.isError
                        ? "bg-rose-50/90 border border-rose-200 text-rose-950 rounded-bl-xs"
                        : "bg-slate-50 border border-slate-200 text-slate-800 rounded-bl-xs"
                    }`}
                  >
                    {!isUser && (
                      <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-200/70 text-[10px] font-mono text-slate-500">
                        <span className="font-bold text-sky-800 flex items-center gap-1">
                          <Bot className="h-3 w-3 text-sky-600" />
                          NexusPulse AI Assistant
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="rounded bg-white px-1.5 py-0.2 border border-slate-200 text-slate-600 font-sans font-semibold">
                            {m.keySource === "personal_byok"
                              ? "Personal Key"
                              : "Verified Context"}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyMessage(m.id, m.content)}
                            title="Copy response"
                            className="rounded p-0.5 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition"
                          >
                            {copiedId === m.id ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    <div>
                      {isUser ? m.content : renderFormattedContent(m.content)}
                    </div>

                    {m.isError && m.retryText && (
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSendMessage(m.retryText)}
                          className="inline-flex items-center gap-1 rounded-md bg-slate-900 hover:bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-white"
                        >
                          <RefreshCw className="h-3 w-3" />
                          <span>Retry Question</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowKeySettings(true)}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white hover:bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-800"
                        >
                          <KeyRound className="h-3 w-3" />
                          <span>API Key Settings</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <span className="mt-1 text-[9px] text-slate-400 px-1 font-mono">
                    {m.timestamp}
                  </span>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-start gap-2">
                <div className="rounded-2xl rounded-bl-xs bg-slate-50 border border-slate-200 p-3 shadow-xs">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="h-2 w-2 rounded-full bg-sky-500 animate-ping" />
                    <span className="font-semibold text-slate-800">
                      NexusPulse AI Assistant is analyzing...
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="border-t border-slate-100 p-3 bg-white rounded-b-2xl"
          >
            <div className="relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isLoading}
                placeholder="Ask anything about NexusPulse, deals, bounties, escrow, or APIs..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-3.5 pr-11 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-sky-500 shadow-xs focus:outline-none"
              />
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                aria-label="Send message"
                className="absolute right-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 disabled:bg-slate-300 p-1.5 text-white transition disabled:cursor-not-allowed shadow-xs"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500 px-1">
              <span>Press Enter to send • Click links to jump to sections</span>
              <button
                type="button"
                onClick={() => setShowKeySettings((prev) => !prev)}
                className="font-mono text-sky-700 hover:underline"
              >
                {savedApiKey ? "BYOK: Personal Key" : "BYOK: Configure Key"}
              </button>
            </div>
          </form>
        </section>
      )}
    </>
  );
}
