"use client";

import React, { useMemo, useState } from "react";
import {
  Analytics01Icon,
  CheckmarkCircle02Icon,
  CodeIcon,
  Copy01Icon,
  Download01Icon,
  File01Icon,
  FileValidationIcon,
  LayoutTable01Icon,
  SecurityCheckIcon,
  SecurityLockIcon,
  Tag01Icon,
  TaskDone01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { AppIcon } from "@/components/ui/Icon";
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

  function handleSaveAsPdf() {
    if (typeof window === "undefined") return;

    const reportElem = document.getElementById("cfo-executive-report");
    if (!reportElem) {
      window.print();
      return;
    }

    // Build dedicated hidden print iframe containing ONLY the answer memorandum
    const iframe = document.createElement("iframe");
    iframe.id = "cfo-pdf-print-frame";
    iframe.style.position = "fixed";
    iframe.style.top = "-9999px";
    iframe.style.left = "-9999px";
    iframe.style.width = "1024px";
    iframe.style.height = "100%";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    // Collect all stylesheets and style tags
    const styleTags = Array.from(
      document.querySelectorAll('link[rel="stylesheet"], style')
    )
      .map((el) => el.outerHTML)
      .join("\n");

    // Clone report element and remove interactive toolbar so buttons don't appear in saved PDF
    const clone = reportElem.cloneNode(true) as HTMLElement;
    const toolbar = clone.querySelector(".cfo-toolbar");
    if (toolbar) toolbar.remove();

    clone.classList.remove("mt-4");
    clone.style.margin = "0";

    const title = `NexusPulse_Spending_Review_${response.interactionId}`;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>${title}</title>
          ${styleTags}
          <style>
            @page {
              size: A4 portrait;
              margin: 12mm 14mm;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background-color: #ffffff !important;
              color: #0f172a !important;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .cfo-toolbar { display: none !important; }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          </style>
        </head>
        <body>
          <div style="padding: 8px; background: #ffffff;">
            ${clone.outerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.warn("Iframe print fallback to window.print()", err);
        window.print();
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1500);
      }
    }, 300);
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
      id="cfo-executive-report"
      role="region"
      aria-label="Spending review summary"
      className="mt-4 rounded-[12px] border border-zinc-200 bg-white overflow-hidden text-zinc-900"
    >
      {/* 1. HEADER */}
      <div className="bg-[#fafafa] px-5 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-[6px] border border-zinc-200 bg-zinc-950 flex items-center justify-center shrink-0">
            <AppIcon icon={FileValidationIcon} size="sm" className="text-white" />
          </div>
          <div>
            <span className="text-[12px] font-medium text-zinc-600 block">
              NexusPulse
            </span>
            <h3 className="text-[15px] font-semibold tracking-tight text-zinc-950">
              Spending review
            </h3>
          </div>
        </div>

        {/* Toolbar: Toggle View, Copy, Save as PDF */}
        <div className="cfo-toolbar flex items-center gap-2 text-[12px]">
          <div className="inline-flex rounded-[6px] bg-zinc-100 p-0.5 border border-zinc-200">
            <button
              type="button"
              onClick={() => setViewMode("document")}
              className={`inline-flex items-center gap-1.5 rounded-[4px] px-2.5 py-1 text-[12px] font-medium transition-colors ${
                viewMode === "document"
                  ? "bg-white text-zinc-950"
                  : "text-zinc-600 hover:text-zinc-950"
              }`}
            >
              <AppIcon icon={File01Icon} size="xs" />
              <span>Summary</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("raw")}
              className={`inline-flex items-center gap-1.5 rounded-[4px] px-2.5 py-1 text-[12px] font-medium transition-colors ${
                viewMode === "raw"
                  ? "bg-white text-zinc-950"
                  : "text-zinc-600 hover:text-zinc-950"
              }`}
            >
              <AppIcon icon={CodeIcon} size="xs" />
              <span>JSON</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyMemo}
            className="inline-flex h-8 items-center gap-1.5 rounded-[6px] bg-white hover:bg-zinc-50 border border-zinc-200 px-3 text-[12px] font-medium text-zinc-700 transition-colors"
            title="Copy summary to clipboard"
          >
            {copied ? (
              <>
                <AppIcon icon={Tick02Icon} size="xs" className="text-emerald-700" />
                <span className="text-emerald-700">Copied</span>
              </>
            ) : (
              <>
                <AppIcon icon={Copy01Icon} size="xs" className="text-zinc-600" />
                <span>Copy</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleSaveAsPdf}
            className="inline-flex h-8 items-center gap-1.5 rounded-[6px] bg-zinc-950 hover:bg-zinc-800 px-3 text-[12px] font-medium text-white transition-colors"
            title="Save summary as PDF"
          >
            <AppIcon icon={Download01Icon} size="xs" />
            <span>Save PDF</span>
          </button>
        </div>
      </div>

      {/* 2. METADATA STRIP */}
      <div className="bg-white border-b border-zinc-200 px-5 sm:px-6 py-3 text-[12px] grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <span className="text-[12px] text-zinc-600 block">
            Reference
          </span>
          <span className="font-mono font-medium text-zinc-950 truncate block mt-0.5">
            {response.interactionId}
          </span>
        </div>
        <div>
          <span className="text-[12px] text-zinc-600 block">
            Checks run
          </span>
          <span className="font-medium text-zinc-950 tabular-nums block mt-0.5">
            {response.toolExecutions?.length ?? 0}
          </span>
        </div>
        <div>
          <span className="text-[12px] text-zinc-600 block">
            Response time
          </span>
          <span className="font-mono text-zinc-800 tabular-nums block mt-0.5">
            {response.durationMs !== undefined ? `${response.durationMs}ms` : "Instant"}
          </span>
        </div>
        <div>
          <span className="text-[12px] text-zinc-600 block">
            Status
          </span>
          <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700 mt-0.5">
            <span className="h-2 w-2 rounded-full bg-emerald-600" aria-hidden="true" />
            Complete
          </span>
        </div>
      </div>

      {/* 3. CHECKS RUN */}
      {response.toolExecutions && response.toolExecutions.length > 0 && (
        <div className="bg-[#fafafa] border-b border-zinc-200 px-5 sm:px-6 py-3">
          <div className="flex items-center gap-2 mb-2">
            <AppIcon icon={Analytics01Icon} size="xs" className="text-zinc-700" />
            <span className="text-[13px] font-medium text-zinc-900">
              Completed checks ({response.toolExecutions.length})
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {response.toolExecutions.map((t, idx) => (
              <div
                key={idx}
                className="rounded-[6px] bg-white border border-zinc-200 p-2.5 text-[12px] flex items-start gap-2"
              >
                <AppIcon icon={CheckmarkCircle02Icon} size="sm" className="text-emerald-700 mt-0.5" />
                <div>
                  <div className="font-mono font-medium text-zinc-950">
                    {t.toolName}
                  </div>
                  <div className="text-zinc-600 mt-0.5">
                    {t.resultSummary}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. MAIN DOCUMENT BODY */}
      <div className="p-5 sm:p-6 space-y-6">
        {viewMode === "raw" ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[12px] text-zinc-600 font-mono">
              <span>JSON response</span>
              <span>application/json</span>
            </div>
            <pre className="rounded-[8px] bg-zinc-950 p-4 font-mono text-[12px] text-zinc-100 overflow-x-auto border border-zinc-800 leading-relaxed">
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
            <div className="rounded-[8px] border border-zinc-200 bg-[#fafafa] p-4">
              <h4 className="text-[13px] font-medium text-zinc-950 mb-1">
                Summary
              </h4>
              <p className="text-[14px] text-zinc-700">
                {String(jsonPayload.summary || jsonPayload.message || jsonPayload.overview || "Spending review completed.")}
              </p>
            </div>

            {/* Render key-values as a structured financial table */}
            <div className="rounded-[8px] border border-zinc-200 overflow-hidden">
              <div className="bg-[#fafafa] px-4 py-2 border-b border-zinc-200 text-[12px] font-medium text-zinc-700">
                Summary metrics
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

                  <div className="space-y-2 text-xs text-zinc-700 leading-relaxed">
                    {sec.items.map((item, iIdx) => {
                      // Check if it's a bold action item
                      const isActionCard = /^[0-9]+\.\s+\*\*/.test(item) || item.startsWith("**");
                      if (isActionCard) {
                        return (
                          <div
                            key={iIdx}
                            className="rounded-lg border border-zinc-200 bg-zinc-50/70 p-3 hover:border-zinc-300 hover:bg-zinc-50 transition"
                          >
                            <div className="flex items-start gap-2">
                              <AppIcon icon={CheckmarkCircle02Icon} size="sm" className="text-indigo-600 mt-0.5" />
                              <div className="text-zinc-800">
                                {renderInlineStyles(item)}
                              </div>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div key={iIdx} className="flex items-start gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 shrink-0 mt-1.5" />
                          <div className="text-zinc-700">
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

        {/* 5. NEXT STEPS */}
        {onNavigate && (
          <div className="pt-3 border-t border-zinc-200 flex flex-wrap items-center justify-between gap-3 text-[13px]">
            <span className="font-medium text-zinc-700">
              Next steps:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onNavigate("channel3")}
                className="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-zinc-200 bg-white hover:bg-zinc-50 px-3 text-[12px] font-medium text-zinc-800 transition-colors"
              >
                <AppIcon icon={Tag01Icon} size="xs" className="text-zinc-700" />
                <span>Price watch</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate("bounties")}
                className="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-zinc-200 bg-white hover:bg-zinc-50 px-3 text-[12px] font-medium text-zinc-800 transition-colors"
              >
                <AppIcon icon={TaskDone01Icon} size="xs" className="text-zinc-700" />
                <span>Verified tasks</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate("bryntum")}
                className="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-zinc-200 bg-white hover:bg-zinc-50 px-3 text-[12px] font-medium text-zinc-800 transition-colors"
              >
                <AppIcon icon={SecurityLockIcon} size="xs" className="text-zinc-700" />
                <span>Milestone escrow</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate("aggrid")}
                className="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-zinc-200 bg-white hover:bg-zinc-50 px-3 text-[12px] font-medium text-zinc-800 transition-colors"
              >
                <AppIcon icon={LayoutTable01Icon} size="xs" className="text-zinc-700" />
                <span>Ledger</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 6. FOOTER */}
      <div className="bg-[#fafafa] border-t border-zinc-200 px-5 sm:px-6 py-2.5 text-[12px] text-zinc-600 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <AppIcon icon={SecurityCheckIcon} size="xs" className="text-emerald-700" />
          <span>Synced with account ledger</span>
        </div>
        <div>
          <span>Generated {new Date().toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
