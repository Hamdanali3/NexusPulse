"use client";

import React from "react";

export interface FormFieldProps {
  id: string;
  label: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

/** Accessible labeled form field with inline error + helper slot. */
export function FormField({
  id,
  label,
  helperText,
  error,
  required = false,
  children,
  className = "",
}: FormFieldProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label htmlFor={id} className="block text-[13px] font-medium text-zinc-900">
        {label}
        {required && (
          <span className="ml-0.5 text-red-700" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-[12px] text-red-700">
          {error}
        </p>
      ) : helperText ? (
        <p id={`${id}-helper`} className="text-[12px] text-zinc-600">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
