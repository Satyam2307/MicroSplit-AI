import assert from "node:assert/strict";
import test from "node:test";
import type { PayPalApiError as PayPalApiErrorType } from "../src/lib/paypal.ts";

test("payout requests are Sandbox-only and reuse the stable request ID", async () => {
  const previous = {
    clientId: process.env.PAYPAL_CLIENT_ID,
    clientSecret: process.env.PAYPAL_CLIENT_SECRET,
    baseUrl: process.env.PAYPAL_BASE_URL,
  };
  const originalFetch = globalThis.fetch;
  process.env.PAYPAL_CLIENT_ID = "sandbox-client";
  process.env.PAYPAL_CLIENT_SECRET = "sandbox-secret";
  process.env.PAYPAL_BASE_URL = "https://api-m.sandbox.paypal.com";
  let payoutRequestId: string | null = null;
  let payoutHost: string | null = null;
  globalThis.fetch = async (input, init) => {
    const url = new URL(
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url
    );
    if (url.pathname === "/v1/oauth2/token") {
      return Response.json({ access_token: "sandbox-token", expires_in: 3600 });
    }

    payoutHost = url.hostname;
    payoutRequestId = new Headers(init?.headers).get("PayPal-Request-Id");
    return Response.json({
      batch_header: {
        payout_batch_id: "SANDBOX-BATCH",
        batch_status: "PENDING",
      },
    });
  };

  try {
    const { createPayoutBatch } = await import("../src/lib/paypal.ts");
    const batchId = "0123456789abcdef0123456789abcd";
    const result = await createPayoutBatch(batchId, "MicroSplit test", [
      {
        senderItemId: "abcdef0123456789abcdef012345",
        email: "payee@example.com",
        amountValue: "1.25",
        currency: "USD",
      },
    ]);

    assert.equal(result.batchId, "SANDBOX-BATCH");
    assert.equal(payoutHost, "api-m.sandbox.paypal.com");
    assert.equal(payoutRequestId, batchId);
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnv("PAYPAL_CLIENT_ID", previous.clientId);
    restoreEnv("PAYPAL_CLIENT_SECRET", previous.clientSecret);
    restoreEnv("PAYPAL_BASE_URL", previous.baseUrl);
  }
});

test("PayPal provider errors never expose their raw response body", async () => {
  const previous = {
    clientId: process.env.PAYPAL_CLIENT_ID,
    clientSecret: process.env.PAYPAL_CLIENT_SECRET,
  };
  const originalFetch = globalThis.fetch;
  process.env.PAYPAL_CLIENT_ID = "sandbox-client";
  process.env.PAYPAL_CLIENT_SECRET = "sandbox-secret";
  globalThis.fetch = async (input) => {
    const url = new URL(
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url
    );
    if (url.pathname === "/v1/oauth2/token") {
      return Response.json({ access_token: "sandbox-token", expires_in: 3600 });
    }
    return Response.json(
      {
        name: "INVALID_REQUEST",
        message: "Sensitive recipient payee@example.com was rejected",
      },
      { status: 400 }
    );
  };

  try {
    const { createPayoutBatch } = await import("../src/lib/paypal.ts");
    await assert.rejects(
      createPayoutBatch("1123456789abcdef0123456789abcd", "test", [
        {
          senderItemId: "2123456789abcdef012345",
          email: "payee@example.com",
          amountValue: "1.25",
          currency: "USD",
        },
      ]),
      (error: unknown) =>
        error instanceof Error &&
        error.message.includes("HTTP 400") &&
        !error.message.includes("payee@example.com")
    );
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnv("PAYPAL_CLIENT_ID", previous.clientId);
    restoreEnv("PAYPAL_CLIENT_SECRET", previous.clientSecret);
  }
});

test("403 NOT_AUTHORIZED diagnostics are retained and sensitive values are redacted", async () => {
  const error = await requestMockedPayoutError(403, {
    name: "NOT_AUTHORIZED",
    message:
      "Recipient payee@example.com is not authorized; client_secret=sandbox-secret; Bearer sandbox-access-token",
    details: [
      {
        issue: "NOT_AUTHORIZED",
        description:
          "Access denied for payee@example.com using sandbox-secret",
      },
    ],
    debug_id: "DEBUG-403-123",
  });

  assert.equal(error.httpStatus, 403);
  assert.equal(error.diagnostic.name, "NOT_AUTHORIZED");
  assert.equal(error.diagnostic.details[0]?.issue, "NOT_AUTHORIZED");
  assert.equal(error.diagnostic.debugId, "DEBUG-403-123");
  assert.match(error.diagnostic.message ?? "", /\[email redacted\]/);
  assert.match(error.diagnostic.message ?? "", /\[credential redacted\]/);
  assert.doesNotMatch(
    JSON.stringify(error.diagnostic),
    /payee@example\.com|sandbox-secret|sandbox-access-token/
  );
});

test("PERMISSION_DENIED is retained from PayPal detail issue", async () => {
  const error = await requestMockedPayoutError(403, {
    message: "The payout permission is unavailable.",
    details: [{ issue: "PERMISSION_DENIED", description: "Payout API access is disabled." }],
    debug_id: "DEBUG-PERMISSION",
  });

  assert.equal(error.diagnostic.name, null);
  assert.equal(error.diagnostic.details[0]?.issue, "PERMISSION_DENIED");
  assert.equal(error.diagnostic.details[0]?.description, "Payout API access is disabled.");
});

test("malformed PayPal error JSON preserves HTTP status without body content", async () => {
  const error = await requestMockedPayoutError(403, "not-json");

  assert.equal(error.diagnostic.httpStatus, 403);
  assert.equal(error.diagnostic.name, null);
  assert.equal(error.diagnostic.message, null);
  assert.deepEqual(error.diagnostic.details, []);
  assert.equal(error.diagnostic.debugId, null);
});

test("PayPal errors without optional fields retain a safe minimal diagnostic", async () => {
  const error = await requestMockedPayoutError(403, { name: "FORBIDDEN" });

  assert.equal(error.diagnostic.name, "FORBIDDEN");
  assert.equal(error.diagnostic.message, null);
  assert.deepEqual(error.diagnostic.details, []);
  assert.equal(error.diagnostic.debugId, null);
});

test("live PayPal endpoints are rejected before any request", async () => {
  const previous = {
    clientId: process.env.PAYPAL_CLIENT_ID,
    clientSecret: process.env.PAYPAL_CLIENT_SECRET,
    baseUrl: process.env.PAYPAL_BASE_URL,
  };
  const originalFetch = globalThis.fetch;
  process.env.PAYPAL_CLIENT_ID = "sandbox-client";
  process.env.PAYPAL_CLIENT_SECRET = "sandbox-secret";
  process.env.PAYPAL_BASE_URL = "https://api-m.paypal.com";
  let requestCount = 0;
  globalThis.fetch = async () => {
    requestCount += 1;
    return Response.json({});
  };

  try {
    const { assertSandboxConfigured } = await import("../src/lib/paypal.ts");
    assert.throws(assertSandboxConfigured, /restricted to the Sandbox API/);
    assert.equal(requestCount, 0);
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnv("PAYPAL_CLIENT_ID", previous.clientId);
    restoreEnv("PAYPAL_CLIENT_SECRET", previous.clientSecret);
    restoreEnv("PAYPAL_BASE_URL", previous.baseUrl);
  }
});

test("payout sender IDs longer than PayPal's 30-character limit are rejected", async () => {
  const { createPayoutBatch } = await import("../src/lib/paypal.ts");
  await assert.rejects(
    createPayoutBatch("a".repeat(31), "test", [
      {
        senderItemId: "b".repeat(30),
        email: "payee@example.com",
        amountValue: "1.25",
        currency: "USD",
      },
    ]),
    /invalid recipients or amounts/
  );
  await assert.rejects(
    createPayoutBatch("a".repeat(30), "test", [
      {
        senderItemId: "b".repeat(31),
        email: "payee@example.com",
        amountValue: "1.25",
        currency: "USD",
      },
    ]),
    /invalid recipients or amounts/
  );
});

async function requestMockedPayoutError(
  status: number,
  body: unknown
): Promise<PayPalApiErrorType> {
  const previous = {
    clientId: process.env.PAYPAL_CLIENT_ID,
    clientSecret: process.env.PAYPAL_CLIENT_SECRET,
    baseUrl: process.env.PAYPAL_BASE_URL,
  };
  const originalFetch = globalThis.fetch;
  process.env.PAYPAL_CLIENT_ID = "sandbox-client";
  process.env.PAYPAL_CLIENT_SECRET = "sandbox-secret";
  process.env.PAYPAL_BASE_URL = "https://api-m.sandbox.paypal.com";
  globalThis.fetch = async (input) => {
    const url = new URL(
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url
    );
    if (url.pathname === "/v1/oauth2/token") {
      return Response.json({ access_token: "sandbox-access-token", expires_in: 3600 });
    }
    return typeof body === "string"
      ? new Response(body, { status, headers: { "Content-Type": "application/json" } })
      : Response.json(body, { status });
  };

  try {
    const { createPayoutBatch, PayPalApiError } = await import("../src/lib/paypal.ts");
    try {
      await createPayoutBatch("1123456789abcdef0123456789abcd", "test", [
        {
          senderItemId: "2123456789abcdef012345",
          email: "payee@example.com",
          amountValue: "1.25",
          currency: "USD",
        },
      ]);
    } catch (error) {
      assert.ok(error instanceof PayPalApiError);
      return error;
    }
    assert.fail("Expected mocked PayPal payout request to fail");
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnv("PAYPAL_CLIENT_ID", previous.clientId);
    restoreEnv("PAYPAL_CLIENT_SECRET", previous.clientSecret);
    restoreEnv("PAYPAL_BASE_URL", previous.baseUrl);
  }
}

function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}
