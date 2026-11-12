"use client";

import React from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { PayPalExecutionMode } from "@/lib/paypal/paypal-types";
import NexusPulseLogo from "@/components/brand/NexusPulseLogo";
import type { WorkspaceTabId } from "./NexusHeader";

interface NexusFooterProps {
  activeMode: PayPalExecutionMode;
  databaseSource: string;
  onSelectTab?: (tab: WorkspaceTabId) => void;
}

export default function NexusFooter({
  activeMode,
  databaseSource,
  onSelectTab,
}: NexusFooterProps) {
  function handleJump(tab: WorkspaceTabId) {
    if (onSelectTab) {
      onSelectTab(tab);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else if (typeof window !== "undefined") {
      window.location.href = tab === "overview" ? "/" : `/?tab=${tab}`;
    }
  }

  return (
    <footer className="mt-20 border-t border-zinc-200 bg-white pb-20 sm:pb-12">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 pb-8 border-b border-zinc-100">
          <div>
            <NexusPulseLogo onNavigateHome={() => handleJump("overview")} />
            <p className="mt-2 text-xs text-zinc-500 max-w-sm">
              Autonomous financial clearinghouse on PayPal. Connecting Gemini AI with programmable payments.
            </p>
          </div>

          <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-zinc-600">
            <button
              type="button"
              onClick={() => handleJump("overview")}
              className="hover:text-zinc-950 transition-colors"
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => handleJump("channel3")}
              className="hover:text-zinc-950 transition-colors"
            >
              Deal Hunter
            </button>
            <button
              type="button"
              onClick={() => handleJump("bounties")}
              className="hover:text-zinc-950 transition-colors"
            >
              Human Bounties
            </button>
            <button
              type="button"
              onClick={() => handleJump("bryntum")}
              className="hover:text-zinc-950 transition-colors"
            >
              Smart Escrow
            </button>
            <button
              type="button"
              onClick={() => handleJump("aggrid")}
              className="hover:text-zinc-950 transition-colors"
            >
              Ledger
            </button>
            <Link href="/about" className="hover:text-zinc-950 transition-colors">
              About
            </Link>
            <Link href="/contact" className="hover:text-zinc-950 transition-colors">
              Contact
            </Link>
          </nav>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400">
          <div className="flex items-center gap-3">
            <span>© {new Date().getFullYear()} NexusPulse</span>
            <span>•</span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  activeMode === "live"
                    ? "bg-emerald-500"
                    : activeMode === "sandbox"
                      ? "bg-sky-500"
                      : "bg-zinc-400"
                }`}
              />
              Mode: {activeMode.toUpperCase()} ({databaseSource === "supabase_postgres" ? "Supabase" : "Local"})
            </span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://github.com/Hamdanali3/NexusPulse"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-zinc-500 hover:text-zinc-950 transition-colors"
            >
              <span>GitHub</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
