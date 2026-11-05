import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedActor, requireSquadRole } from "@/lib/authorization";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  EvidenceStorageError,
  getEvidenceStorage,
} from "@/lib/evidence-storage";
import {
  EvidenceWorkflowError,
  prepareEvidenceUpload,
  validateEvidenceUploadMetadata,
  type EvidenceUploadRecord,
} from "@/lib/evidence-workflow";
import { getPrisma } from "@/lib/prisma";
import { mockEvidence } from "@/lib/mock-data";

const uploadRoles = ["owner", "approver", "contributor"] as const;

export async function POST(request: NextRequest) {
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "anonymous";
  const rateLimit = checkRateLimit(`evidence_upload_${clientIp}`, {
    intervalMs: 60000,
    maxRequests: 30,
  });
  if (!rateLimit.success) {
    return NextResponse.json(
      { success: false, error: "Too many requests. Please slow down." },
      { status: 429 }
    );
  }

  const actor = await requireAuthenticatedActor();
  if (!actor.ok) return actor.response;

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

  const idempotencyKey = request.headers.get("Idempotency-Key");
  let metadata: ReturnType<typeof validateEvidenceUploadMetadata>;
  try {
    metadata = validateEvidenceUploadMetadata({
      squadId: typeof body.squadId === "string" ? body.squadId : undefined,
      idempotencyKey: idempotencyKey ?? undefined,
      fileName: typeof body.fileName === "string" ? body.fileName : undefined,
      mimeType: typeof body.mimeType === "string" ? body.mimeType : undefined,
      sizeBytes: typeof body.sizeBytes === "number" ? body.sizeBytes : undefined,
    });
  } catch (error) {
    if (error instanceof EvidenceWorkflowError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }
    throw error;
  }

  const access = await requireSquadRole(metadata.squadId, uploadRoles);
  if (!access.ok) return access.response;

  try {
    const prisma = getPrisma();
    const storage = getEvidenceStorage();
    const repository = {
      findByIdempotencyKey: (squadId: string, uploaderId: string, key: string) =>
        prisma.evidence.findFirst({
          where: { squadId, uploaderId, idempotencyKey: key },
        }),
      create: (input: {
        squadId: string;
        uploaderId: string;
        idempotencyKey: string;
        fileName: string;
        mimeType: string;
        sizeBytes: number;
        kind: string;
        storageKey: string;
      }) =>
        prisma.evidence.create({
          data: {
            ...input,
            fileUrl: null,
            sha256: null,
            status: "uploading",
          },
        }),
      deleteUploading: async (id: string) => {
        await prisma.evidence.deleteMany({ where: { id, status: "uploading" } });
      },
    };
    const prepared = await prepareEvidenceUpload<EvidenceUploadRecord>(
      {
        ...metadata,
        uploaderId: actor.value.userId,
      },
      `${metadata.squadId}/${randomUUID()}`,
      repository,
      storage
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          id: prepared.record.id,
          status: prepared.record.status,
          completed: prepared.reused && prepared.record.status === "pending_review",
          signedUrl: prepared.signedUrl || undefined,
        },
      },
      { status: prepared.reused ? 200 : 201 }
    );
  } catch (error) {
    if (error instanceof EvidenceWorkflowError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }
    console.error("Unable to prepare evidence upload", error);
    return NextResponse.json(
      { success: false, error: "Unable to prepare evidence upload" },
      { status: error instanceof EvidenceStorageError ? 502 : 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const actor = await requireAuthenticatedActor();
  if (!actor.ok) return actor.response;

  const requestedSquadId = request.nextUrl.searchParams.get("squadId");
  const filtered = requestedSquadId
    ? mockEvidence.filter((e) => e.squadId === requestedSquadId)
    : mockEvidence;

  return NextResponse.json({
    success: true,
    data: filtered.map((e) => ({
      ...e,
      uploader: { name: "Alex Rivera" },
      reviewedBy: { name: "Alex Rivera" },
      aiLogs: [],
    })),
  });
}
