"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Bot,
  ChevronDown,
  CornerDownLeft,
  Maximize2,
  Minimize2,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import type { WorkspaceTabId } from "@/components/layout/NexusHeader";
import type { NexusPulseState } from "@/lib/paypal/paypal-sandbox-mirror";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  modelUsed?: string;
  timestamp: string;
}

interface NexusAiChatbotProps {
  appState: NexusPulseState | null;
  onSelectTab: (tab: WorkspaceTabId) => void;
}

const DEFAULT_SUGGESTIONS = [
  "How does Engine 1 find deals on Channel3?",
  "Explain PayPal Orders v2 AUTHORIZE milestone escrow",
  "What is my current wallet balance & total savings?",
  "How does the Dual-Mode Sandbox solve SMS barriers?",
  "How does Gemini 3.8 Flash audit human bounties?",
  "List all PayPal REST APIs and SDKs integrated",
];

export default function NexusAiChatbot({
  appState,
  onSelectTab,
}: NexusAiChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Hello! I am **NexusPulse Oracle**, powered by the **Groq 120-Billion Parameter Frontier AI Model** (\`openai/gpt-oss-120b\`). 

I have full real-time awareness of the **NexusPulse Autonomous Financial Clearinghouse**, our **PayPal REST APIs & JS SDK v6**, **Channel3 100M+ SKU catalog**, **Proof-of-Human bounties**, and **Bryntum escrow Gantt milestones**.

How can I assist your financial architecture or platform operations today?`,
      modelUsed: "openai/gpt-oss-120b",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

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
      const historyPayload = newMessages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/ai/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: historyPayload,
          stateContext: appState,
        }),
      });

      const data = await res.json();
      if (data.reply) {
        const assistantMsg: Message = {
          id: `bot-${Date.now()}`,
          role: "assistant",
          content: data.reply,
          modelUsed: data.modelUsed ?? "openai/gpt-oss-120b",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        throw new Error(data.error || "No response received from AI");
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Network error";
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: `Sorry, I encountered an issue querying the model: ${errMsg}. Please try again.`,
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
        content: `Chat history cleared. How can I assist you with NexusPulse and PayPal APIs?`,
        modelUsed: "openai/gpt-oss-120b",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  }

  // Parses Markdown-like text including [ACTION:NAVIGATE:tab]
  function renderFormattedContent(text: string) {
    const actionRegex = /\[ACTION:NAVIGATE:([a-zA-Z0-9_-]+)\]/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = actionRegex.exec(text)) !== null) {
      const preText = text.slice(lastIndex, match.index);
      if (preText) {
        parts.push(renderSimpleMarkdown(preText));
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
        <button
          key={`action-${match.index}`}
          type="button"
          onClick={() => {
            onSelectTab(targetTab);
            setIsOpen(false);
          }}
          className="my-1.5 inline-flex items-center gap-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition hover:scale-105 active:scale-95"
        >
          <span>{labelMap[targetTab] || `Navigate to ${targetTab}`}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      );

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(renderSimpleMarkdown(text.slice(lastIndex)));
    }

    return parts;
  }

  function renderSimpleMarkdown(content: string) {
    const lines = content.split("\n");
    return (
      <div key={content.slice(0, 20)} className="space-y-1.5 leading-relaxed text-xs">
        {lines.map((line, idx) => {
          if (!line.trim()) return <div key={idx} className="h-1" />;

          // Header ###
          if (line.startsWith("### ")) {
            return (
              <h4 key={idx} className="text-xs font-bold text-slate-900 mt-2">
                {line.replace("### ", "")}
              </h4>
            );
          }
          if (line.startsWith("## ")) {
            return (
              <h3 key={idx} className="text-sm font-bold text-slate-950 mt-2.5">
                {line.replace("## ", "")}
              </h3>
            );
          }

          // Bullet item
          if (line.startsWith("- ") || line.startsWith("* ")) {
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-1">
                <span className="text-sky-600 font-bold shrink-0">•</span>
                <span>{renderInlineStyles(line.slice(2))}</span>
              </div>
            );
          }

          // Numbered item
          if (/^\d+\.\s/.test(line)) {
            const match = line.match(/^(\d+\.)\s(.*)/);
            if (match) {
              return (
                <div key={idx} className="flex items-start gap-1.5 pl-1">
                  <span className="text-slate-800 font-bold shrink-0">{match[1]}</span>
                  <span>{renderInlineStyles(match[2])}</span>
                </div>
              );
            }
          }

          return <p key={idx}>{renderInlineStyles(line)}</p>;
        })}
      </div>
    );
  }

  function renderInlineStyles(text: string) {
    // Bold **text**
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
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
      <aside aria-label="AI Assistant Floating Trigger">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`fixed bottom-5 right-5 z-50 inline-flex items-center gap-2.5 rounded-full p-2.5 sm:px-4 sm:py-2.5 shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 ${
            isOpen
              ? "bg-slate-900 text-white ring-2 ring-sky-400"
              : "bg-slate-950 text-white hover:bg-slate-800 border border-slate-700"
          }`}
          title="Open NexusPulse AI Assistant (Groq 120B Frontier Model)"
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
              <Zap className="h-2.5 w-2.5 text-amber-300" />
              Groq 120B Active
            </span>
          </div>
        </button>
      </aside>

      {/* Slide-over / Modal Chatbot Panel */}
      {isOpen && (
        <section
          role="dialog"
          aria-label="NexusPulse AI Assistant Chat Window"
          aria-modal="true"
          className={`fixed z-50 flex flex-col rounded-2xl border border-slate-200 bg-white/95 shadow-2xl backdrop-blur-2xl transition-all duration-300 animate-cascade-1 ${
            isExpanded
              ? "inset-4 sm:inset-8"
              : "bottom-20 right-4 sm:right-6 w-[92vw] sm:w-[460px] h-[580px] max-h-[85vh]"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50/80 rounded-t-2xl">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-xs">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-extrabold text-slate-950">
                    NexusPulse Oracle AI
                  </h3>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 text-[10px] font-bold text-emerald-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Online
                  </span>
                </div>
                <p className="text-[10px] font-mono text-slate-500">
                  Groq 120B Frontier AI (<code className="text-indigo-700">openai/gpt-oss-120b</code>)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-500">
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

          {/* Quick Suggestion Pills */}
          <div className="border-b border-slate-100 bg-white/70 px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[11px]">
            <span className="text-slate-400 font-semibold uppercase text-[10px] shrink-0 mr-1">
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
                    className={`max-w-[88%] rounded-2xl p-3 shadow-xs ${
                      isUser
                        ? "bg-slate-950 text-white rounded-br-xs"
                        : "bg-slate-50 border border-slate-200 text-slate-800 rounded-bl-xs"
                    }`}
                  >
                    {!isUser && (
                      <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-slate-200/60 text-[10px] font-mono text-slate-500">
                        <span className="font-bold text-sky-700 flex items-center gap-1">
                          <Bot className="h-3 w-3" />
                          NexusPulse Oracle
                        </span>
                        {m.modelUsed && (
                          <span className="rounded bg-white px-1.5 py-0.2 border border-slate-200 text-slate-600">
                            {m.modelUsed}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="whitespace-pre-wrap">
                      {isUser ? m.content : renderFormattedContent(m.content)}
                    </div>
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
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <span className="h-2 w-2 rounded-full bg-sky-500 animate-ping" />
                    <span className="font-semibold text-slate-800">
                      Groq 120B reasoning...
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
                placeholder="Ask about PayPal APIs, Channel3 deals, bounties, escrow..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-3.5 pr-11 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-sky-500 shadow-xs focus:outline-none"
              />
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="absolute right-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 disabled:bg-slate-300 p-1.5 text-white transition disabled:cursor-not-allowed shadow-xs"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 px-1">
              <span>Press Enter to send</span>
              <span className="font-mono">Real-time state synced</span>
            </div>
          </form>
        </section>
      )}
    </>
  );
}
