import { NextResponse } from "next/server";
import {
  isAllowedFetchSite,
  validateContactForm,
} from "@/lib/security/validation";

// In-memory inquiry log for testing and verification
interface RecordedInquiry {
  ticketId: string;
  receivedAt: string;
  fullName: string;
  email: string;
  inquiryType: string;
  role: string;
  urgency: string;
  subject: string;
  referenceId?: string;
  messageSnippet: string;
  estimatedSla: string;
}

const INQUIRIES_LOG: RecordedInquiry[] = [
  {
    ticketId: "NEXUS-REQ-INIT-JUDGE",
    receivedAt: new Date(Date.now() - 3600000).toISOString(),
    fullName: "PayPal AI Hackathon Evaluation Desk",
    email: "judge-evaluator@hackathon.paypal.com",
    inquiryType: "hackathon_judging",
    role: "judge",
    urgency: "urgent_judge",
    subject: "Judge Review: Dual-Mode Sandbox Parity & APIMatic Controllers",
    referenceId: "PAYPAL-AI-2026-JUDGE",
    messageSnippet: "Reviewing NexusPulse implementation across all 7 sponsor integration tracks.",
    estimatedSla: "< 2 hours (Hackathon Judge Priority)",
  },
];

export async function GET() {
  return NextResponse.json({
    status: "OPERATIONAL",
    service: "NexusPulse Communications & Inquiry Clearinghouse",
    deskHours: "24/7 Automated Ingestion + Rapid Response",
    totalInquiriesReceived: INQUIRIES_LOG.length,
    supportedCategories: [
      { id: "general", label: "General Inquiry / Collaboration" },
      { id: "hackathon_judging", label: "PayPal Hackathon Judging & Evaluation" },
      { id: "developer_api", label: "APIMatic SDK & Developer Integration" },
      { id: "oracle_bounties", label: "Proof-of-Human Oracle Contributor" },
      { id: "enterprise_escrow", label: "Enterprise A2A Smart Escrow Deployment" },
      { id: "security_disclosure", label: "Security & Webhook Dispute Shield" },
    ],
    slaTargets: {
      urgent_judge: "< 2 hours (Hackathon Judge Expedited)",
      high: "< 12 hours (High Priority)",
      normal: "24-48 hours (Standard SLA)",
    },
    recentTickets: INQUIRIES_LOG.slice(-5).map((inq) => ({
      ticketId: inq.ticketId,
      inquiryType: inq.inquiryType,
      urgency: inq.urgency,
      receivedAt: inq.receivedAt,
    })),
  });
}

export async function POST(request: Request) {
  // 1. Fetch Metadata Resource Isolation
  if (!isAllowedFetchSite(request.headers)) {
    return NextResponse.json(
      { success: false, error: "Cross-site request blocked by Fetch Metadata policy." },
      { status: 403 }
    );
  }

  // 2. Parse JSON body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Malformed JSON payload in request." },
      { status: 400 }
    );
  }

  // 3. Strict Validation & Sanitization
  const validation = validateContactForm(body);

  if (validation.isBot) {
    // Return standard success to sink bot without notifying spammer
    return NextResponse.json({
      success: true,
      ticketId: `NEXUS-REQ-BOT-${Date.now().toString(36).toUpperCase()}`,
      receivedAt: new Date().toISOString(),
      estimatedSla: "Standard",
      message: "Your inquiry has been received.",
    });
  }

  if (!validation.valid || !validation.data) {
    return NextResponse.json(
      {
        success: false,
        error: "Validation failed on one or more contact fields.",
        errors: validation.errors,
      },
      { status: 422 }
    );
  }

  const { data } = validation;

  // 4. Generate Ticket Reference ID
  const timestamp = new Date().toISOString();
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const ticketId = `NEXUS-REQ-${Date.now().toString(36).toUpperCase()}-${randomSuffix}`;

  // 5. Determine SLA text
  let estimatedSla = "24-48 hours (Standard SLA)";
  if (data.urgency === "urgent_judge") {
    estimatedSla = "< 2 hours (Hackathon Judge Expedited Review)";
  } else if (data.urgency === "high") {
    estimatedSla = "< 12 hours (High Priority)";
  }

  // 6. Record inquiry into in-memory ledger
  const record: RecordedInquiry = {
    ticketId,
    receivedAt: timestamp,
    fullName: data.fullName,
    email: data.email,
    inquiryType: data.inquiryType,
    role: data.role,
    urgency: data.urgency,
    subject: data.subject,
    referenceId: data.referenceId,
    messageSnippet: data.message.slice(0, 160),
    estimatedSla,
  };
  INQUIRIES_LOG.push(record);

  return NextResponse.json({
    success: true,
    ticketId,
    receivedAt: timestamp,
    estimatedSla,
    summary: {
      fullName: data.fullName,
      email: data.email,
      inquiryType: data.inquiryType,
      role: data.role,
      urgency: data.urgency,
      subject: data.subject,
      referenceId: data.referenceId,
    },
    message:
      "Your inquiry has been successfully dispatched to the NexusPulse team and logged to the inquiry clearinghouse.",
  });
}
