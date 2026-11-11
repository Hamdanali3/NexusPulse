"use client";

import React from "react";
import Link from "next/link";

interface NexusPulseLogoProps {
  onNavigateHome?: () => void;
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
}

/**
 * NexusPulse brand mark.
 * A single pulse line (AI agents acting) that settles into a dot (a completed
 * PayPal payment) inside a near-black tile. Deliberately minimal: one shape,
 * one accent, readable at 16px.
 */
export default function NexusPulseLogo({
  onNavigateHome,
  size = "md",
  showTagline = false,
}: NexusPulseLogoProps) {
  const tile = size === "sm" ? "h-6 w-6" : size === "lg" ? "h-9 w-9" : "h-7 w-7";
  const word = size === "sm" ? "text-sm" : size === "lg" ? "text-lg" : "text-[15px]";

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
      className="group inline-flex items-center gap-2.5 rounded-md"
    >
      <span className={`${tile} shrink-0 rounded-lg bg-zinc-950 p-[3px] transition-transform duration-200 group-hover:-rotate-3`}>
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-full w-full">
          <path
            d="M3.5 12.5h3.2l2-4.5 3.3 8.5 2.2-5.5h2.3"
            stroke="#ffffff"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="19.2" cy="11" r="1.9" fill="#8b92e9" />
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <span className={`${word} font-semibold tracking-tight text-zinc-950`}>NexusPulse</span>
        {showTagline && (
          <span className="mt-1 text-xs font-normal text-zinc-500">AI payments on PayPal</span>
        )}
      </span>
    </Link>
  );
}
