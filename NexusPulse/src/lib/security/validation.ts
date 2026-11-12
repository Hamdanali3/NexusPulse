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

/**
 * Validates a standard email address format.
 */
export function validateEmail(input: unknown): {
  valid: boolean;
  cleaned?: string;
  error?: string;
} {
  if (typeof input !== "string" || !input.trim()) {
    return {
      valid: false,
      error: "Email address is required.",
    };
  }
  const trimmed = input.trim().toLowerCase();
  if (trimmed.length > 120) {
    return {
      valid: false,
      error: "Email address cannot exceed 120 characters.",
    };
  }
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(trimmed)) {
    return {
      valid: false,
      error: "Please enter a valid email address (e.g. name@example.com).",
    };
  }
  return {
    valid: true,
    cleaned: trimmed,
  };
}

/**
 * Validates a user's full name.
 * Requires 2 to 60 characters, letters, spaces, hyphens, periods, and apostrophes.
 * Rejects numbers, special symbols, and HTML/script injection attempts.
 */
export function validateFullName(input: unknown): {
  valid: boolean;
  cleaned?: string;
  error?: string;
} {
  if (typeof input !== "string" || !input.trim()) {
    return {
      valid: false,
      error: "Full name is required.",
    };
  }
  const sanitized = sanitizeText(input, 60);
  if (sanitized.length < 2) {
    return {
      valid: false,
      error: "Full name must be at least 2 characters.",
    };
  }
  if (sanitized.length > 60) {
    return {
      valid: false,
      error: "Full name cannot exceed 60 characters.",
    };
  }
  // Allow letters (including international accents), spaces, hyphens, dots, apostrophes
  const nameRegex = /^[a-zA-Z\u00C0-\u024F\u1E00-\u1EFF][a-zA-Z\u00C0-\u024F\u1E00-\u1EFF\s.'-]*[a-zA-Z\u00C0-\u024F\u1E00-\u1EFF.]$/;
  if (!nameRegex.test(sanitized)) {
    return {
      valid: false,
      error: "Please enter a valid real name (letters, spaces, and hyphens only).",
    };
  }
  return {
    valid: true,
    cleaned: sanitized,
  };
}

export type ContactInquiryType =
  | "general"
  | "hackathon_judging"
  | "developer_api"
  | "oracle_bounties"
  | "enterprise_escrow"
  | "security_disclosure";

export type ContactInquirerRole =
  | "judge"
  | "developer"
  | "merchant"
  | "oracle_worker"
  | "investor_researcher"
  | "other";

export type ContactUrgency = "normal" | "high" | "urgent_judge";

export interface ContactFormData {
  fullName: string;
  email: string;
  inquiryType: ContactInquiryType;
  role: ContactInquirerRole;
  urgency: ContactUrgency;
  subject: string;
  referenceId?: string;
  message: string;
  agreedToTerms: boolean;
  honeypot?: string;
}

export interface CleanedContactFormData {
  fullName: string;
  email: string;
  inquiryType: ContactInquiryType;
  role: ContactInquirerRole;
  urgency: ContactUrgency;
  subject: string;
  referenceId?: string;
  message: string;
  agreedToTerms: boolean;
}

export interface ContactValidationResult {
  valid: boolean;
  isBot?: boolean;
  errors: Partial<Record<keyof ContactFormData, string>>;
  data?: CleanedContactFormData;
}

const VALID_INQUIRY_TYPES: readonly ContactInquiryType[] = [
  "general",
  "hackathon_judging",
  "developer_api",
  "oracle_bounties",
  "enterprise_escrow",
  "security_disclosure",
];

const VALID_ROLES: readonly ContactInquirerRole[] = [
  "judge",
  "developer",
  "merchant",
  "oracle_worker",
  "investor_researcher",
  "other",
];

const VALID_URGENCIES: readonly ContactUrgency[] = [
  "normal",
  "high",
  "urgent_judge",
];

/**
 * Validates and sanitizes a complete contact inquiry payload.
 * Provides granular error messages for every field.
 */
export function validateContactForm(input: unknown): ContactValidationResult {
  const errors: Partial<Record<keyof ContactFormData, string>> = {};

  if (!input || typeof input !== "object") {
    return {
      valid: false,
      errors: { fullName: "Invalid request payload." },
    };
  }

  const raw = input as Record<string, unknown>;

  // Check anti-spam honeypot
  if (
    typeof raw.honeypot === "string" &&
    raw.honeypot.trim().length > 0
  ) {
    return {
      valid: false,
      isBot: true,
      errors: { honeypot: "Automated submission detected." },
    };
  }

  // Full Name validation & sanitization
  const sanitizedName = sanitizeText(raw.fullName, 80);
  if (!sanitizedName) {
    errors.fullName = "Full name is required.";
  } else if (sanitizedName.length < 2) {
    errors.fullName = "Full name must be at least 2 characters.";
  } else if (sanitizedName.length > 80) {
    errors.fullName = "Full name cannot exceed 80 characters.";
  } else if (!/^[\p{L}\p{M}\s.'-]+$/u.test(sanitizedName)) {
    errors.fullName = "Full name contains invalid characters.";
  }

  // Email validation
  const emailRes = validateEmail(raw.email);
  if (!emailRes.valid) {
    errors.email = emailRes.error || "Valid email is required.";
  }

  // Inquiry Type validation
  const rawType = String(raw.inquiryType || "").trim() as ContactInquiryType;
  if (!rawType || !VALID_INQUIRY_TYPES.includes(rawType)) {
    errors.inquiryType = "Please select a valid inquiry category.";
  }

  // Inquirer Role validation
  const rawRole = String(raw.role || "").trim() as ContactInquirerRole;
  if (!rawRole || !VALID_ROLES.includes(rawRole)) {
    errors.role = "Please select your primary role.";
  }

  // Urgency validation
  let rawUrgency = String(raw.urgency || "normal").trim() as ContactUrgency;
  if (!VALID_URGENCIES.includes(rawUrgency)) {
    rawUrgency = "normal";
  }

  // Subject validation
  const rawSubject = typeof raw.subject === "string" ? raw.subject.trim() : "";
  if (!rawSubject) {
    errors.subject = "Subject is required.";
  } else if (rawSubject.length < 4) {
    errors.subject = "Subject must be at least 4 characters.";
  } else if (rawSubject.length > 140) {
    errors.subject = "Subject cannot exceed 140 characters.";
  }

  // Reference ID validation (optional)
  let cleanedReferenceId: string | undefined = undefined;
  if (raw.referenceId !== undefined && raw.referenceId !== null && String(raw.referenceId).trim() !== "") {
    const rawRef = String(raw.referenceId).trim();
    if (rawRef.length > 50) {
      errors.referenceId = "Reference ID cannot exceed 50 characters.";
    } else if (!/^[a-zA-Z0-9_.-]+$/.test(rawRef)) {
      errors.referenceId = "Reference ID may only contain letters, numbers, hyphens, and underscores.";
    } else {
      cleanedReferenceId = sanitizeText(rawRef, 50);
    }
  }

  // Message validation
  const rawMessage = typeof raw.message === "string" ? raw.message.trim() : "";
  if (!rawMessage) {
    errors.message = "Message body is required.";
  } else if (rawMessage.length < 15) {
    errors.message = "Message must be at least 15 characters long.";
  } else if (rawMessage.length > 2500) {
    errors.message = "Message cannot exceed 2500 characters.";
  }

  // Agreement to Terms
  if (raw.agreedToTerms !== true && raw.agreedToTerms !== "true") {
    errors.agreedToTerms = "You must acknowledge data processing to submit.";
  }

  if (Object.keys(errors).length > 0) {
    return {
      valid: false,
      errors,
    };
  }

  return {
    valid: true,
    errors: {},
    data: {
      fullName: sanitizedName,
      email: emailRes.cleaned!,
      inquiryType: rawType,
      role: rawRole,
      urgency: rawUrgency,
      subject: sanitizeText(rawSubject, 140),
      referenceId: cleanedReferenceId,
      message: sanitizeText(rawMessage, 2500),
      agreedToTerms: true,
    },
  };
}
