"use client";

import * as React from "react";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";

export type AppIconSize = "xs" | "sm" | "md" | "lg";

const SIZE_MAP: Record<AppIconSize, number> = {
  /** Micro inline status/caret indicators (14px) */
  xs: 14,
  /** Default UI baseline paired with 13-15px text (16px) */
  sm: 16,
  /** Section cards, modal headers, floating assistant trigger (18px) */
  md: 18,
  /** Primary feature headers & empty state anchors (20px) */
  lg: 20,
};

export interface AppIconProps
  extends Omit<
    React.SVGProps<SVGSVGElement>,
    "children" | "color" | "size" | "strokeWidth"
  > {
  /** Named icon element imported from @hugeicons/core-free-icons */
  icon: IconSvgElement;
  /** Optical size token or explicit pixel size; defaults to "sm" (16px) */
  size?: AppIconSize | number;
  /** Stroke thickness; defaults to unified 1.5px system weight */
  strokeWidth?: number;
  /**
   * Accessible label when the icon is standalone (e.g. not paired with visible text).
   * Omit for decorative/paired icons so they are cleanly hidden from screen readers.
   */
  label?: string;
}

/**
 * Single icon primitive for NexusPulse built on Hugeicons Stroke Rounded.
 * Enforces optical sizing, currentColor inheritance, uniform 1.5px stroke,
 * flex-shrink protection, and accessible semantics.
 */
export function AppIcon({
  icon,
  size = "sm",
  strokeWidth = 1.5,
  label,
  className = "",
  ...props
}: AppIconProps) {
  const pixelSize = typeof size === "number" ? size : SIZE_MAP[size];
  const mergedClassName = className ? `shrink-0 ${className}` : "shrink-0";

  return (
    <HugeiconsIcon
      icon={icon}
      size={pixelSize}
      strokeWidth={strokeWidth}
      color="currentColor"
      data-slot="icon"
      className={mergedClassName}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
      {...props}
    />
  );
}
