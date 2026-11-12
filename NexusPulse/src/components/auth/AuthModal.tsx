"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Bot,
  CheckCircle2,
  Lock,
  LogOut,
  Mail,
  Shield,
  ShieldCheck,
  ShoppingBag,
  User,
  UserCheck,
  X,
  Zap,
} from "lucide-react";
import {
  DEMO_EVALUATOR_ACCOUNTS,
  type DemoAccountDefinition,
  type UserProfile,
  type UserRole,
} from "@/lib/auth/auth-types";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onLoginSuccess: (user: UserProfile) => void;
  onLogout: () => void;
}

export default function AuthModal({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onLogout,
}: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<"demos" | "signin" | "signup">("demos");

  // Sign In form state
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signInLoading, setSignInLoading] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);

  // Sign Up form state
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
      ? "Please enter a valid email address (e.g. name@example.com)."
      : null;

  if (!isOpen) return null;

  async function handleDemoLogin(demoKey: string) {
    setSignInLoading(true);
    setSignInError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demoKey }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        onLoginSuccess(data.user);
        onClose();
      } else {
        setSignInError(data.error || "Failed to switch to demo account.");
      }
    } catch {
      setSignInError("Connection error while switching demo accounts.");
    } finally {
      setSignInLoading(false);
    }
  }

  async function handleSignInSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSignInLoading(true);
    setSignInError(null);

    // Client-side quick check
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
        onClose();
      } else {
        setSignInError(data.error || "Invalid credentials.");
      }
    } catch {
      setSignInError("Network error during login. Please try again.");
    } finally {
      setSignInLoading(false);
    }
  }

  async function handleSignUpSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSignUpLoading(true);
    setSignUpError(null);
    setSignUpSuccess(null);

    // Strict validation
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
          onClose();
        }, 800);
      } else {
        setSignUpError(data.error || "Failed to create account.");
      }
    } catch {
      setSignUpError("Network error during registration.");
    } finally {
      setSignUpLoading(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-4 backdrop-blur-xs animate-fade-in"
    >
      <div
        className="relative w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl shadow-zinc-950/10 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-zinc-100">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-[6px] border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-[12px] font-medium text-zinc-700">
              <span>Account access</span>
            </div>
            <h2 id="auth-modal-title" className="mt-2 text-lg font-bold text-zinc-950 tracking-tight">
              {currentUser ? "User Profile & Persona Switcher" : "Sign In to NexusPulse"}
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              Select an Evaluator Demo Persona or authenticate with your credentials.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Current User Banner (if logged in) */}
        {currentUser && (
          <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50/70 p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-zinc-950 text-white flex items-center justify-center text-xs font-bold uppercase shrink-0">
                {currentUser.fullName.slice(0, 2)}
              </div>
              <div className="truncate">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-zinc-900 truncate">
                    {currentUser.fullName}
                  </span>
                  <span className="rounded bg-zinc-200/80 px-1.5 py-0.2 font-mono text-[10px] text-zinc-700 font-medium">
                    {currentUser.role}
                  </span>
                </div>
                <div className="text-[11px] text-zinc-400 truncate">{currentUser.email}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white hover:bg-rose-50 hover:text-rose-600 px-2.5 py-1 text-xs font-medium text-zinc-600 transition"
            >
              <LogOut className="h-3 w-3" />
              <span>Sign Out</span>
            </button>
          </div>
        )}

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
            Demo Accounts (1-Click)
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

        {/* TAB 1: DEMO ACCOUNTS FOR EVALUATORS */}
        {activeTab === "demos" && (
          <div className="mt-4 space-y-2.5">
            <p className="text-[11px] text-zinc-500">
              Designed for hackathon judges and evaluators to test all 4 platform personas instantly with zero typing:
            </p>

            <div className="space-y-2">
              {Object.entries(DEMO_EVALUATOR_ACCOUNTS).map(([key, demo]) => {
                const isCurrent = currentUser?.email === demo.email;
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={signInLoading}
                    onClick={() => handleDemoLogin(key)}
                    className={`w-full text-left rounded-xl border p-3 transition flex items-start justify-between gap-3 ${
                      isCurrent
                        ? "border-indigo-400 bg-indigo-50/30 ring-1 ring-indigo-400/20"
                        : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/60"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-zinc-950 text-white flex items-center justify-center text-xs font-bold uppercase shrink-0 mt-0.5">
                        {key === "judge" ? (
                          <ShieldCheck className="h-4 w-4 text-purple-400" />
                        ) : key === "consumer" ? (
                          <ShoppingBag className="h-4 w-4 text-emerald-400" />
                        ) : key === "oracle" ? (
                          <UserCheck className="h-4 w-4 text-indigo-400" />
                        ) : (
                          <Bot className="h-4 w-4 text-blue-400" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-zinc-900">{demo.fullName}</span>
                          <span
                            className={`rounded border px-1.5 py-0.2 font-mono text-[10px] font-medium ${demo.badgeColor}`}
                          >
                            {demo.badgeLabel}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] font-semibold text-indigo-600">
                              (Active)
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-400">{demo.email}</div>
                        <p className="mt-1 text-[11px] text-zinc-600 leading-snug line-clamp-2">
                          {demo.description}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 pt-1">
                      <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-1 text-[10px] font-semibold text-zinc-700">
                        <span>Select</span>
                        <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: SIGN IN */}
        {activeTab === "signin" && (
          <form onSubmit={handleSignInSubmit} className="mt-4 space-y-3">
            {signInError && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-2.5 flex items-start gap-2 text-xs text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{signInError}</span>
              </div>
            )}

            <div>
              <label htmlFor="signin-email" className="block text-xs font-semibold text-zinc-700">
                Email Address
              </label>
              <div className="relative mt-1">
                <Mail className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                <input
                  id="signin-email"
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
              <label htmlFor="signin-password" className="block text-xs font-semibold text-zinc-700">
                Password
              </label>
              <div className="relative mt-1">
                <Lock className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                <input
                  id="signin-password"
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
              className="mt-2 w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 py-2 text-xs font-semibold text-white shadow-2xs transition"
            >
              {signInLoading ? "Authenticating…" : "Sign In"}
            </button>
          </form>
        )}

        {/* TAB 3: SIGN UP (WITH STRICT EMAIL AND NAME CHECKS) */}
        {activeTab === "signup" && (
          <form onSubmit={handleSignUpSubmit} className="mt-4 space-y-3">
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
                <label htmlFor="signup-name" className="block text-xs font-semibold text-zinc-700">
                  Full Name
                </label>
                {nameError && <span className="text-[10px] text-rose-500">{nameError}</span>}
              </div>
              <div className="relative mt-1">
                <User className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                <input
                  id="signup-name"
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
                <label htmlFor="signup-email" className="block text-xs font-semibold text-zinc-700">
                  Email Address
                </label>
                {emailError && <span className="text-[10px] text-rose-500">{emailError}</span>}
              </div>
              <div className="relative mt-1">
                <Mail className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                <input
                  id="signup-email"
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
              <label htmlFor="signup-password" className="block text-xs font-semibold text-zinc-700">
                Password
              </label>
              <div className="relative mt-1">
                <Lock className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                <input
                  id="signup-password"
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
              <label htmlFor="signup-role" className="block text-xs font-semibold text-zinc-700">
                Primary Account Persona
              </label>
              <select
                id="signup-role"
                value={signUpRole}
                onChange={(e) => setSignUpRole(e.target.value as UserRole)}
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white py-1.5 px-2.5 text-xs text-zinc-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="CONSUMER">Autonomous Shopper (Engine 1 Deals &amp; Subscriptions)</option>
                <option value="ORACLE_WORKER">Proof-of-Human Contributor (Engine 2 Micro-Bounties)</option>
                <option value="ENTERPRISE_AGENT">Enterprise Requester (Engine 3 Smart Escrow)</option>
                <option value="ADMIN">Platform Auditor &amp; Hackathon Judge (Full Telemetry)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={signUpLoading || Boolean(nameError) || Boolean(emailError)}
              className="mt-3 w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 py-2 text-xs font-semibold text-white shadow-2xs transition disabled:opacity-50"
            >
              {signUpLoading ? "Creating Account…" : "Create Account & Sign In"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
