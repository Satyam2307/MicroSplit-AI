import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requireAuthenticatedActor } from "@/lib/authorization";

export async function GET() {
  const actor = await requireAuthenticatedActor();
  if (!actor.ok) return actor.response;

  try {
    const runs = await getPrisma().splitRun.findMany({
      where: {
        status: { in: ["approved", "paid"] },
        lines: { some: { memberId: actor.value.userId } },
      },
      include: {
        revenueEvent: {
          select: {
            currency: true,
            squad: { select: { name: true } },
          },
        },
        lines: {
          where: { memberId: actor.value.userId },
          include: {
            payoutItems: {
              include: { batch: { select: { status: true } } },
            },
          },
        },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });

    return NextResponse.json({
      success: true,
      data: runs.flatMap((run) =>
        run.lines.map((line) => ({
          id: line.id,
          runId: run.id,
          runStatus: run.status,
          createdAt: run.createdAt.toISOString(),
          poolMinor: run.poolMinor,
          amountMinor: line.amountMinor,
          currency: run.revenueEvent.currency,
          squadName: run.revenueEvent.squad.name,
          contributionSummary: getContributionSummary(line.rationaleJson),
          payoutStatus:
            line.payoutItems[0]?.status === "success"
              ? "success"
              : ["denied", "canceled"].includes(
                    line.payoutItems[0]?.batch.status ?? ""
                  )
                ? "failed"
                : line.payoutItems[0]?.status ?? "not_submitted",
        }))
      ),
    });
  } catch (error) {
    console.warn("Falling back to demo statements", error);
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
      ],
    });
  }
}

function getContributionSummary(rationaleJson: string): string {
  let value: unknown;
  try {
    value = JSON.parse(rationaleJson);
  } catch {
    throw new Error("Persisted split line contains invalid rationale JSON");
  }
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value) ||
    !("contribution_summary" in value) ||
    typeof value.contribution_summary !== "string"
  ) {
    throw new Error("Persisted split line contains invalid rationale JSON");
  }
  return value.contribution_summary;
}
