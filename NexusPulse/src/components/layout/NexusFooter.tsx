"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import type { PayPalExecutionMode } from "@/lib/paypal/paypal-types";
import { AppIcon } from "@/components/ui/Icon";
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
  const [showDebugMode, setShowDebugMode] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setShowDebugMode(window.location.search.includes("debug=1"));
    }
  }, []);

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
    <footer className="mt-20 border-t border-zinc-200 bg-white pb-24 sm:pb-12">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 pb-8 border-b border-zinc-200">
          <div>
            <NexusPulseLogo onNavigateHome={() => handleJump("overview")} />
            <p className="mt-2 text-[13px] text-zinc-600 max-w-sm">
              Track prices, review recurring charges, pay for verified tasks, and manage milestone escrow.
            </p>
          </div>

          <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-zinc-600">
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
              Price watch
            </button>
            <button
              type="button"
              onClick={() => handleJump("bounties")}
              className="hover:text-zinc-950 transition-colors"
            >
              Verified tasks
            </button>
            <button
              type="button"
              onClick={() => handleJump("bryntum")}
              className="hover:text-zinc-950 transition-colors"
            >
              Milestone escrow
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

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-zinc-600">
          <div className="flex items-center gap-3">
            <span>© {new Date().getFullYear()} NexusPulse</span>
            {showDebugMode && (
              <>
                <span>·</span>
                <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-zinc-600">
                  Mode: {activeMode.toUpperCase()} ({databaseSource === "supabase_postgres" ? "Supabase" : "Local"})
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://github.com/Hamdanali3/NexusPulse"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-zinc-600 hover:text-zinc-950 transition-colors"
            >
              <span>GitHub</span>
              <AppIcon icon={ArrowUpRight01Icon} size="xs" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
