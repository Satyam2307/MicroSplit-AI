import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireAuthenticatedActor, requireSquadRole } from "@/lib/authorization";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  createPayoutBatch,
  assertSandboxConfigured,
  PayPalApiError,
  PayPalTransportError,
  type PayoutRecipient,
} from "@/lib/paypal";
import { getPrisma } from "@/lib/prisma";
import {
  computeSplitRunSnapshotChecksum,
  type SplitRunLineCreateRecord,
} from "@/lib/split-run-persistence";
import { toPayPalAmount } from "@/lib/money";
import {
  createStablePayoutBatchId,
  createStablePayoutItemId,
  isConfirmedPayPalRecipient,
  isValidPayPalEmail,
  maskPayPalEmail,
  normalizePayPalBatchStatus,
} from "@/lib/payout-safety";

const PAYPAL_IDEMPOTENCY_RETRY_WINDOW_MS = 6 * 60 * 60 * 1000;
const SUBMISSION_LEASE_MS = 30 * 1000;

const payoutRunInclude = {
  revenueEvent: { select: { squadId: true, currency: true } },
  lines: {
    orderBy: { memberId: "asc" },
    select: {
      id: true,
      runId: true,
      memberId: true,
      membershipId: true,
      weight: true,
      amountMinor: true,
      workAmountMinor: true,
      consistencyAmountMinor: true,
      streakDays: true,
      freezeDaysUsed: true,
      rationaleJson: true,
    },
  },
  approvals: {
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 1,
    select: { decision: true },
  },
} satisfies Prisma.SplitRunInclude;

type PersistedPayoutBatch = Prisma.PayoutBatchGetPayload<{
  include: { items: true };
}>;
type PayoutRunRecord = Prisma.SplitRunGetPayload<{
  include: typeof payoutRunInclude;
}>;
type PayoutRunLine = PayoutRunRecord["lines"][number];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "anonymous";
  const rateLimit = checkRateLimit(`payout_dispatch_${clientIp}`, {
    intervalMs: 60000,
    maxRequests: 20,
  });
  if (!rateLimit.success) {
    return NextResponse.json(
      { success: false, error: "Too many payout requests. Please wait." },
      { status: 429 }
    );
  }

  const actor = await requireAuthenticatedActor();
  if (!actor.ok) return actor.response;

  const { id } = await params;
  if (!id || id.length > 128) {
    return NextResponse.json(
      { success: false, error: "A valid split run ID is required" },
      { status: 400 }
    );
  }
  const prisma = getPrisma();
  const run = await prisma.splitRun.findUnique({
    where: { id },
    include: payoutRunInclude,
  });
  if (!run) {
    return NextResponse.json(
      { success: false, error: "Split run not found" },
      { status: 404 }
    );
  }

  const squadId = run.revenueEvent.squadId;
  const access = await requireSquadRole(squadId, ["owner", "approver"]);
  if (!access.ok) return access.response;

  if (!isApprovedSnapshot(run)) {
    return NextResponse.json(
      { success: false, error: "A persisted approved split snapshot is required before payout" },
      { status: 409 }
    );
  }

  try {
    assertSandboxConfigured();
  } catch {
    return NextResponse.json(
      { success: false, error: "PayPal Sandbox is unavailable or not configured" },
      { status: 503 }
    );
  }

  let claim: { batch: NonNullable<PersistedPayoutBatch>; created: boolean };
  try {
    claim = await prisma.$transaction(
      async (tx) => {
        const currentRun = await tx.splitRun.findUnique({
          where: { id },
          include: payoutRunInclude,
        });
        if (!currentRun) throw new PayoutRequestError(404, "Split run not found");
        if (
          currentRun.revenueEvent.squadId !== squadId ||
          !isApprovedSnapshot(currentRun)
        ) {
          throw new PayoutRequestError(
            409,
            "The split run is no longer an approved payout snapshot"
          );
        }

        const lines = validatePayoutLines(currentRun);
        const existing = await tx.payoutBatch.findUnique({
          where: { runId: id },
          include: { items: { orderBy: { senderItemId: "asc" } } },
        });
        if (existing) {
          const now = new Date();
          const attemptedAt = existing.submissionAttemptedAt;
          const isStaleSubmission =
            existing.status === "submitting" &&
            attemptedAt !== null &&
            now.getTime() - attemptedAt.getTime() >= SUBMISSION_LEASE_MS;
          const isUnknownSubmission =
            existing.status === "submission_unknown";
          const withinIdempotencyWindow =
            now.getTime() - existing.createdAt.getTime() <
            PAYPAL_IDEMPOTENCY_RETRY_WINDOW_MS;
          if (
            (!isStaleSubmission && !isUnknownSubmission) ||
            !withinIdempotencyWindow ||
            !isRetryPayloadIntact(existing.items, lines)
          ) {
            throw new PayoutRequestError(
              409,
              "A payout claim already exists for this split run; reconcile its status before trying again"
            );
          }

          const updated = await tx.payoutBatch.updateMany({
            where: {
              id: existing.id,
              status: existing.status,
              submissionAttemptedAt: attemptedAt,
            },
            data: {
              status: "submitting",
              submissionAttemptedAt: now,
            },
          });
          if (updated.count !== 1) {
            throw new PayoutRequestError(
              409,
              "Another payout request is already being processed"
            );
          }
          const batch = await tx.payoutBatch.findUniqueOrThrow({
            where: { id: existing.id },
            include: { items: { orderBy: { senderItemId: "asc" } } },
          });
          return { batch, created: false };
        }

        const positiveLines = lines.filter((line) => line.amountMinor > 0);
        if (positiveLines.length === 0 || positiveLines.length > 15000) {
          throw new PayoutRequestError(
            400,
            "The approved split has no payable items or exceeds the PayPal batch limit"
          );
        }
        const memberships = await tx.membership.findMany({
          where: {
            squadId,
            userId: { in: positiveLines.map((line) => line.memberId) },
          },
          select: {
            userId: true,
            payoutReceiver: true,
            payoutReceiverType: true,
            payoutReceiverConfirmedAt: true,
          },
        });
        const membershipByUserId = new Map(
          memberships.map((membership) => [membership.userId, membership])
        );
        const itemData = positiveLines.map((line) => {
          const membership = membershipByUserId.get(line.memberId);
          if (
            !membership ||
            !isConfirmedPayPalRecipient({
              receiver: membership.payoutReceiver,
              receiverType: membership.payoutReceiverType,
              confirmedAt: membership.payoutReceiverConfirmedAt,
            })
          ) {
            throw new PayoutRequestError(
              400,
              "Every payout recipient must explicitly confirm a valid PayPal email"
            );
          }
          return {
            lineId: line.id,
            senderItemId: createStablePayoutItemId(id, line.memberId),
            recipientEmail: membership.payoutReceiver,
            amountMinor: line.amountMinor,
            status: "created",
          };
        });
        const now = new Date();
        const batch = await tx.payoutBatch.create({
          data: {
            runId: id,
            senderBatchId: createStablePayoutBatchId(id),
            status: "submitting",
            totalMinor: currentRun.poolMinor,
            submissionAttemptedAt: now,
            items: { create: itemData },
          },
          include: { items: { orderBy: { senderItemId: "asc" } } },
        });
        return { batch, created: true };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
  } catch (error) {
    if (error instanceof PayoutRequestError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { success: false, error: "A payout claim already exists for this split run" },
        { status: 409 }
      );
    }
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2034"
    ) {
      return NextResponse.json(
        { success: false, error: "Payout state changed concurrently; reload and retry" },
        { status: 409 }
      );
    }
    console.error("Failed to persist payout claim", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json(
      { success: false, error: "Unable to prepare the payout claim" },
      { status: 500 }
    );
  }

  const recipients = claim.batch.items.map((item) => ({
    senderItemId: item.senderItemId,
    email: item.recipientEmail,
    amountValue: toPayPalAmount(item.amountMinor),
    currency: "USD",
    note: "Approved MicroSplit payout",
  }));
  try {
    const result = await createPayoutBatch(
      claim.batch.senderBatchId,
      "MicroSplit AI payout",
      recipients
    );
    const updatedBatch = await prisma.payoutBatch.update({
      where: { id: claim.batch.id },
      data: {
        paypalBatchId: result.batchId,
        status: normalizePayPalBatchStatus(result.batchStatus),
        items: {
          updateMany: {
            where: {},
            data: { status: "pending" },
          },
        },
      },
      include: { items: { orderBy: { senderItemId: "asc" } } },
    });
    return NextResponse.json(
      { success: true, data: toPayoutBatchResponse(updatedBatch) },
      { status: claim.created ? 201 : 200 }
    );
  } catch (error) {
    try {
      await prisma.payoutBatch.updateMany({
        where: { id: claim.batch.id, status: "submitting" },
        data: { status: "submission_unknown" },
      });
    } catch (persistenceError) {
      console.error("Failed to persist unknown PayPal submission state", {
        errorName:
          persistenceError instanceof Error
            ? persistenceError.name
            : "UnknownError",
      });
    }

    if (error instanceof PayPalApiError) {
      console.error("PayPal payout provider error", {
        payoutBatchId: claim.batch.id,
        errorName: error.name,
        ...error.diagnostic,
      });
      const explanation = formatPayPalDiagnostic(error.diagnostic);
      return NextResponse.json(
        {
          success: false,
          error: [
            `PayPal Sandbox rejected or could not confirm the payout request (HTTP ${error.httpStatus})`,
            explanation,
            error.diagnostic.debugId
              ? `PayPal reference ${error.diagnostic.debugId}`
              : null,
            "The payout claim is retained to prevent duplicates.",
          ]
            .filter(Boolean)
            .join(". "),
          diagnostics: error.diagnostic,
        },
        { status: 502 }
      );
    }
    if (error instanceof PayPalTransportError) {
      console.error("PayPal payout transport error", {
        errorName: error.name,
        errorCode: error.code,
      });
      return NextResponse.json(
        {
          success: false,
          error: "PayPal Sandbox did not confirm the payout request. The claim is retained to prevent duplicates.",
        },
        { status: 502 }
      );
    }
    console.error("PayPal payout response could not be persisted", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json(
      {
        success: false,
        error: "The payout response could not be confirmed. The claim is retained to prevent duplicates.",
      },
      { status: 502 }
    );
  }
}

function formatPayPalDiagnostic(diagnostic: PayPalApiError["diagnostic"]): string | null {
  const fields = [
    diagnostic.name,
    ...diagnostic.details.flatMap((detail) => [
      detail.issue,
      detail.description,
    ]),
    diagnostic.message,
  ];
  const uniqueFields = [...new Set(fields.filter((field): field is string => Boolean(field)))];
  return uniqueFields.length > 0
    ? `Provider detail: ${uniqueFields.join(" — ").slice(0, 1200)}`
    : null;
}

class PayoutRequestError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
  }
}

function isApprovedSnapshot(
  run: PayoutRunRecord | null
): run is PayoutRunRecord {
  if (
    !run ||
    run.status !== "approved" ||
    run.approvals[0]?.decision !== "approved" ||
    !run.ruleSnapshotJson ||
    run.poolMinor <= 0 ||
    run.revenueEvent.currency !== "USD" ||
    run.lines.length === 0
  ) {
    return false;
  }

  const total = run.lines.reduce((sum, line) => sum + line.amountMinor, 0);
  if (
    total !== run.poolMinor ||
    run.lines.some(
      (line) =>
        !Number.isSafeInteger(line.amountMinor) ||
        line.amountMinor < 0 ||
        !Number.isFinite(line.weight) ||
        line.membershipId === null
    )
  ) {
    return false;
  }

  const checksum = computeSplitRunSnapshotChecksum({
    revenueEventId: run.revenueEventId,
    squadId: run.revenueEvent.squadId,
    poolMinor: run.poolMinor,
    ruleVersion: run.ruleVersion,
    calculationVersion: run.calculationVersion,
    ruleSnapshotJson: run.ruleSnapshotJson,
    lines: run.lines.map((line) => ({
      memberId: line.memberId,
      membershipId: line.membershipId ?? "",
      weight: line.weight,
      amountMinor: line.amountMinor,
      workAmountMinor: line.workAmountMinor,
      consistencyAmountMinor: line.consistencyAmountMinor,
      streakDays: line.streakDays,
      freezeDaysUsed: line.freezeDaysUsed,
      rationaleJson: line.rationaleJson,
    })),
  });
  return checksum === run.checksum;
}

function validatePayoutLines(
  run: PayoutRunRecord
): PayoutRunLine[] {
  if (!isApprovedSnapshot(run)) {
    throw new PayoutRequestError(
      409,
      "A persisted approved split snapshot is required before payout"
    );
  }
  if (
    run.lines.some(
      (line) =>
        !Number.isSafeInteger(line.amountMinor) ||
        line.amountMinor < 0 ||
        !Number.isFinite(line.weight)
    )
  ) {
    throw new PayoutRequestError(409, "The saved split snapshot is invalid");
  }
  return run.lines;
}

function isRetryPayloadIntact(
  items: {
    lineId: string;
    senderItemId: string;
    recipientEmail: string;
    amountMinor: number;
  }[],
  lines: PayoutRunLine[]
): boolean {
  const positiveLines = lines.filter((line) => line.amountMinor > 0);
  if (items.length !== positiveLines.length) return false;
  const lineById = new Map(positiveLines.map((line) => [line.id, line]));
  return items.every((item) => {
    const line = lineById.get(item.lineId);
    return Boolean(
      line &&
        item.amountMinor === line.amountMinor &&
        item.senderItemId === createStablePayoutItemId(line.runId, line.memberId) &&
        isValidPayPalEmail(item.recipientEmail)
    );
  });
}

function toPayoutBatchResponse<
  T extends {
    id: string;
    runId: string;
    senderBatchId: string;
    paypalBatchId: string | null;
    status: string;
    totalMinor: number;
    createdAt: Date;
    items: {
      id: string;
      batchId: string;
      lineId: string;
      senderItemId: string;
      paypalItemId: string | null;
      recipientEmail: string;
      amountMinor: number;
      status: string;
      failureReason: string | null;
    }[];
  },
>(batch: T) {
  return {
    id: batch.id,
    runId: batch.runId,
    senderBatchId: batch.senderBatchId,
    paypalBatchId: batch.paypalBatchId,
    status: batch.status,
    totalMinor: batch.totalMinor,
    createdAt: batch.createdAt.toISOString(),
    items: batch.items.map((item) => ({
      id: item.id,
      batchId: item.batchId,
      lineId: item.lineId,
      senderItemId: item.senderItemId,
      paypalItemId: item.paypalItemId,
      amountMinor: item.amountMinor,
      status: item.status,
      failureReason: item.failureReason,
      recipientEmail: maskPayPalEmail(item.recipientEmail),
    })),
  };
}
