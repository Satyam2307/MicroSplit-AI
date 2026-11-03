import { NextResponse } from "next/server";
import { requireAuthenticatedActor, requireSquadRole } from "@/lib/authorization";
import { getEvidenceStorage } from "@/lib/evidence-storage";
import {
  canStartEvidenceExtraction,
  buildPendingContributionRecords,
  claimEvidenceExtraction,
  executeEvidenceExtraction,
  EXTRACTION_PROMPT_VERSION,
  isExtractionClaimStale,
  EXTRACTABLE_EVIDENCE_STATUSES,
  type EvidenceExtractionOutput,
  GeminiExtractionError,
  getSafeGeminiErrorName,
  getSanitizedGeminiErrorMessage,
  isRetryableGeminiError,
  type ExtractionClaim,
  type ExtractionErrorCategory,
  type GeminiProviderDiagnostics,
  type ProposedContribution,
} from "@/lib/evidence-extraction";
import {
  extractEvidenceWithGemini,
  getGeminiConfiguration,
} from "@/lib/gemini-client";
import {
  canTransitionEvidenceStatus,
  validateEvidenceBytes,
} from "@/lib/evidence-workflow";
import { getPrisma } from "@/lib/prisma";

export const maxDuration = 60;

const extractionRoles = ["owner", "approver", "contributor"] as const;
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestStartedAt = Date.now();
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

  const access = await requireSquadRole(evidence.squadId, extractionRoles);
  if (!access.ok) return access.response;

  let configuration: ReturnType<typeof getGeminiConfiguration>;
  try {
    configuration = getGeminiConfiguration();
  } catch (error) {
    if (error instanceof GeminiExtractionError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }
    console.error("Unable to load Gemini configuration", error);
    return NextResponse.json(
      { success: false, error: "Unable to configure evidence extraction" },
      { status: 503 }
    );
  }

  if (
    !evidence.storageKey ||
    !evidence.fileName ||
    !evidence.mimeType ||
    !evidence.sha256 ||
    (!canStartEvidenceExtraction(evidence.status) &&
      evidence.status !== "extraction_processing")
  ) {
    return NextResponse.json(
      { success: false, error: "Evidence is not eligible for extraction" },
      { status: 409 }
    );
  }
  const storageKey = evidence.storageKey;
  const fileName = evidence.fileName;
  const mimeType = evidence.mimeType;
  const inputHash = evidence.sha256;

  let storage: ReturnType<typeof getEvidenceStorage>;
  try {
    storage = getEvidenceStorage();
  } catch {
    return NextResponse.json(
      { success: false, error: "Private evidence storage is not configured" },
      { status: 503 }
    );
  }
  const members = await prisma.membership.findMany({
    where: { squadId: evidence.squadId },
    select: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          githubUsername: true,
        },
      },
    },
  });

  let attempt: ExtractionClaim;
  try {
    attempt = await claimEvidenceExtraction(
      {
        async claim(input) {
          return prisma.$transaction(async (transaction) => {
            const currentEvidence = await transaction.evidence.findUnique({
              where: { id: input.evidenceId },
              select: { status: true },
            });
            if (currentEvidence?.status === "extraction_processing") {
              const staleAttempt = await transaction.aILog.findFirst({
                where: {
                  evidenceId: input.evidenceId,
                  status: "processing",
                },
                orderBy: { attempt: "desc" },
                select: { id: true, attempt: true, createdAt: true },
              });
              if (!staleAttempt || !isExtractionClaimStale(staleAttempt.createdAt)) {
                return null;
              }

              const completedAt = new Date();
              const markedTimedOut = await transaction.aILog.updateMany({
                where: { id: staleAttempt.id, status: "processing" },
                data: {
                  status: "failed",
                  errorCategory: "timeout",
                  completedAt,
                },
              });
              if (markedTimedOut.count !== 1) return null;

              const markedEvidenceFailed = await transaction.evidence.updateMany({
                where: {
                  id: input.evidenceId,
                  status: "extraction_processing",
                },
                data: { status: "extraction_failed" },
              });
              if (markedEvidenceFailed.count !== 1) {
                throw new GeminiExtractionError(
                  "lifecycle_conflict",
                  "Evidence changed while recovering a stale extraction",
                  409
                );
              }
              await transaction.auditLog.create({
                data: {
                  actorId: input.actorId,
                  action: "evidence.extraction_failed",
                  entity: "Evidence",
                  entityId: input.evidenceId,
                  beforeJson: JSON.stringify({
                    status: "extraction_processing",
                    extractionAttempt: staleAttempt.attempt,
                  }),
                  afterJson: JSON.stringify({
                    status: "extraction_failed",
                    extractionLogId: staleAttempt.id,
                    errorCategory: "timeout",
                    reason: "stale_processing_claim",
                  }),
                },
              });
            }

            const claimed = await transaction.evidence.updateMany({
              where: {
                id: input.evidenceId,
                status: { in: [...EXTRACTABLE_EVIDENCE_STATUSES] },
              },
              data: { status: "extraction_processing" },
            });
            if (claimed.count !== 1) return null;

            const latest = await transaction.aILog.findFirst({
              where: { evidenceId: input.evidenceId },
              orderBy: { attempt: "desc" },
              select: { attempt: true },
            });
            const nextAttempt = (latest?.attempt ?? 0) + 1;
            const log = await transaction.aILog.create({
              data: {
                evidenceId: input.evidenceId,
                attempt: nextAttempt,
                modelName: input.modelName,
                promptVersion: EXTRACTION_PROMPT_VERSION,
                inputHash: input.inputHash,
                status: "processing",
              },
              select: { id: true },
            });
            return {
              id: log.id,
              evidenceId: input.evidenceId,
              attempt: nextAttempt,
              modelName: input.modelName,
              inputHash: input.inputHash,
            } satisfies ExtractionClaim;
          });
        },
      },
      {
        actorId: access.value.userId,
        evidenceId: id,
        modelName: configuration.model,
        inputHash,
      }
    );
  } catch (error) {
    if (error instanceof GeminiExtractionError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }
    console.error("Unable to claim evidence extraction", error);
    return NextResponse.json(
      { success: false, error: "Unable to start evidence extraction" },
      { status: 500 }
    );
  }

  const repository = {
    async complete(
      claim: ExtractionClaim,
      output: EvidenceExtractionOutput,
      proposals: ProposedContribution[],
      rawModelOutput: string
    ) {
      const completedAt = new Date();
      await prisma.$transaction(async (transaction) => {
        const updatedLog = await transaction.aILog.updateMany({
          where: { id: claim.id, status: "processing" },
          data: {
            status: "success",
            outputJson: rawModelOutput,
            completedAt,
          },
        });
        const updatedEvidence = await transaction.evidence.updateMany({
          where: { id: claim.evidenceId, status: "extraction_processing" },
          data: { status: "extraction_completed" },
        });
        if (updatedLog.count !== 1 || updatedEvidence.count !== 1) {
          throw new Error("Extraction state changed before results were persisted");
        }

        if (proposals.length > 0) {
          await transaction.contribution.createMany({
            data: buildPendingContributionRecords(claim.evidenceId, proposals),
          });
        }

        await transaction.auditLog.create({
          data: {
            actorId: access.value.userId,
            action: "evidence.extraction_completed",
            entity: "Evidence",
            entityId: claim.evidenceId,
            beforeJson: JSON.stringify({
              status: evidence.status,
              extractionAttempt: claim.attempt,
            }),
            afterJson: JSON.stringify({
              status: "extraction_completed",
              extractionLogId: claim.id,
              output,
              proposalCount: proposals.length,
            }),
          },
        });
      });
    },
    async fail(
      claim: ExtractionClaim,
      category: ExtractionErrorCategory,
      rawModelOutput?: string
    ) {
      const completedAt = new Date();
      await prisma.$transaction(async (transaction) => {
        const log = await transaction.aILog.updateMany({
          where: { id: claim.id, status: "processing" },
          data: {
            status: "failed",
            errorCategory: category,
            outputJson: rawModelOutput,
            completedAt,
          },
        });
        const failed = await transaction.evidence.updateMany({
          where: { id: claim.evidenceId, status: "extraction_processing" },
          data: { status: "extraction_failed" },
        });
        if (log.count !== 1 || failed.count !== 1) {
          throw new Error("Unable to persist extraction failure state");
        }
        await transaction.auditLog.create({
          data: {
            actorId: access.value.userId,
            action: "evidence.extraction_failed",
            entity: "Evidence",
            entityId: claim.evidenceId,
            beforeJson: JSON.stringify({
              status: "extraction_processing",
              extractionAttempt: claim.attempt,
            }),
            afterJson: JSON.stringify({
              status: "extraction_failed",
              extractionLogId: claim.id,
              errorCategory: category,
            }),
          },
        });
      });
    },
  };

  let evidenceRetrievalMs: number | null = null;
  const geminiDiagnosticsRef: { current: GeminiProviderDiagnostics | null } = {
    current: null,
  };
  let extractionError: unknown;
  try {
    const { output, proposals } = await executeEvidenceExtraction(
      attempt,
      members.map(({ user }) => user),
      repository,
      async () => {
        let bytes: Uint8Array;
        const retrievalStartedAt = Date.now();
        try {
          bytes = await storage.download(storageKey);
        } catch {
          throw new GeminiExtractionError(
            "provider_error",
            "Unable to retrieve evidence from private storage.",
            502
          );
        } finally {
          evidenceRetrievalMs = Date.now() - retrievalStartedAt;
        }
        let fileHash: string;
        try {
          fileHash = validateEvidenceBytes(
            fileName,
            mimeType,
            bytes
          );
        } catch {
          throw new GeminiExtractionError(
            "invalid_file",
            "Stored evidence failed its file integrity checks.",
            422
          );
        }
        if (fileHash !== evidence.sha256) {
          throw new GeminiExtractionError(
            "invalid_file",
            "Stored evidence failed its integrity check.",
            422
          );
        }
        return extractEvidenceWithGemini({
          fileName,
          mimeType,
          bytes,
          apiKey: configuration.apiKey,
          model: configuration.model,
          requestTimeoutMs: configuration.requestTimeoutMs,
          onDiagnostics(diagnostics) {
            geminiDiagnosticsRef.current = diagnostics;
          },
        });
      }
    );
    return NextResponse.json({
      success: true,
      data: {
        extractionLogId: attempt.id,
        attempt: attempt.attempt,
        modelName: attempt.modelName,
        output,
        contributions: proposals.map((proposal) => ({
          ...proposal,
          memberName:
            members.find(({ user }) => user.id === proposal.memberId)?.user.name ??
            null,
          status: "pending",
        })),
      },
    });
  } catch (error) {
    extractionError = error;
    if (error instanceof GeminiExtractionError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          category: error.category,
          retryable:
            error.category === "timeout" ||
            (error.diagnostics !== undefined &&
              isRetryableGeminiError(error.diagnostics)),
        },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { success: false, error: "Unable to extract evidence" },
      { status: 500 }
    );
  } finally {
    const knownError =
      extractionError instanceof GeminiExtractionError ? extractionError : null;
    const geminiDiagnostics = geminiDiagnosticsRef.current;
    console.info("evidence_extraction_diagnostic", {
      modelId: configuration.model,
      attempt: attempt.attempt,
      geminiRequestTimeoutMs: configuration.requestTimeoutMs,
      evidenceRetrievalMs,
      geminiPayloadPreparationMs: geminiDiagnostics?.requestPreparationMs ?? null,
      geminiCallMs: geminiDiagnostics?.durationMs ?? null,
      totalExtractionMs: Date.now() - requestStartedAt,
      retryCount: geminiDiagnostics?.retryCount ?? 0,
      providerHttpStatus: geminiDiagnostics?.providerStatus ?? null,
      providerErrorCode: geminiDiagnostics?.providerCode ?? null,
      providerErrorMessage: geminiDiagnostics?.providerErrorMessage ?? null,
      providerErrorStatus: geminiDiagnostics?.providerErrorStatus ?? null,
      providerErrorDetails: geminiDiagnostics?.providerErrorDetails ?? [],
      errorName:
        geminiDiagnostics?.errorName ??
        getSafeGeminiErrorName(extractionError),
      sanitizedMessage:
        geminiDiagnostics?.sanitizedMessage ??
        (knownError
          ? knownError.message
          : extractionError
            ? getSanitizedGeminiErrorMessage(extractionError)
            : null),
    });
  }
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
      aiLogs: {
        orderBy: { attempt: "desc" },
        select: {
          id: true,
          attempt: true,
          modelName: true,
          promptVersion: true,
          inputHash: true,
          outputJson: true,
          status: true,
          errorCategory: true,
          createdAt: true,
          completedAt: true,
          contributions: {
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              extractionLogId: true,
              memberId: true,
              memberIdentifier: true,
              identityMatchStatus: true,
              activity: true,
              contributionType: true,
              description: true,
              sourceReference: true,
              contributionDate: true,
              confidence: true,
              flagsJson: true,
              status: true,
              reviewedById: true,
              reviewedAt: true,
              member: { select: { id: true, name: true } },
              reviewedBy: { select: { name: true } },
            },
          },
        },
      },
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
    where: { id, status: evidence.status },
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
