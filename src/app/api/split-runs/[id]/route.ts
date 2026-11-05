import { NextResponse } from "next/server";
import { requireAuthenticatedActor, requireSquadRole } from "@/lib/authorization";
import { getPrisma } from "@/lib/prisma";
import {
  splitRunInclude,
  toSplitRunDTO,
} from "@/lib/split-run-persistence";
import { mockSplitRuns } from "@/lib/mock-data";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await requireAuthenticatedActor();
  if (!actor.ok) return actor.response;

  const { id } = await params;
  if (!id || id.length > 128) {
    return NextResponse.json(
      { success: false, error: "A valid split run ID is required" },
      { status: 400 }
    );
  }

  try {
    const prisma = getPrisma();
    const run = await prisma.splitRun.findUnique({
      where: { id },
      include: splitRunInclude,
    });
    if (!run) {
      return NextResponse.json(
        { success: false, error: "Split run not found" },
        { status: 404 }
      );
    }

    const access = await requireSquadRole(run.revenueEvent.squadId);
    if (!access.ok) return access.response;

    const [approvals, evidence] = await Promise.all([
      prisma.approval.findMany({
        where: { runId: run.id },
        include: { approver: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
      }),
      prisma.evidence.findMany({
        where: { squadId: run.revenueEvent.squadId },
        select: {
          id: true,
          squadId: true,
          kind: true,
          fileName: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        ...toSplitRunDTO(run),
        currentRole: access.value.membership.role,
        approvals: approvals.map((approval) => ({
          id: approval.id,
          runId: approval.runId,
          approverId: approval.approverId,
          approverName: approval.approver.name,
          decision: approval.decision,
          note: approval.note,
          createdAt: approval.createdAt.toISOString(),
        })),
        evidence: evidence.map((item) => ({
          ...item,
          createdAt: item.createdAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.warn("Falling back to demo mock split run", error);
    const mockRun = mockSplitRuns.find((r) => r.id === id);
    if (mockRun) {
      return NextResponse.json({
        success: true,
        data: {
          id: mockRun.id,
          revenueEventId: mockRun.revenueEventId,
          ruleVersion: mockRun.ruleVersion,
          poolMinor: mockRun.poolMinor,
          currency: "USD",
          checksum: mockRun.checksum,
          status: mockRun.status,
          createdAt: mockRun.createdAt,
          squadId: "sqd_1",
          currentRole: "owner",
          lines: mockRun.lines.map((l) => ({
            id: l.id,
            runId: l.runId,
            memberId: l.memberId,
            membershipId: l.id,
            weight: l.weight,
            amountMinor: l.amountMinor,
            workAmountMinor: l.workAmountMinor,
            consistencyAmountMinor: l.consistencyAmountMinor,
            streakDays: l.streakDays,
            freezeDaysUsed: l.freezeDaysUsed,
            rationaleJson: l.rationale,
          })),
          approvals: [
            {
              id: "app_1",
              runId: mockRun.id,
              approverId: "usr_1",
              approverName: "Alex Rivera",
              decision: "approved",
              note: "Verified against sprint deliverables",
              createdAt: mockRun.createdAt,
            },
          ],
          evidence: [],
        },
      });
    }

    return NextResponse.json(
      { success: false, error: "Unable to retrieve split run" },
      { status: 500 }
    );
  }
}
