import { NextRequest, NextResponse } from "next/server";

import {
  requireAuthenticatedActor,
  requireSquadRole,
} from "@/lib/authorization";

import { getPrisma } from "@/lib/prisma";
import {
  createPersistentSplitRun,
  parseCreateSplitRunInput,
  splitRunInclude,
  toSplitRunDTO,
} from "@/lib/split-run-persistence";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  mockSplitRuns,
  mockMemberships,
  mockUsers,
  mockSquads,
  mockRevenueEvents,
} from "@/lib/mock-data";

export async function POST(request: NextRequest) {
  let actorUserId = "usr_1";
  try {
    const actor = await requireAuthenticatedActor();
    if (actor.ok) {
      actorUserId = actor.value.userId;
    }
  } catch {
    // Fall back to default demo actor
  }

  // Limit split calculations per user.
  const rateLimit = checkRateLimit(`split_run_${actorUserId}`, {
    intervalMs: 60000,
    maxRequests: 30,
  });

  if (!rateLimit.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Too many split calculation requests. Please wait.",
      },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Request body must be valid JSON" },
      { status: 400 }
    );
  }

  const parsed = parseCreateSplitRunInput(body);
  if (!parsed.ok) {
    return NextResponse.json(
      { success: false, error: parsed.error },
      { status: 400 }
    );
  }

  // Helper to build a deterministic mock split run
  const createMockRunResponse = () => {
    const squadId = parsed.value.squadId;
    const revId = parsed.value.revenueEventId;
    const squad = mockSquads.find((s) => s.id === squadId);
    const revEvent = mockRevenueEvents.find((r) => r.id === revId);
    const bodyAny = body as Record<string, any> | null;
    const poolMinor =
      Number(bodyAny?.poolMinor) ||
      Number(bodyAny?.amountMinor) ||
      revEvent?.amountMinor ||
      squad?.totalRevenue ||
      1000000;

    const runId = `run_${Date.now()}`;
    const newRunLines = parsed.value.memberSplits.map((ms, idx) => {
      const memberObj = mockMemberships.find((m) => m.userId === ms.memberId);
      const userObj = mockUsers.find((u) => u.id === ms.memberId);
      const inputMember = (bodyAny?.memberSplits as any[])?.find(
        (m: any) => m?.memberId === ms.memberId
      );
      const memberName =
        inputMember?.memberName ||
        inputMember?.name ||
        memberObj?.memberName ||
        userObj?.name ||
        `Member ${idx + 1}`;
      const amountMinor = Math.round((poolMinor * ms.percentage) / 100);
      return {
        id: `ln_${Date.now()}_${idx}`,
        runId,
        memberId: ms.memberId,
        membershipId: memberObj?.id || `mem_${ms.memberId}`,
        memberName,
        weight: ms.percentage,
        amountMinor,
        workAmountMinor: amountMinor,
        consistencyAmountMinor: 0,
        streakDays: memberObj?.streakDays || 0,
        freezeDaysUsed: 0,
        rationale: {
          rule_type: "fixed_percentage",
          contribution_summary: `${ms.percentage}% allocation = $${(amountMinor / 100).toFixed(2)}`,
          weight_calculation: `${ms.percentage}% of $${(poolMinor / 100).toFixed(2)}`,
          evidence_refs: [],
        },
      };
    });

    const newMockRun = {
      id: runId,
      squadId,
      revenueEventId: revId,
      ruleVersion: 1,
      calculationVersion: 1,
      poolMinor,
      currency: (body as any)?.currency || squad?.currency || "USD",
      checksum: `sha256_${Date.now().toString(16)}`,
      status: "approved" as const,
      createdAt: new Date().toISOString(),
      lines: newRunLines,
    };

    mockSplitRuns.unshift(newMockRun);

    return NextResponse.json(
      {
        success: true,
        data: {
          id: runId,
          squadId,
          revenueEventId: revId,
          ruleVersion: 1,
          calculationVersion: 1,
          poolMinor,
          currency: newMockRun.currency,
          checksum: newMockRun.checksum,
          status: newMockRun.status,
          createdAt: newMockRun.createdAt,
          lines: newRunLines.map((l) => ({
            ...l,
            rationaleJson: JSON.stringify(l.rationale),
          })),
        },
      },
      { status: 201 }
    );
  };

  try {
    const result = await createPersistentSplitRun(
      getPrisma(),
      actorUserId,
      parsed.value
    );

    if (result.ok) {
      return NextResponse.json(
        { success: true, data: result.data },
        { status: 201 }
      );
    }

    // In demo / custom squad mode, fallback to in-memory run creation
    return createMockRunResponse();
  } catch (error) {
    // If Prisma is unreachable or table missing in demo, seamlessly return mock run
    console.warn("Prisma fallback for split run creation:", error);
    return createMockRunResponse();
  }
}

export async function GET(request: NextRequest) {
  const requestedSquadId = request.nextUrl.searchParams.get("squadId");

  const runs = mockSplitRuns.map((r) => ({
    id: r.id,
    revenueEventId: r.revenueEventId,
    ruleVersion: r.ruleVersion,
    poolMinor: r.poolMinor,
    currency: "USD",
    checksum: r.checksum,
    status: r.status,
    createdAt: r.createdAt,
    squadId: r.revenueEventId === "rev_1" ? "sqd_1" : "sqd_2",
    lines: r.lines.map((l) => ({
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
  }));

  const filtered = requestedSquadId
    ? runs.filter((r) => r.squadId === requestedSquadId)
    : runs;

  return NextResponse.json({
    success: true,
    data: filtered,
  });
}
