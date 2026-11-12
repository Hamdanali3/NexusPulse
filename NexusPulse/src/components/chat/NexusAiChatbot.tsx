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
  "How does NexusPulse work?",
  "What is my current balance and savings?",
  "How do price watches and target alerts work?",
  "How do verified tasks and payouts work?",
  "How does milestone escrow protect payments?",
  "Where can I inspect my transaction ledger?",
];

function createWelcomeMessage(): Message {
  return {
    id: "welcome",
    role: "assistant",
    content: `I can help you review subscriptions, tracked prices, verified tasks, and escrow holds in your workspace.

- **Monitor prices**: Check tracked hardware items and create price targets ([Open Price watch](/?tab=channel3#engine-channel3)).
- **Review verified tasks**: Submit inspection proof and send payouts ([Open Verified tasks](/?tab=bounties#engine-bounties)).
- **Manage milestone escrow**: Review held authorizations and delivery tracking ([Open Milestone escrow](/?tab=bryntum#engine-bryntum)).
- **Inspect ledger**: Filter transactions, invoices, and webhook test events ([Open Ledger](/?tab=aggrid#aggrid-heading)).

Ask a question below or pick a prompt to get started.`,
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
        channel3: "Open Price watch",
        bounties: "Open Verified tasks",
        bryntum: "Open Milestone escrow",
        aggrid: "Open Ledger",
        overview: "Overview",
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
          className={`fixed bottom-5 right-5 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full shadow-[0_8px_24px_-4px_rgb(9_9_11/0.14),0_2px_6px_-1px_rgb(9_9_11/0.06)] transition-colors duration-150 ${
            isOpen
              ? "bg-zinc-900 text-white border border-zinc-800"
              : "bg-zinc-950 text-white hover:bg-zinc-800 border border-zinc-800"
          }`}
          title="Ask assistant"
          aria-label="Open assistant"
          aria-expanded={isOpen}
          aria-haspopup="dialog"
        >
          {isOpen ? (
            <X className="h-4 w-4" strokeWidth={1.5} />
          ) : (
            <Bot className="h-4 w-4" strokeWidth={1.5} />
          )}
        </button>
      </aside>

      {/* Slide-over / Modal Assistant Panel */}
      {isOpen && (
        <section
          role="dialog"
          aria-label="Assistant"
          aria-modal="true"
          className={`fixed z-50 flex flex-col rounded-[12px] border border-zinc-200 bg-white shadow-[0_8px_24px_-4px_rgb(9_9_11/0.12),0_2px_6px_-1px_rgb(9_9_11/0.06)] transition-all duration-150 ${
            isExpanded
              ? "inset-4 sm:inset-8"
              : "bottom-20 right-4 sm:right-5 w-[calc(100vw-2rem)] sm:w-[440px] h-[580px] max-h-[80vh]"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 bg-[#fafafa] rounded-t-[12px]">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-[6px] bg-zinc-950 flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-[13px] font-medium text-zinc-950">Assistant</h3>
                <p className="text-[12px] text-zinc-600">
                  {savedApiKey ? "Custom key active" : "Questions about your workspace"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-zinc-500">
              <button
                type="button"
                onClick={() => setShowKeySettings((prev) => !prev)}
                title="API Key Settings"
                aria-expanded={showKeySettings}
                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition ${
                  showKeySettings
                    ? "bg-zinc-900 text-white"
                    : savedApiKey
                    ? "bg-emerald-50 text-emerald-800"
                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                }`}
              >
                <KeyRound className="h-3 w-3" />
                <span>{savedApiKey ? "Key" : "API Key"}</span>
              </button>
              <button
                type="button"
                onClick={handleClearChat}
                title="Clear conversation"
                className="rounded-lg p-1.5 hover:bg-zinc-100 hover:text-zinc-800 transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsExpanded((prev) => !prev)}
                title={isExpanded ? "Restore size" : "Maximize"}
                className="hidden sm:inline-flex rounded-lg p-1.5 hover:bg-zinc-100 hover:text-zinc-800 transition"
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
                className="rounded-lg p-1.5 hover:bg-zinc-100 hover:text-zinc-800 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Personal API Key Settings Panel */}
          {showKeySettings && (
            <div className="border-b border-zinc-200 bg-[#fafafa] p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-zinc-700" strokeWidth={1.5} />
                    <h4 className="text-[13px] font-semibold text-zinc-950">
                      Custom API key
                    </h4>
                  </div>
                  <p className="mt-0.5 text-[12px] text-zinc-600 leading-relaxed">
                    Optionally enter a personal API key to route chat queries through your own quota. Leave blank to use the default configuration.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowKeySettings(false)}
                  className="rounded-[6px] p-1 text-zinc-500 hover:text-zinc-900"
                  title="Close API key settings"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={1.5} />
                </button>
              </div>

              <div className="flex items-center justify-between rounded-[6px] border border-zinc-200 bg-white px-3 py-1.5 text-[12px]">
                <span className="font-medium text-zinc-700">Status:</span>
                {savedApiKey ? (
                  <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                    Personal key active ({maskApiKey(savedApiKey)})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-medium text-zinc-700">
                    <Bot className="h-3.5 w-3.5" strokeWidth={1.5} />
                    Standard assistant mode
                  </span>
                )}
              </div>

              <form onSubmit={handleSaveAndValidateKey} className="space-y-2">
                <label
                  htmlFor="byok-groq-key-input"
                  className="block text-[12px] font-medium text-zinc-700"
                >
                  API key
                </label>
                <div className="relative flex items-center">
                  <input
                    id="byok-groq-key-input"
                    type={showKeyText ? "text" : "password"}
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder="Enter personal API key"
                    autoComplete="off"
                    spellCheck={false}
                    className="w-full h-9 rounded-[6px] border border-zinc-200 bg-white pl-3 pr-9 font-mono text-[12px] text-zinc-950 placeholder:text-zinc-500 focus:border-indigo-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKeyText((prev) => !prev)}
                    title={showKeyText ? "Hide key" : "Show key"}
                    className="absolute right-2.5 text-zinc-500 hover:text-zinc-800"
                  >
                    {showKeyText ? (
                      <EyeOff className="h-3.5 w-3.5" strokeWidth={1.5} />
                    ) : (
                      <Eye className="h-3.5 w-3.5" strokeWidth={1.5} />
                    )}
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={validatingKey || !keyInput.trim()}
                    className="inline-flex h-8 items-center gap-1.5 rounded-[6px] bg-zinc-950 hover:bg-zinc-800 disabled:bg-zinc-300 px-3 text-[12px] font-medium text-white transition-colors"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                    <span>
                      {validatingKey
                        ? "Validating..."
                        : savedApiKey
                        ? "Update key"
                        : "Save key"}
                    </span>
                  </button>

                  {savedApiKey && (
                    <button
                      type="button"
                      onClick={handleRemoveApiKey}
                      className="inline-flex h-8 items-center gap-1 rounded-[6px] border border-red-200 bg-white hover:bg-red-50 px-3 text-[12px] font-medium text-red-700 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" strokeWidth={1.5} />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </form>

              {keyStatusMessage && (
                <div
                  role="status"
                  className={`flex items-start gap-2 rounded-[6px] border p-2.5 text-[12px] leading-relaxed ${
                    keyStatusMessage.type === "success"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                      : keyStatusMessage.type === "error"
                      ? "border-red-200 bg-red-50 text-red-800"
                      : "border-zinc-200 bg-white text-zinc-800"
                  }`}
                >
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" strokeWidth={1.5} />
                  <span>{keyStatusMessage.text}</span>
                </div>
              )}

              <p className="text-[11px] text-zinc-600 leading-normal">
                Stored only in your browser session storage and sent only on assistant requests.
              </p>
            </div>
          )}

          {/* Quick Suggestions */}
          <div className="border-b border-zinc-200 bg-white px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[12px]">
            <span className="text-zinc-600 font-medium shrink-0 mr-1">
              Ask:
            </span>
            {DEFAULT_SUGGESTIONS.map((sug, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSendMessage(sug)}
                disabled={isLoading}
                className="shrink-0 rounded-[6px] border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 px-2.5 py-1 text-zinc-700 hover:text-zinc-950 transition whitespace-nowrap"
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

                  <span className="mt-1 text-[11px] text-zinc-600 px-1 font-mono">
                    {m.timestamp}
                  </span>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-start gap-2">
                <div className="rounded-[12px] bg-zinc-50 border border-zinc-200 p-3">
                  <div className="flex items-center gap-2 text-[13px] text-zinc-700">
                    <span className="h-2 w-2 rounded-full bg-indigo-600" aria-hidden="true" />
                    <span className="font-medium text-zinc-900">
                      Checking workspace details...
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
            className="border-t border-zinc-200 p-3 bg-white rounded-b-[12px]"
          >
            <div className="relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isLoading}
                placeholder="Ask about subscriptions, prices, tasks, or escrow..."
                className="w-full h-10 rounded-[6px] border border-zinc-200 bg-[#fafafa] pl-3.5 pr-11 text-[13px] text-zinc-950 placeholder:text-zinc-500 focus:bg-white focus:border-indigo-600"
              />
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                aria-label="Send message"
                className="absolute right-1.5 rounded-[4px] bg-zinc-950 hover:bg-zinc-800 disabled:bg-zinc-300 p-1.5 text-white transition-colors disabled:cursor-not-allowed"
              >
                <Send className="h-3.5 w-3.5" strokeWidth={1.5} />
              </button>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[12px] text-zinc-600 px-1">
              <span>Press Enter to send</span>
              <button
                type="button"
                onClick={() => setShowKeySettings((prev) => !prev)}
                className="font-medium text-indigo-600 hover:underline"
              >
                {savedApiKey ? "Custom key active" : "Custom key"}
              </button>
            </div>
          </form>
        </section>
      )}
    </>
  );
}
