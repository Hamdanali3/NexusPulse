import { NextRequest, NextResponse } from "next/server";
import { UserRole, UserProfile } from "@/lib/auth/auth-types";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/db/supabase-client";
import {
  isAllowedFetchSite,
  sanitizeText,
  validateEmail,
  validateFullName,
} from "@/lib/security/validation";

const VARY_HEADERS = {
  Vary: "Sec-Fetch-Dest, Sec-Fetch-Mode, Sec-Fetch-Site",
};

const VALID_ROLES = new Set<UserRole>([
  "CONSUMER",
  "ORACLE_WORKER",
  "ENTERPRISE_AGENT",
  "ADMIN",
]);

export async function POST(req: NextRequest) {
  if (!isAllowedFetchSite(req.headers)) {
    return NextResponse.json(
      { error: "Cross-site signup request rejected by Sec-Fetch-Site policy" },
      { status: 403, headers: VARY_HEADERS }
    );
  }

  try {
    const body = (await req.json()) as {
      fullName?: string;
      email?: string;
      password?: string;
      role?: UserRole;
      paypalEmail?: string;
    };

    // 1. Strict Name Validation (min 2 chars, letters, spaces, hyphens)
    const nameCheck = validateFullName(body.fullName);
    if (!nameCheck.valid || !nameCheck.cleaned) {
      return NextResponse.json(
        { error: nameCheck.error || "Valid full name is required." },
        { status: 400, headers: VARY_HEADERS }
      );
    }
    const cleanName = nameCheck.cleaned;

    // 2. Strict Email Validation (format, RFC 5322, length)
    const emailCheck = validateEmail(body.email);
    if (!emailCheck.valid || !emailCheck.cleaned) {
      return NextResponse.json(
        { error: emailCheck.error || "Valid email address is required." },
        { status: 400, headers: VARY_HEADERS }
      );
    }
    const cleanEmail = emailCheck.cleaned;

    // 3. Password Validation
    const password = sanitizeText(body.password, 128);
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400, headers: VARY_HEADERS }
      );
    }

    // 4. Role Assignment
    const selectedRole: UserRole =
      body.role && VALID_ROLES.has(body.role) ? body.role : "CONSUMER";

    const cleanPaypalEmail = body.paypalEmail ? validateEmail(body.paypalEmail).cleaned : cleanEmail;

    const roleTitle =
      selectedRole === "CONSUMER"
        ? "Autonomous Shopper & Consumer"
        : selectedRole === "ORACLE_WORKER"
        ? "Proof-of-Human Field Oracle"
        : selectedRole === "ENTERPRISE_AGENT"
        ? "B2B AI Agent Escrow Coordinator"
        : "System Administrator & Auditor";

    const preferredEngine =
      selectedRole === "CONSUMER"
        ? "channel3"
        : selectedRole === "ORACLE_WORKER"
        ? "bounties"
        : selectedRole === "ENTERPRISE_AGENT"
        ? "bryntum"
        : "overview";

    const newUserId = `user-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

    const userProfile: UserProfile = {
      id: newUserId,
      email: cleanEmail,
      fullName: cleanName,
      role: selectedRole,
      roleTitle,
      paypalEmail: cleanPaypalEmail || cleanEmail,
      walletBalanceUsd: selectedRole === "ORACLE_WORKER" ? 150.0 : 2500.0,
      autoSpendLimitUsd: selectedRole === "CONSUMER" ? 1000.0 : 500.0,
      reputationScore: 100.0,
      preferredEngine,
      createdAt: new Date().toISOString(),
    };

    // 5. Persist to Supabase PostgreSQL if configured
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          await supabase.from("users").upsert({
            id: newUserId,
            email: cleanEmail,
            full_name: cleanName,
            role: selectedRole,
            paypal_email: cleanPaypalEmail || cleanEmail,
            reputation_score: 100.0,
          });
        } catch (dbErr) {
          console.warn("[Auth SignUp] Supabase user insert warning:", dbErr);
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        user: userProfile,
        message: `Welcome to NexusPulse, ${cleanName}! Your account as ${roleTitle} has been created.`,
      },
      { headers: VARY_HEADERS }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Signup failed";
    return NextResponse.json({ error: msg }, { status: 500, headers: VARY_HEADERS });
  }
}
