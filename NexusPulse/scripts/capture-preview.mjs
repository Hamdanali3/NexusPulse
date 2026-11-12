import { spawn } from "node:child_process";
import fs from "node:fs";

const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const port = 9565;
const outDir = "C:\\Users\\abc\\.gemini\\antigravity\\brain\\5261ea85-d756-49b3-bc34-f01a7d4ddf28";

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const proc = spawn(chrome, [
  "--headless=new",
  "--disable-gpu",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${process.env.TEMP}\\np-preview-session`,
  "--window-size=1440,1100",
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
  height: 1000,
  deviceScaleFactor: 1.25,
  mobile: false,
});

console.log("Navigating to http://localhost:3000...");
await send("Page.navigate", { url: "http://localhost:3000" });
await sleep(3500);

// Capture 1: Hero + 1-Click Personas + Flow Simulator
console.log("Capturing 1: Hero & Personas...");
const snap1 = await send("Page.captureScreenshot", { format: "png" });
fs.writeFileSync(`${outDir}\\preview_01_hero_and_simulator.png`, Buffer.from(snap1.result.data, "base64"));

// Scroll down to the Interactive Flow Simulator & Problem Solution Matrix
await send("Runtime.evaluate", {
  expression: `window.scrollBy({ top: 750, behavior: 'instant' })`,
});
await sleep(1000);

console.log("Capturing 2: Flow Simulator In Action...");
const snap2 = await send("Page.captureScreenshot", { format: "png" });
fs.writeFileSync(`${outDir}\\preview_02_simulator_and_kpis.png`, Buffer.from(snap2.result.data, "base64"));

// Scroll down to Problem & Solution Comparison Matrix
await send("Runtime.evaluate", {
  expression: `const el = document.getElementById('problem-solution-heading'); if (el) el.scrollIntoView({ behavior: 'instant' });`,
});
await sleep(1000);

console.log("Capturing 3: Problem vs Solution Matrix...");
const snap3 = await send("Page.captureScreenshot", { format: "png" });
fs.writeFileSync(`${outDir}\\preview_03_problem_solution_matrix.png`, Buffer.from(snap3.result.data, "base64"));

console.log("All preview screenshots saved to brain directory!");
ws.close();
proc.kill();
process.exit(0);
