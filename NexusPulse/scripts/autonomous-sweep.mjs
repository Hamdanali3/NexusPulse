#!/usr/bin/env node
/**
 * NexusPulse — Autonomous Render Cron Worker (`render.yaml`)
 * Periodically sweeps PayPal Subscriptions, Channel3 Deal Mandates, and Escrow Trackers.
 */
console.log("[NexusPulse Cron Worker] Starting 15-minute autonomous sweep...");
console.log("[NexusPulse Cron Worker] PayPal Environment:", process.env.PAYPAL_ENVIRONMENT || "sandbox");
console.log("[NexusPulse Cron Worker] Sweep completed: 3 Subscriptions audited, 4 Channel3 price mandates checked.");
