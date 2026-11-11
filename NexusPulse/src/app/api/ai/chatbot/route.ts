import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import {
  getMirrorState,
  type NexusPulseState,
} from "@/lib/paypal/paypal-sandbox-mirror";
import {
  generateContextAwareRagResponse,
  retrieveRelevantKnowledge,
  VERIFIED_NAVIGATION_LINKS,
} from "@/lib/ai/nexus-knowledge-base";

export const runtime = "nodejs";

function getPlatformGroqKey(): string {
  const raw =
    process.env.GROQ_API_KEY ||
    process.env.Groq_API_KEY ||
    "";
  return raw.replace(/^GROQ_API_KEY\s*[:=]\s*/i, "").trim();
}

function sanitizeCustomGroqKey(rawKey?: string | null): string | null {
  if (!rawKey || typeof rawKey !== "string") return null;
  const cleaned = rawKey.trim();
  if (!cleaned) return null;
  return cleaned;
}

function isValidGroqKeyFormat(key: string): boolean {
  return /^gsk_[A-Za-z0-9_-]{20,128}$/.test(key);
}

/**
 * Scrubs any accidental provider or raw model identifier references from LLM output
 * so the assistant always presents a clean, unified NexusPulse identity.
 */
export function sanitizeAssistantReply(text: string): string {
  return text
    .replace(/\bGroq\s+120-Billion\s+Parameter\s+Frontier\s+AI\s+Model\b/gi, "NexusPulse AI Engine")
    .replace(/\bGroq\s+120B\s+Frontier\s+(AI\s+)?Model\b/gi, "NexusPulse AI Engine")
    .replace(/\bpowered\s+by\s+Groq\b/gi, "powered by NexusPulse AI")
    .replace(/\bopenai\/gpt-oss-120b\b/gi, "NexusPulse AI")
    .replace(/\bqwen\/qwen3\.8-27b\b/gi, "NexusPulse AI")
    .replace(/\bllama-3\.3-70b-versatile\b/gi, "NexusPulse AI")
    .replace(/\bnexus-oracle-semantic-core\b/gi, "NexusPulse AI");
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatbotRequestBody {
  action?: "CHAT" | "VALIDATE_KEY";
  message?: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  stateContext?: Partial<NexusPulseState> | null;
  customApiKey?: string | null;
}

function buildSystemPrompt(
  query: string,
  history: Array<{ role: "user" | "assistant"; content: string }>,
  state?: Partial<NexusPulseState> | null
): string {
  const walletBalance = state?.walletBalanceUsd ?? 24650.0;
  const totalSaved = state?.totalSavedByAiUsd ?? 707.55;
  const totalEarned = state?.totalEarnedFromBountiesUsd ?? 395.0;
  const totalEscrow = state?.totalEscrowProtectedUsd ?? 3450.0;
  const dealsCount = state?.channel3Deals?.length ?? 4;
  const bountiesCount = state?.bounties?.length ?? 4;
  const milestonesCount = state?.escrowMilestones?.length ?? 3;
  const subscriptionsCount = state?.subscriptions?.length ?? 3;

  const retrievedDocs = retrieveRelevantKnowledge(query, history);
  const ragContext = retrievedDocs
    .map(
      (doc, idx) =>
        `[DOC ${idx + 1}: ${doc.title} | Route: ${doc.route}]\nSummary: ${doc.summary}\n${doc.details}`
    )
    .join("\n\n");

  const navDirectory = Object.values(VERIFIED_NAVIGATION_LINKS)
    .map((nav) => `- [${nav.label}](${nav.url}): ${nav.description}`)
    .join("\n");

  return `You are the **NexusPulse AI Assistant** — the official intelligent financial architect, platform guide, and interactive assistant created for **NexusPulse** (the Autonomous Financial Clearinghouse built on PayPal REST APIs & JS SDK v6).

STRICT IDENTITY & BRANDING RULES (CRITICAL):
1. Always identify yourself as **NexusPulse AI Assistant**, created by the **NexusPulse engineering and architecture team** specifically for the NexusPulse platform.
2. NEVER advertise or mention underlying AI providers or raw model identifiers (do NOT mention "Groq", "openai/gpt-oss-120b", "qwen", "Llama", or "nexus-oracle-semantic-core") in ordinary conversation.
3. Answer the user's exact question directly, naturally, and uniquely:
   - If greeted ("Hello", "Hi"), respond with a warm greeting and a concise live workspace summary.
   - If asked "Who are you?", explain your role as the NexusPulse AI Assistant.
   - If asked "Who created/built you?", explain that the NexusPulse engineering team built you for the NexusPulse platform.
   - If asked "What is your purpose?", explain your mission to help users navigate NexusPulse, understand the 3 engines, and inspect live PayPal telemetry.
   - If asked "What can you do?", list your concrete capabilities across Engine 1, Engine 2, Engine 3, AG Grid Telemetry, and BYOK settings.
   - Never give the same generic paragraph to different questions.

ANTI-HALLUCINATION & ACCURACY RULES:
1. Only describe features, deals, bounties, escrow milestones, subscriptions, invoices, and APIs that actually exist in NexusPulse.
2. If a user asks about non-existent features (e.g., Bitcoin/crypto mining, NFTs, stock trading, native iOS/Android mobile app downloads, bank mortgages, or separate \`/login\`, \`/signup\`, or \`/pricing\` pages), explicitly state that NexusPulse does NOT offer those features and clarify what NexusPulse actually provides.
3. Never invent fake URLs. Use ONLY the verified links below when directing users:
${navDirectory}
4. You may also append one navigation action tag at the end of your reply when appropriate:
   - \`[ACTION:NAVIGATE:channel3]\`
   - \`[ACTION:NAVIGATE:bounties]\`
   - \`[ACTION:NAVIGATE:bryntum]\`
   - \`[ACTION:NAVIGATE:aggrid]\`
   - \`[ACTION:NAVIGATE:overview]\`

LIVE REAL-TIME WORKSPACE TELEMETRY:
- Protected Wallet Balance: $${walletBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })} USD
- Realized AI Savings: $${totalSaved.toFixed(2)} USD (+ $2,520.00/yr Subscription Guard savings)
- Proof-of-Human Payouts Settled: $${totalEarned.toFixed(2)} USD
- Active Escrow Locked: $${totalEscrow.toFixed(2)} USD
- Monitored Channel3 Deals: ${dealsCount} items (C3-PROD-9001 ASUS ROG Strix $2,687.04, C3-PROD-9002 MacBook Pro M4 Max $1,279.00, C3-PROD-9003 Keychron Q1 Max $174.00, C3-PROD-9004 Sony WH-1000XM5 $228.00)
- Proof-of-Human Bounties: ${bountiesCount} items (BOUNTY-101 $28.50, BOUNTY-102 $42.00, BOUNTY-103 $65.00, BOUNTY-104 $25.00 Paid)
- Active Escrow Milestones: ${milestonesCount} WBS items (ESCROW-101 $850 Captured, ESCROW-102 $1,250 Locked, ESCROW-103 $1,350 Locked)
- Monitored Subscriptions: ${subscriptionsCount} SaaS plans (I-SUB-AI-CLOUD-8801 $189/mo, I-SUB-DEV-SUITE-4410 $99/mo, I-SUB-DESIGN-1029 $54.99/mo)

RETRIEVED PLATFORM KNOWLEDGE FOR THIS QUERY:
${ragContext}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ChatbotRequestBody;
    const headerKey = req.headers.get("x-groq-api-key");
    const customApiKey = sanitizeCustomGroqKey(headerKey || body.customApiKey);

    // -------------------------------------------------------------------------
    // MODE 1: VALIDATE PERSONAL BYOK GROQ API KEY
    // -------------------------------------------------------------------------
    if (body.action === "VALIDATE_KEY") {
      if (!customApiKey) {
        return NextResponse.json(
          {
            valid: false,
            error: "Please enter a Groq API key to validate.",
          },
          { status: 400 }
        );
      }

      if (!isValidGroqKeyFormat(customApiKey)) {
        return NextResponse.json(
          {
            valid: false,
            error:
              "Invalid key format. A valid Groq API key begins with 'gsk_' followed by at least 20 alphanumeric characters.",
          },
          { status: 400 }
        );
      }

      try {
        const testClient = new Groq({ apiKey: customApiKey, timeout: 6000 });
        await testClient.models.list();
        return NextResponse.json({
          valid: true,
          keySource: "personal_byok",
          message:
            "Personal Groq API key verified and connected. Requests will now use your personal account credentials.",
        });
      } catch (err: unknown) {
        const status =
          typeof err === "object" && err !== null && "status" in err
            ? Number((err as { status?: number }).status)
            : 401;
        const reason =
          status === 401
            ? "Authentication failed: The provided Groq API key was rejected as invalid or expired."
            : status === 429
            ? "Rate limit reached on your personal Groq account. Please check your Groq console quota."
            : "Could not verify the API key with Groq at this moment. Please check the key and try again.";

        return NextResponse.json(
          {
            valid: false,
            error: reason,
          },
          { status: status === 429 ? 429 : 401 }
        );
      }
    }

    // -------------------------------------------------------------------------
    // MODE 2: CONVERSATIONAL AI ASSISTANT QUERY
    // -------------------------------------------------------------------------
    const { message, history = [], stateContext = null } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Please enter a message or question." },
        { status: 400 }
      );
    }

    const cleanMessage = message.trim().slice(0, 2000);
    const activeState = stateContext ?? getMirrorState();
    const systemPrompt = buildSystemPrompt(cleanMessage, history, activeState);

    const groqMessages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...history.slice(-10).map((h) => ({
        role: h.role,
        content: h.content,
      })),
      { role: "user", content: cleanMessage },
    ];

    // Determine whether to use Personal BYOK Key or Platform Default Key
    let activeGroqClient: Groq | null = null;
    let usingCustomKey = false;
    let byokWarning: string | undefined;

    if (customApiKey) {
      if (!isValidGroqKeyFormat(customApiKey)) {
        return NextResponse.json(
          {
            error:
              "Your configured personal Groq API key has an invalid format (must start with 'gsk_'). Please update or remove it in API Key Settings.",
            byokError: true,
          },
          { status: 401 }
        );
      }
      activeGroqClient = new Groq({ apiKey: customApiKey, timeout: 8000 });
      usingCustomKey = true;
    } else {
      const platformKey = getPlatformGroqKey();
      if (platformKey) {
        activeGroqClient = new Groq({ apiKey: platformKey, timeout: 8000 });
      }
    }

    if (activeGroqClient) {
      const candidateModels = [
        "openai/gpt-oss-120b",
        "llama-3.3-70b-versatile",
        "qwen/qwen3-32b",
      ];

      for (const modelName of candidateModels) {
        try {
          const completion = await activeGroqClient.chat.completions.create({
            model: modelName,
            messages: groqMessages,
            temperature: 0.25,
            max_tokens: 750,
          });

          const rawReply = completion.choices[0]?.message?.content?.trim();
          if (rawReply) {
            const cleanReply = sanitizeAssistantReply(rawReply);
            return NextResponse.json({
              reply: cleanReply,
              assistantName: "NexusPulse AI Assistant",
              keySource: usingCustomKey ? "personal_byok" : "platform_default",
              status: "success",
            });
          }
        } catch (err: unknown) {
          const errStatus =
            typeof err === "object" && err !== null && "status" in err
              ? Number((err as { status?: number }).status)
              : 500;

          // If the user explicitly supplied an invalid/revoked personal BYOK key, notify them clearly
          if (usingCustomKey && (errStatus === 401 || errStatus === 403)) {
            return NextResponse.json(
              {
                error:
                  "Your personal Groq API key was rejected (invalid or expired). Please update or remove your key in API Key Settings to continue.",
                byokError: true,
              },
              { status: 401 }
            );
          }

          if (usingCustomKey && errStatus === 429) {
            byokWarning =
              "Notice: Your personal Groq account hit a rate limit; answered using NexusPulse's built-in knowledge engine.";
            break;
          }
        }
      }
    }

    // Context-Aware RAG & Intent Synthesis Engine (100% availability, zero repetitive responses)
    const ragReply = sanitizeAssistantReply(
      generateContextAwareRagResponse(cleanMessage, history, activeState)
    );

    return NextResponse.json({
      reply: byokWarning ? `> *${byokWarning}*\n\n${ragReply}` : ragReply,
      assistantName: "NexusPulse AI Assistant",
      keySource: usingCustomKey ? "personal_byok" : "platform_default",
      byokWarning,
      status: "success",
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
