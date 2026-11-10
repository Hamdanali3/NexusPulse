/**
 * NexusPulse Chatbot 200 Questions Automated Verification Harness
 * Tests the /api/ai/chatbot endpoint across all 200 questions
 */

import { CHATBOT_200_QUESTIONS } from "../src/tests/chatbot-200-questions.test.ts";

const BASE_URL = "http://localhost:3000/api/ai/chatbot";

async function run200QuestionTest() {
  console.log(`\n======================================================`);
  console.log(`🤖 STARTING NEXUSPULSE AI CHATBOT 200-QUESTION TEST`);
  console.log(`Total questions in benchmark: ${CHATBOT_200_QUESTIONS.length}`);
  console.log(`Target endpoint: ${BASE_URL}`);
  console.log(`======================================================\n`);

  let successCount = 0;
  let failureCount = 0;
  const startTime = Date.now();

  // Test in batches of 5 concurrent requests to avoid server saturation
  const BATCH_SIZE = 5;
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
        if (!data.reply || typeof data.reply !== "string" || data.reply.length < 20) {
          throw new Error("Reply too short or invalid");
        }

        return { qNum, question, success: true, model: data.modelUsed, snippet: data.reply.slice(0, 70).replace(/\n/g, " ") };
      } catch (err) {
        return { qNum, question, success: false, error: err.message };
      }
    });

    const results = await Promise.all(promises);

    for (const r of results) {
      if (r.success) {
        successCount++;
        if (r.qNum % 10 === 0 || r.qNum === 1 || r.qNum === 200) {
          console.log(`✔ [${String(r.qNum).padStart(3, " ")}/200] PASSED (${r.model}): "${r.question}" -> ${r.snippet}...`);
        }
      } else {
        failureCount++;
        console.error(`✖ [${String(r.qNum).padStart(3, " ")}/200] FAILED: "${r.question}" -> Error: ${r.error}`);
      }
    }
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n======================================================`);
  console.log(`📊 200 CHATBOT QUESTIONS TEST COMPLETED in ${durationSec}s`);
  console.log(`✅ Passed: ${successCount} / 200 (${((successCount / 200) * 100).toFixed(1)}%)`);
  console.log(`❌ Failed: ${failureCount} / 200`);
  console.log(`======================================================\n`);

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
