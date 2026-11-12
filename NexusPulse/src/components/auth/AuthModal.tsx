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
            <h2 id="auth-modal-title" className="mt-2 text-[18px] font-semibold text-zinc-950 tracking-tight">
              {currentUser ? "Switch account or profile" : "Sign in to NexusPulse"}
            </h2>
            <p className="mt-0.5 text-[13px] text-zinc-600">
              Choose a sample account or sign in with your email address.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-[6px] p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Current User Banner (if logged in) */}
        {currentUser && (
          <div className="mt-4 rounded-[8px] border border-zinc-200 bg-[#fafafa] p-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-full bg-zinc-950 text-white flex items-center justify-center text-[12px] font-semibold uppercase shrink-0">
                {currentUser.fullName.slice(0, 2)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium text-zinc-950 truncate">
                    {currentUser.fullName}
                  </span>
                  <span className="text-[12px] text-zinc-600 shrink-0">
                    {currentUser.roleTitle}
                  </span>
                </div>
                <div className="text-[12px] text-zinc-600 truncate">{currentUser.email}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="inline-flex h-8 items-center gap-1 rounded-[6px] border border-zinc-200 bg-white hover:bg-red-50 hover:text-red-700 px-2.5 text-[12px] font-medium text-zinc-700 transition-colors shrink-0"
            >
              <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} />
              <span>Sign out</span>
            </button>
          </div>
        )}

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
          <div className="mt-4 space-y-2.5">
            <p className="text-[12px] text-zinc-600">
              Select a sample role to preview each workflow immediately:
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
                    className={`w-full text-left rounded-[8px] border p-3 transition-colors flex items-start justify-between gap-3 ${
                      isCurrent
                        ? "border-indigo-600 bg-indigo-50/40"
                        : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-[#fafafa]"
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="h-8 w-8 rounded-[6px] bg-zinc-950 text-white flex items-center justify-center shrink-0 mt-0.5">
                        {key === "judge" ? (
                          <ShieldCheck className="h-4 w-4" strokeWidth={1.5} />
                        ) : key === "consumer" ? (
                          <ShoppingBag className="h-4 w-4" strokeWidth={1.5} />
                        ) : key === "oracle" ? (
                          <UserCheck className="h-4 w-4" strokeWidth={1.5} />
                        ) : (
                          <Bot className="h-4 w-4" strokeWidth={1.5} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-medium text-zinc-950">{demo.fullName}</span>
                          <span className="text-[12px] text-zinc-600">
                            {demo.badgeLabel}
                          </span>
                          {isCurrent && (
                            <span className="text-[12px] font-medium text-indigo-600">
                              (Active)
                            </span>
                          )}
                        </div>
                        <div className="text-[12px] text-zinc-600">{demo.email}</div>
                        <p className="mt-1 text-[12px] text-zinc-600 leading-snug line-clamp-2">
                          {demo.description}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 pt-1">
                      <span className="inline-flex items-center gap-1 rounded-[6px] border border-zinc-200 bg-[#fafafa] px-2 py-1 text-[12px] font-medium text-zinc-700">
                        <span>Select</span>
                        <ArrowRight className="h-3 w-3" strokeWidth={1.5} />
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
              <label htmlFor="signin-email" className="block text-[13px] font-medium text-zinc-700">
                Email
              </label>
              <div className="relative mt-1">
                <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" strokeWidth={1.5} />
                <input
                  id="signin-email"
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
              <label htmlFor="signin-password" className="block text-[13px] font-medium text-zinc-700">
                Password
              </label>
              <div className="relative mt-1">
                <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" strokeWidth={1.5} />
                <input
                  id="signin-password"
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
              className="mt-2 w-full h-9 inline-flex items-center justify-center gap-1.5 rounded-[6px] bg-zinc-950 hover:bg-zinc-800 text-[13px] font-medium text-white transition-colors"
            >
              {signInLoading ? "Signing in..." : "Sign in"}
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
                <label htmlFor="signup-name" className="block text-[13px] font-medium text-zinc-700">
                  Full name
                </label>
                {nameError && <span className="text-[12px] text-red-700">{nameError}</span>}
              </div>
              <div className="relative mt-1">
                <User className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" strokeWidth={1.5} />
                <input
                  id="signup-name"
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
                <label htmlFor="signup-email" className="block text-[13px] font-medium text-zinc-700">
                  Email
                </label>
                {emailError && <span className="text-[12px] text-red-700">{emailError}</span>}
              </div>
              <div className="relative mt-1">
                <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" strokeWidth={1.5} />
                <input
                  id="signup-email"
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
              <label htmlFor="signup-password" className="block text-[13px] font-medium text-zinc-700">
                Password
              </label>
              <div className="relative mt-1">
                <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" strokeWidth={1.5} />
                <input
                  id="signup-password"
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
              <label htmlFor="signup-role" className="block text-[13px] font-medium text-zinc-700">
                Role
              </label>
              <select
                id="signup-role"
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
              className="mt-3 w-full h-9 inline-flex items-center justify-center gap-1.5 rounded-[6px] bg-zinc-950 hover:bg-zinc-800 text-[13px] font-medium text-white transition-colors disabled:opacity-50"
            >
              {signUpLoading ? "Creating account..." : "Create account"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
