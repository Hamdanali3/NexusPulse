"use client";

import React from "react";
import Link from "next/link";

interface NexusPulseLogoProps {
  onNavigateHome?: () => void;
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
}

interface NexusPulseMarkProps {
  className?: string;
  animated?: boolean;
}

/**
 * Single source of truth for the NexusPulse connected-node SVG mark.
 */
export function NexusPulseMark({
  className = "h-full w-full block",
  animated = false,
}: NexusPulseMarkProps) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <rect width="64" height="64" rx="16" fill="#0b0b0d" />
      <path
        d="M16 47V18L48 47V18"
        fill="none"
        stroke="#ffffff"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={animated ? 106 : undefined}
        className={animated ? "np-intro-path" : undefined}
      />
      <circle
        cx="16"
        cy="47"
        r="4"
        fill="#0b0b0d"
        stroke="#ffffff"
        strokeWidth="2.5"
        className={animated ? "np-intro-node" : undefined}
      />
      <circle
        cx="16"
        cy="18"
        r="4"
        fill="#0b0b0d"
        stroke="#ffffff"
        strokeWidth="2.5"
        className={animated ? "np-intro-node" : undefined}
      />
      <circle
        cx="48"
        cy="47"
        r="4"
        fill="#0b0b0d"
        stroke="#ffffff"
        strokeWidth="2.5"
        className={animated ? "np-intro-node" : undefined}
      />
      <circle
        cx="48"
        cy="18"
        r="9"
        fill="none"
        stroke="#6a5cff"
        strokeOpacity="0.45"
        strokeWidth="2"
        className={animated ? "np-intro-ring" : undefined}
      />
      <circle
        cx="48"
        cy="18"
        r="5"
        fill="#6a5cff"
        className={animated ? "np-intro-beacon" : undefined}
      />
    </svg>
  );
}

/**
 * NexusPulse brand mark.
 * Connected-node "N" monogram with a violet pulse beacon on an ink-black tile,
 * paired with the two-tone NexusPulse wordmark.
 */
export default function NexusPulseLogo({
  onNavigateHome,
  size = "md",
  showTagline = false,
}: NexusPulseLogoProps) {
  const tile = size === "sm" ? "h-6 w-6" : size === "lg" ? "h-9 w-9" : "h-7 w-7";
  const word = size === "sm" ? "text-[15px]" : size === "lg" ? "text-[22px]" : "text-[17px]";
  const gap = size === "lg" ? "gap-2.5" : "gap-2";

  function handleClick() {
    onNavigateHome?.();
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  return (
    <Link
      href="/"
      onClick={handleClick}
      aria-label="NexusPulse home — AI payments on PayPal"
      title="NexusPulse — AI payments on PayPal"
      className={`group inline-flex items-center ${gap} rounded-md`}
    >
      <span className={`${tile} shrink-0 block transition-transform duration-200 group-hover:-rotate-3`}>
        <NexusPulseMark />
      </span>
      <span className="flex flex-col leading-none">
        <span className={`${word} font-semibold tracking-[-0.03em] leading-none text-[#0b0b0d]`}>
          Nexus<span className="text-[#4a3be8]">Pulse</span>
        </span>
        {showTagline && (
          <span className="mt-1 text-xs font-normal text-zinc-500">AI payments on PayPal</span>
        )}
      </span>
    </Link>
  );
}
