"use client";

import React from "react";
import Link from "next/link";

interface NexusPulseLogoProps {
  onNavigateHome?: () => void;
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
}

/**
 * World-class bespoke brand emblem for NexusPulse.
 * Geometric squircle housing the 3-node clearinghouse network with an animated pulse wave.
 * High-contrast, sharp, and pixel-perfect on both light and white background themes.
 */
export default function NexusPulseLogo({
  onNavigateHome,
  size = "md",
  showTagline = false,
}: NexusPulseLogoProps) {
  const dimensions =
    size === "sm"
      ? "h-8 w-8"
      : size === "lg"
        ? "h-10 w-10"
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
      aria-label="NexusPulse — Return to Overview"
      className="group inline-flex items-center gap-2.5 rounded-lg py-1 pr-1 focus:outline-none transition-transform duration-200"
    >
      <div
        className={`logo-mark relative ${dimensions} shrink-0 rounded-xl bg-slate-950 p-0.5 shadow-sm shadow-sky-500/10 ring-1 ring-slate-800 transition-all duration-300 group-hover:ring-sky-500/60 group-hover:shadow-sky-500/20`}
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

          {/* Squircle frame */}
          <rect
            x="4"
            y="4"
            width="56"
            height="56"
            rx="16"
            fill="#050811"
            stroke="url(#npLogoGrad)"
            strokeWidth="2.2"
          />

          {/* Isometric Hexagon Clearinghouse Mesh */}
          <polygon
            points="32,12 49,22 49,42 32,52 15,42 15,22"
            fill="rgba(14, 165, 233, 0.08)"
            stroke="rgba(148, 163, 184, 0.25)"
            strokeWidth="1.2"
          />

          {/* 3 Node Indicators: AI (Indigo), Human Oracles (Emerald), Payments (Sky) */}
          <circle cx="32" cy="12" r="2.8" fill="#818CF8" />
          <circle cx="15" cy="42" r="2.8" fill="#34D399" />
          <circle cx="49" cy="42" r="2.8" fill="#38BDF8" />

          {/* Animated Pulse Wave */}
          <path
            d="M14 32H22L26.5 21L32 43L37 27L40.5 32H50"
            stroke="url(#npWaveGrad)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="nexus-pulse-path"
          />
        </svg>
      </div>

      <div className="flex flex-col text-left">
        <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 transition-colors group-hover:text-sky-600">
          Nexus<span className="text-sky-600">Pulse</span>
        </span>
        {showTagline && (
          <span className="text-[11px] font-medium text-slate-500">
            Autonomous Financial Clearinghouse
          </span>
        )}
      </div>
    </Link>
  );
}
