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
  assert.equal(canTransitionEvidenceStatus("confirmed", "rejected"), false);
  assert.equal(canTransitionEvidenceStatus("rejected", "confirmed"), false);
});
