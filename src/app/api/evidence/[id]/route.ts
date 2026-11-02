import { NextResponse } from "next/server";
import { requireAuthenticatedActor, requireSquadRole } from "@/lib/authorization";
import { getEvidenceStorage } from "@/lib/evidence-storage";
import { canTransitionEvidenceStatus } from "@/lib/evidence-workflow";
import { getPrisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await requireAuthenticatedActor();
  if (!actor.ok) return actor.response;

  const { id } = await params;
  const evidence = await getPrisma().evidence.findUnique({ where: { id } });
  if (!evidence) {
    return NextResponse.json(
      { success: false, error: "Evidence not found" },
      { status: 404 }
    );
  }

  const access = await requireSquadRole(evidence.squadId);
  if (!access.ok) return access.response;

  return NextResponse.json(
    { success: false, error: "Evidence extraction is not available yet" },
    { status: 501 }
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await requireAuthenticatedActor();
  if (!actor.ok) return actor.response;

  const { id } = await params;
  const evidence = await getPrisma().evidence.findUnique({
    where: { id },
    select: {
      id: true,
      squadId: true,
      uploaderId: true,
      kind: true,
      fileName: true,
      sha256: true,
      mimeType: true,
      sizeBytes: true,
      status: true,
      reviewedById: true,
      reviewedAt: true,
      createdAt: true,
      uploader: { select: { name: true } },
      reviewedBy: { select: { name: true } },
    },
  });
  if (!evidence) {
    return NextResponse.json(
      { success: false, error: "Evidence not found" },
      { status: 404 }
    );
  }

  const access = await requireSquadRole(evidence.squadId);
  if (!access.ok) return access.response;
  return NextResponse.json({ success: true, data: evidence });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await requireAuthenticatedActor();
  if (!actor.ok) return actor.response;

  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Request body must be valid JSON" },
      { status: 400 }
    );
  }
  const nextStatus = body.status;
  if (nextStatus !== "confirmed" && nextStatus !== "rejected") {
    return NextResponse.json(
      { success: false, error: "status must be confirmed or rejected" },
      { status: 400 }
    );
  }

  const prisma = getPrisma();
  const evidence = await prisma.evidence.findUnique({ where: { id } });
  if (!evidence) {
    return NextResponse.json(
      { success: false, error: "Evidence not found" },
      { status: 404 }
    );
  }
  const access = await requireSquadRole(evidence.squadId, ["owner", "approver"]);
  if (!access.ok) return access.response;
  if (!canTransitionEvidenceStatus(evidence.status, nextStatus)) {
    return NextResponse.json(
      { success: false, error: "Evidence is not awaiting review" },
      { status: 409 }
    );
  }

  const updated = await prisma.evidence.updateMany({
    where: { id, status: "pending_review" },
    data: {
      status: nextStatus,
      reviewedById: actor.value.userId,
      reviewedAt: new Date(),
    },
  });
  if (updated.count !== 1) {
    return NextResponse.json(
      { success: false, error: "Evidence changed before review completed" },
      { status: 409 }
    );
  }

  return NextResponse.json({
    success: true,
    data: await prisma.evidence.findUniqueOrThrow({
      where: { id },
      select: {
        id: true,
        squadId: true,
        uploaderId: true,
        kind: true,
        fileName: true,
        sha256: true,
        mimeType: true,
        sizeBytes: true,
        status: true,
        reviewedById: true,
        reviewedAt: true,
        createdAt: true,
        reviewedBy: { select: { name: true } },
      },
    }),
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await requireAuthenticatedActor();
  if (!actor.ok) return actor.response;

  const { id } = await params;
  const prisma = getPrisma();
  const evidence = await prisma.evidence.findUnique({
    where: { id },
    include: { _count: { select: { contributions: true, aiLogs: true, focusSessions: true } } },
  });
  if (!evidence) {
    return NextResponse.json(
      { success: false, error: "Evidence not found" },
      { status: 404 }
    );
  }
  const access = await requireSquadRole(evidence.squadId);
  if (!access.ok) return access.response;
  if (
    evidence.uploaderId !== actor.value.userId &&
    access.value.membership.role !== "owner"
  ) {
    return NextResponse.json(
      { success: false, error: "Only the uploader or squad owner can delete evidence" },
      { status: 403 }
    );
  }
  if (
    evidence._count.contributions > 0 ||
    evidence._count.aiLogs > 0 ||
    evidence._count.focusSessions > 0
  ) {
    return NextResponse.json(
      { success: false, error: "Evidence linked to review or focus-session records cannot be deleted" },
      { status: 409 }
    );
  }
  if (
    evidence.status !== "deletion_pending" &&
    !canTransitionEvidenceStatus(evidence.status, "deletion_pending")
  ) {
    return NextResponse.json(
      { success: false, error: "Evidence cannot be deleted in its current state" },
      { status: 409 }
    );
  }

  const originalStatus = evidence.status;
  if (originalStatus !== "deletion_pending") {
    const marked = await prisma.evidence.updateMany({
      where: { id, status: originalStatus },
      data: { status: "deletion_pending" },
    });
    if (marked.count !== 1) {
      return NextResponse.json(
        { success: false, error: "Evidence changed before deletion" },
        { status: 409 }
      );
    }
  }

  try {
    if (evidence.storageKey) {
      await getEvidenceStorage().remove(evidence.storageKey);
    }
  } catch (error) {
    console.error("Unable to remove evidence from storage", error);
    if (originalStatus !== "deletion_pending") {
      await prisma.evidence.updateMany({
        where: { id, status: "deletion_pending" },
        data: { status: originalStatus },
      });
    }
    return NextResponse.json(
      { success: false, error: "Unable to remove evidence file from storage" },
      { status: 502 }
    );
  }

  try {
    await prisma.evidence.delete({ where: { id } });
  } catch (error) {
    console.error("Evidence file was removed but its metadata could not be deleted", error);
    return NextResponse.json(
      { success: false, error: "File removed; metadata cleanup is pending. Retry deletion." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
