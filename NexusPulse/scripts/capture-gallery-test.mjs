import { spawn } from "node:child_process";
import fs from "node:fs";

const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const port = 9555;
const proc = spawn(chrome, [
  "--headless=new",
  "--disable-gpu",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${process.env.TEMP}\\np-gallery-capture`,
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

const outDir = "D:\\StartUp\\PayPal_AI_Hackathon\\Devpost_Gallery_Images";

// Capture 1: Hero Landing Page
console.log("Navigating to home page...");
await send("Page.navigate", { url: "https://nexus-pulse-bice.vercel.app/" });
await sleep(3500);
const snapHome = await send("Page.captureScreenshot", { format: "png" });
fs.writeFileSync(`${outDir}\\01_Hero_Landing_Page.png`, Buffer.from(snapHome.result.data, "base64"));
console.log("Saved 01_Hero_Landing_Page.png");

ws.close();
proc.kill();
process.exit(0);
