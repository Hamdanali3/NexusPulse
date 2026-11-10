import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import type { NexusPulseState } from "@/lib/paypal/paypal-sandbox-mirror";

export const runtime = "nodejs";

const GROQ_API_KEY =
  process.env.GROQ_API_KEY ||
  process.env.Groq_API_KEY ||
  "";

// Initialize Groq client safely
const groq = GROQ_API_KEY ? new Groq({ apiKey: GROQ_API_KEY }) : null;

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatbotRequestBody {
  message: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  stateContext?: Partial<NexusPulseState> | null;
}

function buildSystemPrompt(state?: Partial<NexusPulseState> | null): string {
  const walletBalance = state?.walletBalanceUsd ?? 24650.0;
  const totalSaved = state?.totalSavedByAiUsd ?? 707.55;
  const totalEarned = state?.totalEarnedFromBountiesUsd ?? 395.0;
  const totalEscrow = state?.totalEscrowProtectedUsd ?? 3450.0;
  const dealsCount = state?.channel3Deals?.length ?? 4;
  const bountiesCount = state?.bounties?.length ?? 4;
  const milestonesCount = state?.escrowMilestones?.length ?? 3;
  const subscriptionsCount = state?.subscriptions?.length ?? 3;

  return `You are NexusPulse Oracle — the world-class Senior AI Financial Architect, Chief Financial Officer (CFO), and technical assistant embedded into NexusPulse.

ABOUT NEXUSPULSE:
NexusPulse is an Autonomous Financial Clearinghouse built for the PayPal AI Hackathon. It connects Google Gemini Interactions API with PayPal's developer platform (Orders v2, Payouts v1, Subscriptions v1, Invoicing v2, Trackers v2, and Webhooks v1) across three closed-loop financial engines:

ENGINE 1: CHANNEL3 AUTONOMOUS DEAL ARBITRAGE & SUBSCRIPTION GUARD
- Integrates Channel3's 100M+ SKU product catalog with real-time price drops.
- Users set cryptographic spending mandates (e.g. target price on hardware or electronics).
- Channel3 AI signal evaluates price histories and triggers instant 1-click purchases using PayPal JS SDK v6 (PayPal Wallet, Pay Later / BNPL, Venmo).
- Subscription Guard monitors recurring PayPal subscriptions (/v1/billing/subscriptions), identifies idle or over-budget seats, and autonomously executes tier downgrades or cancellations to eliminate recurring leakage.

ENGINE 2: PROOF-OF-HUMAN ORACLE CLEARINGHOUSE
- AI agents submit physical-world ground-truth micro-bounties (30-60 second tasks, e.g., verifying store shelf stock, cold-chain temperature logs, code audit proofs, translation nuances).
- Human workers submit verified evidence.
- Google Gemini 3.8 Flash audits evidence in sub-2 seconds using multimodal reasoning, scores it 0-100, and triggers instant PayPal Payouts v1 (/v1/payments/payouts) with unique PayPal-Request-Id idempotency.

ENGINE 3: BRYNTUM MILESTONE SMART ESCROW & DISPUTE SHIELD
- Uses PayPal Orders v2 with intent="AUTHORIZE" to lock funds on a Bryntum interactive Gantt timeline before deliverable completion.
- Counterparties submit cryptographic completion proofs (commit hashes, test logs, bills of lading).
- Google Gemini 4 Argon audits the proof before triggering capture (/v2/payments/authorizations/{id}/capture).
- Automatically attaches DHL/FedEx shipment tracking via PayPal Trackers v2 to provide cryptographic dispute protection.

SPONSOR & TECHNICAL ARCHITECTURE:
- APIMatic: Uses @paypal/paypal-server-sdk v2.5.0 with strongly-typed controllers (OrdersController, PaymentsController, SubscriptionsController, TransactionSearchController).
- AG Grid Enterprise (v36.3.0): Financial Telemetry Command Center aggregating /v1/reporting/transactions, /v2/checkout/orders, /v1/payments/payouts, and /v2/invoicing/invoices with CSV export and query filtering.
- Dual-Mode Gateway: Automatically operates in "Deterministic Sandbox Mirror Mode" for zero-friction evaluation without SMS barriers, and hot-swaps to "Live PayPal Sandbox" when credentials are supplied.
- Database: Supabase PostgreSQL with pooled connections (DATABASE_URL) and fallback in-memory ledger.
- Webhook Security: Verifies PAYPAL-TRANSMISSION-SIG via POST /v1/notifications/verify-webhook-signature using raw bytes.

LIVE REAL-TIME STATE CONTEXT:
- Protected Wallet Balance: $${walletBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })} USD
- Realized AI Savings: $${totalSaved.toFixed(2)} USD
- Proof-of-Human Payouts Settled: $${totalEarned.toFixed(2)} USD
- Active Escrow Locked: $${totalEscrow.toFixed(2)} USD
- Monitored Channel3 Deals: ${dealsCount} active items
- Open Human Bounties: ${bountiesCount} micro-tasks
- Active Escrow Milestones: ${milestonesCount} WBS items
- Monitored Subscriptions: ${subscriptionsCount} SaaS plans

RESPONSE GUIDELINES:
1. Always be authoritative, precise, professional, and directly actionable.
2. Provide concise yet rich explanations using formatting (bullet points, bold titles, code snippets).
3. If the user asks about navigating the site, you can include action tags like:
   - [ACTION:NAVIGATE:channel3] to view Engine 1 Deal Hunter
   - [ACTION:NAVIGATE:bounties] to view Engine 2 Human Bounties
   - [ACTION:NAVIGATE:bryntum] to view Engine 3 Escrow Gantt
   - [ACTION:NAVIGATE:aggrid] to view AG Grid Telemetry
   - [ACTION:NAVIGATE:overview] to view All Engines Overview
4. When asked financial or technical questions, reference the exact PayPal API endpoints, HTTP methods, and parameter names.
5. Emphasize how Gemini AI, PayPal SDKs, Channel3, Bryntum, AG Grid, and Supabase work together seamlessly.`;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ChatbotRequestBody;
    const { message, history = [], stateContext = null } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Message is required." },
        { status: 400 }
      );
    }

    const systemPrompt = buildSystemPrompt(stateContext);

    // Format chat messages for Groq
    const groqMessages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...history.slice(-10).map((h) => ({
        role: h.role,
        content: h.content,
      })),
      { role: "user", content: message },
    ];

    if (groq) {
      try {
        // Primary: Try Groq 120B Frontier model (openai/gpt-oss-120b)
        const completion = await groq.chat.completions.create({
          model: "openai/gpt-oss-120b",
          messages: groqMessages,
          temperature: 0.3,
          max_tokens: 650,
        });

        const reply = completion.choices[0]?.message?.content?.trim();
        if (reply) {
          return NextResponse.json({
            reply,
            modelUsed: "openai/gpt-oss-120b",
            provider: "groq",
            status: "success",
          });
        }
      } catch (groqErr) {
        console.warn("Groq 120B model failed, attempting fallback:", groqErr);

        // Fallback 1: Try Qwen 27B on Groq
        try {
          const fallbackCompletion = await groq.chat.completions.create({
            model: "qwen/qwen3.8-27b",
            messages: groqMessages,
            temperature: 0.3,
            max_tokens: 650,
          });

          const fallbackReply = fallbackCompletion.choices[0]?.message?.content?.trim();
          if (fallbackReply) {
            return NextResponse.json({
              reply: fallbackReply,
              modelUsed: "qwen/qwen3.8-27b",
              provider: "groq-fallback",
              status: "success",
            });
          }
        } catch (fallbackErr) {
          console.warn("Groq secondary model failed:", fallbackErr);
        }
      }
    }

    // Fallback 2: Comprehensive Deterministic Semantic Response Engine
    const fallbackReply = generateDeterministicKnowledgeResponse(message, stateContext);
    return NextResponse.json({
      reply: fallbackReply,
      modelUsed: "nexus-oracle-semantic-core",
      provider: "deterministic-knowledge-engine",
      status: "success",
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

/**
 * High-performance deterministic knowledge engine covering the platform
 * ensuring 100% availability even in offline or disconnected states.
 */
function generateDeterministicKnowledgeResponse(
  query: string,
  state?: Partial<NexusPulseState> | null
): string {
  const q = query.toLowerCase();
  const wallet = state?.walletBalanceUsd ?? 24650.0;

  if (q.includes("wallet") || q.includes("balance") || q.includes("funds")) {
    return `Your **NexusPulse Protected Wallet** currently holds **$${wallet.toLocaleString("en-US", { minimumFractionDigits: 2 })} USD** in liquid assets. 

All transactions are secured via PayPal Orders v2 \`AUTHORIZE\` holds, Payouts v1 idempotency keys (\`PayPal-Request-Id\`), and verified by SHA256withRSA webhook signatures.

You can inspect the entire ledger in the AG Grid Command Center.
[ACTION:NAVIGATE:aggrid]`;
  }

  if (q.includes("channel3") || q.includes("deal") || q.includes("engine 1") || q.includes("save")) {
    return `**Engine 1: Channel3 Deal Arbitrage & Subscription Guard**

1. **100M+ SKU Catalog Scans**: Channel3 monitors merchant prices against your target price mandates (e.g., ASUS ROG Strix, Sony WH-1000XM5).
2. **Autonomous Execution**: When an instant match is detected meeting your cryptographic threshold, the system executes a 1-click purchase via the **PayPal JS SDK v6** with Pay Later (BNPL) or PayPal Wallet.
3. **Subscription Optimizer**: Continuously audits recurring subscriptions via \`/v1/billing/subscriptions\` and flags unused seats for automatic downgrade.

[ACTION:NAVIGATE:channel3]`;
  }

  if (q.includes("bounty") || q.includes("human") || q.includes("oracle") || q.includes("engine 2")) {
    return `**Engine 2: Proof-of-Human Oracle Clearinghouse**

1. **Micro-Bounty Requests**: AI agents publish real-world ground-truth tasks requiring physical inspection or expert judgment (e.g., verifying inventory, code sanity checks).
2. **Gemini 3.8 Flash Verification**: Submissions are audited by Google Gemini using multimodal inference to score deliverable fidelity (0–100).
3. **Instant Settlement**: Passing submissions automatically trigger immediate payment using **PayPal Payouts v1** (\`POST /v1/payments/payouts\`) with zero dispute friction.

[ACTION:NAVIGATE:bounties]`;
  }

  if (q.includes("escrow") || q.includes("bryntum") || q.includes("engine 3") || q.includes("milestone")) {
    return `**Engine 3: Bryntum Milestone Escrow & Dispute Shield**

1. **Authorization Hold**: Counterparty funds are locked using PayPal Orders v2 with \`intent: "AUTHORIZE"\`.
2. **Interactive Gantt Timeline**: Project dependencies, WBS tasks, and deadlines are tracked on an interactive Bryntum Gantt chart.
3. **Gemini 4 Argon Audit**: When deliverables are uploaded (e.g., commit hashes, delivery receipts), Gemini audits criteria before triggering capture (\`POST /v2/payments/authorizations/{id}/capture\`).
4. **Dispute Shield**: Automatically attaches carrier tracking info via PayPal Trackers v2 to provide chargeback and dispute immunity.

[ACTION:NAVIGATE:bryntum]`;
  }

  if (q.includes("paypal") || q.includes("api") || q.includes("sdk")) {
    return `**NexusPulse PayPal Platform Integration**:

- **Orders v2** (\`/v2/checkout/orders\`): Multi-funding checkout (PayPal Wallet, Pay Later, Venmo) and milestone \`AUTHORIZE\` holds.
- **Payouts v1** (\`/v1/payments/payouts\`): High-speed batch settlements for Proof-of-Human bounties.
- **Subscriptions v1** (\`/v1/billing/subscriptions\`): Recurring SaaS plan auditing and automated tier downgrades.
- **Invoicing v2** (\`/v2/invoicing/invoices\`): Dynamic business invoicing with early-payment discounts and QR codes.
- **Trackers v2** (\`/v1/shipping/trackers\`): Injects DHL/FedEx proof of delivery into authorizations.
- **Webhooks v1** (\`/v1/notifications/verify-webhook-signature\`): Validates \`PAYPAL-TRANSMISSION-SIG\` before state mutation.
- **APIMatic Server SDK** (\`@paypal/paypal-server-sdk v2.5.0\`): Strongly-typed TypeScript controllers with idempotency and token caching.`;
  }

  if (q.includes("dual") || q.includes("sandbox") || q.includes("mirror")) {
    return `**Dual-Mode Gateway Architecture**:

- **Deterministic Sandbox Mirror Mode** (Default): Preloaded with realistic state, transactions, and live simulated responses. Enables instant evaluation without SMS phone verification hurdles.
- **Live PayPal Sandbox**: Switches automatically when \`PAYPAL_CLIENT_ID\` and \`PAYPAL_CLIENT_SECRET\` are provided via \`.env.local\` or the Header Hot-Swap drawer.
- **Full Parity**: Both modes implement identical REST response shapes, idempotency handling, and ledger entries.`;
  }

  return `**NexusPulse Autonomous Financial Clearinghouse**

NexusPulse unifies **Google Gemini AI** with **PayPal Developer APIs** to create an autonomous economy across 3 engines:
- **Engine 1**: Channel3 Autonomous Deal Hunter & Subscription Guard
- **Engine 2**: Proof-of-Human Oracle Payouts via Gemini 3.8 Flash
- **Engine 3**: Bryntum Zero-Dispute Milestone Escrow Gantt

How can I assist you with the platform? You can ask about our PayPal APIs, current savings, escrow milestones, or test simulated transactions.
[ACTION:NAVIGATE:overview]`;
}
