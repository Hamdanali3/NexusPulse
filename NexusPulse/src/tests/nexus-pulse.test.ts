import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  gatewayCreateOrder,
  gatewayCaptureOrAuthorizeOrder,
  gatewayOptimizeSubscription,
} from "../lib/paypal/paypal-gateway";
import {
  getMirrorState,
  hydrateMirrorState,
  resetMirrorState,
} from "../lib/paypal/paypal-sandbox-mirror";
import { verifyPayPalWebhookSignature } from "../lib/paypal/paypal-client";
import {
  runNexusPulseAgentInteraction,
  verifyHumanBountySubmissionWithGemini,
} from "../lib/ai/gemini-agent";
import {
  isAllowedFetchSite,
  sanitizeText,
  validateContactForm,
  validateEmail,
  validateRecipientAccount,
  validateUsdAmount,
} from "../lib/security/validation";
import { POST as contactPost, GET as contactGet } from "../app/api/contact/route";
import { VERIFIED_NAVIGATION_LINKS } from "../lib/ai/nexus-knowledge-base";

describe("NexusPulse — Connecting AI Agents, Human Oracles & Smart Payments on PayPal", () => {
  beforeEach(() => {
    resetMirrorState();
  });

  it("returns complete application state with KPIs and all 3 economic engines", () => {
    const state = getMirrorState();
    assert.ok(state.walletBalanceUsd > 1000);
    assert.ok(state.orders.length >= 2);
    assert.ok(state.payouts.length >= 1);
    assert.ok(state.subscriptions.length >= 3);
    assert.ok(state.bounties.length >= 3);
    assert.ok(state.escrowMilestones.length >= 2);
    assert.ok(state.channel3Deals.length >= 3);
    assert.ok(state.transactions.length >= 4);
  });

  it("creates and captures a PayPal Order v2 with Channel3 deal update and idempotency key", async () => {
    const created = await gatewayCreateOrder({
      intent: "CAPTURE",
      amountValue: "189.00",
      currencyCode: "USD",
      description: "NVIDIA Jetson Orin Nano Super via Channel3 Mandate",
      category: "CHANNEL3_DEAL",
      fundingSource: "paypal",
    });

    assert.ok(created.id);
    assert.ok(created.paypal_request_id);
    assert.equal(created.status, "CREATED");

    const captured = await gatewayCaptureOrAuthorizeOrder({
      orderId: created.id,
      action: "CAPTURE",
      fundingSource: "paypal",
      channel3DealId: "C3-PROD-9001",
    });

    assert.equal(captured.status, "COMPLETED");
    assert.ok(captured.capture_id);

    const stateAfter = getMirrorState();
    const updatedDeal = stateAfter.channel3Deals.find(
      (d) => d.id === "C3-PROD-9001"
    );
    assert.equal(updatedDeal?.mandate_status, "PURCHASED_VIA_PAYPAL");
  });

  it("verifies Proof-of-Human Oracle evidence and executes instant PayPal Payouts v1 settlement", async () => {
    const stateBefore = getMirrorState();
    const openBounty = stateBefore.bounties.find(
      (b) => b.status === "OPEN"
    )!;

    const result = await verifyHumanBountySubmissionWithGemini({
      bountyId: openBounty.id,
      evidenceText: openBounty.sample_evidence_text,
      recipientEmail: "oracle-contributor@sandbox.paypal.com",
    });

    assert.equal(result.verification.passed, true);
    assert.ok(result.verification.score >= 85);
    assert.equal(result.payout.batch_status, "SUCCESS");

    const stateAfter = getMirrorState();
    const updatedBounty = stateAfter.bounties.find(
      (b) => b.id === openBounty.id
    );
    assert.equal(updatedBounty?.status, "PAID_OUT");
  });

  it("locks and releases A2A Smart Escrow Milestone via PayPal Orders v2 AUTHORIZE + Capture", async () => {
    const order = await gatewayCreateOrder({
      amountValue: "350.00",
      intent: "AUTHORIZE",
      description: "A2A Smart Escrow: Zero-Dispute Webhook Router",
      category: "ESCROW_MILESTONE",
    });

    const authorized = await gatewayCaptureOrAuthorizeOrder({
      orderId: order.id,
      action: "AUTHORIZE",
    });

    assert.equal(authorized.status, "APPROVED");
    assert.ok(authorized.authorization_id);

    const captured = await gatewayCaptureOrAuthorizeOrder({
      orderId: order.id,
      action: "CAPTURE",
      escrowMilestoneId: "ESCROW-102",
      trackingNumber: "DHL-PK-99887766",
      carrier: "DHL",
    });

    assert.equal(captured.status, "COMPLETED");
    assert.equal(captured.tracking_number, "DHL-PK-99887766");

    const stateAfter = getMirrorState();
    const milestone = stateAfter.escrowMilestones.find(
      (m) => m.id === "ESCROW-102"
    );
    assert.equal(milestone?.status, "AI_VERIFIED_CAPTURED");
  });

  it("optimizes recurring PayPal Subscriptions v1 plans to eliminate subscription leakage", async () => {
    const stateBefore = getMirrorState();
    const targetSub = stateBefore.subscriptions.find(
      (s) => Number(s.potential_monthly_savings.value) > 0
    )!;

    const result = await gatewayOptimizeSubscription({
      subscriptionId: targetSub.id,
      action: "REVISE_DOWNGRADE",
    });

    assert.equal(result.subscription.potential_monthly_savings.value, "0.00");
    assert.ok(result.monthlySaved > 0);
    assert.ok(result.annualSaved > 0);
  });

  it("verifies PayPal Webhook cryptographic headers before processing state mutations", async () => {
    const verified = await verifyPayPalWebhookSignature({
      headers: {
        authAlgo: "SHA256withRSA",
        certUrl:
          "https://api.sandbox.paypal.com/v1/notifications/certs/CERT-123",
        transmissionId: "WH-TX-12345",
        transmissionSig: "VALID-SIG-12345",
        transmissionTime: new Date().toISOString(),
      },
      rawBody: JSON.stringify({ event_type: "PAYMENT.CAPTURE.COMPLETED" }),
      webhookId: "WH-ID-999",
    });

    assert.equal(verified.verified, true);
    assert.equal(verified.status, "SUCCESS");
  });

  it("executes Google Gemini Agentic CFO sweep with PayPal MCP tool bindings", async () => {
    const response = await runNexusPulseAgentInteraction({
      prompt:
        "Optimize my unused PayPal subscription and downgrade idle GPU plan to save money",
      mode: "deep_cfo_audit",
    });

    assert.ok(response.interactionId);
    assert.ok(response.outputText.length > 20);
    assert.ok(response.toolExecutions.length > 0);
    assert.ok(typeof response.durationMs === "number");
  });

  it("executes multi-turn Gemini Agentic CFO bounty ranking and escrow audit tools", async () => {
    const firstTurn = await runNexusPulseAgentInteraction({
      prompt: "Rank open Proof-of-Human Oracle bounties by hourly PayPal Payout yield",
      mode: "fast_agent",
    });
    assert.ok(
      firstTurn.toolExecutions.some((t) => t.toolName === "rank_human_oracle_bounties")
    );

    const secondTurn = await runNexusPulseAgentInteraction({
      prompt: "Audit A2A Smart Escrow milestones and Dispute Shield tracking status",
      previousInteractionId: firstTurn.interactionId,
      mode: "deep_cfo_audit",
    });
    assert.equal(secondTurn.previousInteractionId, firstTurn.interactionId);
    assert.ok(
      secondTurn.toolExecutions.some((t) => t.toolName === "audit_escrow_and_disputes")
    );
  });

  it("hydrates mirror state cleanly from external Supabase PostgreSQL payload", () => {
    const customState = structuredClone(getMirrorState());
    customState.walletBalanceUsd = 9999.99;
    hydrateMirrorState(customState);
    assert.equal(getMirrorState().walletBalanceUsd, 9999.99);
  });

  it("validates and sanitizes financial amounts, recipient accounts, and Fetch Metadata headers", () => {
    assert.equal(sanitizeText("  Hello \u0000World  ", 20), "Hello World");
    assert.equal(validateUsdAmount("189.50").valid, true);
    assert.equal(validateUsdAmount("-10").valid, false);
    assert.equal(validateUsdAmount("999999").valid, false);
    assert.equal(
      validateRecipientAccount("sb-buyer-nexus@personal.example.com").valid,
      true
    );
    assert.equal(validateRecipientAccount("@nexus_user").valid, true);
    assert.equal(validateRecipientAccount("not-an-email").valid, false);

    const sameOriginHeaders = new Headers({ "sec-fetch-site": "same-origin" });
    const crossSiteHeaders = new Headers({ "sec-fetch-site": "cross-site" });
    assert.equal(isAllowedFetchSite(sameOriginHeaders), true);
    assert.equal(isAllowedFetchSite(crossSiteHeaders), false);
  });

  it("validates 200 expected questions, non-repetitive core intents, anti-hallucination, and brand hygiene for the AI chatbot", async () => {
    const { CHATBOT_200_QUESTIONS } = await import("./chatbot-200-questions.test");
    const {
      generateContextAwareRagResponse,
      retrieveRelevantKnowledge,
      VERIFIED_NAVIGATION_LINKS,
    } = await import("../lib/ai/nexus-knowledge-base");
    const { sanitizeAssistantReply } = await import("../app/api/ai/chatbot/route");

    assert.equal(CHATBOT_200_QUESTIONS.length, 200);

    const state = getMirrorState();

    // 1. Core Intents Uniqueness Check (Greetings, Identity, Creator, Purpose, Capabilities, Website Purpose)
    const corePrompts = [
      "Hello",
      "who are you?",
      "who built you?",
      "what is your purpose?",
      "what can you do?",
      "what is website for ?",
    ];
    const coreReplies = corePrompts.map((p) =>
      generateContextAwareRagResponse(p, [], state)
    );
    assert.equal(
      new Set(coreReplies).size,
      corePrompts.length,
      "Every core identity/greeting/purpose/overview question must produce a distinct answer"
    );

    // 2. Verify all 200 questions return substantive answers with zero raw model/provider leakage
    const forbiddenPatterns = [
      /openai\/gpt-oss-120b/i,
      /qwen\/qwen3\.8-27b/i,
      /nexus-oracle-semantic-core/i,
      /Groq 120-Billion/i,
      /Groq 120B/i,
      /powered by Groq/i,
    ];

    for (let i = 0; i < CHATBOT_200_QUESTIONS.length; i++) {
      const q = CHATBOT_200_QUESTIONS[i];
      const reply = sanitizeAssistantReply(
        generateContextAwareRagResponse(q, [], state)
      );
      assert.ok(reply.length >= 40, `Reply for Q#${i + 1} is too short`);
      for (const pat of forbiddenPatterns) {
        assert.doesNotMatch(reply, pat);
      }
    }

    // 3. Anti-Hallucination Guardrails
    assert.match(
      generateContextAwareRagResponse("Does NexusPulse support Bitcoin mining?", [], state),
      /does not support cryptocurrency mining/i
    );
    assert.match(
      generateContextAwareRagResponse("Where can I download the iOS mobile app?", [], state),
      /does not have a separate native iOS, Android/i
    );
    assert.match(
      generateContextAwareRagResponse("Take me to /login or /pricing", [], state),
      /does not have a separate `\/login`/i
    );

    // 4. Multi-Turn Context Awareness
    const e1History = [
      { role: "user" as const, content: "What is Engine 1?" },
      {
        role: "assistant" as const,
        content: generateContextAwareRagResponse("What is Engine 1?", [], state),
      },
    ];
    const e2History = [
      { role: "user" as const, content: "Tell me about Engine 2 bounties" },
      {
        role: "assistant" as const,
        content: generateContextAwareRagResponse("Tell me about Engine 2 bounties", [], state),
      },
    ];
    const e1FollowUp = generateContextAwareRagResponse("How do I use it?", e1History, state);
    const e2FollowUp = generateContextAwareRagResponse("How do I use it?", e2History, state);
    assert.notEqual(e1FollowUp, e2FollowUp);

    // 5. Verified Navigation Deep Links & RAG Retrieval
    const validUrls = new Set(Object.values(VERIFIED_NAVIGATION_LINKS).map((v) => v.url));
    assert.ok(validUrls.has("/?tab=channel3#engine-channel3"));
    assert.ok(validUrls.has("/?tab=bounties#engine-bounties"));
    assert.ok(validUrls.has("/?tab=bryntum#engine-bryntum"));
    assert.ok(validUrls.has("/?tab=aggrid#aggrid-heading"));
    assert.ok(validUrls.has("/about"));
    assert.ok(validUrls.has("/contact"));
    assert.equal(
      retrieveRelevantKnowledge("How do I claim BOUNTY-102 cold chain?")[0].category,
      "engine_2_bounties"
    );
  });

  it("validates and processes contact form submissions with strict schema rules, honeypot, and SLA estimation", async () => {
    // 1. Missing fields should fail
    const emptyRes = validateContactForm({});
    assert.equal(emptyRes.valid, false);
    assert.ok(emptyRes.errors.fullName);
    assert.ok(emptyRes.errors.email);
    assert.ok(emptyRes.errors.message);

    // 2. Invalid email format should fail
    const invalidEmailRes = validateContactForm({
      fullName: "Judge Evaluator",
      email: "not-an-email",
      inquiryType: "hackathon_judging",
      role: "judge",
      urgency: "urgent_judge",
      subject: "Evaluating PayPal Hackathon Project",
      message: "Here is a sufficiently long message testing validation.",
      agreedToTerms: true,
    });
    assert.equal(invalidEmailRes.valid, false);
    assert.ok(invalidEmailRes.errors.email);

    // 3. Bot Honeypot detection
    const botRes = validateContactForm({
      fullName: "Spam Bot",
      email: "bot@spam.com",
      inquiryType: "general",
      role: "other",
      urgency: "normal",
      subject: "Buy cheap crypto",
      message: "Here is spam payload text for the test.",
      agreedToTerms: true,
      honeypot: "https://spam-link.com",
    });
    assert.equal(botRes.valid, false);
    assert.equal(botRes.isBot, true);

    // 4. Valid inquiry passes and sanitizes
    const validRes = validateContactForm({
      fullName: "Dr. Jane Smith <script>",
      email: "jane.smith@paypal.com",
      inquiryType: "hackathon_judging",
      role: "judge",
      urgency: "urgent_judge",
      subject: "Judge Review: Dual-Mode Sandbox Verification",
      referenceId: "ORD-90123",
      message: "Detailed feedback on the Gemini 3.8 Flash multimodal verification latency.",
      agreedToTerms: true,
    });
    assert.equal(validRes.valid, true);
    assert.equal(validRes.data?.fullName, "Dr. Jane Smith script");
    assert.equal(validRes.data?.email, "jane.smith@paypal.com");
    assert.equal(validRes.data?.urgency, "urgent_judge");

    // 5. Test Contact API POST route
    const postReq = new Request("http://localhost:3000/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json", "sec-fetch-site": "same-origin" },
      body: JSON.stringify({
        fullName: "Judge Tester",
        email: "judge@hackathon.paypal.com",
        inquiryType: "hackathon_judging",
        role: "judge",
        urgency: "urgent_judge",
        subject: "Evaluating NexusPulse Clearinghouse",
        referenceId: "REF-HACK-01",
        message: "Testing the end-to-end contact ticket clearinghouse flow for hackathon review.",
        agreedToTerms: true,
      }),
    });
    const postResponse = await contactPost(postReq);
    const postJson = await postResponse.json();
    assert.equal(postResponse.status, 200);
    assert.equal(postJson.success, true);
    assert.ok(postJson.ticketId.startsWith("NEXUS-REQ-"));
    assert.match(postJson.estimatedSla, /< 2 hours/i);

    // 6. Test Contact API GET route
    const getResponse = await contactGet();
    const getJson = await getResponse.json();
    assert.equal(getResponse.status, 200);
    assert.equal(getJson.status, "OPERATIONAL");
    assert.ok(getJson.totalInquiriesReceived >= 1);
  });

  it("validates Autonomous CFO across 200+ questions including identity, roles, out-of-scope rejection, and anti-hallucination", async () => {
    const { CHATBOT_200_QUESTIONS } = await import("./chatbot-200-questions.test");
    const { runNexusPulseAgentInteraction } = await import("../lib/ai/gemini-agent");

    // 1. Test combined identity & roles question (user's explicit example)
    const combinedRes = await runNexusPulseAgentInteraction({
      prompt: "who built you and what are your roles?",
    });
    assert.ok(combinedRes.outputText.length > 100);
    assert.match(combinedRes.outputText, /NexusPulse engineering and architecture team/i);
    assert.match(combinedRes.outputText, /Autonomous Personal AI CFO/i);
    assert.match(combinedRes.outputText, /Autopilot Subscription Guard/i);
    assert.match(combinedRes.outputText, /Channel3 Deal Hunter/i);
    assert.match(combinedRes.outputText, /Proof-of-Human Verification Oracle/i);
    assert.match(combinedRes.outputText, /Smart Escrow & Dispute Shield/i);
    assert.match(combinedRes.outputText, /Treasury Management/i);

    // 2. Test individual "who built you?"
    const builtRes = await runNexusPulseAgentInteraction({ prompt: "who built you?" });
    assert.match(builtRes.outputText, /NexusPulse engineering and architecture team/i);

    // 3. Test individual "what are your roles?"
    const rolesRes = await runNexusPulseAgentInteraction({ prompt: "what are your roles?" });
    assert.match(rolesRes.outputText, /Five Executive Roles of the Autonomous CFO/i);
    assert.match(rolesRes.outputText, /Subscription Guard/i);
    assert.match(rolesRes.outputText, /Channel3 Deal Hunter/i);

    // 4. Test individual "who are you?"
    const whoRes = await runNexusPulseAgentInteraction({ prompt: "who are you?" });
    assert.match(whoRes.outputText, /NexusPulse/i);
    assert.match(whoRes.outputText, /Autonomous Personal AI CFO/i);

    // 5. Test out-of-scope questions (must NOT hallucinate, must state outside scope, must list permitted topics)
    const outOfScopeQueries = [
      "how to bake chocolate chip cookies?",
      "what is the weather in Tokyo right now?",
      "what is the capital of Australia?",
      "write a python quicksort script",
      "can you diagnose my headache and stomach ache?",
      "who won the FIFA World Cup in 2022?",
      "write me a love poem about the ocean",
      "how do I change the oil in a 2015 Honda Civic?",
      "can you recommend a good action movie on Netflix?",
      "tell me a funny programmer joke",
      "what are the best growth stocks to buy today on Wall Street?",
      "can I mine Bitcoin using Engine 2 bounties on NexusPulse?",
      "where can I download the iOS app from the Apple App Store?",
      "take me to the /pricing page to pay monthly fees",
    ];

    for (const q of outOfScopeQueries) {
      const res = await runNexusPulseAgentInteraction({ prompt: q });
      assert.ok(res.outputText.length > 50, `Output for query "${q}" is too short`);
      const isRefused =
        /outside my operational scope/i.test(res.outputText) ||
        /does not support/i.test(res.outputText) ||
        /does not have/i.test(res.outputText) ||
        /cannot provide answers/i.test(res.outputText);
      assert.ok(isRefused, `Query "${q}" was not recognized as out-of-scope or unsupported`);
      assert.match(res.outputText, /Subscription Guard/i);
      assert.match(res.outputText, /Channel3 Deal Hunter|Engine 1/i);
    }

    // 6. Test all 200 diverse questions from CHATBOT_200_QUESTIONS through the Autonomous CFO
    assert.equal(CHATBOT_200_QUESTIONS.length, 200);
    for (let i = 0; i < CHATBOT_200_QUESTIONS.length; i++) {
      const prompt = CHATBOT_200_QUESTIONS[i];
      const res = await runNexusPulseAgentInteraction({ prompt });
      assert.ok(res.interactionId, `Q#${i + 1} missing interactionId`);
      assert.ok(res.outputText.length >= 30, `Q#${i + 1} "${prompt}" output text is too short`);
      assert.match(res.outputText, /### 1\./, `Q#${i + 1} "${prompt}" missing markdown section header`);
    }
  });

  it("validates production launch modules: dual-mode live PayPal gateway, Channel3 catalog search, and media upload validation", async () => {
    const { getPayPalBaseUrl, isPayPalLiveEnvironment } = await import("../lib/paypal/paypal-client");
    const { resolveActivePayPalMode, setRuntimePayPalCredentials } = await import("../lib/paypal/paypal-gateway");

    // 1. Validate PayPal Base URL resolution
    const defaultUrl = getPayPalBaseUrl();
    assert.ok(defaultUrl.startsWith("https://api-m."), "Base URL must target PayPal API");
    assert.equal(typeof isPayPalLiveEnvironment(), "boolean");

    // 2. Validate Gateway mode switching
    const initialMode = resolveActivePayPalMode();
    assert.ok(["live", "sandbox", "mirror"].includes(initialMode));

    const switched = setRuntimePayPalCredentials({
      clientId: "test_live_sandbox_client_id_abc123",
      clientSecret: "test_live_sandbox_secret_xyz789",
      preferredMode: "sandbox",
    });
    assert.equal(switched.activeMode, "sandbox");

    const autoSwitched = setRuntimePayPalCredentials({
      clientId: "",
      clientSecret: "",
      preferredMode: "auto",
    });
    assert.ok(["live", "sandbox", "mirror"].includes(autoSwitched.activeMode));

    // 3. Test Channel3 search route
    const { GET: channel3Get } = await import("../app/api/channel3/search/route");
    const { NextRequest } = await import("next/server");

    const reqAll = new NextRequest("http://localhost:3000/api/channel3/search");
    const resAll = await channel3Get(reqAll);
    assert.equal(resAll.status, 200);
    const jsonAll = await resAll.json();
    assert.ok(jsonAll.count >= 1);
    assert.ok(Array.isArray(jsonAll.deals));

    const reqFiltered = new NextRequest("http://localhost:3000/api/channel3/search?q=orin");
    const resFiltered = await channel3Get(reqFiltered);
    assert.equal(resFiltered.status, 200);
    const jsonFiltered = await resFiltered.json();
    assert.ok(jsonFiltered.deals.some((d: any) => d.title.toLowerCase().includes("orin")));

    // 4. Test Media Upload endpoint
    const { POST: mediaUploadPost } = await import("../app/api/media/upload/route");
    const formData = new FormData();
    const fakeFile = new File(["test image bytes"], "inspection_proof.png", { type: "image/png" });
    formData.append("file", fakeFile);
    formData.append("bountyId", "POH-401");

    const mediaReq = new NextRequest("http://localhost:3000/api/media/upload", {
      method: "POST",
      body: formData,
    });
    const mediaRes = await mediaUploadPost(mediaReq);
    assert.equal(mediaRes.status, 200);
    const mediaJson = await mediaRes.json();
    assert.equal(mediaJson.success, true);
    assert.ok(mediaJson.mediaUrl);
    assert.equal(mediaJson.mimeType, "image/png");
  });
});
