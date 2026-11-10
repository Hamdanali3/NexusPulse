"use client";

import React from "react";
import Link from "next/link";

interface NexusPulseLogoProps {
  onNavigateHome?: () => void;
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
}

/**
 * Bespoke geometric SVG brand logo for NexusPulse.
 * Represents the 3 interconnected nodes (AI Agents, Human Oracles, Smart Payments)
 * around an isometric clearinghouse core with an animated financial pulse wave.
 * Clicking the logo always directs the user to the homepage ("/") and resets to the primary overview.
 */
export default function NexusPulseLogo({
  onNavigateHome,
  size = "md",
  showTagline = true,
}: NexusPulseLogoProps) {
  const dimensions =
    size === "sm"
      ? "h-8 w-8"
      : size === "lg"
        ? "h-11 w-11"
        : "h-9 w-9";

  function handleClick() {
    if (onNavigateHome) {
      onNavigateHome();
    }
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  return (
    <Link
      href="/"
      onClick={handleClick}
      aria-label="NexusPulse — Go to Homepage"
      className="group inline-flex items-center gap-3 rounded-xl py-1 pr-2 focus:outline-none"
    >
      <div
        className={`logo-mark relative ${dimensions} shrink-0 rounded-xl bg-slate-950 p-0.5 shadow-md shadow-sky-500/10 ring-1 ring-slate-800 transition-all duration-300 group-hover:ring-sky-400/60 group-hover:shadow-sky-500/25`}
      >
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-full block"
          aria-hidden="true"
        >
          <defs>
            <linearGradient
              id="npLogoGrad"
              x1="6"
              y1="6"
              x2="58"
              y2="58"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="50%" stopColor="#0EA5E9" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
            <linearGradient
              id="npWaveGrad"
              x1="12"
              y1="32"
              x2="52"
              y2="32"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="50%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#34D399" />
            </linearGradient>
          </defs>

          {/* Outer Squircle Frame */}
          <rect
            x="4"
            y="4"
            width="56"
            height="56"
            rx="15"
            fill="#050811"
            stroke="url(#npLogoGrad)"
            strokeWidth="2.5"
          />

          {/* Isometric Hexagon Clearinghouse Mesh */}
          <polygon
            points="32,11 50,21.5 50,42.5 32,53 14,42.5 14,21.5"
            fill="rgba(14, 165, 233, 0.07)"
            stroke="rgba(148, 163, 184, 0.22)"
            strokeWidth="1.25"
            className="transition-transform duration-500 origin-center group-hover:scale-105"
          />

          {/* 3 Nodes: AI Agents (Indigo), Human Oracles (Emerald), Smart Payments (Sky) */}
          <circle cx="32" cy="11" r="3.2" fill="#818CF8" />
          <circle cx="14" cy="42.5" r="3.2" fill="#34D399" />
          <circle cx="50" cy="42.5" r="3.2" fill="#38BDF8" />

          {/* Animated Pulse Wave */}
          <path
            d="M13 33H22L26.5 20.5L32.5 43.5L37.5 26.5L41 33H51"
            stroke="url(#npWaveGrad)"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="nexus-pulse-path"
          />
        </svg>
      </div>

      <div className="flex flex-col text-left">
        <div className="flex items-center gap-2">
          <span className="text-base sm:text-lg font-extrabold tracking-tight text-white transition-colors group-hover:text-sky-100">
            Nexus<span className="bg-gradient-to-r from-sky-400 via-indigo-400 to-emerald-400 bg-clip-text text-transparent">Pulse</span>
          </span>
          <span className="hidden xl:inline-flex items-center rounded-full border border-slate-800 bg-slate-900/90 px-2 py-0.5 text-[10px] font-medium tracking-wide text-slate-400">
            PayPal AI Clearinghouse
          </span>
        </div>
        {showTagline && (
          <span className="text-[11px] text-slate-400 transition-colors group-hover:text-slate-300">
            AI Agents • Human Oracles • Smart Payments
          </span>
        )}
      </div>
    </Link>
  );
}
