import { NextResponse } from "next/server";
import {
  CONTRIBUTION_TYPES,
  GeminiExtractionError,
  normalizeContributionDate,
} from "@/lib/evidence-extraction";
import { requireAuthenticatedActor, requireSquadRole } from "@/lib/authorization";
import { canReviewExtractedContribution } from "@/lib/authorization-policy";
import { DATE_INTERPRETATION_WARNING_PREFIX } from "@/lib/evidence-extraction-display";
import { getPrisma } from "@/lib/prisma";

function isValidDate(value: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    normalizeContributionDate(value).date === value
  );
}

function removeDateInterpretationWarning(flagsJson: string | null): string | null {
  if (!flagsJson) return flagsJson;
  try {
    const parsed: unknown = JSON.parse(flagsJson);
    if (!Array.isArray(parsed)) return flagsJson;
    return JSON.stringify(
      parsed.filter(
        (value) =>
          typeof value !== "string" ||
          !value.startsWith(DATE_INTERPRETATION_WARNING_PREFIX)
      )
    );
  } catch {
    return flagsJson;
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await requireAuthenticatedActor();
  if (!actor.ok) return actor.response;

  const { id } = await params;
  let parsedBody: unknown;
  try {
    parsedBody = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Request body must be valid JSON" },
      { status: 400 }
    );
  }
  if (
    !parsedBody ||
    typeof parsedBody !== "object" ||
    Array.isArray(parsedBody)
  ) {
    return NextResponse.json(
      { success: false, error: "Request body must be a JSON object" },
      { status: 400 }
    );
  }

  const body = parsedBody as Record<string, unknown>;
  if (
    body.status !== "pending" &&
    body.status !== "confirmed" &&
    body.status !== "rejected"
  ) {
    return NextResponse.json(
      { success: false, error: "status must be pending, confirmed, or rejected" },
      { status: 400 }
    );
  }
  if (
    Object.keys(body).some(
      (key) =>
        ![
          "status",
          "memberId",
          "description",
          "contributionType",
          "sourceReference",
          "contributionDate",
        ].includes(key)
    )
  ) {
    return NextResponse.json(
      { success: false, error: "Request contains unsupported fields" },
      { status: 400 }
    );
  }
  if (
    body.description !== undefined &&
    (typeof body.description !== "string" ||
      !body.description.trim() ||
      body.description.length > 4000)
  ) {
    return NextResponse.json(
      { success: false, error: "description must be 1–4000 characters" },
      { status: 400 }
    );
  }
  if (
    body.contributionType !== undefined &&
    (typeof body.contributionType !== "string" ||
      !CONTRIBUTION_TYPES.includes(
        body.contributionType as (typeof CONTRIBUTION_TYPES)[number]
      ))
  ) {
    return NextResponse.json(
      { success: false, error: "contributionType is not supported" },
      { status: 400 }
    );
  }
  if (
    body.sourceReference !== undefined &&
    (typeof body.sourceReference !== "string" ||
      !body.sourceReference.trim() ||
      body.sourceReference.length > 1000)
  ) {
    return NextResponse.json(
      { success: false, error: "sourceReference must be 1–1000 characters" },
      { status: 400 }
    );
  }
  if (
    body.contributionDate !== undefined &&
    body.contributionDate !== null &&
    (typeof body.contributionDate !== "string" ||
      !isValidDate(body.contributionDate))
  ) {
    return NextResponse.json(
      { success: false, error: "contributionDate must be a valid YYYY-MM-DD date or null" },
      { status: 400 }
    );
  }
  if (
    body.memberId !== undefined &&
    body.memberId !== null &&
    (typeof body.memberId !== "string" || body.memberId.length > 128)
  ) {
    return NextResponse.json(
      { success: false, error: "memberId must be a valid squad member or null" },
      { status: 400 }
    );
  }

  const prisma = getPrisma();
  const contribution = await prisma.contribution.findUnique({
    where: { id },
    include: {
      evidence: {
        select: {
          id: true,
          squadId: true,
          uploaderId: true,
        },
      },
    },
  });
  if (!contribution) {
    return NextResponse.json(
      { success: false, error: "Contribution not found" },
      { status: 404 }
    );
  }

  const access = await requireSquadRole(contribution.evidence.squadId, [
    "owner",
    "approver",
  ]);
  if (!access.ok) return access.response;
  if (
    !canReviewExtractedContribution({
      role: access.value.membership.role,
      actorId: actor.value.userId,
      uploaderId: contribution.evidence.uploaderId,
      assignedMemberId: contribution.memberId,
      status: contribution.status,
    })
  ) {
    return NextResponse.json(
      {
        success: false,
        error:
          contribution.status === "pending"
            ? "You cannot review your own evidence or contribution"
            : "Only pending extracted contributions can be reviewed",
      },
      { status: contribution.status === "pending" ? 403 : 409 }
    );
  }

  const memberId =
    body.memberId === undefined ? contribution.memberId : body.memberId;
  if (memberId === actor.value.userId) {
    return NextResponse.json(
      { success: false, error: "You cannot assign or approve your own contribution" },
      { status: 403 }
    );
  }
  if (body.status === "confirmed" && typeof memberId !== "string") {
    return NextResponse.json(
      { success: false, error: "Resolve this contribution to a squad member before confirming" },
      { status: 400 }
    );
  }
  if (typeof memberId === "string") {
    const membership = await prisma.membership.findUnique({
      where: {
        squadId_userId: {
          squadId: contribution.evidence.squadId,
          userId: memberId,
        },
      },
      select: { userId: true },
    });
    if (!membership) {
      return NextResponse.json(
        { success: false, error: "Assigned user is not a member of this squad" },
        { status: 400 }
      );
    }
  }

  const reviewedAt = new Date();
  const updateData = {
    ...(body.status === "pending"
      ? {}
      : {
          status: body.status,
          reviewedById: actor.value.userId,
          reviewedAt,
        }),
    memberId: typeof memberId === "string" ? memberId : null,
    identityMatchStatus: typeof memberId === "string" ? "matched" : "unresolved",
    activity:
      typeof body.contributionType === "string"
        ? body.contributionType
        : contribution.activity,
    contributionType:
      typeof body.contributionType === "string"
        ? body.contributionType
        : contribution.contributionType,
    description:
      typeof body.description === "string"
        ? body.description.trim()
        : contribution.description,
    sourceReference:
      typeof body.sourceReference === "string"
        ? body.sourceReference.trim()
        : contribution.sourceReference,
    contributionDate:
      body.contributionDate === undefined
        ? contribution.contributionDate
        : typeof body.contributionDate === "string"
          ? new Date(`${body.contributionDate}T00:00:00.000Z`)
          : null,
    ...(typeof body.contributionDate === "string"
      ? {
          flagsJson: removeDateInterpretationWarning(contribution.flagsJson),
        }
      : {}),
  };

  try {
    const updated = await prisma.$transaction(async (transaction) => {
      const extractionLog = contribution.extractionLogId
        ? await transaction.aILog.findUnique({
            where: { id: contribution.extractionLogId },
            select: { outputJson: true },
          })
        : null;
      const changed = await transaction.contribution.updateMany({
        where: { id, status: "pending" },
        data: updateData,
      });
      if (changed.count !== 1) {
        throw new GeminiExtractionError(
          "lifecycle_conflict",
          "Contribution was already reviewed",
          409
        );
      }

      const record = await transaction.contribution.findUniqueOrThrow({
        where: { id },
        include: {
          member: { select: { id: true, name: true } },
          reviewedBy: { select: { id: true, name: true } },
        },
      });
      await transaction.auditLog.create({
        data: {
          actorId: actor.value.userId,
          action:
            body.status === "pending"
              ? "contribution.corrected"
              : `contribution.${body.status}`,
          entity: "Contribution",
          entityId: id,
          beforeJson: JSON.stringify({
            contribution: {
              id: contribution.id,
              memberId: contribution.memberId,
              memberIdentifier: contribution.memberIdentifier,
              identityMatchStatus: contribution.identityMatchStatus,
              activity: contribution.activity,
              contributionType: contribution.contributionType,
              description: contribution.description,
              sourceReference: contribution.sourceReference,
              contributionDate: contribution.contributionDate,
              confidence: contribution.confidence,
              flagsJson: contribution.flagsJson,
              status: contribution.status,
            },
            originalExtractionOutput: extractionLog?.outputJson ?? null,
          }),
          afterJson: JSON.stringify({
            contribution: {
              id: record.id,
              memberId: record.memberId,
              identityMatchStatus: record.identityMatchStatus,
              activity: record.activity,
              contributionType: record.contributionType,
              description: record.description,
              sourceReference: record.sourceReference,
              contributionDate: record.contributionDate,
              flagsJson: record.flagsJson,
              status: record.status,
            },
            reviewerId: actor.value.userId,
            reviewedAt,
            decision: body.status,
          }),
        },
      });
      return record;
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof GeminiExtractionError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    console.error("Unable to persist contribution review", error);
    return NextResponse.json(
      { success: false, error: "Unable to save contribution review" },
      { status: 500 }
    );
  }
}
