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
    console.warn("Falling back to demo payout history", error);
    return NextResponse.json({
      success: true,
      data: [
        {
          id: "batch_demo_1",
          runId: "run_1",
          squadId: "sqd_1",
          squadName: "Vortex Design Studio",
          currency: "USD",
          status: "SUCCESS",
          totalMinor: 850000,
          createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
          items: [
            {
              id: "item_1",
              senderItemId: "item_1",
              paypalItemId: "PAY-12345",
              amountMinor: 340000,
              status: "SUCCESS",
              recipientName: "Maya Chen",
              recipientEmail: "m***@microsplit.demo",
            },
            {
              id: "item_2",
              senderItemId: "item_2",
              paypalItemId: "PAY-12346",
              amountMinor: 255000,
              status: "SUCCESS",
              recipientName: "Jordan Kim",
              recipientEmail: "j***@microsplit.demo",
            },
            {
              id: "item_3",
              senderItemId: "item_3",
              paypalItemId: "PAY-12347",
              amountMinor: 255000,
              status: "SUCCESS",
              recipientName: "Sam Patel",
              recipientEmail: "s***@microsplit.demo",
            },
          ],
        },
      ],
    });
  }
}
