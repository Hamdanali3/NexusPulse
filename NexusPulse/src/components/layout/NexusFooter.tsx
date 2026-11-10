"use client";

import React from "react";
import {
  ArrowUp,
  CheckCircle2,
  Database,
  ExternalLink,
  Lock,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { PayPalExecutionMode } from "@/lib/paypal/paypal-types";
import NexusPulseLogo from "@/components/brand/NexusPulseLogo";
import type { WorkspaceTabId } from "./NexusHeader";

interface NexusFooterProps {
  activeMode: PayPalExecutionMode;
  databaseSource: string;
  onSelectTab: (tab: WorkspaceTabId) => void;
}

export default function NexusFooter({
  activeMode,
  databaseSource,
  onSelectTab,
}: NexusFooterProps) {
  function scrollToTop() {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handleJumpToEngine(tab: WorkspaceTabId) {
    onSelectTab(tab);
    scrollToTop();
  }

  return (
    <footer className="mt-20 border-t border-slate-200 bg-white text-slate-600 shadow-[0_-1px_3px_rgba(0,0,0,0.02)]">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-8 lg:px-12 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 pb-10 border-b border-slate-200">
          {/* Column 1: Brand Identity & Mission */}
          <div className="lg:col-span-4 space-y-4">
            <NexusPulseLogo
              onNavigateHome={() => {
                onSelectTab("overview");
              }}
            />
            <p className="text-xs text-slate-600 leading-relaxed max-w-sm">
              Autonomous Personal AI CFO, Channel3 Deal-Hunter, and Proof-of-Human Verification Clearinghouse built on the PayPal Developer Platform and Google Gemini Interactions API.
            </p>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>All 3 Economic Engines Operational</span>
            </div>
          </div>

          {/* Column 2: Economic Engines Navigation */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Economic Engines
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => handleJumpToEngine("overview")}
                  className="text-slate-600 hover:text-slate-950 transition"
                >
                  Unified Clearinghouse Overview
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleJumpToEngine("channel3")}
                  className="text-slate-600 hover:text-fuchsia-600 transition"
                >
                  Engine 1: Channel3 + PayPal JS SDK v6
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleJumpToEngine("bounties")}
                  className="text-slate-600 hover:text-emerald-600 transition"
                >
                  Engine 2: Proof-of-Human Payouts v1
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleJumpToEngine("bryntum")}
                  className="text-slate-600 hover:text-indigo-600 transition"
                >
                  Engine 3: Bryntum Smart Escrow Gantt
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleJumpToEngine("aggrid")}
                  className="text-slate-600 hover:text-sky-600 transition"
                >
                  AG Grid v36 Financial Command Center
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Sponsor & Protocol Stack */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              PayPal &amp; Sponsor Stack
            </h3>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                <span>PayPal Orders v2, Payouts v1 &amp; Subscriptions v1</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                <span>APIMatic @paypal/paypal-server-sdk v2.5.0</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Google Gemini 4 Argon &amp; 3.8 Flash Interactions API</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-fuchsia-600 shrink-0" />
                <span>Channel3 100M+ SKU Catalog &amp; AG Grid v36</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                <span>Bryntum Milestone Gantt &amp; Render Blueprint</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Security & Telemetry */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Security &amp; Runtime
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-1.5 text-slate-700">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>SHA256withRSA Webhooks</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700">
                <Lock className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                <span>Fetch Metadata Guard</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700">
                <Database className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                <span>
                  {databaseSource === "supabase_postgres"
                    ? "Supabase PostgreSQL"
                    : "In-Memory Mirror"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700">
                <Sparkles className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                <span>Mode: {activeMode.toUpperCase()}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={scrollToTop}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs transition"
            >
              <ArrowUp className="h-3.5 w-3.5" />
              <span>Back to Top</span>
            </button>
          </div>
        </div>

        {/* Bottom Legal & Repository Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} <strong className="text-slate-900">NexusPulse</strong>. Built for the PayPal AI Hackathon.
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <a
              href="https://github.com/Hamdanali3/NexusPulse"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-950 transition"
            >
              <span>GitHub Repository</span>
              <ExternalLink className="h-3 w-3" />
            </a>
            <span className="text-slate-300">•</span>
            <span className="font-mono text-slate-600">
              PayPal-Request-Id Idempotent
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
