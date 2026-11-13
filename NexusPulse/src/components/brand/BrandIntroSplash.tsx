"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { NexusPulseMark } from "@/components/brand/NexusPulseLogo";

const INTRO_HOLD_MS = 7550;
const INTRO_EXIT_MS = 450;
const INTRO_TOTAL_MS = INTRO_HOLD_MS + INTRO_EXIT_MS; // 8000ms total

/**
 * 8-second opening & reload brand intro splash.
 * Renders a calm logo pop, connected-node stroke reveal, slogan detail,
 * and smooth dissolve before unmounting so nothing blocks the workspace.
 */
export default function BrandIntroSplash() {
  const [mounted, setMounted] = useState(true);
  const [exiting, setExiting] = useState(false);
  const timersRef = useRef<number[]>([]);

  const clearScheduled = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  }, []);

  const dismiss = useCallback(() => {
    clearScheduled();
    setExiting(true);
    const id = window.setTimeout(() => setMounted(false), 200);
    timersRef.current.push(id);
  }, [clearScheduled]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const prefersReducedMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    )?.matches;

    if (prefersReducedMotion) {
      timersRef.current.push(
        window.setTimeout(() => {
          setExiting(true);
          timersRef.current.push(window.setTimeout(() => setMounted(false), 120));
        }, 350)
      );
      return clearScheduled;
    }

    timersRef.current.push(
      window.setTimeout(() => setExiting(true), INTRO_HOLD_MS),
      window.setTimeout(() => setMounted(false), INTRO_TOTAL_MS)
    );

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      clearScheduled();
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [clearScheduled, dismiss]);

  if (!mounted) return null;

  return (
    <div
      role="region"
      aria-label="NexusPulse launch screen"
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#fafafa] px-6 select-none transition-[opacity,transform] duration-[450ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
        exiting ? "opacity-0 scale-[1.015] pointer-events-none" : "opacity-100 scale-100"
      }`}
    >
      {/* Subtle center radial wash behind the logo lockup */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(480px 320px at 50% 44%, rgba(74, 59, 232, 0.065), transparent 72%)",
        }}
      />

      <div className="relative flex flex-col items-center text-center max-w-lg">
        {/* Animated Logo Lockup */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5">
          <div className="np-intro-tile h-16 w-16 sm:h-[72px] sm:w-[72px] shrink-0">
            <NexusPulseMark animated />
          </div>

          <div className="np-intro-wordmark text-[38px] sm:text-[48px] font-semibold tracking-[-0.03em] leading-none text-[#0b0b0d]">
            Nexus<span className="text-[#4a3be8]">Pulse</span>
          </div>
        </div>

        {/* Hairline Divider & Slogan Detail */}
        <div
          aria-hidden="true"
          className="np-intro-rule mt-6 h-px w-20 bg-zinc-200"
        />

        <p className="np-intro-slogan mt-5 text-[17px] sm:text-[19px] font-semibold tracking-[-0.015em] text-zinc-950">
          Spend smarter. Pay people fairly. Release money when work is done.
        </p>

        <p className="np-intro-detail mt-2 text-[14px] text-zinc-600 leading-relaxed max-w-md">
          Track prices, review recurring subscriptions, pay verified contributors, and hold milestone funds on PayPal.
        </p>

        {/* Quiet 8-Second Progress Sweep */}
        <div
          aria-hidden="true"
          className="np-intro-detail mt-7 h-[2px] w-40 rounded-full bg-zinc-200 overflow-hidden"
        >
          <div className="np-intro-progress h-full w-full bg-[#4a3be8]" />
        </div>
      </div>

      {/* Accessible early-skip control */}
      <button
        type="button"
        onClick={dismiss}
        className="mt-8 text-[12px] font-medium text-zinc-600 hover:text-zinc-950 transition-colors"
      >
        Skip intro
      </button>
    </div>
  );
}
