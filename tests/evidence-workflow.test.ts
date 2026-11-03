import assert from "node:assert/strict";
import test from "node:test";
import {
  authorizationFailureStatus,
  hasSquadRole,
} from "../src/lib/authorization-policy.ts";
import {
  canTransitionEvidenceStatus,
  downloadEvidenceFile,
  EvidenceWorkflowError,
  prepareEvidenceUpload,
  validateEvidenceBytes,
  validateEvidenceUploadMetadata,
  verifyAndPersistEvidenceUpload,
  type EvidenceUploadMetadata,
  type EvidenceUploadRecord,
  type EvidenceUploadRepository,
} from "../src/lib/evidence-workflow.ts";
import {
  getContributionDateWarning,
  getExtractionDisplayStatus,
} from "../src/lib/evidence-extraction-display.ts";
import {
  buildPendingContributionRecords,
  canStartEvidenceExtraction,
  claimEvidenceExtraction,
  EXTRACTION_CLAIM_STALE_MS,
  executeEvidenceExtraction,
  EXTRACTION_SYSTEM_INSTRUCTION,
  getGeminiErrorCategory,
  getGeminiRequestMaxAttempts,
  getGeminiProviderCode,
  getGeminiProviderErrorDetails,
  getGeminiProviderErrorMessage,
  getGeminiProviderErrorStatus,
  getGeminiProviderStatus,
  getSanitizedGeminiErrorMessage,
  isRetryableGeminiError,
  isExtractionClaimStale,
  GeminiExtractionError,
  normalizeContributionDate,
  parseEvidenceExtractionOutput,
  resolveGeminiConfiguration,
  resolveEvidenceIdentity,
  retryTransientGeminiRequest,
  runEvidenceExtraction,
  type EvidenceExtractionOutput,
  type ExtractionClaim,
  type ExtractionErrorCategory,
  type ProposedContribution,
} from "../src/lib/evidence-extraction.ts";

const fileBytes = new TextEncoder().encode("hours,member\n4,Avery\n");
const metadata: EvidenceUploadMetadata & { kind: string } = {
  squadId: "squad-a",
  uploaderId: "user-a",
  idempotencyKey: "00000000-0000-4000-8000-000000000001",
  fileName: "hours.csv",
  mimeType: "text/csv",
  sizeBytes: fileBytes.byteLength,
  kind: "csv",
};
const extractedOutput: EvidenceExtractionOutput = {
  summary: "Completed a documented implementation task.",
  document_type: "task_report",
  contributions: [
    {
      member_identifier: "avery",
      contribution_type: "code",
      description: "Implemented the documented feature.",
      evidence_reference: "Task report, section 2.",
      date: "2026-03-05",
      confidence: 0.9,
      uncertainties: [],
    },
    {
      member_identifier: "Avery",
      contribution_type: "testing",
      description: "Ran the documented tests.",
      evidence_reference: "Task report, section 3.",
      date: null,
      confidence: 0.7,
      uncertainties: [
        "Date was not shown.",
        "Date could not be interpreted. Please review and enter the correct contribution date.",
      ],
    },
  ],
  unresolved_items: [],
};
const extractionClaim: ExtractionClaim = {
  id: "ai-log-1",
  evidenceId: "evidence-1",
  attempt: 1,
  modelName: "gemini-3.8-flash",
  inputHash: "sha256",
};

class MemoryEvidenceRepository
  implements EvidenceUploadRepository<EvidenceUploadRecord>
{
  records: EvidenceUploadRecord[] = [];
  deleteCount = 0;
  failCreate = false;

  async findByIdempotencyKey(squadId: string, uploaderId: string, key: string) {
    return (
      this.records.find(
        (record) =>
          record.squadId === squadId &&
          record.uploaderId === uploaderId &&
          record.idempotencyKey === key
      ) ?? null
    );
  }

  async create(
    input: EvidenceUploadMetadata & { kind: string; storageKey: string }
  ) {
    if (this.failCreate) throw new Error("database create failed");
    const record: EvidenceUploadRecord = {
      ...input,
      id: `evidence-${this.records.length + 1}`,
      status: "uploading",
    };
    this.records.push(record);
    return record;
  }

  async deleteUploading(id: string) {
    this.deleteCount += 1;
    this.records = this.records.filter(
      (record) => record.id !== id || record.status !== "uploading"
    );
  }
}

test("validates file extension, MIME type, and size before upload", () => {
  assert.equal(
    validateEvidenceUploadMetadata(metadata).kind,
    "csv"
  );
  assert.throws(
    () =>
      validateEvidenceUploadMetadata({
        ...metadata,
        fileName: "hours.pdf",
      }),
    EvidenceWorkflowError
  );
  assert.throws(
    () =>
      validateEvidenceUploadMetadata({
        ...metadata,
        sizeBytes: 10 * 1024 * 1024 + 1,
      }),
    EvidenceWorkflowError
  );
});

test("denies unauthenticated, non-member, and non-uploader roles", () => {
  assert.equal(authorizationFailureStatus(null), 401);
  assert.equal(authorizationFailureStatus("user-a", undefined), 403);
  assert.equal(hasSquadRole("viewer", ["owner", "approver", "contributor"]), false);
  assert.equal(hasSquadRole("contributor", ["owner", "approver", "contributor"]), true);
});

test("denies cross-squad evidence access because the evidence squad is not a membership", () => {
  const memberships = [{ squadId: "squad-a", role: "contributor" }];
  const requestedEvidenceSquad = "squad-b";
  const matchingMembership = memberships.find(
    (membership) => membership.squadId === requestedEvidenceSquad
  );
  assert.equal(authorizationFailureStatus("user-a", matchingMembership?.role), 403);
});

test("prepares a signed upload, verifies bytes, hashes, and persists pending review", async () => {
  const repository = new MemoryEvidenceRepository();
  let uploadedKey = "";
  const prepared = await prepareEvidenceUpload(
    metadata,
    "squad-a/random-key",
    repository,
    {
      async createSignedUpload(storageKey) {
        uploadedKey = storageKey;
        return { signedUrl: "https://storage.invalid/signed", token: "upload-token" };
      },
    }
  );
  assert.equal(prepared.record.status, "uploading");
  assert.equal(uploadedKey, "squad-a/random-key");

  let persistedHash = "";
  const hash = validateEvidenceBytes("hours.csv", "text/csv", fileBytes);
  const result = await verifyAndPersistEvidenceUpload(
    {
      fileName: "hours.csv",
      mimeType: "text/csv",
      expectedSizeBytes: fileBytes.byteLength,
    },
    {
      async download() {
        return fileBytes;
      },
      async remove() {
        assert.fail("successful verification must not delete the file");
      },
    },
    async (verifiedHash) => {
      persistedHash = verifiedHash;
      return { status: "pending_review", sha256: verifiedHash };
    }
  );
  assert.equal(result.status, "pending_review");
  assert.equal(persistedHash, hash);
});

test("removes a prepared database record when signed storage setup fails", async () => {
  const repository = new MemoryEvidenceRepository();
  await assert.rejects(
    prepareEvidenceUpload(metadata, "squad-a/random-key", repository, {
      async createSignedUpload() {
        throw new Error("storage unavailable");
      },
    }),
    /storage unavailable/
  );
  assert.equal(repository.records.length, 0);
  assert.equal(repository.deleteCount, 1);
});

test("reuses idempotency keys and rejects reuse for different file metadata", async () => {
  const repository = new MemoryEvidenceRepository();
  let signedUrlCount = 0;
  const storage = {
    async createSignedUpload() {
      signedUrlCount += 1;
      return { signedUrl: "signed", token: "token" };
    },
  };
  await prepareEvidenceUpload(metadata, "squad-a/key-1", repository, storage);
  const retry = await prepareEvidenceUpload(metadata, "squad-a/key-2", repository, storage);
  assert.equal(repository.records.length, 1);
  assert.equal(retry.record.storageKey, "squad-a/key-1");
  assert.equal(retry.reused, true);

  await assert.rejects(
    prepareEvidenceUpload(
      { ...metadata, fileName: "different.csv" },
      "squad-a/key-3",
      repository,
      storage
    ),
    (error: unknown) =>
      error instanceof EvidenceWorkflowError && error.statusCode === 409
  );
  assert.equal(signedUrlCount, 2);
});

test("cleans up the uploaded object if byte validation or database persistence fails", async () => {
  let removeCount = 0;
  const storage = {
    async download() {
      return new TextEncoder().encode("not a csv file \u0000");
    },
    async remove() {
      removeCount += 1;
    },
  };
  await assert.rejects(
    verifyAndPersistEvidenceUpload(
      {
        fileName: "hours.csv",
        mimeType: "text/csv",
        expectedSizeBytes: 17,
      },
      storage,
      async () => "unused"
    ),
    EvidenceWorkflowError
  );
  assert.equal(removeCount, 1);

  await assert.rejects(
    verifyAndPersistEvidenceUpload(
      {
        fileName: "hours.csv",
        mimeType: "text/csv",
        expectedSizeBytes: fileBytes.byteLength,
      },
      {
        async download() {
          return fileBytes;
        },
        async remove() {
          removeCount += 1;
        },
      },
      async () => {
        throw new Error("database update failed");
      }
    ),
    /database update failed/
  );
  assert.equal(removeCount, 2);
});

test("cleans up storage when the uploaded object cannot be retrieved", async () => {
  let removeCount = 0;
  await assert.rejects(
    verifyAndPersistEvidenceUpload(
      {
        fileName: "hours.csv",
        mimeType: "text/csv",
        expectedSizeBytes: fileBytes.byteLength,
      },
      {
        async download() {
          throw new Error("storage read failed");
        },
        async remove() {
          removeCount += 1;
        },
      },
      async () => "unused"
    ),
    /storage read failed/
  );
  assert.equal(removeCount, 1);
});

test("validates the strict extraction schema and rejects financial output fields", () => {
  assert.deepEqual(
    parseEvidenceExtractionOutput(JSON.stringify(extractedOutput)),
    extractedOutput
  );
  assert.throws(
    () =>
      parseEvidenceExtractionOutput(
        JSON.stringify({
          ...extractedOutput,
          contributions: [],
        })
      ),
    (error: unknown) =>
      error instanceof GeminiExtractionError &&
      error.category === "invalid_output"
  );
  assert.throws(
    () =>
      parseEvidenceExtractionOutput(
        JSON.stringify({
          ...extractedOutput,
          contributions: [
            { ...extractedOutput.contributions[0], amount_minor: 10 },
          ],
        })
      ),
    (error: unknown) =>
      error instanceof GeminiExtractionError &&
      error.category === "invalid_output"
  );
  const parsedWithImpossibleDate = parseEvidenceExtractionOutput(
    JSON.stringify({
      ...extractedOutput,
      contributions: [
        { ...extractedOutput.contributions[0], date: "2026-02-31" },
      ],
    })
  );
  assert.equal(parsedWithImpossibleDate.contributions.length, 1);
  assert.equal(parsedWithImpossibleDate.contributions[0].date, null);
  assert.match(
    parsedWithImpossibleDate.contributions[0].uncertainties[0],
    /^Date could not be interpreted\./
  );
});

test("normalizes explicit dates without inferring ambiguous or invalid values", () => {
  assert.deepEqual(normalizeContributionDate("October 20, 2026"), {
    date: "2026-10-20",
    warning: null,
  });
  assert.deepEqual(normalizeContributionDate("October 25, 2026"), {
    date: "2026-10-25",
    warning: null,
  });
  assert.deepEqual(normalizeContributionDate("2026-10-20"), {
    date: "2026-10-20",
    warning: null,
  });
  assert.deepEqual(normalizeContributionDate("20 October 2026"), {
    date: "2026-10-20",
    warning: null,
  });
  assert.deepEqual(normalizeContributionDate("10/20/2026"), {
    date: "2026-10-20",
    warning: null,
  });
  assert.deepEqual(normalizeContributionDate("2024-02-29"), {
    date: "2024-02-29",
    warning: null,
  });
  assert.match(
    normalizeContributionDate(null).warning ?? "",
    /^Date could not be interpreted\./
  );
  assert.equal(normalizeContributionDate("2023-02-29").date, null);
  assert.equal(normalizeContributionDate("February 30, 2026").date, null);
  assert.equal(normalizeContributionDate("10/11/2026").date, null);
  assert.equal(normalizeContributionDate("October 20").date, null);
  assert.match(
    normalizeContributionDate("October 20").warning ?? "",
    /Original extracted value: "October 20"/
  );
});

test("retains valid and invalid-date contributions as proposals with pending status", async () => {
  const sourceOutput = {
    ...extractedOutput,
    contributions: [
      { ...extractedOutput.contributions[0], date: "October 20, 2026" },
      {
        ...extractedOutput.contributions[1],
        date: "February 30, 2026",
      },
    ],
  };
  const parsed = parseEvidenceExtractionOutput(JSON.stringify(sourceOutput));
  assert.equal(parsed.contributions.length, 2);
  assert.equal(parsed.contributions[0].date, "2026-10-20");
  assert.equal(parsed.contributions[1].date, null);
  assert.ok(
    parsed.contributions[1].uncertainties.some((warning) =>
      warning.includes("February 30, 2026")
    )
  );

  const { output, proposals, rawModelOutput } = await executeEvidenceExtraction(
    extractionClaim,
    [],
    {
      async complete() {},
      async fail() {
        assert.fail("A valid proposal set must complete despite a date warning");
      },
    },
    async () => ({
      output: parsed,
      rawModelOutput: JSON.stringify(sourceOutput),
    })
  );
  assert.equal(output.contributions.length, 2);
  assert.equal(rawModelOutput, JSON.stringify(sourceOutput));
  const pendingRecords = buildPendingContributionRecords(
    extractionClaim.evidenceId,
    proposals
  );
  assert.equal(pendingRecords.length, 2);
  assert.equal(pendingRecords[0].status, "pending");
  assert.equal(pendingRecords[0].contributionDate?.toISOString(), "2026-10-20T00:00:00.000Z");
  assert.equal(pendingRecords[1].status, "pending");
  assert.equal(pendingRecords[1].contributionDate, null);
  assert.match(pendingRecords[1].flagsJson, /Date could not be interpreted/);
  assert.match(pendingRecords[1].flagsJson, /February 30, 2026/);
});

test("completed extractions with date warnings have distinct display status", () => {
  const warning = normalizeContributionDate("10/11/2026").warning;
  assert.ok(warning);
  const flagsJson = JSON.stringify([warning]);
  assert.equal(
    getContributionDateWarning(flagsJson),
    warning
  );
  assert.equal(
    getExtractionDisplayStatus("extraction_completed", [{ flagsJson }]),
    "Extraction completed with warnings"
  );
  assert.equal(
    getExtractionDisplayStatus("extraction_failed", [{ flagsJson }]),
    "extraction_failed"
  );
});

test("requires a server Gemini key and supports an explicit model override", () => {
  assert.throws(
    () => resolveGeminiConfiguration({}),
    (error: unknown) =>
      error instanceof GeminiExtractionError &&
      error.category === "configuration" &&
      error.statusCode === 503
  );
  assert.deepEqual(
    resolveGeminiConfiguration({
      GEMINI_API_KEY: "test-key-not-a-credential",
      GEMINI_MODEL: "gemini-test-model",
    }),
    {
      apiKey: "test-key-not-a-credential",
      model: "gemini-test-model",
      requestTimeoutMs: 18_000,
    }
  );
  assert.equal(
    resolveGeminiConfiguration({
      GEMINI_API_KEY: "test-key-not-a-credential",
      GEMINI_REQUEST_TIMEOUT_MS: "50000",
    }).requestTimeoutMs,
    50_000
  );
  assert.equal(getGeminiRequestMaxAttempts(18_000), 2);
  assert.equal(getGeminiRequestMaxAttempts(50_000), 1);
  assert.throws(
    () =>
      resolveGeminiConfiguration({
        GEMINI_API_KEY: "test-key-not-a-credential",
        GEMINI_REQUEST_TIMEOUT_MS: "50001",
      }),
    (error: unknown) =>
      error instanceof GeminiExtractionError &&
      error.category === "configuration"
  );
});

test("resolves identities only by a unique exact match within the supplied squad", () => {
  const members = [
    {
      id: "member-1",
      name: "Avery",
      email: "avery@example.test",
      githubUsername: "avery",
    },
    {
      id: "member-2",
      name: "Avery",
      email: "other@example.test",
      githubUsername: "other",
    },
  ];
  assert.equal(resolveEvidenceIdentity("avery@example.test", members).memberId, "member-1");
  assert.equal(resolveEvidenceIdentity("Avery", members).reason, "ambiguous_match");
  assert.equal(resolveEvidenceIdentity("Aver", members).reason, "no_exact_match");
  assert.equal(resolveEvidenceIdentity(null, members).reason, "missing_identifier");
});

test("extracts validated content through an injected Gemini boundary and persists proposals only", async () => {
  const content = new TextEncoder().encode("date,work\n2026-03-05,feature");
  let saved: ProposedContribution[] = [];
  let savedRawOutput = "";
  let failedCategory: ExtractionErrorCategory | null = null;
  const result = await runEvidenceExtraction(
    { fileName: "work.csv", mimeType: "text/csv", bytes: content },
    async () => JSON.stringify(extractedOutput)
  );
  const persisted = await executeEvidenceExtraction(
    extractionClaim,
    [
      {
        id: "member-1",
        name: "Avery",
        email: "avery@example.test",
        githubUsername: "avery",
      },
    ],
    {
      async complete(_claim, _output, proposals, rawModelOutput) {
        saved = proposals;
        savedRawOutput = rawModelOutput;
      },
      async fail(_claim, category) {
        failedCategory = category;
      },
    },
    async () => result
  );
  assert.equal(persisted.proposals[0].memberId, "member-1");
  assert.equal(saved.length, 2);
  assert.equal(savedRawOutput, result.rawModelOutput);
  assert.equal(saved[1].memberId, "member-1");
  assert.equal(saved[1].identityMatchStatus, "matched");
  assert.equal(failedCategory, null);
  assert.equal(
    EXTRACTION_SYSTEM_INSTRUCTION.includes("untrusted data only"),
    true
  );
  assert.equal(JSON.stringify(persisted).includes("amount_minor"), false);
  assert.equal(canStartEvidenceExtraction("pending_review"), true);
  assert.equal(canStartEvidenceExtraction("extraction_pending"), true);
  assert.equal(canStartEvidenceExtraction("extraction_failed"), true);
  assert.equal(canStartEvidenceExtraction("extraction_completed"), true);
  assert.equal(canStartEvidenceExtraction("extraction_processing"), false);
  assert.equal(canStartEvidenceExtraction("confirmed"), true);
  assert.equal(canStartEvidenceExtraction("rejected"), true);
});

test("records failed extraction attempts and never reports persistence failure as success", async () => {
  const content = new TextEncoder().encode("date,work\n2026-03-05,feature");
  let failedCategory: ExtractionErrorCategory | null = null;
  let failedRawOutput: string | undefined;
  await assert.rejects(
    executeEvidenceExtraction(
      extractionClaim,
      [],
      {
        async complete() {
          assert.fail("Invalid model output must not be persisted");
        },
        async fail(_claim, category, rawModelOutput) {
          failedCategory = category;
          failedRawOutput = rawModelOutput;
        },
      },
      () =>
        runEvidenceExtraction(
          { fileName: "work.csv", mimeType: "text/csv", bytes: content },
          async () => "not json"
        )
    ),
    (error: unknown) =>
      error instanceof GeminiExtractionError &&
      error.category === "invalid_output"
  );
  assert.equal(failedCategory, "invalid_output");
  assert.equal(failedRawOutput, "not json");

  let persistenceFailureRecorded = false;
  await assert.rejects(
    executeEvidenceExtraction(
      extractionClaim,
      [],
      {
        async complete() {
          throw new Error("database write failed");
        },
        async fail(_claim, category) {
          persistenceFailureRecorded = category === "provider_error";
        },
      },
      async () => ({
        output: extractedOutput,
        rawModelOutput: JSON.stringify(extractedOutput),
      })
    ),
    /database write failed/
  );
  assert.equal(persistenceFailureRecorded, true);
});

test("atomically claims one extraction attempt and rejects a concurrent request", async () => {
  let status = "pending_review";
  let attempt = 0;
  const repository = {
    async claim(input: {
      actorId: string;
      evidenceId: string;
      modelName: string;
      inputHash: string;
    }) {
      if (!canStartEvidenceExtraction(status)) return null;
      status = "extraction_processing";
      attempt += 1;
      return {
        id: `ai-log-${attempt}`,
        evidenceId: input.evidenceId,
        attempt,
        modelName: input.modelName,
        inputHash: input.inputHash,
      };
    },
  };
  const results = await Promise.allSettled([
    claimEvidenceExtraction(repository, {
      actorId: "approver-1",
      evidenceId: "evidence-1",
      modelName: "gemini-3.8-flash",
      inputHash: "sha256",
    }),
    claimEvidenceExtraction(repository, {
      actorId: "approver-1",
      evidenceId: "evidence-1",
      modelName: "gemini-3.8-flash",
      inputHash: "sha256",
    }),
  ]);
  assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
  const conflict = results.find((result) => result.status === "rejected");
  assert.equal(
    conflict?.status === "rejected" &&
      conflict.reason instanceof GeminiExtractionError &&
      conflict.reason.statusCode === 409,
    true
  );
  assert.equal(attempt, 1);
});

test("classifies abandoned extraction claims as stale only after the recovery window", () => {
  const now = new Date("2026-03-05T12:00:00.000Z");
  assert.equal(
    isExtractionClaimStale(
      new Date(now.getTime() - EXTRACTION_CLAIM_STALE_MS - 1),
      now
    ),
    true
  );
  assert.equal(
    isExtractionClaimStale(
      new Date(now.getTime() - EXTRACTION_CLAIM_STALE_MS + 1),
      now
    ),
    false
  );
});

test("maps provider timeout and rate-limit failures to explicit retryable categories", async () => {
  const sdkTimeout = Object.assign(new Error("Request timed out"), {
    name: "RequestTimeoutError",
  });
  const deadlineError = Object.assign(
    new Error(
      JSON.stringify({
        error: {
          code: 504,
          message: "Deadline exceeded for API key=AIza123456789012345678901234",
          status: "DEADLINE_EXCEEDED",
          details: [
            {
              "@type": "type.googleapis.com/google.rpc.ErrorInfo",
              reason: "DEADLINE_EXCEEDED",
              domain: "googleapis.com",
              metadata: { service: "generativelanguage.googleapis.com" },
            },
          ],
        },
      })
    ),
    { name: "ApiError", status: 504 }
  );
  assert.equal(
    getGeminiErrorCategory(sdkTimeout),
    "timeout"
  );
  assert.equal(getGeminiErrorCategory(deadlineError), "timeout");
  assert.equal(getGeminiProviderStatus(deadlineError), 504);
  assert.equal(getGeminiProviderCode(deadlineError), "DEADLINE_EXCEEDED");
  assert.equal(getGeminiProviderErrorStatus(deadlineError), "DEADLINE_EXCEEDED");
  assert.equal(
    getGeminiProviderErrorMessage(deadlineError),
    "Deadline exceeded for API key=[REDACTED_KEY]"
  );
  assert.deepEqual(getGeminiProviderErrorDetails(deadlineError), [
    {
      type: "type.googleapis.com/google.rpc.ErrorInfo",
      reason: "DEADLINE_EXCEEDED",
      domain: "googleapis.com",
      metadata: { service: "generativelanguage.googleapis.com" },
    },
  ]);
  assert.equal(isRetryableGeminiError(deadlineError), false);
  assert.equal(isRetryableGeminiError({ status: 504 }), false);
  assert.equal(getGeminiErrorCategory({ status: 429 }), "rate_limit");
  assert.equal(getGeminiErrorCategory({ response: { status: 429 } }), "rate_limit");
  assert.equal(isRetryableGeminiError(sdkTimeout), false);
  assert.equal(isRetryableGeminiError({ status: 503 }), true);
  assert.equal(
    isRetryableGeminiError(Object.assign(new Error("connection failed"), {
      name: "ConnectionError",
    })),
    true
  );
  assert.equal(isRetryableGeminiError({ name: "ConnectionError" }), true);
  assert.equal(isRetryableGeminiError(new DOMException("aborted", "AbortError")), false);
  assert.equal(isRetryableGeminiError({ status: 408 }), false);
  assert.equal(isRetryableGeminiError({ status: 401 }), false);
  assert.equal(isRetryableGeminiError({ status: 403 }), false);
  assert.equal(isRetryableGeminiError({ status: 429 }), false);
  const rateLimitError = Object.assign(
    new Error(
      JSON.stringify({
        error: {
          code: 429,
          message: "Rate limit exceeded",
          status: "RESOURCE_EXHAUSTED",
          details: [
            {
              "@type": "type.googleapis.com/google.rpc.ErrorInfo",
              reason: "RATE_LIMIT_EXCEEDED",
            },
          ],
        },
      })
    ),
    { status: 429 }
  );
  assert.equal(isRetryableGeminiError(rateLimitError), true);
  assert.equal(
    getSanitizedGeminiErrorMessage({
      status: 503,
      message: "provider error containing private details",
    }),
    "Gemini provider returned HTTP 503"
  );
  await assert.rejects(
    runEvidenceExtraction(
      { fileName: "unsafe.exe", mimeType: "application/octet-stream", bytes: new Uint8Array([0]) },
      async () => JSON.stringify(extractedOutput)
    ),
    (error: unknown) =>
      error instanceof GeminiExtractionError &&
      error.category === "unsupported_document"
  );
  await assert.rejects(
    runEvidenceExtraction(
      {
        fileName: "work.csv",
        mimeType: "text/csv",
        bytes: new TextEncoder().encode("work\ncode"),
      },
      async () => {
        throw new DOMException("request timed out", "TimeoutError");
      }
    ),
    (error: unknown) =>
      error instanceof GeminiExtractionError &&
      error.category === "timeout" &&
      error.statusCode === 504
  );
});

test("retries one transient Gemini failure with bounded exponential jitter", async () => {
  let calls = 0;
  const delays: number[] = [];
  const result = await retryTransientGeminiRequest(
    async () => {
      calls += 1;
      if (calls === 1) {
        throw Object.assign(new Error("upstream unavailable"), { status: 503 });
      }
      return "response";
    },
    {
      maxAttempts: 2,
      sleep: async (milliseconds) => {
        delays.push(milliseconds);
      },
      random: () => 0.5,
    }
  );

  assert.deepEqual(result, { value: "response", retryCount: 1 });
  assert.equal(calls, 2);
  assert.deepEqual(delays, [300]);
});

test("retries explicit rate-limit 429 errors only within the configured attempt bound", async () => {
  const rateLimitError = Object.assign(
    new Error(
      JSON.stringify({
        error: {
          code: 429,
          status: "RESOURCE_EXHAUSTED",
          details: [
            {
              "@type": "type.googleapis.com/google.rpc.ErrorInfo",
              reason: "RATE_LIMIT_EXCEEDED",
            },
          ],
        },
      })
    ),
    { status: 429 }
  );
  let calls = 0;
  const result = await retryTransientGeminiRequest(
    async () => {
      calls += 1;
      if (calls === 1) throw rateLimitError;
      return "response";
    },
    {
      maxAttempts: 2,
      sleep: async () => undefined,
    }
  );
  assert.equal(result.retryCount, 1);
  assert.equal(calls, 2);
});

test("does not retry quota, authentication, invalid request, or exhausted transient failures", async () => {
  for (const error of [
    {
      status: 429,
      message: JSON.stringify({
        error: {
          code: 429,
          status: "RESOURCE_EXHAUSTED",
          details: [
            {
              "@type": "type.googleapis.com/google.rpc.ErrorInfo",
              reason: "QUOTA_EXCEEDED",
            },
          ],
        },
      }),
    },
    { status: 401 },
    { status: 403 },
    { status: 400 },
    { status: 504, message: '{"error":{"status":"DEADLINE_EXCEEDED"}}' },
  ]) {
    let calls = 0;
    await assert.rejects(
      retryTransientGeminiRequest(
        async () => {
          calls += 1;
          throw error;
        },
        { sleep: async () => assert.fail("non-retryable error must not sleep") }
      )
    );
    assert.equal(calls, 1);
  }

  let timeoutCalls = 0;
  await assert.rejects(
    retryTransientGeminiRequest(
      async () => {
        timeoutCalls += 1;
        throw Object.assign(new Error("request timed out"), {
          name: "RequestTimeoutError",
        });
      },
      { sleep: async () => undefined }
    )
  );
  assert.equal(timeoutCalls, 1);
});

test("persists a deadline failure without repeating the same request deadline", async () => {
  const content = new TextEncoder().encode("work\ncode");
  let calls = 0;
  let persistedFailure: ExtractionErrorCategory | null = null;
  await assert.rejects(
    executeEvidenceExtraction(
      extractionClaim,
      [],
      {
        async complete() {
          assert.fail("A failed Gemini request must not persist proposals");
        },
        async fail(_claim, category) {
          persistedFailure = category;
        },
      },
      async () => {
        const { value } = await retryTransientGeminiRequest(
          async () => {
            calls += 1;
            throw Object.assign(
              new Error(
                '{"error":{"code":504,"status":"DEADLINE_EXCEEDED","message":"Deadline exceeded"}}'
              ),
              { name: "ApiError", status: 504 }
            );
          },
          { sleep: async () => undefined }
        );
        return runEvidenceExtraction(
          { fileName: "work.csv", mimeType: "text/csv", bytes: content },
          async () => value
        );
      }
    ),
    (error: unknown) =>
      error instanceof Error && error.name === "ApiError"
  );
  assert.equal(calls, 1);
  assert.equal(persistedFailure, "timeout");
});

test("retrieves a stored evidence file only when its lifecycle allows download", async () => {
  let requestedKey = "";
  const bytes = await downloadEvidenceFile(
    { storageKey: "squad-a/object-key", status: "pending_review" },
    {
      async download(storageKey) {
        requestedKey = storageKey;
        return fileBytes;
      },
    }
  );
  assert.equal(requestedKey, "squad-a/object-key");
  assert.deepEqual(bytes, fileBytes);
  await assert.rejects(
    downloadEvidenceFile(
      { storageKey: "squad-a/object-key", status: "uploading" },
      { async download() { return fileBytes; } }
    ),
    (error: unknown) =>
      error instanceof EvidenceWorkflowError && error.statusCode === 409
  );
});

test("rejects invalid review transitions and preserves terminal review outcomes", () => {
  assert.equal(canTransitionEvidenceStatus("pending_review", "confirmed"), true);
  assert.equal(canTransitionEvidenceStatus("pending_review", "rejected"), true);
  assert.equal(
    canTransitionEvidenceStatus("pending_review", "extraction_processing"),
    true
  );
  assert.equal(
    canTransitionEvidenceStatus("extraction_processing", "extraction_completed"),
    true
  );
  assert.equal(
    canTransitionEvidenceStatus("extraction_processing", "extraction_failed"),
    true
  );
  assert.equal(canTransitionEvidenceStatus("confirmed", "extraction_processing"), true);
  assert.equal(canTransitionEvidenceStatus("rejected", "extraction_processing"), true);
  assert.equal(canTransitionEvidenceStatus("confirmed", "rejected"), false);
  assert.equal(canTransitionEvidenceStatus("rejected", "confirmed"), false);
});
