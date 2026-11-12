import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const port = 9560;
const outDir = "D:\\StartUp\\PayPal_AI_Hackathon\\Devpost_Gallery_Images";

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const proc = spawn(chrome, [
  "--headless=new",
  "--disable-gpu",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${process.env.TEMP}\\np-gallery-session2`,
  "--window-size=1500,1000",
  "about:blank",
]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let targets;
for (let i = 0; i < 40; i++) {
  try {
    targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
    if (targets.find((t) => t.type === "page")) break;
  } catch {}
  await sleep(250);
}
const page = targets.find((t) => t.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));

let id = 0;
const pending = new Map();
ws.onmessage = (m) => {
  const msg = JSON.parse(m.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  }
};

const send = (method, params = {}) =>
  new Promise((r) => {
    const mid = ++id;
    pending.set(mid, r);
    ws.send(JSON.stringify({ id: mid, method, params }));
  });

await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: 1500,
  height: 1000,
  deviceScaleFactor: 1.5,
  mobile: false,
});

async function waitForAppReady(maxSecs = 15) {
  for (let i = 0; i < maxSecs * 2; i++) {
    const res = await send("Runtime.evaluate", {
      expression: `Boolean(!document.body.innerText.includes("Initializing NexusPulse") && document.querySelector("main, nav"))`,
      returnByValue: true,
    });
    if (res.result?.value) return true;
    await sleep(500);
  }
  return false;
}

async function capture(filename, description) {
  console.log(`[Capturing] ${filename}: ${description}...`);
  const snap = await send("Page.captureScreenshot", { format: "png" });
  const filePath = path.join(outDir, filename);
  fs.writeFileSync(filePath, Buffer.from(snap.result.data, "base64"));
  const stats = fs.statSync(filePath);
  console.log(` -> Saved ${filename} (${(stats.size / 1024).toFixed(1)} KB)`);
}

const baseUrl = "https://nexus-pulse-bice.vercel.app";

// 1. Hero Landing Page
console.log("Navigating to Home Page...");
await send("Page.navigate", { url: `${baseUrl}/` });
await waitForAppReady();
await sleep(1500);
await send("Runtime.evaluate", {
  expression: `window.scrollTo({ top: 0, behavior: 'instant' });`,
});
await sleep(800);
await capture("01_Hero_Landing_Page.png", "Hero with Title, Subtitle, CTAs and Header Navigation");

// 2. Animated 3-Engine Cards Close-Up
await send("Runtime.evaluate", {
  expression: `
    const el = document.getElementById('autonomous-engines-hub');
    if (el) el.scrollIntoView({ block: 'center', behavior: 'instant' });
    else window.scrollTo({ top: 480, behavior: 'instant' });
  `,
});
await sleep(1000);
await capture("02_Interactive_3_Engine_Cards.png", "Animated Engine Hub (Deal-Hunter, Bounties, Smart Escrow)");

// 3. Gemini Autonomous CFO Console
await send("Runtime.evaluate", {
  expression: `
    const el = document.getElementById('gemini-console-heading') || document.getElementById('gemini-agent-prompt-input');
    if (el) el.scrollIntoView({ block: 'start', behavior: 'instant' });
    else window.scrollTo({ top: 350, behavior: 'instant' });
  `,
});
await sleep(1000);
await capture("03_Gemini_Autonomous_CFO_Console.png", "Gemini 4 Argon Deep CFO Sweep Console & Multi-Turn Controls");

// 4. Engine 1: Channel3 100M+ Catalog Deal-Hunter
console.log("Navigating to Engine 1 (Channel3)...");
await send("Page.navigate", { url: `${baseUrl}/?tab=channel3` });
await waitForAppReady();
await sleep(1500);
await send("Runtime.evaluate", {
  expression: `
    const el = document.getElementById('engine-channel3-workspace') || document.getElementById('engine-channel3');
    if (el) el.scrollIntoView({ block: 'start', behavior: 'instant' });
  `,
});
await sleep(1000);
await capture("04_Engine_1_Channel3_Deal_Hunter.png", "Channel3 100M+ SKU Product Catalog & Price Mandates");

// 5. PayPal JS SDK v6 Interactive Checkout Widget
await send("Runtime.evaluate", {
  expression: `window.scrollBy({ top: 400, behavior: 'instant' });`,
});
await sleep(1000);
await capture("05_PayPal_JS_SDK_v6_Checkout.png", "PayPal JS SDK v6 Buttons, PayLater & Multi-Funding Checkout");

// 6. Engine 2: Proof-of-Human Oracle Micro-Bounties Board
console.log("Navigating to Engine 2 (Human Bounties)...");
await send("Page.navigate", { url: `${baseUrl}/?tab=bounties` });
await waitForAppReady();
await sleep(1500);
await send("Runtime.evaluate", {
  expression: `
    const el = document.getElementById('engine-bounties-workspace') || document.getElementById('engine-bounties');
    if (el) el.scrollIntoView({ block: 'start', behavior: 'instant' });
  `,
});
await sleep(1000);
await capture("06_Engine_2_Proof_Of_Human_Bounties.png", "60-Second Physical Ground Truth Micro-Bounties Board");

// 7. Gemini AI Multimodal Verification & Instant PayPal Payout
await send("Runtime.evaluate", {
  expression: `
    const card = document.querySelector('section[aria-label*=\"Oracle\"], div[class*=\"verification\"]');
    if (card) card.scrollIntoView({ block: 'center', behavior: 'instant' });
  `,
});
await sleep(1000);
await capture("07_Gemini_AI_Oracle_Verification_And_Payout.png", "Gemini 3.8 Flash Multimodal Criteria & Instant PayPal Payout Form");

// 8. Engine 3: Bryntum Smart Escrow Milestone Gantt
console.log("Navigating to Engine 3 (Bryntum Escrow)...");
await send("Page.navigate", { url: `${baseUrl}/?tab=bryntum` });
await waitForAppReady();
await sleep(1500);
await send("Runtime.evaluate", {
  expression: `
    const el = document.getElementById('engine-bryntum-workspace') || document.getElementById('engine-bryntum');
    if (el) el.scrollIntoView({ block: 'start', behavior: 'instant' });
  `,
});
await sleep(1000);
await capture("08_Engine_3_Bryntum_Escrow_Gantt.png", "Bryntum Critical-Path Milestone Gantt & Cashflow Timeline");

// 9. Escrow Deliverable Inspection & Dispute Shield Tracking
await send("Runtime.evaluate", {
  expression: `window.scrollBy({ top: 420, behavior: 'instant' });`,
});
await sleep(1000);
await capture("09_Escrow_Dispute_Shield_Tracking.png", "Cryptographic Deliverable Proof & DHL Shipment Tracker Integration");

// 10. AG Grid Dark Quartz Financial Command Center
console.log("Navigating to AG Grid Telemetry...");
await send("Page.navigate", { url: `${baseUrl}/?tab=aggrid` });
await waitForAppReady();
await sleep(1500);
await send("Runtime.evaluate", {
  expression: `
    const el = document.getElementById('aggrid-heading');
    if (el) el.scrollIntoView({ block: 'start', behavior: 'instant' });
  `,
});
await sleep(1000);
await capture("10_AG_Grid_Financial_Ledger.png", "AG Grid v36 Dark Quartz Enterprise Financial Ledger");

// 11. PayPal Webhook Security & APIMatic Inspector
await send("Runtime.evaluate", {
  expression: `
    const el = document.getElementById('webhooks-security');
    if (el) el.scrollIntoView({ block: 'start', behavior: 'instant' });
    else window.scrollBy({ top: 450, behavior: 'instant' });
  `,
});
await sleep(1000);
await capture("11_PayPal_Webhook_Security_Inspector.png", "Webhook Signature Verification & APIMatic Server SDK Telemetry");

// 12. About: Frontier Research Citations & Literature
console.log("Navigating to About Page...");
await send("Page.navigate", { url: `${baseUrl}/about` });
await waitForAppReady();
await sleep(1500);
await send("Runtime.evaluate", {
  expression: `window.scrollTo({ top: 0, behavior: 'instant' });`,
});
await sleep(1000);
await capture("12_Frontier_Research_Foundations.png", "DeepMind, Anthropic & MIT Research Foundations & Problem Cards");

// 13. About: 4-Stage Engine Architecture Lifecycles
await send("Runtime.evaluate", {
  expression: `
    const el = document.getElementById('engines');
    if (el) el.scrollIntoView({ block: 'start', behavior: 'instant' });
  `,
});
await sleep(1000);
await capture("13_Engine_Architecture_Lifecycles.png", "Clean 4-Stage Autonomous Engine Architecture Lifecycle Pipelines");

// 14. About: 7-Sponsor Enterprise Integration Matrix
await send("Runtime.evaluate", {
  expression: `
    const table = document.querySelector('table');
    if (table) table.scrollIntoView({ block: 'center', behavior: 'instant' });
    else window.scrollTo({ top: 1600, behavior: 'instant' });
  `,
});
await sleep(1000);
await capture("14_Sponsor_Technology_Matrix.png", "Comprehensive 7-Sponsor Integration & Architecture Table");

// 15. Contact: Founder Operations Desk & Validated Form
console.log("Navigating to Contact Page...");
await send("Page.navigate", { url: `${baseUrl}/contact` });
await waitForAppReady();
await sleep(1500);
await send("Runtime.evaluate", {
  expression: `window.scrollTo({ top: 0, behavior: 'instant' });`,
});
await sleep(1000);
await capture("15_Contact_Desk_And_Governance.png", "Direct Lead Developer Desk (hamdanaly651@gmail.com) & Inquiries");

console.log("\nAll 15 gallery images captured successfully!");
ws.close();
proc.kill();
process.exit(0);
