import { NextRequest, NextResponse } from "next/server";
import {
  requireAuthenticatedActor,
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

export async function GET(request: NextRequest) {
  const actor = await requireAuthenticatedActor();
  if (!actor.ok) return actor.response;

  const requestedSquadId = request.nextUrl.searchParams.get("squadId");
  if (
    requestedSquadId !== null &&
    (!requestedSquadId.trim() || requestedSquadId.length > 128)
  ) {
    return NextResponse.json(
      { success: false, error: "squadId must be a valid identifier" },
      { status: 400 }
    );
  }

  if (requestedSquadId !== null) {
    const access = await requireSquadRole(requestedSquadId);
    if (!access.ok) return access.response;
  }

  try {
    const prisma = getPrisma();
    const memberships = await prisma.membership.findMany({
      where: { userId: actor.value.userId },
      select: { squadId: true },
    });
    const squadIds = memberships.map(({ squadId }) => squadId);
    if (squadIds.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const runs = await prisma.splitRun.findMany({
      where: {
        revenueEvent: {
          squadId: requestedSquadId ?? { in: squadIds },
        },
      },
      include: splitRunInclude,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });
    return NextResponse.json({
      success: true,
      data: runs.map(toSplitRunDTO),
    });
  } catch (error) {
    console.error("Failed to retrieve split runs", error);
    return NextResponse.json(
      { success: false, error: "Unable to retrieve split runs" },
      { status: 500 }
    );
  }
}
