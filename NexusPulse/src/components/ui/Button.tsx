"use client";

import React from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-zinc-950 text-white hover:bg-zinc-800 border border-zinc-950 disabled:bg-zinc-300 disabled:border-zinc-300 disabled:text-zinc-600",
  secondary:
    "bg-white text-zinc-900 border border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 disabled:bg-zinc-50 disabled:text-zinc-400",
  ghost:
    "bg-transparent text-zinc-700 border border-transparent hover:bg-zinc-100 hover:text-zinc-950 disabled:text-zinc-400",
  danger:
    "bg-white text-red-700 border border-red-200 hover:bg-red-50 hover:border-red-300 disabled:bg-zinc-50 disabled:text-zinc-400",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[12px]",
  md: "h-9 px-3.5 text-[13px]",
  lg: "h-10 px-4 text-[13px]",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "md", loading = false, disabled, className = "", children, type = "button", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-1.5 rounded-[6px] font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
});
