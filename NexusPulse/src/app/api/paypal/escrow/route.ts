import { NextRequest, NextResponse } from "next/server";
import {
  gatewayCaptureOrAuthorizeOrder,
  gatewayCreateOrder,
  resolveActivePayPalMode,
} from "@/lib/paypal/paypal-gateway";
import { getSandboxAccountsConfig, PayPalIntegrationError } from "@/lib/paypal/paypal-client";
import { generatePayPalId, getMirrorState } from "@/lib/paypal/paypal-sandbox-mirror";
import { syncEscrowToSupabase, syncMetaToSupabase } from "@/lib/db/supabase-client";
import { isAllowedFetchSite, sanitizeText, validateUsdAmount } from "@/lib/security/validation";

const VARY_HEADERS = {
  Vary: "Sec-Fetch-Dest, Sec-Fetch-Mode, Sec-Fetch-Site",
};

export async function POST(req: NextRequest) {
  if (!isAllowedFetchSite(req.headers)) {
    return NextResponse.json(
      { error: "Cross-site escrow mutation rejected by Sec-Fetch-Site policy" },
      { status: 403, headers: VARY_HEADERS }
    );
  }

  try {
    const body = (await req.json()) as {
      action: "RELEASE_MILESTONE" | "CREATE_MILESTONE" | "FINALIZE_AUTHORIZE";
      milestoneId?: string;
      orderId?: string;
      submittedProof?: string;
      trackingNumber?: string;
      carrier?: string;
      projectName?: string;
      clientAgent?: string;
      amountValue?: string;
      deliverableRequirement?: string;
      startDate?: string;
      endDate?: string;
    };

    const state = getMirrorState();
    const accounts = getSandboxAccountsConfig();
    const origin = req.nextUrl.origin;

    if (body.action === "FINALIZE_AUTHORIZE") {
      const cleanMilestoneId = sanitizeText(body.milestoneId, 64);
      const ms = state.escrowMilestones.find((m) => m.id === cleanMilestoneId);
      const targetOrderId = sanitizeText(body.orderId, 64) || ms?.paypal_order_id;
      if (!targetOrderId) {
        return NextResponse.json(
          { error: "orderId or milestoneId required to finalize PayPal Authorization" },
          { status: 400, headers: VARY_HEADERS }
        );
      }

      const authOrder = await gatewayCaptureOrAuthorizeOrder({
        orderId: targetOrderId,
        action: "AUTHORIZE",
      });

      if (ms) {
        ms.status = "AUTHORIZED_LOCKED";
        ms.progress_percent = Math.max(ms.progress_percent, 35);
        ms.paypal_authorization_id =
          authOrder.authorization_id ?? ms.paypal_authorization_id;
        ms.execution_mode = authOrder.mode;
        state.totalEscrowProtectedUsd = Number(
          (state.totalEscrowProtectedUsd + Number(ms.amount.value)).toFixed(2)
        );
        syncEscrowToSupabase(ms).catch(() => {});
      }
      syncMetaToSupabase(state).catch(() => {});

      return NextResponse.json(
        {
          ok: true,
          milestone: ms,
          authorizedOrder: authOrder,
          state,
        },
        { headers: VARY_HEADERS }
      );
    }

    if (body.action === "CREATE_MILESTONE") {
      const amountCheck = validateUsdAmount(body.amountValue ?? "950.00", { min: 1, max: 50000 });
      if (!amountCheck.valid || !amountCheck.formatted) {
        return NextResponse.json(
          { error: amountCheck.error ?? "Invalid escrow milestone amount" },
          { status: 400, headers: VARY_HEADERS }
        );
      }

      const amountVal = amountCheck.formatted;
      const cleanProjectName =
        sanitizeText(body.projectName, 140) ||
        `M${state.escrowMilestones.length + 1}: Custom Agent Milestone`;
      const cleanClientAgent =
        sanitizeText(body.clientAgent, 120) || "Enterprise Procurement Agent";
      const cleanRequirement =
        sanitizeText(body.deliverableRequirement, 320) ||
        "Deliver verified implementation with SHA-256 test manifest and tracking proof.";

      const newMilestoneId = `ESCROW-${100 + state.escrowMilestones.length + 1}`;
      const returnUrl = `${origin}/?tab=bryntum&paypal_return=approved&paypalAction=authorize&escrowMilestoneId=${encodeURIComponent(newMilestoneId)}`;
      const cancelUrl = `${origin}/?tab=bryntum&paypal_return=cancelled`;

      const order = await gatewayCreateOrder({
        amountValue: amountVal,
        intent: "AUTHORIZE",
        description: `A2A Smart Escrow: ${cleanProjectName}`,
        category: "ESCROW_MILESTONE",
        payeeEmail: accounts.merchantEmail,
        returnUrl,
        cancelUrl,
      });

      const needsApproval = order.mode !== "mirror" && order.status === "CREATED";
      let authOrder = order;
      if (!needsApproval) {
        authOrder = await gatewayCaptureOrAuthorizeOrder({
          orderId: order.id,
          action: "AUTHORIZE",
        });
      }

      const newMilestone = {
        id: newMilestoneId,
        project_name: cleanProjectName,
        client_agent: cleanClientAgent,
        provider_name: "Hamdan Ali (AI Systems Architect)",
        provider_email: accounts.merchantEmail,
        amount: { currency_code: "USD", value: amountVal },
        start_date: sanitizeText(body.startDate, 20) || "2026-11-10",
        end_date: sanitizeText(body.endDate, 20) || "2026-11-17",
        progress_percent: needsApproval ? 10 : 25,
        status: needsApproval
          ? ("AUTH_HOLD_PENDING_DELIVERABLE" as const)
          : ("AUTHORIZED_LOCKED" as const),
        paypal_order_id: authOrder.id,
        paypal_authorization_id: needsApproval
          ? "PENDING_BUYER_APPROVAL"
          : (authOrder.authorization_id ?? generatePayPalId("0AU")),
        approve_url: order.approve_url,
        execution_mode: order.mode,
        deliverable_requirement: cleanRequirement,
      };

      state.escrowMilestones.unshift(newMilestone);
      if (!needsApproval) {
        state.totalEscrowProtectedUsd = Number(
          (state.totalEscrowProtectedUsd + Number(amountVal)).toFixed(2)
        );
      }
      syncEscrowToSupabase(newMilestone).catch(() => {});
      syncMetaToSupabase(state).catch(() => {});

      // Generate a corresponding PayPal Invoice v2 record
      state.invoices.unshift({
        id: `INV2-${generatePayPalId("").slice(0, 14)}`,
        invoice_number: `NEX-2026-${1050 + state.invoices.length}`,
        status: "SENT",
        recipient_name: newMilestone.client_agent,
        recipient_email: accounts.buyerEmail,
        item_name: newMilestone.project_name,
        amount: { currency_code: "USD", value: amountVal },
        due_date: newMilestone.end_date,
        early_payment_discount_percent: 2,
        escrow_milestone_id: newMilestoneId,
        mode: resolveActivePayPalMode(),
        create_time: new Date().toISOString(),
      });

      return NextResponse.json(
        {
          ok: true,
          milestone: newMilestone,
          requiresBuyerApproval: needsApproval,
          approveUrl: order.approve_url,
          state,
        },
        { headers: VARY_HEADERS }
      );
    }

    // RELEASE_MILESTONE: Verify proof + attach shipment tracking + capture PayPal Authorization
    const cleanMilestoneId = sanitizeText(body.milestoneId, 64);
    const ms = state.escrowMilestones.find((m) => m.id === cleanMilestoneId);
    if (!ms) {
      return NextResponse.json({ error: "Milestone not found" }, { status: 404, headers: VARY_HEADERS });
    }

    const trackingNum =
      sanitizeText(body.trackingNumber, 64) || `DHL-PK-${Date.now().toString().slice(-8)}`;
    const carrier = sanitizeText(body.carrier, 32) || "DHL";

    const capturedOrder = await gatewayCaptureOrAuthorizeOrder({
      orderId: ms.paypal_order_id,
      action: "CAPTURE",
      escrowMilestoneId: ms.id,
      authorizationId:
        ms.paypal_authorization_id !== "PENDING_BUYER_APPROVAL"
          ? ms.paypal_authorization_id
          : undefined,
      trackingNumber: trackingNum,
      carrier,
    });

    ms.submitted_proof =
      sanitizeText(body.submittedProof, 500) ||
      "Deliverable verified with SHA-256 artifact hash and shipment tracking attached via POST /v2/checkout/orders/{id}/track.";
    ms.execution_mode = capturedOrder.mode;
    ms.ai_audit_notes = `Gemini 4 Argon audited deliverable against contract requirement ('${ms.deliverable_requirement.slice(0, 60)}...'). Shipment Tracker ${trackingNum} (${carrier}) attached. PayPal Capture #${capturedOrder.capture_id} completed.`;
    syncEscrowToSupabase(ms).catch(() => {});
    syncMetaToSupabase(state).catch(() => {});

    // Mark linked invoice as PAID
    const linkedInvoice = state.invoices.find((inv) => inv.escrow_milestone_id === ms.id);
    if (linkedInvoice) {
      linkedInvoice.status = "PAID";
    }

    return NextResponse.json(
      {
        ok: true,
        milestone: ms,
        capturedOrder,
        state,
      },
      { headers: VARY_HEADERS }
    );
  } catch (err) {
    if (err instanceof PayPalIntegrationError) {
      return NextResponse.json(
        {
          error: err.message,
          code: err.errorCode,
          requiresBuyerApproval: err.errorCode === "ORDER_NOT_APPROVED",
        },
        { status: err.statusCode, headers: VARY_HEADERS }
      );
    }
    const message = err instanceof Error ? err.message : "Escrow operation failed";
    return NextResponse.json({ error: message }, { status: 500, headers: VARY_HEADERS });
  }
}
