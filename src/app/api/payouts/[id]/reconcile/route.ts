import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireSquadRole } from "@/lib/authorization";
import { getPayoutBatchStatus } from "@/lib/paypal";
import { getPrisma } from "@/lib/prisma";
import {
  aggregatePayoutBatchStatus,
  isTerminalPayoutItemStatus,
  maskPayPalEmail,
  normalizePayPalBatchStatus,
  normalizePayPalItemStatus,
} from "@/lib/payout-safety";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id || id.length > 128) {
    return NextResponse.json(
      { success: false, error: "A valid payout ID is required" },
      { status: 400 }
    );
  }

  const prisma = getPrisma();
  const batch = await prisma.payoutBatch.findUnique({
    where: { id },
    include: { run: { select: { revenueEvent: { select: { squadId: true } } } } },
  });
  if (!batch) {
    return NextResponse.json(
      { success: false, error: "Payout batch not found" },
      { status: 404 }
    );
  }

  const access = await requireSquadRole(
    batch.run.revenueEvent.squadId,
    ["owner", "approver"]
  );
  if (!access.ok) return access.response;
  if (!batch.paypalBatchId) {
    return NextResponse.json(
      {
        success: false,
        error:
          "PayPal has not confirmed a batch ID. Retry submission through the split run within the safe idempotency window.",
      },
      { status: 409 }
    );
  }

  let providerResponse: unknown;
  try {
    providerResponse = await getPayoutBatchStatus(batch.paypalBatchId);
  } catch (error) {
    logProviderFailure(error);
    return NextResponse.json(
      { success: false, error: "Unable to refresh payout status from PayPal Sandbox" },
      { status: 502 }
    );
  }

  const parsed = parsePayoutStatus(providerResponse);
  if (!parsed || parsed.paypalBatchId !== batch.paypalBatchId) {
    return NextResponse.json(
      { success: false, error: "PayPal returned an invalid payout status response" },
      { status: 502 }
    );
  }

  try {
    const updated = await prisma.$transaction(
      async (tx) => {
        const current = await tx.payoutBatch.findUnique({
          where: { id },
          include: { items: { orderBy: { senderItemId: "asc" } } },
        });
        if (!current) throw new Error("Payout batch disappeared during reconciliation");

        for (const providerItem of parsed.items) {
          const item = await tx.payoutItem.findUnique({
            where: { senderItemId: providerItem.senderItemId },
          });
          if (!item || item.batchId !== current.id || !providerItem.status) continue;

          const nextStatus =
            isTerminalPayoutItemStatus(item.status) &&
            !isTerminalPayoutItemStatus(providerItem.status)
              ? item.status
              : isTerminalPayoutItemStatus(item.status)
                ? item.status
                : providerItem.status;
          await tx.payoutItem.update({
            where: { id: item.id },
            data: {
              status: nextStatus,
              paypalItemId: providerItem.paypalItemId ?? item.paypalItemId,
              failureReason:
                nextStatus === "success"
                  ? null
                  : providerItem.failureReason ?? item.failureReason,
            },
          });
        }

        const items = await tx.payoutItem.findMany({
          where: { batchId: current.id },
          select: { id: true, status: true },
        });
        const providerBatchStatus = normalizePayPalBatchStatus(
          parsed.batchStatus
        );
        const status =
          current.status === "success"
            ? "success"
            : providerBatchStatus === "denied" || providerBatchStatus === "canceled"
              ? providerBatchStatus
              : aggregatePayoutBatchStatus(
                  current.status,
                  items.map(({ status }) => status)
                );
        const saved = await tx.payoutBatch.update({
          where: { id: current.id },
          data: { status },
          include: {
            run: {
              select: {
                revenueEvent: {
                  select: {
                    squadId: true,
                    currency: true,
                    squad: { select: { name: true } },
                  },
                },
              },
            },
            items: {
              orderBy: { senderItemId: "asc" },
              include: {
                line: {
                  select: {
                    membership: {
                      select: { user: { select: { name: true } } },
                    },
                  },
                },
              },
            },
          },
        });
        if (status === "success") {
          await tx.splitRun.updateMany({
            where: { id: current.runId, status: "approved" },
            data: { status: "paid" },
          });
        }
        return saved;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        runId: updated.runId,
        senderBatchId: updated.senderBatchId,
        paypalBatchId: updated.paypalBatchId,
        status: updated.status,
        totalMinor: updated.totalMinor,
        createdAt: updated.createdAt.toISOString(),
        squadId: updated.run.revenueEvent.squadId,
        squadName: updated.run.revenueEvent.squad.name,
        currency: updated.run.revenueEvent.currency,
        items: updated.items.map((item) => ({
          id: item.id,
          lineId: item.lineId,
          senderItemId: item.senderItemId,
          paypalItemId: item.paypalItemId,
          amountMinor: item.amountMinor,
          status: item.status,
          failureReason: item.failureReason,
          recipientName: item.line.membership?.user.name ?? "Former member",
          recipientEmail: maskPayPalEmail(item.recipientEmail),
        })),
      },
    });
  } catch (error) {
    console.error("Failed to persist payout reconciliation", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json(
      { success: false, error: "Unable to save payout status" },
      { status: 500 }
    );
  }
}

function parsePayoutStatus(value: unknown): {
  paypalBatchId: string;
  batchStatus: string;
  items: {
    senderItemId: string;
    paypalItemId: string | null;
    status: ReturnType<typeof normalizePayPalItemStatus>;
    failureReason: string | null;
  }[];
} | null {
  if (!isRecord(value) || !isRecord(value.batch_header)) return null;
  const header = value.batch_header;
  if (
    typeof header.payout_batch_id !== "string" ||
    typeof header.batch_status !== "string"
  ) {
    return null;
  }
  const rawItems = Array.isArray(value.items) ? value.items : [];
  const items = rawItems.flatMap((rawItem) => {
    if (!isRecord(rawItem)) return [];
    const payoutItem = isRecord(rawItem.payout_item)
      ? rawItem.payout_item
      : null;
    const senderItemId =
      payoutItem && typeof payoutItem.sender_item_id === "string"
        ? payoutItem.sender_item_id
        : null;
    if (!senderItemId) return [];
    const status =
      typeof rawItem.transaction_status === "string"
        ? normalizePayPalItemStatus(rawItem.transaction_status)
        : null;
    const errors = isRecord(rawItem.errors) ? rawItem.errors : null;
    const failureReason =
      errors &&
      typeof errors.name === "string" &&
      /^[A-Z0-9_-]{1,80}$/i.test(errors.name)
        ? errors.name
        : null;
    return [
      {
        senderItemId,
        paypalItemId:
          typeof rawItem.payout_item_id === "string"
            ? rawItem.payout_item_id
            : null,
        status,
        failureReason,
      },
    ];
  });
  return {
    paypalBatchId: header.payout_batch_id,
    batchStatus: header.batch_status,
    items,
  };
}

function logProviderFailure(error: unknown): void {
  if (typeof error === "object" && error !== null && "httpStatus" in error) {
    console.error("PayPal payout reconciliation provider error", {
      errorName: error instanceof Error ? error.name : "UnknownError",
      httpStatus: error.httpStatus,
      providerCode:
        "providerCode" in error ? error.providerCode : undefined,
    });
    return;
  }
  console.error("PayPal payout reconciliation provider error", {
    errorName: error instanceof Error ? error.name : "UnknownError",
    errorCode:
      typeof error === "object" && error !== null && "code" in error
        ? error.code
        : undefined,
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
