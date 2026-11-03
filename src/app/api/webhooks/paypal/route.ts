import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";
import {
  aggregatePayoutBatchStatus,
  getWebhookPayoutItemStatus,
  isTerminalPayoutItemStatus,
} from "@/lib/payout-safety";
import { verifyWebhookSignature } from "@/lib/paypal";

const MAX_WEBHOOK_BODY_LENGTH = 1_000_000;

export async function POST(request: NextRequest) {
  const bodyText = await request.text();
  if (bodyText.length > MAX_WEBHOOK_BODY_LENGTH) {
    return NextResponse.json(
      { success: false, error: "Webhook payload is too large" },
      { status: 413 }
    );
  }

  let event: unknown;
  try {
    event = JSON.parse(bodyText);
  } catch {
    return NextResponse.json(
      { success: false, error: "Webhook payload must be valid JSON" },
      { status: 400 }
    );
  }
  if (
    !isRecord(event) ||
    typeof event.id !== "string" ||
    event.id.length === 0 ||
    event.id.length > 256 ||
    typeof event.event_type !== "string" ||
    event.event_type.length === 0 ||
    event.event_type.length > 128 ||
    !isRecord(event.resource)
  ) {
    return NextResponse.json(
      { success: false, error: "Invalid PayPal event payload" },
      { status: 400 }
    );
  }
  const eventId = event.id;
  const eventType = event.event_type;
  const resource = event.resource;

  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });
  let verified: boolean;
  try {
    verified = await verifyWebhookSignature(headers, bodyText);
  } catch (error) {
    logProviderFailure("verification", error);
    return NextResponse.json(
      { success: false, error: "PayPal webhook verification is temporarily unavailable" },
      { status: 503 }
    );
  }
  if (!verified) {
    return NextResponse.json(
      { success: false, error: "Invalid webhook signature" },
      { status: 401 }
    );
  }

  try {
    await getPrisma().$transaction(
      async (tx) => {
        await tx.payPalWebhookEvent.create({
          data: {
            paypalEventId: eventId,
            eventType,
          },
        });

        if (eventType.startsWith("PAYMENT.PAYOUTSBATCH.")) {
          await processBatchEvent(tx, eventType, resource);
        } else {
          const itemStatus = getWebhookPayoutItemStatus(eventType);
          if (itemStatus) await processItemEvent(tx, resource, itemStatus);
        }
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
    return NextResponse.json({ success: true, message: "Webhook processed" });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json({
        success: true,
        message: "Event already processed",
      });
    }
    if (error instanceof UnmatchedPayoutEvent) {
      return NextResponse.json(
        { success: false, error: "Payout record is not available for reconciliation yet" },
        { status: 503 }
      );
    }
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2034"
    ) {
      return NextResponse.json(
        { success: false, error: "Payout state changed concurrently; retry this webhook" },
        { status: 503 }
      );
    }
    console.error("Failed to persist PayPal webhook", {
      errorName: error instanceof Error ? error.name : "UnknownError",
      eventType: event.event_type,
    });
    return NextResponse.json(
      { success: false, error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function processBatchEvent(
  tx: Prisma.TransactionClient,
  eventType: string,
  resource: Record<string, unknown>
): Promise<void> {
  const header = isRecord(resource.batch_header) ? resource.batch_header : null;
  const paypalBatchId =
    header && typeof header.payout_batch_id === "string"
      ? header.payout_batch_id
      : null;
  const senderBatchId =
    header && typeof header.sender_batch_id === "string"
      ? header.sender_batch_id
      : null;
  const conditions = [
    ...(paypalBatchId ? [{ paypalBatchId }] : []),
    ...(senderBatchId ? [{ senderBatchId }] : []),
  ];
  if (conditions.length === 0) throw new UnmatchedPayoutEvent();

  const batch = await tx.payoutBatch.findFirst({
    where: { OR: conditions },
    include: { items: { select: { status: true } } },
  });
  if (!batch) throw new UnmatchedPayoutEvent();

  const status =
    batch.status === "success" ||
    batch.status === "denied" ||
    batch.status === "canceled"
      ? batch.status
      : eventType === "PAYMENT.PAYOUTSBATCH.DENIED"
        ? "denied"
        : eventType === "PAYMENT.PAYOUTSBATCH.CANCELED"
          ? "canceled"
          : eventType === "PAYMENT.PAYOUTSBATCH.SUCCESS" &&
              batch.items.length > 0 &&
              batch.items.every((item) => item.status === "success")
            ? "success"
            : "processing";

  await tx.payoutBatch.update({
    where: { id: batch.id },
    data: { paypalBatchId: paypalBatchId ?? batch.paypalBatchId, status },
  });
  if (status === "success") {
    await tx.splitRun.updateMany({
      where: { id: batch.runId, status: "approved" },
      data: { status: "paid" },
    });
  }
}

async function processItemEvent(
  tx: Prisma.TransactionClient,
  resource: Record<string, unknown>,
  nextStatus: Exclude<ReturnType<typeof getWebhookPayoutItemStatus>, null>
): Promise<void> {
  const payoutItem = isRecord(resource.payout_item) ? resource.payout_item : null;
  const senderItemId =
    payoutItem && typeof payoutItem.sender_item_id === "string"
      ? payoutItem.sender_item_id
      : null;
  const paypalItemId =
    typeof resource.payout_item_id === "string"
      ? resource.payout_item_id
      : null;
  let item = senderItemId
    ? await tx.payoutItem.findUnique({
        where: { senderItemId },
        include: { batch: true },
      })
    : null;
  if (!item && paypalItemId) {
    item = await tx.payoutItem.findFirst({
      where: { paypalItemId },
      include: { batch: true },
    });
  }
  if (!item) throw new UnmatchedPayoutEvent();

  const errorRecord = isRecord(resource.errors) ? resource.errors : null;
  const failureCode =
    errorRecord &&
    typeof errorRecord.name === "string" &&
    /^[A-Z0-9_-]{1,80}$/i.test(errorRecord.name)
      ? errorRecord.name
      : null;
  const resolvedStatus = isTerminalPayoutItemStatus(item.status)
    ? item.status
    : nextStatus;
  await tx.payoutItem.update({
    where: { id: item.id },
    data: {
      status: resolvedStatus,
      paypalItemId: paypalItemId ?? item.paypalItemId,
      failureReason: resolvedStatus === "success" ? null : failureCode,
    },
  });

  const items = await tx.payoutItem.findMany({
    where: { batchId: item.batchId },
    select: { id: true, status: true },
  });
  const batchStatus = aggregatePayoutBatchStatus(
    item.batch.status,
    items.map(({ id, status }) => (id === item.id ? resolvedStatus : status))
  );
  await tx.payoutBatch.update({
    where: { id: item.batchId },
    data: { status: batchStatus },
  });
  if (batchStatus === "success") {
    await tx.splitRun.updateMany({
      where: { id: item.batch.runId, status: "approved" },
      data: { status: "paid" },
    });
  }
}

function logProviderFailure(operation: string, error: unknown): void {
  if (typeof error === "object" && error !== null && "httpStatus" in error) {
    console.error(`PayPal webhook ${operation} failed`, {
      errorName: error instanceof Error ? error.name : "UnknownError",
      httpStatus: error.httpStatus,
      providerCode:
        "providerCode" in error ? error.providerCode : undefined,
    });
    return;
  }
  console.error(`PayPal webhook ${operation} failed`, {
    errorName: error instanceof Error ? error.name : "UnknownError",
  });
}

class UnmatchedPayoutEvent extends Error {}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
