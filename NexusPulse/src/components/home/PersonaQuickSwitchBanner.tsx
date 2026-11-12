"use client";

import React from "react";
import { User, ShieldCheck, Sparkles, ShoppingBag, UserCheck, Lock, ArrowRight } from "lucide-react";
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
      title: "Lead Hackathon Evaluator",
      role: "Platform Admin & CFO",
      badge: "Evaluator",
      badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
      description: "Full access to Gemini Autonomous CFO, PayPal ledger, and system architecture.",
      icon: ShieldCheck,
      recommendedFor: "Overview & CFO Console",
    },
    {
      key: "consumer",
      name: "Marcus Vance",
      title: "Hardware Buyer & Developer",
      role: "Consumer Buyer",
      badge: "Consumer",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      description: "Autonomous deal hunter matching 100M+ SKUs with PayPal JS SDK v6 checkout.",
      icon: ShoppingBag,
      recommendedFor: "Engine 01: Deal Hunter",
    },
    {
      key: "oracle",
      name: "Elena Rostova",
      title: "Field Ground-Truth Specialist",
      role: "Proof-of-Human Oracle",
      badge: "Human Oracle",
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
      description: "60-second physical checks audited by Gemini Vision with instant PayPal Payouts.",
      icon: UserCheck,
      recommendedFor: "Engine 02: Human Bounties",
    },
    {
      key: "enterprise",
      name: "Sovereign Labs",
      title: "Autonomous Agent Corporation",
      role: "Enterprise AI Agent",
      badge: "Enterprise Agent",
      badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
      description: "A2A smart escrow milestone contracts with DHL Dispute Shield tracking.",
      icon: Lock,
      recommendedFor: "Engine 03: Smart Escrow",
    },
  ];

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-2xs space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-indigo-600 shrink-0" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
            1-Click Interactive Evaluator Personas
          </h3>
          <span className="text-[11px] text-zinc-400">
            Test each engine from the exact user perspective
          </span>
        </div>

        {currentUser && (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-zinc-400 text-[11px]">Active Persona:</span>
            <span className="font-semibold text-zinc-900">{currentUser.fullName}</span>
            <span className="rounded bg-zinc-100 px-1.5 py-0.2 text-[10px] font-mono text-zinc-600 font-medium">
              {currentUser.role}
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

              <div className="mt-3 pt-2 border-t border-zinc-100 flex items-center justify-between text-[10px] text-zinc-400 font-medium">
                <span>{p.recommendedFor}</span>
                <ArrowRight className="h-3 w-3 text-zinc-400 group-hover:text-zinc-900" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
