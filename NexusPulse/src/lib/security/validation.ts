/**
 * Sanitizes untrusted user text input by stripping ASCII control characters,
 * normalizing whitespace, escaping dangerous HTML angle brackets, and enforcing
 * a strict maximum character length.
 */
export function sanitizeText(
  input: unknown,
  maxLength = 500,
  fallback = ""
): string {
  if (typeof input !== "string") return fallback;
  const cleaned = input
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[<>]/g, "")
    .trim();
  if (!cleaned) return fallback;
  return cleaned.slice(0, maxLength);
}

/**
 * Validates and normalizes a USD monetary amount (e.g. "189.00" or 189).
 * Returns a structured validation result with `valid`, `value`, `formatted`, and `error`.
 */
export function validateUsdAmount(
  input: unknown,
  options?: { min?: number; max?: number }
): {
  valid: boolean;
  value?: number;
  formatted?: string;
  error?: string;
} {
  const min = options?.min ?? 0.01;
  const max = options?.max ?? 250000;
  const num = typeof input === "number" ? input : Number(String(input ?? "").trim());
  if (!Number.isFinite(num) || num < min || num > max) {
    return {
      valid: false,
      error: `Invalid USD amount: must be a finite number between $${min.toFixed(2)} and $${max.toFixed(2)}.`,
    };
  }
  return {
    valid: true,
    value: Number(num.toFixed(2)),
    formatted: num.toFixed(2),
  };
}

/**
 * Validates a PayPal payout recipient email or @venmo handle.
 */
export function validateRecipientAccount(input: unknown): {
  valid: boolean;
  cleaned?: string;
  error?: string;
} {
  if (typeof input !== "string" || !input.trim()) {
    return {
      valid: false,
      error: "Recipient account is required.",
    };
  }
  const trimmed = input.trim().slice(0, 160);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const venmoRegex = /^@[a-zA-Z0-9_-]{3,40}$/;
  if (emailRegex.test(trimmed) || venmoRegex.test(trimmed)) {
    return {
      valid: true,
      cleaned: trimmed,
    };
  }
  return {
    valid: false,
    error: "Recipient must be a valid PayPal email address or @venmo handle.",
  };
}

/**
 * Server-side Fetch Metadata Resource Isolation check (`Sec-Fetch-Site`).
 * Rejects cross-site state-mutating POST requests from untrusted browser origins
 * while allowing same-origin, same-site, direct API/CLI clients (no header), and webhooks.
 */
export function isAllowedFetchSite(headers: Headers): boolean {
  const site = headers.get("sec-fetch-site");
  if (!site) return true; // Non-browser client, unit test, or server-to-server webhook
  return ["same-origin", "same-site", "none"].includes(site.toLowerCase());
}
