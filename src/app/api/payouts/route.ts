import { NextResponse } from "next/server";

export async function GET() {
  // Demo mode: Instant response with realistic payout batch history
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
      {
        id: "batch_demo_2",
        runId: "run_2",
        squadId: "sqd_2",
        squadName: "OSS Contributors Fund",
        currency: "USD",
        status: "SUCCESS",
        totalMinor: 1200000,
        createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
        items: [
          {
            id: "item_4",
            senderItemId: "item_4",
            paypalItemId: "PAY-22341",
            amountMinor: 480000,
            status: "SUCCESS",
            recipientName: "Maya Chen",
            recipientEmail: "m***@microsplit.demo",
          },
          {
            id: "item_5",
            senderItemId: "item_5",
            paypalItemId: "PAY-22342",
            amountMinor: 360000,
            status: "SUCCESS",
            recipientName: "Casey Brooks",
            recipientEmail: "c***@microsplit.demo",
          },
          {
            id: "item_6",
            senderItemId: "item_6",
            paypalItemId: "PAY-22343",
            amountMinor: 360000,
            status: "SUCCESS",
            recipientName: "Jordan Kim",
            recipientEmail: "j***@microsplit.demo",
          },
        ],
      },
    ],
  });
}
