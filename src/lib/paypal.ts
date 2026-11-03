// PayPal REST API client – Payouts v1. All calls are restricted to Sandbox.

import { isValidPayPalEmail } from "./payout-safety.ts";

const PAYPAL_SANDBOX_URL = "https://api-m.sandbox.paypal.com";
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || "";
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || "";
const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID || "";
const DEFAULT_REQUEST_TIMEOUT_MS = 4000;
const MAX_REQUEST_TIMEOUT_MS = 5000;

let cachedToken: { token: string; expiresAt: number } | null = null;

export class PayPalApiError extends Error {
  readonly operation: string;
  readonly httpStatus: number;
  readonly providerCode: string | null;
  readonly diagnostic: PayPalProviderDiagnostic;

  constructor(
    operation: string,
    httpStatus: number,
    diagnostic: PayPalProviderDiagnostic
  ) {
    super(`PayPal ${operation} request failed with HTTP ${httpStatus}.`);
    this.name = "PayPalApiError";
    this.operation = operation;
    this.httpStatus = httpStatus;
    this.diagnostic = diagnostic;
    this.providerCode =
      diagnostic.name ??
      diagnostic.details.find((detail) => detail.issue)?.issue ??
      null;
  }
}

export interface PayPalProviderDiagnostic {
  httpStatus: number;
  name: string | null;
  message: string | null;
  details: { issue: string | null; description: string | null }[];
  debugId: string | null;
}

export class PayPalTransportError extends Error {
  readonly operation: string;
  readonly code: "timeout" | "network_error";

  constructor(
    operation: string,
    code: "timeout" | "network_error"
  ) {
    super(
      code === "timeout"
        ? `PayPal ${operation} request timed out.`
        : `Unable to reach PayPal Sandbox for ${operation}.`
    );
    this.name = "PayPalTransportError";
    this.operation = operation;
    this.code = code;
  }
}

function getSandboxUrl(): string {
  const configuredUrl = process.env.PAYPAL_BASE_URL;
  if (!configuredUrl) return PAYPAL_SANDBOX_URL;

  try {
    const url = new URL(configuredUrl);
    if (
      url.origin !== PAYPAL_SANDBOX_URL ||
      url.pathname !== "/" ||
      url.search ||
      url.hash ||
      url.username ||
      url.password
    ) {
      throw new Error("PayPal payouts are restricted to the Sandbox API.");
    }
  } catch {
    throw new Error("PayPal payouts are restricted to the Sandbox API.");
  }
  return PAYPAL_SANDBOX_URL;
}

function getRequestTimeoutMs(): number {
  const raw = process.env.PAYPAL_REQUEST_TIMEOUT_MS;
  if (raw === undefined || raw.trim() === "") return DEFAULT_REQUEST_TIMEOUT_MS;
  const timeoutMs = Number(raw);
  if (
    !Number.isInteger(timeoutMs) ||
    timeoutMs < 1000 ||
    timeoutMs > MAX_REQUEST_TIMEOUT_MS
  ) {
    throw new Error(
      `PAYPAL_REQUEST_TIMEOUT_MS must be between 1000 and ${MAX_REQUEST_TIMEOUT_MS}.`
    );
  }
  return timeoutMs;
}

export function assertSandboxConfigured(): void {
  getSandboxUrl();
  getRequestTimeoutMs();
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error("PayPal Sandbox credentials are not configured.");
  }
}

async function paypalFetch(
  operation: string,
  url: string,
  init: RequestInit
): Promise<Response> {
  try {
    return await fetch(url, {
      ...init,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(getRequestTimeoutMs()),
    });
  } catch (error) {
    const name =
      typeof error === "object" && error !== null && "name" in error
        ? error.name
        : null;
    throw new PayPalTransportError(
      operation,
      name === "TimeoutError" || name === "AbortError"
        ? "timeout"
        : "network_error"
    );
  }
}

async function readProviderError(
  operation: string,
  response: Response
): Promise<PayPalApiError> {
  const diagnostic: PayPalProviderDiagnostic = {
    httpStatus: response.status,
    name: null,
    message: null,
    details: [],
    debugId: null,
  };
  try {
    const body: unknown = await response.json();
    if (isRecord(body)) {
      diagnostic.name = sanitizeProviderCode(body.name);
      diagnostic.message = sanitizeProviderText(body.message);
      diagnostic.debugId = sanitizeProviderCode(body.debug_id);
      diagnostic.details = Array.isArray(body.details)
        ? body.details.slice(0, 10).flatMap((detail) => {
            if (!isRecord(detail)) return [];
            return [{
              issue: sanitizeProviderCode(detail.issue),
              description: sanitizeProviderText(detail.description),
            }];
          })
        : [];
    }
  } catch {
    // Keep the HTTP status when the provider body is malformed or not JSON.
  }
  return new PayPalApiError(operation, response.status, diagnostic);
}

function sanitizeProviderCode(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const sanitized = sanitizeProviderText(value);
  return sanitized && /^[A-Za-z0-9_.-]{1,128}$/.test(sanitized)
    ? sanitized
    : null;
}

function sanitizeProviderText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  let sanitized = value
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[email redacted]")
    .replace(/\b(Bearer|Basic)\s+[A-Za-z0-9._~+/-]+=*/gi, "$1 [credential redacted]")
    .replace(
      /\b(access[_ -]?token|client[_ -]?secret|client[_ -]?id|authorization)\b\s*[:=]\s*["']?[^,\s;"']+/gi,
      "$1=[credential redacted]"
    )
    .replace(/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}(?:\.[A-Za-z0-9_-]+)?\b/g, "[token redacted]");

  for (const secret of [
    process.env.PAYPAL_CLIENT_ID,
    process.env.PAYPAL_CLIENT_SECRET,
    cachedToken?.token,
  ]) {
    if (secret && secret.length >= 4) {
      sanitized = sanitized.replace(
        new RegExp(escapeRegExp(secret), "gi"),
        "[credential redacted]"
      );
    }
  }
  return sanitized.trim().slice(0, 1000) || null;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function getAccessToken(): Promise<string> {
  assertSandboxConfigured();
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const auth = Buffer.from(
    `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`
  ).toString("base64");
  const response = await paypalFetch(
    "authentication",
    `${getSandboxUrl()}/v1/oauth2/token`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    }
  );
  if (!response.ok) throw await readProviderError("authentication", response);

  const data: unknown = await response.json();
  if (
    !isRecord(data) ||
    typeof data.access_token !== "string" ||
    typeof data.expires_in !== "number" ||
    !Number.isFinite(data.expires_in)
  ) {
    throw new Error("PayPal Sandbox returned an invalid authentication response.");
  }

  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + Math.max(0, data.expires_in - 60) * 1000,
  };
  return cachedToken.token;
}

export interface PayoutRecipient {
  senderItemId: string;
  email: string;
  amountValue: string;
  currency: string;
  note?: string;
}

export interface CreatePayoutResult {
  batchId: string;
  batchStatus: string;
}

export async function createPayoutBatch(
  senderBatchId: string,
  emailSubject: string,
  recipients: PayoutRecipient[]
): Promise<CreatePayoutResult> {
  if (
    !/^[a-f0-9]{1,30}$/i.test(senderBatchId) ||
    recipients.length === 0 ||
    recipients.length > 15000 ||
    recipients.some(
      (recipient) =>
        !/^[a-f0-9]{1,30}$/i.test(recipient.senderItemId) ||
        !isValidPayPalEmail(recipient.email) ||
        recipient.currency !== "USD" ||
        !/^\d+\.\d{2}$/.test(recipient.amountValue) ||
        Number(recipient.amountValue) <= 0 ||
        (recipient.note !== undefined && recipient.note.length > 100)
    )
  ) {
    throw new Error("Payout request contains invalid recipients or amounts.");
  }

  const token = await getAccessToken();
  const body = {
    sender_batch_header: {
      sender_batch_id: senderBatchId,
      email_subject: emailSubject.slice(0, 100),
      email_message: "You have received a payout from MicroSplit AI.",
    },
    items: recipients.map((recipient) => ({
      recipient_type: "EMAIL",
      amount: { value: recipient.amountValue, currency: recipient.currency },
      receiver: recipient.email,
      note: recipient.note || "Approved MicroSplit payout",
      sender_item_id: recipient.senderItemId,
    })),
  };

  const response = await paypalFetch(
    "payout submission",
    `${getSandboxUrl()}/v1/payments/payouts`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": senderBatchId,
      },
      body: JSON.stringify(body),
    }
  );
  if (!response.ok) throw await readProviderError("payout submission", response);

  const data: unknown = await response.json();
  if (
    !isRecord(data) ||
    !isRecord(data.batch_header) ||
    typeof data.batch_header.payout_batch_id !== "string" ||
    typeof data.batch_header.batch_status !== "string"
  ) {
    throw new Error("PayPal Sandbox returned an invalid payout response.");
  }
  return {
    batchId: data.batch_header.payout_batch_id,
    batchStatus: data.batch_header.batch_status,
  };
}

export async function getPayoutBatchStatus(
  paypalBatchId: string
): Promise<unknown> {
  if (!paypalBatchId || paypalBatchId.length > 128) {
    throw new Error("A valid PayPal batch ID is required.");
  }
  const token = await getAccessToken();
  const response = await paypalFetch(
    "payout status",
    `${getSandboxUrl()}/v1/payments/payouts/${encodeURIComponent(paypalBatchId)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!response.ok) throw await readProviderError("payout status", response);
  return response.json();
}

export async function verifyWebhookSignature(
  headers: Record<string, string>,
  body: string
): Promise<boolean> {
  if (
    !PAYPAL_WEBHOOK_ID ||
    !PAYPAL_CLIENT_ID ||
    !PAYPAL_CLIENT_SECRET ||
    !headers["paypal-auth-algo"] ||
    !headers["paypal-cert-url"] ||
    !headers["paypal-transmission-id"] ||
    !headers["paypal-transmission-sig"] ||
    !headers["paypal-transmission-time"]
  ) {
    return false;
  }

  assertSandboxConfigured();
  const token = await getAccessToken();
  const verifyBody = {
    auth_algo: headers["paypal-auth-algo"],
    cert_url: headers["paypal-cert-url"],
    transmission_id: headers["paypal-transmission-id"],
    transmission_sig: headers["paypal-transmission-sig"],
    transmission_time: headers["paypal-transmission-time"],
    webhook_id: PAYPAL_WEBHOOK_ID,
    webhook_event: JSON.parse(body),
  };
  const response = await paypalFetch(
    "webhook verification",
    `${getSandboxUrl()}/v1/notifications/verify-webhook-signature`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(verifyBody),
    }
  );
  if (!response.ok) throw await readProviderError("webhook verification", response);
  const data: unknown = await response.json();
  return isRecord(data) && data.verification_status === "SUCCESS";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
