import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requireAuthenticatedActor } from "@/lib/authorization";
import { maskPayPalEmail } from "@/lib/payout-safety";

export async function GET() {
  const actor = await requireAuthenticatedActor();
  if (!actor.ok) return actor.response;

  try {
    const prisma = getPrisma();
    const memberships = await prisma.membership.findMany({
      where: { userId: actor.value.userId },
      select: { squadId: true, role: true },
    });
    const accessibleSquadIds = memberships
      .filter(({ role }) => role === "owner" || role === "approver")
      .map(({ squadId }) => squadId);
    if (accessibleSquadIds.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const batches = await prisma.payoutBatch.findMany({
      where: {
        run: {
          revenueEvent: { squadId: { in: accessibleSquadIds } },
        },
      },
      include: {
        run: {
          select: {
            status: true,
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
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });

    return NextResponse.json({
      success: true,
      data: batches.map((batch) => ({
        id: batch.id,
        runId: batch.runId,
        senderBatchId: batch.senderBatchId,
        paypalBatchId: batch.paypalBatchId,
        status: batch.status,
        totalMinor: batch.totalMinor,
        createdAt: batch.createdAt.toISOString(),
        squadId: batch.run.revenueEvent.squadId,
        squadName: batch.run.revenueEvent.squad.name,
        currency: batch.run.revenueEvent.currency,
        items: batch.items.map((item) => ({
          id: item.id,
          batchId: item.batchId,
          lineId: item.lineId,
          senderItemId: item.senderItemId,
          paypalItemId: item.paypalItemId,
          amountMinor: item.amountMinor,
          status: item.status,
          failureReason: item.failureReason,
          recipientName: item.line.membership?.user.name ?? "Former member",
          recipientEmail: maskPayPalEmail(item.recipientEmail),
        })),
      })),
    });
  } catch (error) {
    console.error("Failed to retrieve persisted payout history", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json(
      { success: false, error: "Unable to retrieve payout history" },
      { status: 500 }
    );
  }
}
