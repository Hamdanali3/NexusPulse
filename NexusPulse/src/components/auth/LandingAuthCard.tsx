"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Bot,
  CheckCircle2,
  Lock,
  Mail,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  User,
  UserCheck,
} from "lucide-react";
import {
  DEMO_EVALUATOR_ACCOUNTS,
  type UserProfile,
  type UserRole,
} from "@/lib/auth/auth-types";

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
    <div id="landing-auth-gateway" className="w-full max-w-xl mx-auto rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-md shadow-zinc-950/5 text-left">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
          <span className="text-xs font-bold text-zinc-950 uppercase tracking-wider">
            Sign In to Unlock Project Access
          </span>
        </div>
        <span className="rounded bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-mono px-2 py-0.5 font-medium">
          Instant Evaluator Access
        </span>
      </div>

      <p className="mt-2 text-xs text-zinc-500 leading-relaxed">
        Sign in, create a custom account with name &amp; email checks, or select a pre-configured Evaluator Demo Persona to access the 3 engines, Autonomous CFO, and PayPal clearinghouse.
      </p>

      {/* Tabs */}
      <div role="tablist" className="mt-4 flex rounded-lg bg-zinc-100 p-0.5">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "demos"}
          onClick={() => setActiveTab("demos")}
          className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition ${
            activeTab === "demos"
              ? "bg-white text-zinc-950 shadow-2xs"
              : "text-zinc-500 hover:text-zinc-950"
          }`}
        >
          Evaluator Demos (1-Click)
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "signin"}
          onClick={() => setActiveTab("signin")}
          className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition ${
            activeTab === "signin"
              ? "bg-white text-zinc-950 shadow-2xs"
              : "text-zinc-500 hover:text-zinc-950"
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "signup"}
          onClick={() => setActiveTab("signup")}
          className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition ${
            activeTab === "signup"
              ? "bg-white text-zinc-950 shadow-2xs"
              : "text-zinc-500 hover:text-zinc-950"
          }`}
        >
          Sign Up
        </button>
      </div>

      {/* TAB 1: 1-CLICK DEMO ACCOUNTS */}
      {activeTab === "demos" && (
        <div className="mt-4 space-y-2">
          {signInError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-2.5 flex items-start gap-2 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
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
                className="text-left rounded-xl border border-zinc-200 bg-white hover:border-indigo-400 hover:bg-indigo-50/20 p-3 transition flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-zinc-900 group-hover:text-indigo-600 transition truncate">
                      {demo.fullName}
                    </span>
                    <span className={`text-[9px] font-mono font-medium rounded px-1.5 py-0.2 border shrink-0 ${demo.badgeColor}`}>
                      {demo.badgeLabel}
                    </span>
                  </div>
                  <div className="mt-1 text-[11px] text-zinc-500 line-clamp-1">
                    {demo.roleTitle}
                  </div>
                </div>

                <div className="mt-2.5 flex items-center justify-between pt-1.5 border-t border-zinc-100 text-[10px]">
                  <span className="text-zinc-400 font-mono">${demo.walletBalanceUsd.toFixed(0)}</span>
                  <span className="font-semibold text-indigo-600 flex items-center gap-0.5">
                    <span>Unlock</span>
                    <ArrowRight className="h-2.5 w-2.5" />
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
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-2.5 flex items-start gap-2 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{signInError}</span>
            </div>
          )}

          <div>
            <label htmlFor="landing-signin-email" className="block text-xs font-semibold text-zinc-700">
              Email Address
            </label>
            <div className="relative mt-1">
              <Mail className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
              <input
                id="landing-signin-email"
                type="email"
                required
                autoComplete="email"
                value={signInEmail}
                onChange={(e) => setSignInEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-lg border border-zinc-200 bg-white py-1.5 pl-8 pr-3 text-xs placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="landing-signin-password" className="block text-xs font-semibold text-zinc-700">
              Password
            </label>
            <div className="relative mt-1">
              <Lock className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
              <input
                id="landing-signin-password"
                type="password"
                required
                autoComplete="current-password"
                value={signInPassword}
                onChange={(e) => setSignInPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-zinc-200 bg-white py-1.5 pl-8 pr-3 text-xs placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={signInLoading}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 py-2 text-xs font-semibold text-white shadow-2xs transition"
          >
            {signInLoading ? "Unlocking…" : "Sign In & Unlock Platform"}
          </button>
        </form>
      )}

      {/* TAB 3: SIGN UP */}
      {activeTab === "signup" && (
        <form onSubmit={handleSignUp} className="mt-4 space-y-3">
          {signUpError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-2.5 flex items-start gap-2 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{signUpError}</span>
            </div>
          )}

          {signUpSuccess && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 flex items-start gap-2 text-xs text-emerald-700">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{signUpSuccess}</span>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="landing-signup-name" className="block text-xs font-semibold text-zinc-700">
                Full Name
              </label>
              {nameError && <span className="text-[10px] text-rose-500">{nameError}</span>}
            </div>
            <div className="relative mt-1">
              <User className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
              <input
                id="landing-signup-name"
                type="text"
                required
                autoComplete="name"
                value={signUpName}
                onChange={(e) => setSignUpName(e.target.value)}
                placeholder="e.g. Alex Rivera"
                className={`w-full rounded-lg border py-1.5 pl-8 pr-3 text-xs placeholder:text-zinc-400 focus:outline-none focus:ring-1 ${
                  nameError
                    ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500"
                    : "border-zinc-200 focus:border-indigo-500 focus:ring-indigo-500"
                }`}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="landing-signup-email" className="block text-xs font-semibold text-zinc-700">
                Email Address
              </label>
              {emailError && <span className="text-[10px] text-rose-500">{emailError}</span>}
            </div>
            <div className="relative mt-1">
              <Mail className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
              <input
                id="landing-signup-email"
                type="email"
                required
                autoComplete="email"
                value={signUpEmail}
                onChange={(e) => setSignUpEmail(e.target.value)}
                placeholder="name@example.com"
                className={`w-full rounded-lg border py-1.5 pl-8 pr-3 text-xs placeholder:text-zinc-400 focus:outline-none focus:ring-1 ${
                  emailError
                    ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500"
                    : "border-zinc-200 focus:border-indigo-500 focus:ring-indigo-500"
                }`}
              />
            </div>
          </div>

          <div>
            <label htmlFor="landing-signup-password" className="block text-xs font-semibold text-zinc-700">
              Password
            </label>
            <div className="relative mt-1">
              <Lock className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
              <input
                id="landing-signup-password"
                type="password"
                required
                autoComplete="new-password"
                value={signUpPassword}
                onChange={(e) => setSignUpPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full rounded-lg border border-zinc-200 bg-white py-1.5 pl-8 pr-3 text-xs placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="landing-signup-role" className="block text-xs font-semibold text-zinc-700">
              Select Your Role / Persona
            </label>
            <select
              id="landing-signup-role"
              value={signUpRole}
              onChange={(e) => setSignUpRole(e.target.value as UserRole)}
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white py-1.5 px-2.5 text-xs text-zinc-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="CONSUMER">Consumer / Shopper (Engine 1 Deals &amp; Subscriptions)</option>
              <option value="ORACLE_WORKER">Proof-of-Human Contributor (Engine 2 Micro-Bounties)</option>
              <option value="ENTERPRISE_AGENT">Enterprise Agent (Engine 3 Smart Escrow)</option>
              <option value="ADMIN">Platform Auditor &amp; Hackathon Judge (Full Telemetry)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={signUpLoading || Boolean(nameError) || Boolean(emailError)}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 py-2 text-xs font-semibold text-white shadow-2xs transition disabled:opacity-50"
          >
            {signUpLoading ? "Creating Account…" : "Create Account & Unlock Access"}
          </button>
        </form>
      )}
    </div>
  );
}
