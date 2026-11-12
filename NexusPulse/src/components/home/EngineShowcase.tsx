"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight02Icon,
  Camera01Icon,
  CheckmarkBadge02Icon,
  CheckmarkCircle02Icon,
  DeliveryTruck01Icon,
  SecurityLockIcon,
  Tag01Icon,
  TaskDone01Icon,
  TradeDownIcon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import { AppIcon } from "@/components/ui/Icon";
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
  icon: IconSvgElement;
  highlights: string[];
  theme: {
    text: string;
    softBg: string;
    ring: string;
    bar: string;
  };
};

const ENGINES: EngineDef[] = [
  {
    id: "channel3",
    step: "01",
    tag: "Price watch",
    title: "Track prices and cut recurring waste",
    description:
      "Tracks price drops across merchants and spots idle subscriptions to downgrade or cancel.",
    icon: Tag01Icon,
    highlights: ["Merchant price alerts", "Subscription review", "PayPal Checkout"],
    theme: {
      text: "text-indigo-600",
      softBg: "bg-zinc-50",
      ring: "ring-zinc-200",
      bar: "bg-indigo-600",
    },
  },
  {
    id: "bounties",
    step: "02",
    tag: "Verified tasks",
    title: "Quick verification tasks with fast payouts",
    description:
      "Complete short checks reviewed against evidence and receive direct PayPal payouts.",
    icon: TaskDone01Icon,
    highlights: ["Short checks", "Evidence review", "PayPal payouts"],
    theme: {
      text: "text-indigo-600",
      softBg: "bg-zinc-50",
      ring: "ring-zinc-200",
      bar: "bg-indigo-600",
    },
  },
  {
    id: "bryntum",
    step: "03",
    tag: "Milestone escrow",
    title: "Hold payments until work is verified",
    description:
      "Locks project funds on a milestone schedule and releases them only after delivery is confirmed.",
    icon: SecurityLockIcon,
    highlights: ["Milestone holds", "Schedule tracking", "Delivery review"],
    theme: {
      text: "text-indigo-600",
      softBg: "bg-zinc-50",
      ring: "ring-zinc-200",
      bar: "bg-indigo-600",
    },
  },
];

/* ----------------------------- Engine visuals ----------------------------- */

function DealHunterVisual() {
  return (
    <div className="relative w-full max-w-[280px] mx-auto">
      <div className="rounded-[12px] border border-zinc-200 bg-white p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-[6px] border border-zinc-200 bg-zinc-50 flex items-center justify-center">
            <AppIcon icon={Tag01Icon} size="sm" className="text-zinc-700" />
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-medium text-zinc-900 truncate">Jetson Orin Nano Kit</div>
            <div className="text-[12px] text-zinc-600">Price alert reached</div>
          </div>
        </div>
        <svg viewBox="0 0 200 56" className="mt-3 h-14 w-full" aria-hidden="true">
          <path
            d="M0 10 L30 14 L60 9 L90 22 L120 20 L150 36 L175 34 L200 46"
            fill="none"
            stroke="#4F46E5"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="200" cy="46" r="3.5" fill="#4F46E5" />
        </svg>
        <div className="mt-2 flex items-end justify-between">
          <div>
            <div className="text-[12px] text-zinc-600 line-through tabular-nums">$349.00</div>
            <div className="text-lg font-semibold text-zinc-950 tabular-nums">$279.00</div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-[6px] bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[12px] font-medium text-emerald-700">
            <AppIcon icon={TradeDownIcon} size="xs" /> −20%
          </span>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between rounded-[6px] border border-zinc-200 bg-white px-3 py-1.5 text-[12px] text-zinc-700">
        <span>Unused plan paused</span>
        <span className="font-medium text-emerald-700 tabular-nums">+$38.00/mo saved</span>
      </div>
    </div>
  );
}

function BountyVisual() {
  return (
    <div className="relative w-full max-w-[280px] mx-auto">
      <div className="relative aspect-[4/3] rounded-[12px] border border-zinc-200 bg-zinc-900 overflow-hidden flex flex-col items-center justify-center p-4 text-center">
        <AppIcon icon={Camera01Icon} size={28} className="text-zinc-300 mb-2" />
        <span className="text-[13px] font-medium text-white">Inspection photo verified</span>
        <span className="mt-1 text-[12px] text-zinc-400">Matches required location &amp; checklist</span>
      </div>
      <div className="mt-2 flex items-center justify-between rounded-[6px] border border-zinc-200 bg-white px-3 py-1.5 text-[12px] text-zinc-700">
        <span className="inline-flex items-center gap-1.5">
          <AppIcon icon={CheckmarkBadge02Icon} size="sm" className="text-emerald-700" />
          Payout sent
        </span>
        <span className="font-medium text-zinc-950 tabular-nums">$4.50</span>
      </div>
    </div>
  );
}

function EscrowVisual() {
  const rows = [
    { label: "Deposit", pct: "100%" },
    { label: "Delivery", pct: "65%" },
    { label: "Sign-off", pct: "0%" },
  ];
  return (
    <div className="relative w-full max-w-[280px] mx-auto">
      <div className="rounded-[12px] border border-zinc-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium text-zinc-900">Escrow milestone #0482</span>
          <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-indigo-600">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
            Held
          </span>
        </div>
        <div className="mt-3 space-y-2.5">
          {rows.map((r) => (
            <div key={r.label} className="space-y-1">
              <div className="flex items-center justify-between text-[12px] text-zinc-600">
                <span>{r.label}</span>
                <span className="tabular-nums">{r.pct}</span>
              </div>
              <div className="h-1.5 w-full rounded-[6px] bg-zinc-100 overflow-hidden">
                <div className="h-full bg-indigo-600" style={{ width: r.pct }} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-2.5">
          <span className="inline-flex items-center gap-1 text-[12px] text-zinc-600">
            <AppIcon icon={DeliveryTruck01Icon} size="xs" className="text-zinc-600" /> Shipment tracked
          </span>
          <span className="text-[14px] font-semibold text-zinc-950 tabular-nums">$1,240.00</span>
        </div>
      </div>
      <div className="es-chip absolute -bottom-3 -right-2 sm:-right-4 inline-flex items-center gap-1.5 rounded-[6px] border border-zinc-800 bg-zinc-950 px-2.5 py-1 text-[11px] font-medium text-white shadow-sm">
        <AppIcon icon={CheckmarkCircle02Icon} size={13} className="text-indigo-300" /> Milestone 1 captured
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
      {/* Step selector */}
      <div
        role="tablist"
        aria-label="Select capability"
        onKeyDown={handleKeyDown}
        className="mx-auto flex w-fit max-w-full items-center gap-1 rounded-[6px] border border-zinc-200 bg-white p-1"
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
              className={`relative flex items-center gap-1.5 overflow-hidden rounded-[6px] px-3 sm:px-4 py-1.5 text-[13px] font-medium transition-colors duration-150 ${
                isActive ? "bg-zinc-950 text-white" : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100"
              }`}
            >
              <span className={`font-mono text-[12px] ${isActive ? "text-zinc-300" : "text-zinc-500"}`}>{e.step}</span>
              <AppIcon icon={Icon} size="sm" />
              <span className="hidden sm:inline">{e.tag}</span>
              {isActive && (
                <span aria-hidden="true" className="absolute inset-x-3 bottom-[2px] h-[2px] bg-white/20 overflow-hidden">
                  <span
                    key={cycle}
                    className="es-progress block h-full bg-indigo-400"
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
      <div className="relative mt-6 grid rounded-[12px] border border-zinc-200 bg-white p-6">
        {ENGINES.map((e, i) => {
          const Visual = VISUALS[e.id];
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
              className="engine-slide [grid-area:1/1] grid grid-cols-1 md:grid-cols-[1.05fr_1fr] items-center gap-8"
            >
              {/* Copy */}
              <div className="text-left order-2 md:order-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] border border-zinc-200 bg-zinc-50 text-zinc-900">
                    <AppIcon icon={e.icon} size="sm" />
                  </span>
                  <span className="text-[13px] font-medium text-indigo-600">
                    {e.tag}
                  </span>
                </div>
                <h3 className="mt-4 text-[24px] leading-[1.2] font-semibold tracking-[-0.015em] text-zinc-950">
                  {e.title}
                </h3>
                <p className="mt-3 text-[15px] leading-[1.55] text-zinc-600 max-w-md">
                  {e.description}
                </p>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {e.highlights.map((h) => (
                    <li
                      key={h}
                      className="inline-flex items-center gap-1.5 rounded-[6px] border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[12px] font-medium text-zinc-700"
                    >
                      <AppIcon icon={CheckmarkCircle02Icon} size="xs" className="text-zinc-600" />
                      {h}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => onOpenEngine(e.id)}
                  className="mt-6 inline-flex h-9 items-center gap-2 rounded-[6px] bg-zinc-950 hover:bg-zinc-800 px-4 text-[13px] font-medium text-white transition-colors duration-150"
                >
                  Open {e.tag}
                  <AppIcon icon={ArrowRight02Icon} size="sm" />
                </button>
              </div>

              {/* Visual */}
              <div
                onClick={() => onOpenEngine(e.id)}
                title={`Open ${e.tag}`}
                className="order-1 md:order-2 flex items-center justify-center py-4 cursor-pointer"
              >
                <div className="w-full">
                  <Visual />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Slide counter */}
      <div className="mt-4 flex items-center justify-center gap-2 text-[12px] text-zinc-600" aria-live="polite">
        <span className="font-mono font-medium text-zinc-950">{engine.step}</span>
        <span className="h-px w-6 bg-zinc-300" />
        <span className="font-mono">0{ENGINES.length}</span>
      </div>
    </div>
  );
}
