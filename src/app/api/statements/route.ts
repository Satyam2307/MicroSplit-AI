import { NextResponse } from "next/server";

export async function GET() {
  // Demo mode: Instant response with realistic member statement records
  return NextResponse.json({
    success: true,
    data: [
      {
        id: "line_demo_1",
        runId: "run_demo_1",
        runStatus: "paid",
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        poolMinor: 100000,
        amountMinor: 237374,
        currency: "USD",
        squadName: "Vortex Design Studio",
        contributionSummary: "Brand Design Lead & Product Review (47 commits, 8 code reviews)",
        payoutStatus: "success",
      },
      {
        id: "line_demo_2",
        runId: "run_demo_2",
        runStatus: "paid",
        createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
        poolMinor: 850000,
        amountMinor: 185000,
        currency: "USD",
        squadName: "DevRelay Agency",
        contributionSummary: "API Integration & Smart Dispatch",
        payoutStatus: "success",
      },
      {
        id: "line_demo_3",
        runId: "run_demo_3",
        runStatus: "approved",
        createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
        poolMinor: 1200000,
        amountMinor: 240000,
        currency: "USD",
        squadName: "OSS Contributors Fund",
        contributionSummary: "Core library optimization & automated test harness",
        payoutStatus: "processing",
      },
    ],
  });
}
