/**
 * Centralized formatting & label normalization helpers for NexusPulse.
 * Ensures a single USD formatter across all views, true Unicode minus signs (U+2212)
 * before currency symbols, tabular figures, clean date ranges, and humanized enums.
 */

const MINUS_SIGN = "\u2212"; // U+2212 true minus sign
const EN_DASH = "\u2013"; // U+2013 en dash

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function toNumericAmount(value: number | string | null | undefined): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.\-]/g, "");
    const parsed = Number.parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

/**
 * Formats an amount in USD using en-US thousands separators and 2 decimals.
 * Negative numbers use U+2212 before the dollar sign: "−$16,551.72".
 */
export function formatUsd(value: number | string | null | undefined): string {
  const num = toNumericAmount(value);
  if (Object.is(num, -0) || Math.abs(num) < 0.005) {
    return usdFormatter.format(0);
  }
  if (num < 0) {
    return `${MINUS_SIGN}${usdFormatter.format(Math.abs(num))}`;
  }
  return usdFormatter.format(num);
}

/**
 * Formats a money delta with an explicit leading "+" or U+2212 "−" before "$".
 */
export function formatSignedUsd(value: number | string | null | undefined): string {
  const num = toNumericAmount(value);
  if (Math.abs(num) < 0.005) {
    return usdFormatter.format(0);
  }
  if (num < 0) {
    return `${MINUS_SIGN}${usdFormatter.format(Math.abs(num))}`;
  }
  return `+${usdFormatter.format(num)}`;
}

/**
 * Formats recurring monthly USD pricing, e.g. "$129.00/mo".
 */
export function formatUsdPerMonth(value: number | string | null | undefined): string {
  return `${formatUsd(value)}/mo`;
}

/**
 * Parses an ISO or YYYY-MM-DD date string safely without timezone day drift.
 */
function parseSafeDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const ymdMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
  if (ymdMatch) {
    const year = Number(ymdMatch[1]);
    const month = Number(ymdMatch[2]) - 1;
    const day = Number(ymdMatch[3]);
    return new Date(Date.UTC(year, month, day));
  }
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? null : d;
}

const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

const fullDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

/**
 * Formats a date as "Nov 1" (or "Nov 1, 2026" when includeYear is true).
 */
export function formatShortDate(dateStr: string, includeYear = false): string {
  const parsed = parseSafeDate(dateStr);
  if (!parsed) return dateStr;
  return includeYear ? fullDateFormatter.format(parsed) : shortDateFormatter.format(parsed);
}

/**
 * Formats a range cleanly as "Nov 1 – Nov 7" (with en-dash).
 */
export function formatDateRange(startStr: string, endStr: string): string {
  const start = parseSafeDate(startStr);
  const end = parseSafeDate(endStr);
  if (!start || !end) return `${startStr} ${EN_DASH} ${endStr}`;
  const sameYear = start.getUTCFullYear() === end.getUTCFullYear();
  if (sameYear) {
    return `${shortDateFormatter.format(start)} ${EN_DASH} ${shortDateFormatter.format(end)}`;
  }
  return `${fullDateFormatter.format(start)} ${EN_DASH} ${fullDateFormatter.format(end)}`;
}

export const ENGINE_LABELS: Record<string, string> = {
  AUTOPILOT_CFO: "Spending review",
  A2A_SMART_ESCROW: "Escrow",
  PROOF_OF_HUMAN_BOUNTY: "Verified task",
  SUBSCRIPTION_GUARD: "Subscription check",
  CHANNEL3_DEAL: "Price watch",
  CHANNEL3: "Price watch",
  DIRECT_CHECKOUT: "Direct payment",
};

export function humanizeEngine(code: string | null | undefined): string {
  if (!code) return "General";
  const normalized = code.trim().toUpperCase();
  if (ENGINE_LABELS[normalized]) return ENGINE_LABELS[normalized];
  return normalized
    .toLowerCase()
    .split("_")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
    .join(" ");
}

export function humanizeEscrowStatus(status: string | null | undefined): string {
  switch ((status ?? "").toUpperCase()) {
    case "AI_VERIFIED_CAPTURED":
    case "CAPTURED":
    case "COMPLETED":
      return "Captured";
    case "IN_PROGRESS":
      return "In progress";
    case "AUTHORIZED_LOCKED":
    case "AUTHORIZED":
      return "Scheduled";
    case "DISPUTE_HOLD":
      return "On hold";
    case "VOIDED":
      return "Released";
    default:
      return status ? status.replace(/_/g, " ") : "Scheduled";
  }
}

export function humanizeTransactionStatus(
  statusCode: string | null | undefined,
  statusLabel?: string | null
): string {
  const raw = (statusLabel || statusCode || "").toUpperCase();
  if (raw === "S" || raw === "SUCCESS" || raw === "COMPLETED" || raw === "CAPTURED") {
    return "Completed";
  }
  if (raw === "AUTHORIZED" || raw === "APPROVED" || raw === "CREATED") {
    return "Authorized";
  }
  if (raw === "P" || raw === "PENDING" || raw === "PROCESSING" || raw === "SENT") {
    return "Pending";
  }
  if (raw === "D" || raw === "DENIED" || raw === "FAILED" || raw === "VOIDED") {
    return "Failed";
  }
  return statusLabel || "Recorded";
}

/**
 * Masks legacy personal email strings that may still exist in older database records.
 */
export function sanitizeDisplayEmail(email: string | null | undefined): string {
  if (!email) return "contributor@nexuspulse.example";
  const lower = email.trim().toLowerCase();
  if (lower.includes("hamdanali@") || lower.includes("hamdanaly")) {
    return "contributor@nexuspulse.example";
  }
  return email;
}
