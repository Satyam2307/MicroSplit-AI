import { NextResponse } from "next/server";
import { requireAuthenticatedActor, requireSquadRole } from "@/lib/authorization";
import { getEvidenceStorage } from "@/lib/evidence-storage";
import {
  EvidenceWorkflowError,
  verifyAndPersistEvidenceUpload,
} from "@/lib/evidence-workflow";
import { getPrisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await requireAuthenticatedActor();
  if (!actor.ok) return actor.response;

  const { id } = await params;
  const prisma = getPrisma();
  const evidence = await prisma.evidence.findUnique({ where: { id } });
  if (!evidence) {
    return NextResponse.json(
      { success: false, error: "Evidence not found" },
      { status: 404 }
    );
  }

  const access = await requireSquadRole(evidence.squadId, [
    "owner",
    "approver",
    "contributor",
  ]);
  if (!access.ok) return access.response;
  if (evidence.uploaderId !== actor.value.userId) {
    return NextResponse.json(
      { success: false, error: "Only the uploader can complete this upload" },
      { status: 403 }
    );
  }
  if (evidence.status === "pending_review") {
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
          createdAt: true,
        },
      }),
    });
  }
  const storageKey = evidence.storageKey;
  if (
    evidence.status !== "uploading" ||
    !storageKey ||
    !evidence.fileName ||
    !evidence.mimeType ||
    evidence.sizeBytes === null
  ) {
    return NextResponse.json(
      { success: false, error: "Evidence is not awaiting upload completion" },
      { status: 409 }
    );
  }

  try {
    const storage = getEvidenceStorage();
    const completed = await verifyAndPersistEvidenceUpload(
      {
        fileName: evidence.fileName,
        mimeType: evidence.mimeType,
        expectedSizeBytes: evidence.sizeBytes,
      },
      {
        download: () => storage.download(storageKey),
        remove: () => storage.remove(storageKey),
      },
      async (sha256) => {
        const updated = await prisma.evidence.updateMany({
          where: { id, status: "uploading" },
          data: { status: "pending_review", sha256 },
        });
        if (updated.count === 0) {
          const current = await prisma.evidence.findUnique({ where: { id } });
          if (current?.status === "pending_review") return current;
          throw new EvidenceWorkflowError(
            "Evidence changed before upload completion",
            409
          );
        }
        return prisma.evidence.findUniqueOrThrow({
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
            createdAt: true,
          },
        });
      }
    );
    return NextResponse.json({ success: true, data: completed });
  } catch (error) {
    if (error instanceof EvidenceWorkflowError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }
    console.error("Unable to complete evidence upload", error);
    return NextResponse.json(
      { success: false, error: "Unable to verify or persist uploaded evidence" },
      { status: 500 }
    );
  }
}
