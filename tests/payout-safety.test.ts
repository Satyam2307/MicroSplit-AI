import assert from "node:assert/strict";
import test from "node:test";
import {
  createStablePayoutBatchId,
  createStablePayoutItemId,
  aggregatePayoutBatchStatus,
  getWebhookPayoutItemStatus,
  isTerminalPayoutItemStatus,
  getSplitRunStatusForDecision,
  isConfirmedPayPalRecipient,
  isValidPayPalEmail,
  maskPayPalEmail,
  normalizePayPalItemStatus,
  normalizePayPalBatchStatus,
  parseSplitApprovalInput,
} from "../src/lib/payout-safety.ts";

test("split approval input validates decision and bounded note", () => {
  assert.deepEqual(
    parseSplitApprovalInput({ decision: "approved", note: " checked " }),
    { decision: "approved", note: "checked" }
  );
  assert.equal(parseSplitApprovalInput({ decision: "other" }), null);
  assert.equal(parseSplitApprovalInput({ decision: "approved", note: 7 }), null);
  assert.equal(
    parseSplitApprovalInput({ decision: "approved", note: "x".repeat(2001) }),
    null
  );
});

test("approval decisions map to persisted split-run states", () => {
  assert.equal(getSplitRunStatusForDecision("approved"), "approved");
  assert.equal(getSplitRunStatusForDecision("disputed"), "disputed");
  assert.equal(getSplitRunStatusForDecision("adjusted"), "pending_approval");
});

test("payout recipients require an explicitly confirmed valid email", () => {
  const confirmedAt = new Date("2026-11-03T00:00:00.000Z");
  assert.equal(isValidPayPalEmail("payee@example.com"), true);
  assert.equal(isValidPayPalEmail("not-an-email"), false);
  assert.equal(
    isConfirmedPayPalRecipient({
      receiver: "payee@example.com",
      receiverType: "EMAIL",
      confirmedAt,
    }),
    true
  );
  assert.equal(
    isConfirmedPayPalRecipient({
      receiver: "payee@example.com",
      receiverType: "EMAIL",
      confirmedAt: null,
    }),
    false
  );
  assert.equal(
    isConfirmedPayPalRecipient({
      receiver: "payee@example.com",
      receiverType: "PHONE",
      confirmedAt,
    }),
    false
  );
});

test("payout recipient masking never returns the full address", () => {
  assert.equal(maskPayPalEmail("payee@example.com"), "p***@example.com");
  assert.equal(maskPayPalEmail("invalid"), "Not configured");
});

test("payout sender identifiers are deterministic and scoped to their run and member", () => {
  const batchId = createStablePayoutBatchId("run-1");
  assert.equal(batchId, createStablePayoutBatchId("run-1"));
  assert.equal(batchId.length, 30);
  assert.notEqual(batchId, createStablePayoutBatchId("run-2"));
  assert.notEqual(
    createStablePayoutItemId("run-1", "member-1"),
    createStablePayoutItemId("run-1", "member-2")
  );
  assert.equal(createStablePayoutItemId("run-1", "member-1").length, 30);
});

test("unknown PayPal batch statuses remain processing until item reconciliation", () => {
  assert.equal(normalizePayPalBatchStatus("PENDING"), "processing");
  assert.equal(normalizePayPalBatchStatus("SUCCESS"), "processing");
  assert.equal(normalizePayPalBatchStatus("DENIED"), "denied");
  assert.equal(normalizePayPalBatchStatus("CANCELED"), "canceled");
});

test("payout item status reconciliation recognizes terminal states and preserves incomplete batches", () => {
  assert.equal(normalizePayPalItemStatus("SUCCESS"), "success");
  assert.equal(normalizePayPalItemStatus("UNCLAIMED"), "unclaimed");
  assert.equal(normalizePayPalItemStatus("PENDING"), "pending");
  assert.equal(normalizePayPalItemStatus("UNRECOGNIZED"), null);
  assert.equal(
    getWebhookPayoutItemStatus("PAYMENT.PAYOUTS-ITEM.FAILED"),
    "failed"
  );
  assert.equal(isTerminalPayoutItemStatus("pending"), false);
  assert.equal(isTerminalPayoutItemStatus("success"), true);
  assert.equal(aggregatePayoutBatchStatus("processing", ["success", "success"]), "success");
  assert.equal(
    aggregatePayoutBatchStatus("processing", ["success", "failed"]),
    "completed_with_issues"
  );
  assert.equal(aggregatePayoutBatchStatus("processing", ["success", "pending"]), "processing");
  assert.equal(aggregatePayoutBatchStatus("denied", ["success"]), "denied");
});
