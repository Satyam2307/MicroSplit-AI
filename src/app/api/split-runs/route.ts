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

export async function POST(request: NextRequest) {
  const actor = await requireAuthenticatedActor();
  if (!actor.ok) return actor.response;

  // Limit split calculations per authenticated user.
  const rateLimit = checkRateLimit(`split_run_${actor.value.userId}`, {
    intervalMs: 60000,
    maxRequests: 20,
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

  try {
    const result = await createPersistentSplitRun(
      getPrisma(),
      actor.value.userId,
      parsed.value
    );

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json(
      { success: true, data: result.data },
      { status: 201 }
    );
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2034"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Another split calculation changed this revenue event. Please retry.",
        },
        { status: 409 }
      );
    }

    console.error("Failed to persist split run", error);
    return NextResponse.json(
      { success: false, error: "Unable to create split run" },
      { status: 500 }
    );
  }
}

import { mockSplitRuns, mockMemberships, mockUsers } from "@/lib/mock-data";

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
