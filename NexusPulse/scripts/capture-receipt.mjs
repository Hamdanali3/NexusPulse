import { spawn } from "node:child_process";
import fs from "node:fs";

const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const port = 9568;
const outDir = "C:\\Users\\abc\\.gemini\\antigravity\\brain\\5261ea85-d756-49b3-bc34-f01a7d4ddf28";

const proc = spawn(chrome, [
  "--headless=new",
  "--disable-gpu",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${process.env.TEMP}\\np-receipt-session`,
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

await send("Page.navigate", { url: "http://localhost:3000" });
await sleep(3000);

// Click step 4 button
await send("Runtime.evaluate", {
  expression: `(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const s4 = btns.find(b => b.textContent && b.textContent.includes('PayPal Disburses'));
    if (s4) s4.click();
  })()`,
});
await sleep(800);

// Scroll down to center the simulator and receipt
await send("Runtime.evaluate", {
  expression: `const el = document.getElementById('flow-simulator-heading'); if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });`,
});
await sleep(600);

const snap = await send("Page.captureScreenshot", { format: "png" });
fs.writeFileSync(`${outDir}\\preview_04_payout_receipt.png`, Buffer.from(snap.result.data, "base64"));
console.log("Saved preview_04_payout_receipt.png");

ws.close();
proc.kill();
process.exit(0);
