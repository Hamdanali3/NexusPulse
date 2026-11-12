import { NextResponse } from "next/server";
import { DEMO_EVALUATOR_ACCOUNTS } from "@/lib/auth/auth-types";

const VARY_HEADERS = {
  Vary: "Sec-Fetch-Dest, Sec-Fetch-Mode, Sec-Fetch-Site",
};

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      demoAccounts: Object.values(DEMO_EVALUATOR_ACCOUNTS),
      availableRoles: [
        {
          role: "CONSUMER",
          title: "Autonomous Shopper / Consumer",
          engine: "Engine 1 (Channel3 Deal Hunter)",
          description: "Sets price mandates, triggers autonomous purchases, and optimizes recurring subscriptions.",
        },
        {
          role: "ORACLE_WORKER",
          title: "Human Oracle Contributor",
          engine: "Engine 2 (Proof-of-Human Bounties)",
          description: "Submits physical verification evidence and earns instant PayPal Payouts.",
        },
        {
          role: "ENTERPRISE_AGENT",
          title: "Enterprise AI Requester",
          engine: "Engine 3 (Smart Escrow Gantt)",
          description: "Locks milestone funds via PayPal Orders v2 AUTHORIZE and releases on deliverable proof.",
        },
        {
          role: "ADMIN",
          title: "Hackathon Judge & Auditor",
          engine: "Command Center (AG Grid Ledger & Webhooks)",
          description: "Inspects full system telemetry, verifies cryptographic signatures, and arbitrates disputes.",
        },
      ],
    },
    { headers: VARY_HEADERS }
  );
}
