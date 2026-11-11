"use client";

import React from "react";
import Link from "next/link";

interface NexusPulseLogoProps {
  onNavigateHome?: () => void;
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
}

/**
 * Redesigned NexusPulse Brand Emblem:
 * Directly illustrates and communicates the purpose of the platform:
 * Converging AI Agent Intelligence (Indigo) with PayPal Smart Payments (Sky)
 * through a secure, verified Autonomous Clearinghouse Shield (Emerald).
 */
export default function NexusPulseLogo({
  onNavigateHome,
  size = "md",
  showTagline = true,
}: NexusPulseLogoProps) {
  const iconDimensions =
    size === "sm"
      ? "h-8 w-8"
      : size === "lg"
        ? "h-11 w-11"
        : "h-9 w-9";

  const textSize =
    size === "sm"
      ? "text-sm"
      : size === "lg"
        ? "text-xl"
        : "text-base sm:text-lg";

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
      aria-label="NexusPulse — Return to Overview | Autonomous AI & PayPal Financial Clearinghouse"
      title="NexusPulse — Autonomous AI & PayPal Financial Clearinghouse"
      className="group inline-flex items-center gap-3 rounded-xl py-1 pr-2 focus:outline-none transition-all duration-200"
    >
      {/* Brand Emblem Icon: Interlocking AI & PayPal Clearinghouse Gateway */}
      <div
        className={`logo-mark relative ${iconDimensions} shrink-0 rounded-xl bg-slate-950 p-1 shadow-sm shadow-sky-500/15 ring-1 ring-slate-800 transition-all duration-300 group-hover:ring-sky-500/80 group-hover:shadow-sky-500/30 group-hover:scale-105`}
      >
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-full block"
          aria-hidden="true"
        >
          <defs>
            {/* Primary AI -> PayPal Gradient */}
            <linearGradient id="npAiToPaypal" x1="4" y1="8" x2="44" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#818CF8" />
              <stop offset="45%" stopColor="#0EA5E9" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>

            {/* Core Shield Gradient */}
            <linearGradient id="npShieldFill" x1="16" y1="12" x2="32" y2="36" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0284C7" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.15" />
            </linearGradient>

            {/* Glowing Pulse Vector */}
            <linearGradient id="npPulseGlow" x1="8" y1="24" x2="40" y2="24" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="50%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#34D399" />
            </linearGradient>
          </defs>

          {/* Outer Rounded Squircle Base */}
          <rect
            x="3"
            y="3"
            width="42"
            height="42"
            rx="12"
            fill="#090D16"
            stroke="url(#npAiToPaypal)"
            strokeWidth="1.75"
          />

          {/* Central Security Shield (Zero-Dispute Escrow Trust Layer) */}
          <path
            d="M24 10L35 15V24C35 30.5 30.3 36.4 24 38C17.7 36.4 13 30.5 13 24V15L24 10Z"
            fill="url(#npShieldFill)"
            stroke="rgba(14, 165, 233, 0.4)"
            strokeWidth="1.2"
          />

          {/* AI Neural Node (Top-Left) */}
          <circle cx="18" cy="18" r="2.2" fill="#818CF8" />
          {/* PayPal Payment Settlement Node (Bottom-Right) */}
          <circle cx="30" cy="30" r="2.2" fill="#38BDF8" />
          {/* Verified Human Oracle Node (Bottom-Left) */}
          <circle cx="18" cy="30" r="2.2" fill="#34D399" />

          {/* Active Synapse Connections */}
          <line x1="18" y1="18" x2="30" y2="30" stroke="rgba(129, 140, 248, 0.3)" strokeWidth="1" strokeDasharray="2 2" />
          <line x1="18" y1="30" x2="30" y2="30" stroke="rgba(56, 189, 248, 0.3)" strokeWidth="1" strokeDasharray="2 2" />

          {/* Core Dynamic Financial Pulse Wave */}
          <path
            d="M10 24H16L19 17L24 31L28 20L31 24H38"
            stroke="url(#npPulseGlow)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Brand Name & Purpose Descriptor */}
      <div className="flex flex-col text-left">
        <div className="flex items-center gap-1.5">
          <span className={`${textSize} font-extrabold tracking-tight text-slate-950 transition-colors group-hover:text-sky-600`}>
            Nexus<span className="text-sky-600">Pulse</span>
          </span>
          <span className="hidden sm:inline-flex items-center rounded-md bg-sky-50 border border-sky-200/80 px-1.5 py-0.2 text-[10px] font-bold text-sky-700 tracking-tight">
            AI on PayPal
          </span>
        </div>
        {showTagline && (
          <span className="text-[11px] font-medium text-slate-500 leading-tight flex items-center gap-1">
            <span>Autonomous Financial Clearinghouse</span>
          </span>
        )}
      </div>
    </Link>
  );
}
