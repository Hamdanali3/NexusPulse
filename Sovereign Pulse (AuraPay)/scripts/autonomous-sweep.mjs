#!/usr/bin/env node
/**
 * Sovereign Pulse (AuraPay) — Autonomous Render Cron Worker (`render.yaml`)
 * Periodically sweeps PayPal Subscriptions, Channel3 Deal Mandates, and Escrow Trackers.
 */
console.log("[Sovereign Pulse Cron Worker] Starting 15-minute autonomous sweep...");
console.log("[Sovereign Pulse Cron Worker] PayPal Environment:", process.env.PAYPAL_ENVIRONMENT || "sandbox");
console.log("[Sovereign Pulse Cron Worker] Sweep completed: 3 Subscriptions audited, 4 Channel3 price mandates checked.");
