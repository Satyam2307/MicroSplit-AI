import { createHash } from "node:crypto";

export type SplitApprovalDecision = "approved" | "disputed" | "adjusted";

export function parseSplitApprovalInput(value: unknown): {
  decision: SplitApprovalDecision;
  note: string | null;
} | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  const body = value as Record<string, unknown>;
  if (
    body.decision !== "approved" &&
    body.decision !== "disputed" &&
    body.decision !== "adjusted"
  ) {
    return null;
  }
  if (body.note !== undefined && typeof body.note !== "string") return null;

  const note = typeof body.note === "string" ? body.note.trim() : "";
  if (note.length > 2000) return null;
  return { decision: body.decision, note: note || null };
}

export function getSplitRunStatusForDecision(
  decision: SplitApprovalDecision
): "approved" | "disputed" | "pending_approval" {
  if (decision === "approved") return "approved";
  if (decision === "disputed") return "disputed";
  return "pending_approval";
}

export function isValidPayPalEmail(value: string): boolean {
  if (value.length > 254 || value.trim() !== value || /\s/.test(value)) {
    return false;
  }

  const at = value.lastIndexOf("@");
  if (at < 1 || at === value.length - 1) return false;
  const localPart = value.slice(0, at);
  const domain = value.slice(at + 1);
  return (
    localPart.length <= 64 &&
    !localPart.startsWith(".") &&
    !localPart.endsWith(".") &&
    !localPart.includes("..") &&
    domain.includes(".") &&
    !domain.startsWith(".") &&
    !domain.endsWith(".") &&
    domain.split(".").every((label) => label.length > 0 && label.length <= 63)
  );
}

export function isConfirmedPayPalRecipient(input: {
  receiver: string;
  receiverType: string;
  confirmedAt: Date | null;
}): boolean {
  return (
    input.receiverType === "EMAIL" &&
    input.confirmedAt !== null &&
    isValidPayPalEmail(input.receiver)
  );
}

export function maskPayPalEmail(value: string): string {
  if (!isValidPayPalEmail(value)) return "Not configured";
  const [localPart, domain] = value.split("@");
  const visiblePrefix = localPart.slice(0, Math.min(1, localPart.length));
  return `${visiblePrefix}***@${domain}`;
}

export function createStablePayoutBatchId(runId: string): string {
  return createHash("sha256")
    .update(`microsplit:payout-batch:${runId}`)
    .digest("hex")
    .slice(0, 30);
}

export function createStablePayoutItemId(
  runId: string,
  memberId: string
): string {
  return createHash("sha256")
    .update(`microsplit:payout-item:${runId}:${memberId}`)
    .digest("hex")
    .slice(0, 30);
}

export function normalizePayPalBatchStatus(
  status: string
): "processing" | "denied" | "canceled" {
  if (status === "DENIED") return "denied";
  if (status === "CANCELED") return "canceled";
  return "processing";
}

export type PersistedPayoutItemStatus =
  | "created"
  | "pending"
  | "success"
  | "failed"
  | "unclaimed"
  | "returned"
  | "blocked";

export function normalizePayPalItemStatus(
  status: string
): PersistedPayoutItemStatus | null {
  switch (status) {
    case "SUCCESS":
      return "success";
    case "FAILED":
    case "DENIED":
      return "failed";
    case "UNCLAIMED":
      return "unclaimed";
    case "RETURNED":
      return "returned";
    case "BLOCKED":
      return "blocked";
    case "PENDING":
    case "PROCESSING":
      return "pending";
    default:
      return null;
  }
}

export function getWebhookPayoutItemStatus(
  eventType: string
): PersistedPayoutItemStatus | null {
  switch (eventType) {
    case "PAYMENT.PAYOUTS-ITEM.SUCCEEDED":
      return "success";
    case "PAYMENT.PAYOUTS-ITEM.FAILED":
      return "failed";
    case "PAYMENT.PAYOUTS-ITEM.UNCLAIMED":
      return "unclaimed";
    case "PAYMENT.PAYOUTS-ITEM.RETURNED":
      return "returned";
    case "PAYMENT.PAYOUTS-ITEM.BLOCKED":
      return "blocked";
    default:
      return null;
  }
}

export function isTerminalPayoutItemStatus(status: string): boolean {
  return ["success", "failed", "unclaimed", "returned", "blocked"].includes(
    status
  );
}

export function aggregatePayoutBatchStatus(
  currentStatus: string,
  itemStatuses: readonly string[]
): string {
  if (currentStatus === "denied" || currentStatus === "canceled") {
    return currentStatus;
  }
  if (
    itemStatuses.length > 0 &&
    itemStatuses.every(isTerminalPayoutItemStatus)
  ) {
    return itemStatuses.every((status) => status === "success")
      ? "success"
      : "completed_with_issues";
  }
  return "processing";
}
