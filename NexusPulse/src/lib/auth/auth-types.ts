export type UserRole = "CONSUMER" | "ORACLE_WORKER" | "ENTERPRISE_AGENT" | "ADMIN";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  roleTitle: string;
  avatarUrl?: string;
  paypalEmail: string;
  walletBalanceUsd: number;
  autoSpendLimitUsd: number;
  reputationScore: number;
  preferredEngine: "channel3" | "bounties" | "bryntum" | "aggrid" | "overview";
  isDemoAccount?: boolean;
  createdAt: string;
}

export interface DemoAccountDefinition extends UserProfile {
  description: string;
  badgeLabel: string;
  badgeColor: string;
  keyActionLabel: string;
}

export const DEMO_EVALUATOR_ACCOUNTS: Record<string, DemoAccountDefinition> = {
  judge: {
    id: "demo-evaluator-judge",
    email: "judge.evaluator@paypal-hackathon.com",
    fullName: "Judge Evaluator",
    role: "ADMIN",
    roleTitle: "PayPal AI Hackathon Judge & Chief Auditor",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    paypalEmail: "sb-merchant-nexus@business.example.com",
    walletBalanceUsd: 14850.0,
    autoSpendLimitUsd: 5000.0,
    reputationScore: 100.0,
    preferredEngine: "aggrid",
    isDemoAccount: true,
    createdAt: "2026-11-01T00:00:00Z",
    badgeLabel: "Judge / Admin",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    description: "Full system telemetry access, institutional AG Grid ledger, cryptographic webhook simulator, dispute arbitration, and PayPal live/sandbox switcher.",
    keyActionLabel: "Inspect Clearinghouse Ledger",
  },
  consumer: {
    id: "demo-evaluator-consumer",
    email: "alex.consumer@nexuspulse.ai",
    fullName: "Alex Rivera",
    role: "CONSUMER",
    roleTitle: "Autonomous Shopper & Subscription Optimizer",
    avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    paypalEmail: "sb-buyer-nexus@personal.example.com",
    walletBalanceUsd: 4820.5,
    autoSpendLimitUsd: 1500.0,
    reputationScore: 98.5,
    preferredEngine: "channel3",
    isDemoAccount: true,
    createdAt: "2026-11-05T00:00:00Z",
    badgeLabel: "Consumer Buyer",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    description: "Sets cryptographic price mandates on 100M+ Channel3 SKUs, activates zero-click autonomous deals, and eliminates unused recurring SaaS subscriptions.",
    keyActionLabel: "Explore Deal Mandates",
  },
  oracle: {
    id: "demo-evaluator-oracle",
    email: "elena.oracle@nexuspulse.ai",
    fullName: "Elena Rostova",
    role: "ORACLE_WORKER",
    roleTitle: "Lead Field Ground-Truth Contributor",
    avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    paypalEmail: "elena.field.oracle@worker.example.com",
    walletBalanceUsd: 385.0,
    autoSpendLimitUsd: 250.0,
    reputationScore: 99.4,
    preferredEngine: "bounties",
    isDemoAccount: true,
    createdAt: "2026-11-08T00:00:00Z",
    badgeLabel: "Human Oracle",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
    description: "Executes physical verification tasks, uploads high-resolution evidence, passes Gemini 3.8 Flash multimodal audits, and receives instant PayPal Payouts.",
    keyActionLabel: "Claim Field Bounties",
  },
  enterprise: {
    id: "demo-evaluator-enterprise",
    email: "marcus.agent@enterprise.ai",
    fullName: "Marcus Vance",
    role: "ENTERPRISE_AGENT",
    roleTitle: "B2B AI Agent Clearinghouse Coordinator",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    paypalEmail: "marcus.procure@enterprise.example.com",
    walletBalanceUsd: 28500.0,
    autoSpendLimitUsd: 10000.0,
    reputationScore: 99.9,
    preferredEngine: "bryntum",
    isDemoAccount: true,
    createdAt: "2026-11-02T00:00:00Z",
    badgeLabel: "Enterprise Agent",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    description: "Orchestrates A2A Smart Escrow milestone contracts with PayPal Orders v2 AUTHORIZE holds, WBS Gantt dependency tracking, and automated carrier capture.",
    keyActionLabel: "Manage Smart Escrow",
  },
};
