import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requireSquadRole } from "@/lib/authorization";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  getSplitRunStatusForDecision,
  parseSplitApprovalInput,
} from "@/lib/payout-safety";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "anonymous";
  const rateLimit = checkRateLimit(`split_approval_${clientIp}`, {
    intervalMs: 60000,
    maxRequests: 30,
  });
  if (!rateLimit.success) {
    return NextResponse.json(
      { success: false, error: "Too many requests. Please slow down." },
      { status: 429 }
    );
  }

  const { id } = await params;
  if (!id || id.length > 128) {
    return NextResponse.json(
      { success: false, error: "A valid split run ID is required" },
      { status: 400 }
    );
  }

  const prisma = getPrisma();
  const run = await prisma.splitRun.findUnique({
    where: { id },
    select: { id: true, status: true, revenueEvent: { select: { squadId: true } } },
  });
  if (!run) {
    return NextResponse.json(
      { success: false, error: "Split run not found" },
      { status: 404 }
    );
  }

  const access = await requireSquadRole(run.revenueEvent.squadId, [
    "owner",
    "approver",
  ]);
  if (!access.ok) return access.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Request body must be valid JSON" },
      { status: 400 }
    );
  }

  const parsed = parseSplitApprovalInput(body);
  if (!parsed) {
    return NextResponse.json(
      {
        success: false,
        error:
          "decision must be approved, disputed, or adjusted; note must be a string of at most 2000 characters",
      },
      { status: 400 }
    );
  }

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        const currentRun = await tx.splitRun.findUnique({
          where: { id },
          select: {
            id: true,
            status: true,
            payoutBatches: { select: { id: true }, take: 1 },
          },
        });
        if (!currentRun) return { kind: "not_found" as const };
        if (
          currentRun.status === "paid" ||
          currentRun.payoutBatches.length > 0
        ) {
          return { kind: "payout_started" as const };
        }
        if (
          currentRun.status !== "pending_approval" &&
          currentRun.status !== "disputed" &&
          currentRun.status !== "approved"
        ) {
          return { kind: "invalid_status" as const };
        }

        const status = getSplitRunStatusForDecision(parsed.decision);
        const updated = await tx.splitRun.updateMany({
          where: { id, status: currentRun.status },
          data: { status },
        });
        if (updated.count !== 1) return { kind: "concurrent_change" as const };

        const approval = await tx.approval.create({
          data: {
            runId: id,
            approverId: access.value.userId,
            decision: parsed.decision,
            note: parsed.note,
          },
          include: { approver: { select: { name: true } } },
        });

        return {
          kind: "ok" as const,
          approval: {
            id: approval.id,
            runId: approval.runId,
            approverId: approval.approverId,
            approverName: approval.approver.name,
            decision: approval.decision,
            note: approval.note,
            createdAt: approval.createdAt.toISOString(),
          },
          runStatus: status,
        };
      },
      { isolationLevel: "Serializable" }
    );

    if (result.kind === "not_found") {
      return NextResponse.json(
        { success: false, error: "Split run not found" },
        { status: 404 }
      );
    }
    if (result.kind === "payout_started") {
      return NextResponse.json(
        { success: false, error: "A split run with a payout claim cannot be changed" },
        { status: 409 }
      );
    }
    if (result.kind === "invalid_status") {
      return NextResponse.json(
        { success: false, error: "Split run is not awaiting a review decision" },
        { status: 409 }
      );
    }
    if (result.kind === "concurrent_change") {
      return NextResponse.json(
        { success: false, error: "Split run changed during review; reload and retry" },
        { status: 409 }
      );
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2034"
    ) {
      return NextResponse.json(
        { success: false, error: "Split run changed during review; reload and retry" },
        { status: 409 }
      );
    }
    console.error("Failed to persist split-run approval", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json(
      { success: false, error: "Unable to save approval decision" },
      { status: 500 }
    );
  }
}
