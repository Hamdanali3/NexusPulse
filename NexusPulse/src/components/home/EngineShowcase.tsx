"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Camera,
  CheckCircle2,
  Lock,
  ShoppingBag,
  TrendingDown,
  Truck,
  UserCheck,
  Zap,
} from "lucide-react";
import type { WorkspaceTabId } from "@/components/layout/NexusHeader";

/**
 * EngineShowcase — animated, looping spotlight of the three NexusPulse engines.
 *
 * - One engine is spotlighted at a time; they rotate automatically in a loop.
 * - The progress bar under the active step drives the timer (CSS animation), so
 *   hovering / focusing the stage pauses it naturally.
 * - Click a step to jump, use ← / → keys, or swipe on touch devices.
 * - Auto-rotation is disabled for users who prefer reduced motion.
 */

const SLIDE_DURATION_MS = 5200;

type EngineDef = {
  id: WorkspaceTabId;
  step: string;
  tag: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  highlights: string[];
  theme: {
    text: string;
    softBg: string;
    ring: string;
    gradient: string;
    glow: string;
    button: string;
    bar: string;
  };
};

const ENGINES: EngineDef[] = [
  {
    id: "channel3",
    step: "01",
    tag: "Deal Hunter",
    title: "Deal & Subscription Guard",
    description:
      "Channel3 100M+ catalog monitor & PayPal subscription optimizer. Automatically downgrades idle tier services.",
    icon: ShoppingBag,
    highlights: ["100M+ live catalog", "Idle-tier auto downgrade", "PayPal Orders v2"],
    theme: {
      text: "text-sky-700",
      softBg: "bg-sky-50",
      ring: "ring-sky-200",
      gradient: "from-sky-500 to-cyan-400",
      glow: "rgba(14,165,233,0.22)",
      button: "bg-sky-600 hover:bg-sky-700 shadow-sky-500/30",
      bar: "bg-sky-500",
    },
  },
  {
    id: "bounties",
    step: "02",
    tag: "Proof-of-Human",
    title: "Oracle Micro-Bounties",
    description:
      "30-60s physical verifications verified by Gemini 3.8 Flash & paid immediately via PayPal Payouts v1 batches.",
    icon: UserCheck,
    highlights: ["30-60s verifications", "Gemini vision proof", "Instant Payouts v1"],
    theme: {
      text: "text-emerald-700",
      softBg: "bg-emerald-50",
      ring: "ring-emerald-200",
      gradient: "from-emerald-500 to-teal-400",
      glow: "rgba(16,185,129,0.22)",
      button: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30",
      bar: "bg-emerald-500",
    },
  },
  {
    id: "bryntum",
    step: "03",
    tag: "Smart Escrow",
    title: "Bryntum Milestone Escrow",
    description:
      "Orders v2 AUTHORIZE holds tracked on an interactive Gantt timeline with DHL carrier proofs and Dispute Shield.",
    icon: Lock,
    highlights: ["AUTHORIZE holds", "DHL carrier proofs", "Dispute Shield"],
    theme: {
      text: "text-indigo-700",
      softBg: "bg-indigo-50",
      ring: "ring-indigo-200",
      gradient: "from-indigo-500 to-violet-400",
      glow: "rgba(99,102,241,0.22)",
      button: "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30",
      bar: "bg-indigo-500",
    },
  },
];

/* ----------------------------- Engine visuals ----------------------------- */

function DealHunterVisual() {
  return (
    <div className="relative w-full max-w-[260px] mx-auto">
      <div className="es-pop rounded-2xl bg-white/90 backdrop-blur p-4 shadow-[0_20px_45px_-15px_rgba(14,165,233,0.45)] ring-1 ring-sky-100">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-400 flex items-center justify-center shadow-md">
            <ShoppingBag className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-slate-900 truncate">Jetson Orin Nano Kit</div>
            <div className="text-[10px] text-slate-500">Channel3 • 214 merchants scanned</div>
          </div>
        </div>
        <svg viewBox="0 0 200 56" className="mt-3 h-14 w-full" aria-hidden="true">
          <defs>
            <linearGradient id="es-deal-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgb(14,165,233)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="rgb(14,165,233)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            className="es-fade-late"
            d="M0 10 L30 14 L60 9 L90 22 L120 20 L150 36 L175 34 L200 46 L200 56 L0 56 Z"
            fill="url(#es-deal-fill)"
          />
          <path
            className="es-draw"
            d="M0 10 L30 14 L60 9 L90 22 L120 20 L150 36 L175 34 L200 46"
            fill="none"
            stroke="rgb(14,165,233)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle className="es-dot" cx="200" cy="46" r="4" fill="rgb(14,165,233)" />
        </svg>
        <div className="mt-2 flex items-end justify-between">
          <div>
            <div className="text-[11px] text-slate-400 line-through tabular-nums">$349.00</div>
            <div className="es-price text-xl font-extrabold text-slate-950 tabular-nums">$279.00</div>
          </div>
          <span className="es-badge inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white shadow">
            <TrendingDown className="h-3 w-3" /> −20%
          </span>
        </div>
      </div>
      <div className="es-chip absolute -bottom-4 -right-3 sm:-right-6 inline-flex items-center gap-1.5 rounded-full bg-slate-950 px-3 py-1.5 text-[10px] font-semibold text-white shadow-lg">
        <Zap className="h-3 w-3 text-sky-400" /> Idle GPU plan downgraded • −$38/mo
      </div>
    </div>
  );
}

function BountyVisual() {
  return (
    <div className="relative w-full max-w-[260px] mx-auto">
      <div className="es-pop relative aspect-[4/3] rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 overflow-hidden shadow-[0_20px_45px_-15px_rgba(16,185,129,0.5)]">
        {/* grid texture */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-20 bg-[linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] bg-[size:18px_18px]"
        />
        {/* viewfinder corners */}
        {[
          "top-3 left-3 border-t-2 border-l-2 rounded-tl-md",
          "top-3 right-3 border-t-2 border-r-2 rounded-tr-md",
          "bottom-3 left-3 border-b-2 border-l-2 rounded-bl-md",
          "bottom-3 right-3 border-b-2 border-r-2 rounded-br-md",
        ].map((c) => (
          <span key={c} aria-hidden="true" className={`absolute h-5 w-5 border-emerald-400 ${c}`} />
        ))}
        <Camera className="absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 text-slate-500" />
        <div aria-hidden="true" className="es-scan absolute inset-x-4 h-[2px] bg-emerald-400 shadow-[0_0_14px_3px_rgba(52,211,153,0.7)]" />
        <div className="es-verified absolute inset-0 flex flex-col items-center justify-center gap-1 bg-emerald-500/15 backdrop-blur-[1px]">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/40">
            <CheckCircle2 className="h-7 w-7 text-white" />
          </span>
          <span className="text-[11px] font-bold text-emerald-100 tracking-wide">Gemini verified • 98.4%</span>
        </div>
        <span className="absolute top-3 left-1/2 -translate-x-1/2 rounded-full bg-black/40 px-2 py-0.5 text-[9px] font-mono text-emerald-300">
          ● REC 00:42
        </span>
      </div>
      <div className="es-chip absolute -bottom-4 -left-3 sm:-left-6 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[10px] font-semibold text-slate-900 shadow-lg ring-1 ring-emerald-200">
        <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" /> $4.50 paid via Payouts v1
      </div>
    </div>
  );
}

function EscrowVisual() {
  const rows = [
    { label: "Deposit", w: "92%", delay: "0ms", color: "from-indigo-500 to-violet-500" },
    { label: "Ship", w: "70%", delay: "180ms", color: "from-violet-500 to-fuchsia-400" },
    { label: "Deliver", w: "48%", delay: "360ms", color: "from-indigo-400 to-sky-400" },
  ];
  return (
    <div className="relative w-full max-w-[260px] mx-auto">
      <div className="es-pop rounded-2xl bg-white/90 backdrop-blur p-4 shadow-[0_20px_45px_-15px_rgba(99,102,241,0.45)] ring-1 ring-indigo-100">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-900">Escrow #A2A-0482</span>
          <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-1.5 py-0.5 text-[9px] font-bold text-indigo-700">
            <Lock className="h-2.5 w-2.5" /> AUTHORIZED
          </span>
        </div>
        <div className="mt-3 space-y-2.5">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center gap-2">
              <span className="w-12 text-[10px] text-slate-500">{r.label}</span>
              <div className="h-2.5 flex-1 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`es-bar h-full rounded-full bg-gradient-to-r ${r.color}`}
                  style={{ "--es-w": r.w, animationDelay: r.delay } as React.CSSProperties}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
          <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
            <Truck className="h-3 w-3 text-indigo-500" /> DHL proof synced
          </span>
          <span className="text-sm font-extrabold text-slate-950 tabular-nums">$1,240.00</span>
        </div>
      </div>
      <div className="es-chip absolute -bottom-4 -right-3 sm:-right-6 inline-flex items-center gap-1.5 rounded-full bg-slate-950 px-3 py-1.5 text-[10px] font-semibold text-white shadow-lg">
        <CheckCircle2 className="h-3 w-3 text-indigo-300" /> Milestone 1 captured
      </div>
    </div>
  );
}

const VISUALS: Record<string, React.ComponentType> = {
  channel3: DealHunterVisual,
  bounties: BountyVisual,
  bryntum: EscrowVisual,
};

/* ------------------------------- Component ------------------------------- */

interface EngineShowcaseProps {
  onOpenEngine: (tab: WorkspaceTabId) => void;
}

export default function EngineShowcase({ onOpenEngine }: EngineShowcaseProps) {
  const [active, setActive] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [cycle, setCycle] = useState(0); // restarts the progress animation
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [inView, setInView] = useState(true);
  const [autoplay, setAutoplay] = useState(true);
  const stageRef = useRef<HTMLDivElement>(null);
  const touchX = useRef<number | null>(null);

  // Respect reduced-motion preference.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setAutoplay(!mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // Pause when the showcase scrolls out of view.
  useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.25,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const goTo = useCallback(
    (index: number) => {
      const next = (index + ENGINES.length) % ENGINES.length;
      setActive((cur) => {
        if (cur !== next) setPrev(cur);
        return next;
      });
      setCycle((c) => c + 1);
    },
    []
  );

  const paused = hovered || focused || !inView;
  const engine = ENGINES[active];

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      goTo(active + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      goTo(active - 1);
    }
  }

  return (
    <div
      ref={stageRef}
      className="relative mx-auto mt-12 w-full max-w-5xl px-2 sm:px-8"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocused(false);
      }}
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 45) goTo(active + (dx < 0 ? 1 : -1));
        touchX.current = null;
      }}
      aria-roledescription="carousel"
      aria-label="NexusPulse financial engines"
    >
      {/* Soft, edgeless ambient glow (crossfades per engine) */}
      <div aria-hidden="true" className="es-edge-fade pointer-events-none absolute inset-0 -z-10">
        {ENGINES.map((e, i) => (
          <div
            key={e.id}
            className="absolute inset-0 transition-opacity duration-1000 ease-out"
            style={{
              opacity: i === active ? 1 : 0,
              background: `radial-gradient(ellipse 55% 60% at 30% 50%, ${e.theme.glow}, transparent 70%), radial-gradient(ellipse 40% 50% at 78% 40%, ${e.theme.glow.replace("0.22", "0.12")}, transparent 70%)`,
            }}
          />
        ))}
      </div>

      {/* Step selector with live progress */}
      <div
        role="tablist"
        aria-label="Select engine"
        onKeyDown={handleKeyDown}
        className="relative mx-auto flex w-fit max-w-full items-center gap-1 rounded-full bg-white/70 p-1 shadow-[0_4px_20px_-6px_rgba(15,23,42,0.15)] ring-1 ring-slate-900/5 backdrop-blur"
      >
        {ENGINES.map((e, i) => {
          const isActive = i === active;
          const Icon = e.icon;
          return (
            <button
              key={e.id}
              type="button"
              role="tab"
              id={`es-tab-${e.id}`}
              aria-selected={isActive}
              aria-controls={`es-panel-${e.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => goTo(i)}
              className={`relative flex items-center gap-1.5 overflow-hidden rounded-full px-3 sm:px-4 py-2 text-[11px] font-bold transition-colors duration-300 ${
                isActive ? "bg-slate-950 text-white" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/80"
              }`}
            >
              <span className={`font-mono ${isActive ? "text-white/60" : "text-slate-400"}`}>{e.step}</span>
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{e.tag}</span>
              {isActive && (
                <span aria-hidden="true" className="absolute inset-x-3 bottom-[3px] h-[2px] rounded-full bg-white/15 overflow-hidden">
                  <span
                    key={cycle}
                    className={`es-progress block h-full rounded-full bg-gradient-to-r ${e.theme.gradient}`}
                    style={{
                      animationDuration: `${SLIDE_DURATION_MS}ms`,
                      animationPlayState: autoplay && !paused ? "running" : "paused",
                    }}
                    onAnimationEnd={() => {
                      if (autoplay) goTo(active + 1);
                    }}
                  />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Slides (stacked in one grid cell so height stays stable) */}
      <div className="relative mt-8 grid">
        {ENGINES.map((e, i) => {
          const Visual = VISUALS[e.id];
          const Icon = e.icon;
          const state = i === active ? "active" : i === prev ? "prev" : "next";
          return (
            <div
              key={e.id}
              id={`es-panel-${e.id}`}
              role="tabpanel"
              aria-labelledby={`es-tab-${e.id}`}
              aria-hidden={i !== active}
              inert={i !== active}
              data-state={state}
              className="engine-slide [grid-area:1/1] grid grid-cols-1 md:grid-cols-[1.05fr_1fr] items-center gap-10 md:gap-12 px-2 sm:px-6 py-4"
            >
              {/* Copy */}
              <div className="text-left order-2 md:order-1">
                <div className="es-rise flex items-center gap-2" style={{ animationDelay: "60ms" }}>
                  <span className={`inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${e.theme.gradient} shadow-md`}>
                    <Icon className="h-4 w-4 text-white" />
                  </span>
                  <span className={`text-[11px] font-mono font-bold uppercase tracking-[0.18em] ${e.theme.text}`}>
                    {e.step} / {e.tag}
                  </span>
                </div>
                <h3
                  className="es-rise mt-4 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950"
                  style={{ animationDelay: "140ms" }}
                >
                  {e.title}
                </h3>
                <p
                  className="es-rise mt-3 text-sm sm:text-[15px] leading-relaxed text-slate-600 max-w-md"
                  style={{ animationDelay: "220ms" }}
                >
                  {e.description}
                </p>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {e.highlights.map((h, hi) => (
                    <li
                      key={h}
                      className={`es-rise inline-flex items-center gap-1.5 rounded-full ${e.theme.softBg} ring-1 ${e.theme.ring} px-3 py-1 text-[11px] font-semibold ${e.theme.text}`}
                      style={{ animationDelay: `${300 + hi * 80}ms` }}
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      {h}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => onOpenEngine(e.id)}
                  className={`es-rise group mt-7 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-lg transition hover:scale-105 active:scale-95 ${e.theme.button}`}
                  style={{ animationDelay: "560ms" }}
                >
                  Open {e.tag}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>

              {/* Visual */}
              <div
                onClick={() => onOpenEngine(e.id)}
                title={`Open ${e.tag}`}
                className="order-1 md:order-2 relative flex items-center justify-center py-6 cursor-pointer"
              >
                <span
                  aria-hidden="true"
                  className={`es-orbit absolute h-56 w-56 sm:h-64 sm:w-64 rounded-full border border-dashed border-current ${e.theme.text} opacity-25`}
                />
                <span
                  aria-hidden="true"
                  className={`es-orbit-rev absolute h-40 w-40 sm:h-48 sm:w-48 rounded-full border border-current ${e.theme.text} opacity-15`}
                />
                <div className="es-float relative w-full">
                  <Visual />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Slide counter */}
      <div className="mt-6 flex items-center justify-center gap-2 text-[11px] font-mono text-slate-400" aria-live="polite">
        <span className={`font-bold ${engine.theme.text}`}>{engine.step}</span>
        <span className="h-px w-8 bg-slate-300" />
        <span>0{ENGINES.length}</span>
        <span className="ml-2 hidden sm:inline text-slate-400">
          {paused && autoplay ? "Paused" : autoplay ? "Auto-playing" : ""}
        </span>
      </div>
    </div>
  );
}
