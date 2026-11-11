/**
 * NexusPulse AI Assistant — 200-Question & BYOK Live HTTP Verification Harness
 * Tests POST /api/ai/chatbot across all 200 questions, non-repetition checks,
 * brand/identity hygiene, and BYOK API key validation.
 */

import { CHATBOT_200_QUESTIONS } from "../src/tests/chatbot-200-questions.test.ts";

const BASE_URL =
  process.env.CHATBOT_URL || "http://localhost:3000/api/ai/chatbot";

const FORBIDDEN_SUBSTRINGS = [
  "openai/gpt-oss-120b",
  "qwen/qwen3.8-27b",
  "nexus-oracle-semantic-core",
  "Groq 120B",
  "Groq 120-Billion",
];

async function run200QuestionTest() {
  console.log(`\n================================================================`);
  console.log(`🤖 STARTING NEXUSPULSE AI ASSISTANT 200-QUESTION LIVE HTTP TEST`);
  console.log(`Total questions in benchmark: ${CHATBOT_200_QUESTIONS.length}`);
  console.log(`Target endpoint: ${BASE_URL}`);
  console.log(`================================================================\n`);

  let successCount = 0;
  let failureCount = 0;
  const startTime = Date.now();
  const coreIntentReplies = new Map();

  // 1. Test BYOK Key Validation Endpoint first
  console.log(`🔑 Step 1: Testing BYOK API Key Validation & Security Guardrails...`);
  const invalidFormatRes = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "VALIDATE_KEY", customApiKey: "invalid_key_123" }),
  });
  const invalidFormatData = await invalidFormatRes.json();
  if (invalidFormatRes.status === 400 && invalidFormatData.valid === false) {
    console.log(`  ✔ BYOK format validation rejected malformed key (HTTP 400): "${invalidFormatData.error}"`);
  } else {
    throw new Error(`Expected HTTP 400 for malformed BYOK key, got ${invalidFormatRes.status}`);
  }

  // 2. Test all 200 Questions in batches
  console.log(`\n📚 Step 2: Executing 200-Question Conversational Benchmark...`);
  const BATCH_SIZE = 10;
  for (let i = 0; i < CHATBOT_200_QUESTIONS.length; i += BATCH_SIZE) {
    const batch = CHATBOT_200_QUESTIONS.slice(i, i + BATCH_SIZE);
    const promises = batch.map(async (question, indexInBatch) => {
      const qNum = i + indexInBatch + 1;
      try {
        const res = await fetch(BASE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: question }),
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();
        if (!data.reply || typeof data.reply !== "string" || data.reply.length < 30) {
          throw new Error("Reply too short or invalid");
        }

        for (const forbidden of FORBIDDEN_SUBSTRINGS) {
          if (data.reply.toLowerCase().includes(forbidden.toLowerCase())) {
            throw new Error(`Leaked forbidden string "${forbidden}" in reply`);
          }
        }

        if (qNum <= 7) {
          coreIntentReplies.set(question, data.reply);
        }

        return {
          qNum,
          question,
          success: true,
          assistantName: data.assistantName || "NexusPulse AI Assistant",
          snippet: data.reply.slice(0, 75).replace(/\n/g, " "),
        };
      } catch (err) {
        return { qNum, question, success: false, error: err.message };
      }
    });

    const results = await Promise.all(promises);

    for (const r of results) {
      if (r.success) {
        successCount++;
        if (r.qNum <= 7 || r.qNum % 20 === 0 || r.qNum === 200) {
          console.log(
            `✔ [${String(r.qNum).padStart(3, " ")}/200] PASSED (${r.assistantName}): "${r.question}" -> ${r.snippet}...`
          );
        }
      } else {
        failureCount++;
        console.error(
          `✖ [${String(r.qNum).padStart(3, " ")}/200] FAILED: "${r.question}" -> Error: ${r.error}`
        );
      }
    }
  }

  // 3. Verify Core Intents produced distinct answers
  const uniqueCoreCount = new Set(coreIntentReplies.values()).size;
  console.log(
    `\n🎯 Step 3: Core Intent Uniqueness Check: ${uniqueCoreCount}/${coreIntentReplies.size} distinct answers for Q1–Q7.`
  );
  if (uniqueCoreCount < coreIntentReplies.size) {
    console.error(`✖ ERROR: Found repetitive answers among Q1–Q7!`);
    failureCount++;
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n================================================================`);
  console.log(`📊 200 CHATBOT QUESTIONS TEST COMPLETED in ${durationSec}s`);
  console.log(`✅ Passed: ${successCount} / 200 (${((successCount / 200) * 100).toFixed(1)}%)`);
  console.log(`❌ Failed: ${failureCount}`);
  console.log(`================================================================\n`);

  if (failureCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

run200QuestionTest().catch((e) => {
  console.error("FATAL ERROR running 200 question test:", e);
  process.exit(1);
});
