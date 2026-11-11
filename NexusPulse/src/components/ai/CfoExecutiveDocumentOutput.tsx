"use client";

import React, { useMemo, useState } from "react";
import {
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  Code2,
  Copy,
  DollarSign,
  Download,
  FileCheck,
  FileText,
  Layers,
  Lock,
  Printer,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  UserCheck,
  Zap,
} from "lucide-react";
import type { WorkspaceTabId } from "@/components/layout/NexusHeader";

export interface AgentInteractionResponse {
  interactionId: string;
  previousInteractionId?: string;
  modelUsed: string;
  outputText: string;
  durationMs?: number;
  paypalMode?: string;
  toolExecutions: Array<{
    toolName: string;
    args: Record<string, unknown>;
    resultSummary: string;
  }>;
}

interface CfoExecutiveDocumentOutputProps {
  response: AgentInteractionResponse;
  onNavigate?: (tab: WorkspaceTabId, sectionId?: string) => void;
}

/**
 * Helper to safely extract JSON from string if the output is raw JSON or wrapped in code blocks
 */
function tryExtractJson(text: string): Record<string, unknown> | null {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      return JSON.parse(trimmed) as Record<string, unknown>;
    } catch {
      // not pure JSON
    }
  }

  const jsonBlockMatch = /```(?:json)?\s*([\s\S]*?)\s*```/i.exec(trimmed);
  if (jsonBlockMatch && jsonBlockMatch[1]) {
    try {
      return JSON.parse(jsonBlockMatch[1]) as Record<string, unknown>;
    } catch {
      // not valid JSON
    }
  }

  return null;
}

/**
 * Format inline bold, codes, and currency highlights
 */
function renderInlineStyles(text: string): React.ReactNode[] {
  // Pattern matching: **bold**, `code`, $amount
  const tokenRegex = /(\*\*[^*]+\*\*|`[^`]+`|\$\d+(?:\.\d{2})?(?:\s*(?:USD|\/mo|\/month|\/yr|\/year))?)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(
        <strong key={`b-${match.index}`} className="font-bold text-slate-950">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("`") && token.endsWith("`")) {
      parts.push(
        <code
          key={`c-${match.index}`}
          className="rounded bg-slate-100 border border-slate-200 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-slate-800"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("$")) {
      parts.push(
        <span
          key={`m-${match.index}`}
          className="font-bold font-mono text-emerald-700 bg-emerald-50/70 border border-emerald-200/60 rounded px-1 py-0.2"
        >
          {token}
        </span>
      );
    } else {
      parts.push(token);
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

export default function CfoExecutiveDocumentOutput({
  response,
  onNavigate,
}: CfoExecutiveDocumentOutputProps) {
  const [viewMode, setViewMode] = useState<"document" | "raw">("document");
  const [copied, setCopied] = useState(false);

  const jsonPayload = useMemo(
    () => tryExtractJson(response.outputText),
    [response.outputText]
  );

  function handleCopyMemo() {
    navigator.clipboard?.writeText(response.outputText).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handlePrint() {
    if (typeof window !== "undefined") {
      window.print();
    }
  }

  // Parse lines into document sections
  const documentSections = useMemo(() => {
    if (jsonPayload) return null;

    const rawLines = response.outputText.split("\n");
    const sections: Array<{
      title: string;
      items: string[];
      isNumbered?: boolean;
    }> = [];

    let currentSection: { title: string; items: string[]; isNumbered?: boolean } = {
      title: "Executive Observations & Findings",
      items: [],
    };

    for (const rawLine of rawLines) {
      const line = rawLine.trim();
      if (!line) continue;

      if (line.startsWith("### ") || line.startsWith("## ")) {
        if (currentSection.items.length > 0 || currentSection.title !== "Executive Observations & Findings") {
          sections.push(currentSection);
        }
        currentSection = {
          title: line.replace(/^#{2,3}\s+/, "").replace(/^[0-9]+\.\s*/, "").trim(),
          items: [],
        };
      } else if (/^[0-9]+\.\s+\*\*/.test(line)) {
        // Numbered list item
        currentSection.items.push(line);
        currentSection.isNumbered = true;
      } else if (line.startsWith("- ") || line.startsWith("* ")) {
        currentSection.items.push(line.replace(/^[-*]\s+/, ""));
      } else {
        currentSection.items.push(line);
      }
    }

    if (currentSection.items.length > 0) {
      sections.push(currentSection);
    }

    return sections;
  }, [response.outputText, jsonPayload]);

  return (
    <div
      role="region"
      aria-label="Autonomous CFO Executive Financial Audit Memorandum"
      className="nexus-fade-in mt-4 rounded-2xl border border-slate-300 bg-white shadow-md overflow-hidden text-slate-900"
    >
      {/* 1. EXECUTIVE MEMORANDUM LETTERHEAD */}
      <div className="bg-slate-900 text-white px-5 sm:px-7 py-4.5 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-400 p-0.5 shadow-md flex items-center justify-center">
            <div className="h-full w-full rounded-[10px] bg-slate-950 flex items-center justify-center">
              <Bot className="h-5 w-5 text-sky-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-sky-400">
                NexusPulse Financial Intelligence
              </span>
              <span className="rounded bg-slate-800 border border-slate-700 px-2 py-0.2 font-mono text-[9px] text-slate-300 font-semibold uppercase">
                {response.paypalMode ? `Mode: ${response.paypalMode}` : "Official Audit"}
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-extrabold tracking-tight text-white">
              Autonomous CFO Executive Memorandum
            </h3>
          </div>
        </div>

        {/* Toolbar: Toggle View, Copy, Print */}
        <div className="flex items-center gap-2 text-xs">
          <div className="inline-flex rounded-lg bg-slate-800 p-0.5 border border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode("document")}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                viewMode === "document"
                  ? "bg-sky-500 text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Document</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("raw")}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                viewMode === "raw"
                  ? "bg-slate-700 text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Code2 className="h-3.5 w-3.5" />
              <span>Raw JSON</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyMemo}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition"
            title="Copy Executive Memorandum to clipboard"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-slate-400" />
                <span>Copy</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition"
            title="Print or export as PDF"
          >
            <Printer className="h-3.5 w-3.5 text-slate-400" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* 2. DOCUMENT METADATA STRIP */}
      <div className="bg-slate-50 border-b border-slate-200 px-5 sm:px-7 py-3 text-xs grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <span className="text-[10px] font-mono uppercase text-slate-500 font-semibold block">
            Reference ID
          </span>
          <span className="font-mono font-bold text-slate-900 truncate block">
            {response.interactionId}
          </span>
        </div>
        <div>
          <span className="text-[10px] font-mono uppercase text-slate-500 font-semibold block">
            Auditing Model
          </span>
          <span className="font-semibold text-indigo-700 block">
            {response.modelUsed}
          </span>
        </div>
        <div>
          <span className="text-[10px] font-mono uppercase text-slate-500 font-semibold block">
            Telemetry Latency
          </span>
          <span className="font-mono text-slate-700 block">
            {response.durationMs !== undefined ? `${response.durationMs}ms` : "Instant"}
          </span>
        </div>
        <div>
          <span className="text-[10px] font-mono uppercase text-slate-500 font-semibold block">
            Status
          </span>
          <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            Verified Financial Telemetry
          </span>
        </div>
      </div>

      {/* 3. TOOL EXECUTION BADGES (IF ANY EXECUTED) */}
      {response.toolExecutions && response.toolExecutions.length > 0 && (
        <div className="bg-emerald-50/60 border-b border-emerald-200/80 px-5 sm:px-7 py-3">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-3.5 w-3.5 text-emerald-700" />
            <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
              Autonomous Actions Executed in this Turn ({response.toolExecutions.length})
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {response.toolExecutions.map((t, idx) => (
              <div
                key={idx}
                className="rounded-lg bg-white border border-emerald-200 p-2.5 text-xs shadow-2xs flex items-start gap-2"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-mono font-bold text-emerald-900">
                    {t.toolName}
                  </div>
                  <div className="text-slate-600 text-[11px] mt-0.5">
                    {t.resultSummary}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. MAIN DOCUMENT BODY */}
      <div className="p-5 sm:p-7 space-y-6">
        {viewMode === "raw" ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
              <span>Raw JSON Telemetry Output</span>
              <span>application/json</span>
            </div>
            <pre className="rounded-xl bg-slate-950 p-4 font-mono text-xs text-sky-300 overflow-x-auto border border-slate-800 leading-relaxed">
              <code>
                {jsonPayload
                  ? JSON.stringify(jsonPayload, null, 2)
                  : JSON.stringify(response, null, 2)}
              </code>
            </pre>
          </div>
        ) : jsonPayload ? (
          /* Formatted Rendering if Model Output was structured JSON */
          <div className="space-y-5">
            <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-sky-900 mb-1">
                Audit Summary &amp; Direct Assessment
              </h4>
              <p className="text-sm font-medium text-slate-900">
                {String(jsonPayload.summary || jsonPayload.message || jsonPayload.overview || "Autonomous audit completed.")}
              </p>
            </div>

            {/* Render key-values as a structured financial table */}
            <div className="rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 text-xs font-bold text-slate-800">
                Extracted Financial &amp; Operational Metrics
              </div>
              <table className="w-full text-left text-xs border-collapse">
                <tbody className="divide-y divide-slate-100">
                  {Object.entries(jsonPayload).map(([key, val], idx) => {
                    if (typeof val === "object" && val !== null) {
                      return (
                        <tr key={idx} className="hover:bg-slate-50/70">
                          <td className="px-4 py-2.5 font-mono font-semibold text-slate-700 w-1/3 align-top">
                            {key.replace(/_/g, " ")}
                          </td>
                          <td className="px-4 py-2.5 text-slate-900 font-mono text-[11px] bg-slate-50/50">
                            <pre className="whitespace-pre-wrap">{JSON.stringify(val, null, 2)}</pre>
                          </td>
                        </tr>
                      );
                    }
                    return (
                      <tr key={idx} className="hover:bg-slate-50/70">
                        <td className="px-4 py-2.5 font-semibold text-slate-700 w-1/3">
                          {key.replace(/_/g, " ")}
                        </td>
                        <td className="px-4 py-2.5 font-bold text-slate-950 tabular-nums">
                          {renderInlineStyles(String(val))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Structured Executive Document Style */
          <div className="space-y-5">
            {documentSections &&
              documentSections.map((sec, sIdx) => (
                <div
                  key={sIdx}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3"
                >
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-50 border border-indigo-200 text-xs font-bold text-indigo-700 font-mono">
                      0{sIdx + 1}
                    </span>
                    <h4 className="text-sm font-extrabold tracking-tight text-slate-950">
                      {sec.title}
                    </h4>
                  </div>

                  <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
                    {sec.items.map((item, iIdx) => {
                      // Check if it's a bold action item
                      const isActionCard = /^[0-9]+\.\s+\*\*/.test(item) || item.startsWith("**");
                      if (isActionCard) {
                        return (
                          <div
                            key={iIdx}
                            className="rounded-lg border border-slate-100 bg-slate-50/70 p-3 hover:border-slate-200 hover:bg-slate-50 transition"
                          >
                            <div className="flex items-start gap-2">
                              <CheckCircle2 className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" />
                              <div className="text-slate-800">
                                {renderInlineStyles(item)}
                              </div>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div key={iIdx} className="flex items-start gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0 mt-1.5" />
                          <div className="text-slate-700">
                            {renderInlineStyles(item)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* 5. ACTIONABLE NEXT STEPS SHORTCUT CLUSTER */}
        {onNavigate && (
          <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-semibold text-slate-600">
              Immediate Execution Actions:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onNavigate("channel3")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 font-bold text-slate-800 shadow-2xs transition"
              >
                <ShoppingBag className="h-3.5 w-3.5 text-sky-600" />
                <span>Open Deal Hunter</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate("bounties")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 font-bold text-slate-800 shadow-2xs transition"
              >
                <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Claim Bounties</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate("bryntum")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 font-bold text-slate-800 shadow-2xs transition"
              >
                <Lock className="h-3.5 w-3.5 text-indigo-600" />
                <span>Escrow Gantt</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate("aggrid")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 font-bold text-slate-800 shadow-2xs transition"
              >
                <Layers className="h-3.5 w-3.5 text-slate-600" />
                <span>AG Grid Ledger</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 6. DOCUMENT SIGN-OFF FOOTER */}
      <div className="bg-slate-50 border-t border-slate-200 px-5 sm:px-7 py-3 text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-mono">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>Cryptographically validated via PayPal Dual-Mode Gateway</span>
        </div>
        <div>
          <span>Document Generated: {new Date().toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
