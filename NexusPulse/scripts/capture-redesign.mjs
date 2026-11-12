import { spawn } from "node:child_process";
import fs from "node:fs";

const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const port = 9572;
const outDir = "C:\\Users\\abc\\.gemini\\antigravity\\brain\\5261ea85-d756-49b3-bc34-f01a7d4ddf28";

const proc = spawn(chrome, [
  "--headless=new",
  "--disable-gpu",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${process.env.TEMP}\\np-redesign-session`,
  "--window-size=1440,1150",
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
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: 1440,
  height: 1050,
  deviceScaleFactor: 1.25,
  mobile: false,
});

await send("Page.navigate", { url: "http://localhost:3000" });
await sleep(3500);

// Scroll down to the Problem & Solution Studio
await send("Runtime.evaluate", {
  expression: `const el = document.getElementById('problem-solution-heading'); if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });`,
});
await sleep(800);

// Capture Tab 1: AI Smart Wallets
console.log("Capturing Tab 1: AI Smart Wallets...");
const snap1 = await send("Page.captureScreenshot", { format: "png" });
fs.writeFileSync(`${outDir}\\preview_redesign_wallets.png`, Buffer.from(snap1.result.data, "base64"));

// Click Tab 2: Human Oracles
await send("Runtime.evaluate", {
  expression: `(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find(x => x.textContent && x.textContent.includes('Human Oracles'));
    if (b) b.click();
  })()`,
});
await sleep(800);
console.log("Capturing Tab 2: Human Oracles...");
const snap2 = await send("Page.captureScreenshot", { format: "png" });
fs.writeFileSync(`${outDir}\\preview_redesign_oracles.png`, Buffer.from(snap2.result.data, "base64"));

// Click Tab 3: Milestone Escrow
await send("Runtime.evaluate", {
  expression: `(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find(x => x.textContent && x.textContent.includes('Milestone Escrow'));
    if (b) b.click();
  })()`,
});
await sleep(800);
console.log("Capturing Tab 3: Milestone Escrow...");
const snap3 = await send("Page.captureScreenshot", { format: "png" });
fs.writeFileSync(`${outDir}\\preview_redesign_escrow.png`, Buffer.from(snap3.result.data, "base64"));

// Click Tab 4: Autonomous CFO
await send("Runtime.evaluate", {
  expression: `(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find(x => x.textContent && x.textContent.includes('Autonomous CFO') && x.textContent.includes('Auto-Recovery'));
    if (b) b.click();
  })()`,
});
await sleep(1000);
console.log("Capturing Tab 4: Autonomous CFO...");
const snap4 = await send("Page.captureScreenshot", { format: "png" });
fs.writeFileSync(`${outDir}\\preview_redesign_cfo.png`, Buffer.from(snap4.result.data, "base64"));

console.log("All redesign screenshots captured!");
ws.close();
proc.kill();
process.exit(0);
