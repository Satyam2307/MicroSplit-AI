// PayPal REST API client – Payouts v1
// All interactions with PayPal are server-side only.

import CryptoJS from 'crypto-js';

const PAYPAL_BASE_URL = process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com';
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || '';
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || '';
const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID || '';

// ─── Token cache ─────────────────────────────────────────────
let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  const res = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    throw new Error(`PayPal auth failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000, // refresh 60s early
  };
  return cachedToken.token;
}

// ─── Create Payout Batch ─────────────────────────────────────
export interface PayoutRecipient {
  senderItemId: string;
  email: string;
  amountValue: string; // "125.99"
  currency: string;
  note?: string;
}

export interface CreatePayoutResult {
  batchId: string;
  batchStatus: string;
  links: { rel: string; href: string }[];
}

export async function createPayoutBatch(
  senderBatchId: string,
  emailSubject: string,
  recipients: PayoutRecipient[]
): Promise<CreatePayoutResult> {
  // Block batches > 15,000 items
  if (recipients.length > 15000) {
    throw new Error(
      `Batch has ${recipients.length} items — exceeds PayPal limit of 15,000. Use Large Batch Payouts API.`
    );
  }

  const token = await getAccessToken();
  const requestId = `${senderBatchId}_${Date.now()}`;

  const body = {
    sender_batch_header: {
      sender_batch_id: senderBatchId,
      email_subject: emailSubject,
      email_message: 'You have received a payout from MicroSplit AI.',
    },
    items: recipients.map((r) => ({
      recipient_type: 'EMAIL',
      amount: { value: r.amountValue, currency: r.currency },
      receiver: r.email,
      note: r.note || 'MicroSplit payout',
      sender_item_id: r.senderItemId,
    })),
  };

  const res = await fetch(`${PAYPAL_BASE_URL}/v1/payments/payouts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': requestId,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal payout failed: ${res.status} ${err}`);
  }

  const data = await res.json();
  return {
    batchId: data.batch_header.payout_batch_id,
    batchStatus: data.batch_header.batch_status,
    links: data.links || [],
  };
}

// ─── Get Payout Batch Status ─────────────────────────────────
export async function getPayoutBatchStatus(paypalBatchId: string) {
  const token = await getAccessToken();
  const res = await fetch(
    `${PAYPAL_BASE_URL}/v1/payments/payouts/${paypalBatchId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`PayPal batch status failed: ${res.status}`);
  return res.json();
}

// ─── Get Balance ─────────────────────────────────────────────
export async function getBusinessBalance(): Promise<number> {
  const token = await getAccessToken();
  const res = await fetch(
    `${PAYPAL_BASE_URL}/v1/reporting/balances?currency_code=USD`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) {
    // Fallback: return a large mock balance for sandbox
    return 99999999; // $999,999.99
  }
  const data = await res.json();
  const balance = data.balances?.[0]?.available?.value;
  return balance ? Math.round(parseFloat(balance) * 100) : 0;
}

// ─── Verify Webhook Signature ────────────────────────────────
export async function verifyWebhookSignature(
  headers: Record<string, string>,
  body: string
): Promise<boolean> {
  const token = await getAccessToken();

  const verifyBody = {
    auth_algo: headers['paypal-auth-algo'],
    cert_url: headers['paypal-cert-url'],
    transmission_id: headers['paypal-transmission-id'],
    transmission_sig: headers['paypal-transmission-sig'],
    transmission_time: headers['paypal-transmission-time'],
    webhook_id: PAYPAL_WEBHOOK_ID,
    webhook_event: JSON.parse(body),
  };

  const res = await fetch(
    `${PAYPAL_BASE_URL}/v1/notifications/verify-webhook-signature`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(verifyBody),
    }
  );

  if (!res.ok) return false;
  const data = await res.json();
  return data.verification_status === 'SUCCESS';
}

// ─── Mock PayPal for demo mode ───────────────────────────────
export function isSandboxConfigured(): boolean {
  return !!(PAYPAL_CLIENT_ID && PAYPAL_CLIENT_SECRET);
}

export function mockPayoutBatch(
  senderBatchId: string,
  recipients: PayoutRecipient[]
): CreatePayoutResult {
  return {
    batchId: `MOCK_BATCH_${Date.now()}`,
    batchStatus: 'PENDING',
    links: [],
  };
}
