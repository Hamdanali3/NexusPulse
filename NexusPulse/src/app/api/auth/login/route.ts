import { NextRequest, NextResponse } from "next/server";
import { DEMO_EVALUATOR_ACCOUNTS, type UserProfile } from "@/lib/auth/auth-types";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/db/supabase-client";
import { isAllowedFetchSite, sanitizeText, validateEmail } from "@/lib/security/validation";

const VARY_HEADERS = {
  Vary: "Sec-Fetch-Dest, Sec-Fetch-Mode, Sec-Fetch-Site",
};

export async function POST(req: NextRequest) {
  if (!isAllowedFetchSite(req.headers)) {
    return NextResponse.json(
      { error: "Cross-site login request rejected by Sec-Fetch-Site policy" },
      { status: 403, headers: VARY_HEADERS }
    );
  }

  try {
    const body = (await req.json()) as {
      demoKey?: string;
      email?: string;
      password?: string;
    };

    // 1. Instant 1-Click Demo Account Login for Evaluators
    if (body.demoKey && DEMO_EVALUATOR_ACCOUNTS[body.demoKey]) {
      const demoUser = DEMO_EVALUATOR_ACCOUNTS[body.demoKey];
      return NextResponse.json(
        {
          success: true,
          user: demoUser,
          isDemo: true,
          message: `Logged in as evaluator demo persona: ${demoUser.fullName} (${demoUser.roleTitle})`,
        },
        { headers: VARY_HEADERS }
      );
    }

    // 2. Real / Custom User Login with Email validation
    const emailCheck = validateEmail(body.email);
    if (!emailCheck.valid || !emailCheck.cleaned) {
      return NextResponse.json(
        { error: emailCheck.error || "A valid email address is required to log in." },
        { status: 400, headers: VARY_HEADERS }
      );
    }

    const email = emailCheck.cleaned;
    const password = sanitizeText(body.password, 128);
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400, headers: VARY_HEADERS }
      );
    }

    // Check if matching any predefined demo accounts by email
    const matchedDemo = Object.values(DEMO_EVALUATOR_ACCOUNTS).find(
      (d) => d.email.toLowerCase() === email.toLowerCase()
    );
    if (matchedDemo) {
      return NextResponse.json(
        {
          success: true,
          user: matchedDemo,
          isDemo: true,
          message: `Welcome back, ${matchedDemo.fullName}!`,
        },
        { headers: VARY_HEADERS }
      );
    }

    // If Supabase is connected, attempt to fetch or sync the user
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { data: dbUser } = await supabase
          .from("users")
          .select("*")
          .eq("email", email)
          .maybeSingle();

        if (dbUser) {
          const userProfile: UserProfile = {
            id: dbUser.id,
            email: dbUser.email,
            fullName: dbUser.full_name,
            role: dbUser.role,
            roleTitle:
              dbUser.role === "CONSUMER"
                ? "Autonomous Shopper & Consumer"
                : dbUser.role === "ORACLE_WORKER"
                ? "Proof-of-Human Field Oracle"
                : dbUser.role === "ENTERPRISE_AGENT"
                ? "B2B AI Agent Escrow Coordinator"
                : "System Administrator & Auditor",
            avatarUrl: dbUser.avatar_url,
            paypalEmail: dbUser.paypal_email || email,
            walletBalanceUsd: 2500.0,
            autoSpendLimitUsd: 1000.0,
            reputationScore: Number(dbUser.reputation_score || 100),
            preferredEngine:
              dbUser.role === "CONSUMER"
                ? "channel3"
                : dbUser.role === "ORACLE_WORKER"
                ? "bounties"
                : dbUser.role === "ENTERPRISE_AGENT"
                ? "bryntum"
                : "overview",
            createdAt: dbUser.created_at,
          };

          return NextResponse.json(
            {
              success: true,
              user: userProfile,
              message: `Welcome back, ${userProfile.fullName}!`,
            },
            { headers: VARY_HEADERS }
          );
        }
      }
    }

    // Fallback: Create dynamic verified session user
    const fallbackUser: UserProfile = {
      id: `user-${Date.now().toString(36)}`,
      email,
      fullName: email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      role: "CONSUMER",
      roleTitle: "Autonomous Shopper & Consumer",
      paypalEmail: email,
      walletBalanceUsd: 1500.0,
      autoSpendLimitUsd: 500.0,
      reputationScore: 100.0,
      preferredEngine: "channel3",
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(
      {
        success: true,
        user: fallbackUser,
        message: `Welcome, ${fallbackUser.fullName}!`,
      },
      { headers: VARY_HEADERS }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Authentication failed";
    return NextResponse.json({ error: msg }, { status: 500, headers: VARY_HEADERS });
  }
}
