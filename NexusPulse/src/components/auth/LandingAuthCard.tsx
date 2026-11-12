"use client";

import React, { useState } from "react";
import {
  AlertCircleIcon,
  ArrowRight02Icon,
  CheckmarkCircle02Icon,
  Mail01Icon,
  SquareLock02Icon,
  User02Icon,
} from "@hugeicons/core-free-icons";
import { AppIcon } from "@/components/ui/Icon";
import {
  DEMO_EVALUATOR_ACCOUNTS,
  type UserProfile,
  type UserRole,
} from "@/lib/auth/auth-types";
import { formatUsd } from "@/lib/format";

interface LandingAuthCardProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export default function LandingAuthCard({ onLoginSuccess }: LandingAuthCardProps) {
  const [activeTab, setActiveTab] = useState<"demos" | "signin" | "signup">("demos");

  // Sign In state
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signInLoading, setSignInLoading] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);

  // Sign Up state
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpRole, setSignUpRole] = useState<UserRole>("CONSUMER");
  const [signUpLoading, setSignUpLoading] = useState(false);
  const [signUpError, setSignUpError] = useState<string | null>(null);
  const [signUpSuccess, setSignUpSuccess] = useState<string | null>(null);

  // Live client-side validations
  const nameError =
    signUpName.trim().length > 0 && signUpName.trim().length < 2
      ? "Full name must be at least 2 characters."
      : null;

  const emailError =
    signUpEmail.trim().length > 0 &&
    !/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/.test(signUpEmail.trim())
      ? "Please enter a valid email address."
      : null;

  async function handleDemoSelect(key: string) {
    setSignInLoading(true);
    setSignInError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demoKey: key }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        onLoginSuccess(data.user);
      } else {
        setSignInError(data.error || "Failed to log in with demo account.");
      }
    } catch {
      setSignInError("Connection error while accessing demo account.");
    } finally {
      setSignInLoading(false);
    }
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setSignInLoading(true);
    setSignInError(null);

    if (!signInEmail.trim()) {
      setSignInError("Email address is required.");
      setSignInLoading(false);
      return;
    }
    if (!/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/.test(signInEmail.trim())) {
      setSignInError("Please enter a valid email address.");
      setSignInLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: signInEmail.trim(),
          password: signInPassword,
        }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        onLoginSuccess(data.user);
      } else {
        setSignInError(data.error || "Invalid credentials.");
      }
    } catch {
      setSignInError("Network error during login.");
    } finally {
      setSignInLoading(false);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setSignUpLoading(true);
    setSignUpError(null);
    setSignUpSuccess(null);

    if (signUpName.trim().length < 2) {
      setSignUpError("Full name must be at least 2 characters.");
      setSignUpLoading(false);
      return;
    }
    if (!/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/.test(signUpEmail.trim())) {
      setSignUpError("Please enter a valid email address.");
      setSignUpLoading(false);
      return;
    }
    if (signUpPassword.length < 6) {
      setSignUpError("Password must be at least 6 characters.");
      setSignUpLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: signUpName.trim(),
          email: signUpEmail.trim(),
          password: signUpPassword,
          role: signUpRole,
        }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setSignUpSuccess(`Account created for ${data.user.fullName}!`);
        setTimeout(() => {
          onLoginSuccess(data.user);
        }, 700);
      } else {
        setSignUpError(data.error || "Failed to create account.");
      }
    } catch {
      setSignUpError("Network error during sign up.");
    } finally {
      setSignUpLoading(false);
    }
  }

  return (
    <div id="landing-auth-gateway" className="w-full max-w-xl mx-auto rounded-[12px] border border-zinc-200 bg-white p-5 sm:p-6 text-left">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-indigo-600" aria-hidden="true" />
          <span className="text-[13px] font-medium text-zinc-950">
            Sign in to NexusPulse
          </span>
        </div>
        <span className="text-[12px] text-zinc-600">
          Demo access
        </span>
      </div>

      <p className="mt-2 text-[13px] text-zinc-600 leading-relaxed">
        Sign in, create an account, or pick a sample profile to explore price watch, verified tasks, and milestone escrow.
      </p>

      {/* Tabs */}
      <div role="tablist" className="mt-4 flex rounded-[6px] border border-zinc-200 bg-zinc-100 p-0.5">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "demos"}
          onClick={() => setActiveTab("demos")}
          className={`flex-1 rounded-[4px] py-1.5 text-[12px] font-medium transition-colors ${
            activeTab === "demos"
              ? "bg-white text-zinc-950"
              : "text-zinc-600 hover:text-zinc-950"
          }`}
        >
          Sample accounts
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "signin"}
          onClick={() => setActiveTab("signin")}
          className={`flex-1 rounded-[4px] py-1.5 text-[12px] font-medium transition-colors ${
            activeTab === "signin"
              ? "bg-white text-zinc-950"
              : "text-zinc-600 hover:text-zinc-950"
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "signup"}
          onClick={() => setActiveTab("signup")}
          className={`flex-1 rounded-[4px] py-1.5 text-[12px] font-medium transition-colors ${
            activeTab === "signup"
              ? "bg-white text-zinc-950"
              : "text-zinc-600 hover:text-zinc-950"
          }`}
        >
          Sign up
        </button>
      </div>

      {/* TAB 1: SAMPLE ACCOUNTS */}
      {activeTab === "demos" && (
        <div className="mt-4 space-y-2">
          {signInError && (
            <div className="rounded-[6px] border border-red-200 bg-red-50 p-2.5 flex items-start gap-2 text-[13px] text-red-700">
              <AppIcon icon={AlertCircleIcon} size="sm" className="mt-0.5" />
              <span>{signInError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Object.entries(DEMO_EVALUATOR_ACCOUNTS).map(([key, demo]) => (
              <button
                key={key}
                type="button"
                disabled={signInLoading}
                onClick={() => handleDemoSelect(key)}
                className="text-left rounded-[8px] border border-zinc-200 bg-white hover:border-indigo-600 hover:bg-zinc-50 p-3 transition-colors flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-medium text-zinc-950 group-hover:text-indigo-600 transition-colors">
                      {demo.fullName}
                    </span>
                    <span className="text-[12px] text-zinc-600 shrink-0">
                      {demo.badgeLabel}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[12px] text-zinc-600 line-clamp-2">
                    {demo.roleTitle}
                  </div>
                </div>

                <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-zinc-200 text-[12px]">
                  <span className="text-zinc-700 tabular-nums font-medium">{formatUsd(demo.walletBalanceUsd)}</span>
                  <span className="font-medium text-indigo-600 flex items-center gap-0.5">
                    <span>Use account</span>
                    <AppIcon icon={ArrowRight02Icon} size="xs" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: SIGN IN */}
      {activeTab === "signin" && (
        <form onSubmit={handleSignIn} className="mt-4 space-y-3">
          {signInError && (
            <div className="rounded-[6px] border border-red-200 bg-red-50 p-2.5 flex items-start gap-2 text-xs text-red-700">
              <AppIcon icon={AlertCircleIcon} size="sm" className="mt-0.5" />
              <span>{signInError}</span>
            </div>
          )}

          <div>
            <label htmlFor="landing-signin-email" className="block text-[13px] font-medium text-zinc-700">
              Email
            </label>
            <div className="relative mt-1">
              <AppIcon icon={Mail01Icon} size="sm" className="pointer-events-none absolute left-2.5 top-2.5 text-zinc-500" />
              <input
                id="landing-signin-email"
                type="email"
                required
                autoComplete="email"
                value={signInEmail}
                onChange={(e) => setSignInEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full h-9 rounded-[6px] border border-zinc-200 bg-white pl-8 pr-3 text-[13px] text-zinc-950 placeholder:text-zinc-500 focus:border-indigo-600"
              />
            </div>
          </div>

          <div>
            <label htmlFor="landing-signin-password" className="block text-[13px] font-medium text-zinc-700">
              Password
            </label>
            <div className="relative mt-1">
              <AppIcon icon={SquareLock02Icon} size="sm" className="pointer-events-none absolute left-2.5 top-2.5 text-zinc-500" />
              <input
                id="landing-signin-password"
                type="password"
                required
                autoComplete="current-password"
                value={signInPassword}
                onChange={(e) => setSignInPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-9 rounded-[6px] border border-zinc-200 bg-white pl-8 pr-3 text-[13px] text-zinc-950 placeholder:text-zinc-500 focus:border-indigo-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={signInLoading}
            className="w-full h-9 inline-flex items-center justify-center gap-1.5 rounded-[6px] bg-zinc-950 hover:bg-zinc-800 text-[13px] font-medium text-white transition-colors"
          >
            {signInLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      )}

      {/* TAB 3: SIGN UP */}
      {activeTab === "signup" && (
        <form onSubmit={handleSignUp} className="mt-4 space-y-3">
          {signUpError && (
            <div className="rounded-[6px] border border-red-200 bg-red-50 p-2.5 flex items-start gap-2 text-xs text-red-700">
              <AppIcon icon={AlertCircleIcon} size="sm" className="mt-0.5" />
              <span>{signUpError}</span>
            </div>
          )}

          {signUpSuccess && (
            <div className="rounded-[6px] border border-emerald-200 bg-emerald-50 p-2.5 flex items-start gap-2 text-xs text-emerald-700">
              <AppIcon icon={CheckmarkCircle02Icon} size="sm" className="mt-0.5" />
              <span>{signUpSuccess}</span>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="landing-signup-name" className="block text-[13px] font-medium text-zinc-700">
                Full name
              </label>
              {nameError && <span className="text-[12px] text-red-700">{nameError}</span>}
            </div>
            <div className="relative mt-1">
              <AppIcon icon={User02Icon} size="sm" className="pointer-events-none absolute left-2.5 top-2.5 text-zinc-500" />
              <input
                id="landing-signup-name"
                type="text"
                required
                autoComplete="name"
                value={signUpName}
                onChange={(e) => setSignUpName(e.target.value)}
                placeholder="Alex Rivera"
                className={`w-full h-9 rounded-[6px] border pl-8 pr-3 text-[13px] text-zinc-950 placeholder:text-zinc-500 ${
                  nameError
                    ? "border-red-500 focus:border-red-600"
                    : "border-zinc-200 focus:border-indigo-600"
                }`}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="landing-signup-email" className="block text-[13px] font-medium text-zinc-700">
                Email
              </label>
              {emailError && <span className="text-[12px] text-red-700">{emailError}</span>}
            </div>
            <div className="relative mt-1">
              <AppIcon icon={Mail01Icon} size="sm" className="pointer-events-none absolute left-2.5 top-2.5 text-zinc-500" />
              <input
                id="landing-signup-email"
                type="email"
                required
                autoComplete="email"
                value={signUpEmail}
                onChange={(e) => setSignUpEmail(e.target.value)}
                placeholder="name@example.com"
                className={`w-full h-9 rounded-[6px] border pl-8 pr-3 text-[13px] text-zinc-950 placeholder:text-zinc-500 ${
                  emailError
                    ? "border-red-500 focus:border-red-600"
                    : "border-zinc-200 focus:border-indigo-600"
                }`}
              />
            </div>
          </div>

          <div>
            <label htmlFor="landing-signup-password" className="block text-[13px] font-medium text-zinc-700">
              Password
            </label>
            <div className="relative mt-1">
              <AppIcon icon={SquareLock02Icon} size="sm" className="pointer-events-none absolute left-2.5 top-2.5 text-zinc-500" />
              <input
                id="landing-signup-password"
                type="password"
                required
                autoComplete="new-password"
                value={signUpPassword}
                onChange={(e) => setSignUpPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full h-9 rounded-[6px] border border-zinc-200 bg-white pl-8 pr-3 text-[13px] text-zinc-950 placeholder:text-zinc-500 focus:border-indigo-600"
              />
            </div>
          </div>

          <div>
            <label htmlFor="landing-signup-role" className="block text-[13px] font-medium text-zinc-700">
              Role
            </label>
            <select
              id="landing-signup-role"
              value={signUpRole}
              onChange={(e) => setSignUpRole(e.target.value as UserRole)}
              className="mt-1 w-full h-9 rounded-[6px] border border-zinc-200 bg-white px-2.5 text-[13px] text-zinc-900 focus:border-indigo-600"
            >
              <option value="CONSUMER">Buyer (Price watch &amp; subscriptions)</option>
              <option value="ORACLE_WORKER">Contributor (Verified tasks &amp; payouts)</option>
              <option value="ENTERPRISE_AGENT">Team lead (Milestone escrow)</option>
              <option value="ADMIN">Reviewer (Full workspace access)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={signUpLoading || Boolean(nameError) || Boolean(emailError)}
            className="w-full h-9 inline-flex items-center justify-center gap-1.5 rounded-[6px] bg-zinc-950 hover:bg-zinc-800 text-[13px] font-medium text-white transition-colors disabled:opacity-50"
          >
            {signUpLoading ? "Creating account..." : "Create account"}
          </button>
        </form>
      )}
    </div>
  );
}
