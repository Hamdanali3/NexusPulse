import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  gatewayCreateOrder,
  gatewayCaptureOrAuthorizeOrder,
  gatewayCreatePayout,
  gatewayOptimizeSubscription,
} from "../lib/paypal/paypal-gateway";
import {
  getMirrorState,
  resetMirrorState,
} from "../lib/paypal/paypal-sandbox-mirror";
import { verifyPayPalWebhookSignature } from "../lib/paypal/paypal-client";
import {
  runNexusPulseAgentInteraction,
  verifyHumanBountySubmissionWithGemini,
} from "../lib/ai/gemini-agent";

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
  });
});
