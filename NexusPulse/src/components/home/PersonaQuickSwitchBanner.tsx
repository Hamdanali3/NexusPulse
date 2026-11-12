"use client";

import React from "react";
import {
  ArrowRight02Icon,
  SecurityCheckIcon,
  SecurityLockIcon,
  Tag01Icon,
  TaskDone01Icon,
  UserCheck01Icon,
} from "@hugeicons/core-free-icons";
import { AppIcon } from "@/components/ui/Icon";
import { DEMO_EVALUATOR_ACCOUNTS, type UserProfile } from "@/lib/auth/auth-types";

interface PersonaQuickSwitchBannerProps {
  currentUser: UserProfile | null;
  onSelectPersona: (demoKey: string) => Promise<void>;
  onOpenAuthModal: () => void;
}

export default function PersonaQuickSwitchBanner({
  currentUser,
  onSelectPersona,
  onOpenAuthModal,
}: PersonaQuickSwitchBannerProps) {
  const personas = [
    {
      key: "judge",
      name: "Eva Vance",
      title: "Finance Reviewer",
      role: "Workspace admin",
      badge: "Reviewer",
      badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
      description: "Full access to spending review, account ledger, and workspace settings.",
      icon: SecurityCheckIcon,
      recommendedFor: "Overview",
    },
    {
      key: "consumer",
      name: "Marcus Vance",
      title: "Hardware Buyer & Developer",
      role: "Buyer",
      badge: "Buyer",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      description: "Monitors tracked hardware prices and recurring subscriptions with PayPal checkout.",
      icon: Tag01Icon,
      recommendedFor: "Price watch",
    },
    {
      key: "oracle",
      name: "Elena Rostova",
      title: "Field Ground-Truth Specialist",
      role: "Contributor",
      badge: "Contributor",
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
      description: "Completes quick physical inspection checks for fast PayPal payouts.",
      icon: TaskDone01Icon,
      recommendedFor: "Verified tasks",
    },
    {
      key: "enterprise",
      name: "Sovereign Labs",
      title: "Project Organization",
      role: "Team account",
      badge: "Team",
      badgeColor: "bg-zinc-100 text-zinc-700 border-zinc-200",
      description: "Manages milestone-based escrow holds and verified delivery releases.",
      icon: SecurityLockIcon,
      recommendedFor: "Milestone escrow",
    },
  ];

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-2xs space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
        <div className="flex items-center gap-2">
          <AppIcon icon={UserCheck01Icon} size="sm" className="text-indigo-600" />
          <h3 className="text-[13px] font-medium text-zinc-900">
            Quick-switch sample accounts
          </h3>
          <span className="text-[12px] text-zinc-600">
            Preview each workflow from a sample role
          </span>
        </div>

        {currentUser && (
          <div className="flex items-center gap-1.5 text-[12px]">
            <span className="text-zinc-600">Active:</span>
            <span className="font-medium text-zinc-950">{currentUser.fullName}</span>
            <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] font-mono text-zinc-700 font-medium">
              {currentUser.roleTitle}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {personas.map((p) => {
          const Icon = p.icon;
          const isCurrent = currentUser?.email === DEMO_EVALUATOR_ACCOUNTS[p.key]?.email;

          return (
            <button
              key={p.key}
              type="button"
              onClick={() => onSelectPersona(p.key)}
              className={`text-left rounded-lg p-3 border transition-all flex flex-col justify-between ${
                isCurrent
                  ? "border-indigo-500 bg-indigo-50/30 ring-1 ring-indigo-500 shadow-2xs"
                  : "border-zinc-200 bg-zinc-50/50 hover:bg-white hover:border-zinc-300"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className={`rounded border px-1.5 py-0.2 text-[9px] font-mono font-semibold ${p.badgeColor}`}>
                    {p.badge}
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] font-bold text-indigo-600 font-mono">
                      ACTIVE
                    </span>
                  )}
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-zinc-900 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                    {p.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-bold text-zinc-900 truncate">
                      {p.name}
                    </div>
                    <div className="text-[10px] text-zinc-500 truncate">
                      {p.title}
                    </div>
                  </div>
                </div>

                <p className="mt-2 text-[11px] text-zinc-600 leading-snug line-clamp-2">
                  {p.description}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-zinc-200 flex items-center justify-between text-[12px] text-zinc-600 font-medium">
                <span className="inline-flex items-center gap-1.5">
                  <AppIcon icon={p.icon} size="xs" className="text-zinc-500" />
                  <span>{p.recommendedFor}</span>
                </span>
                <AppIcon icon={ArrowRight02Icon} size="xs" className="text-zinc-600" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
