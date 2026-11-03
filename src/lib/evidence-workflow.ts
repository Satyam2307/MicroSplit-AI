import { createHash } from "node:crypto";

export const MAX_EVIDENCE_FILE_SIZE = 10 * 1024 * 1024;

const fileTypes = {
  ".pdf": { mimeType: "application/pdf", kind: "pdf" },
  ".png": { mimeType: "image/png", kind: "image" },
  ".jpg": { mimeType: "image/jpeg", kind: "image" },
  ".jpeg": { mimeType: "image/jpeg", kind: "image" },
  ".csv": { mimeType: "text/csv", kind: "csv" },
  ".txt": { mimeType: "text/plain", kind: "text" },
  ".mp3": { mimeType: "audio/mpeg", kind: "audio" },
  ".wav": { mimeType: "audio/wav", kind: "audio" },
} as const;

export type EvidenceUploadMetadata = {
  squadId: string;
  uploaderId: string;
  idempotencyKey: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
};

export type EvidenceUploadRecord = {
  id: string;
  squadId: string;
  uploaderId: string;
  idempotencyKey: string | null;
  fileName: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  kind: string;
  storageKey: string | null;
  status: string;
};

export class EvidenceWorkflowError extends Error {
  readonly statusCode: number;

  constructor(
    message: string,
    statusCode: number
  ) {
    super(message);
    this.name = "EvidenceWorkflowError";
    this.statusCode = statusCode;
  }
}

export function validateEvidenceUploadMetadata(
  input: Partial<EvidenceUploadMetadata>
): Omit<EvidenceUploadMetadata, "uploaderId"> & { kind: string } {
  if (
    typeof input.squadId !== "string" ||
    input.squadId.length < 1 ||
    input.squadId.length > 128
  ) {
    throw new EvidenceWorkflowError("A valid squadId is required", 400);
  }
  if (
    typeof input.idempotencyKey !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      input.idempotencyKey
    )
  ) {
    throw new EvidenceWorkflowError("A valid Idempotency-Key is required", 400);
  }
  if (
    typeof input.fileName !== "string" ||
    input.fileName.length > 255 ||
    /[\u0000-\u001f\u007f]/.test(input.fileName)
  ) {
    throw new EvidenceWorkflowError("A valid file name is required", 400);
  }

  const fileName = input.fileName.split(/[\\/]/).pop()?.trim() ?? "";
  const extension = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
  const fileType = fileTypes[extension as keyof typeof fileTypes];
  if (!fileName || !fileType || input.mimeType !== fileType.mimeType) {
    throw new EvidenceWorkflowError(
      "File extension and MIME type are not supported or do not match",
      400
    );
  }
  if (
    typeof input.sizeBytes !== "number" ||
    !Number.isSafeInteger(input.sizeBytes) ||
    input.sizeBytes < 1 ||
    input.sizeBytes > MAX_EVIDENCE_FILE_SIZE
  ) {
    throw new EvidenceWorkflowError("Files must be between 1 byte and 10 MB", 400);
  }

  return {
    squadId: input.squadId,
    idempotencyKey: input.idempotencyKey,
    fileName,
    mimeType: fileType.mimeType,
    sizeBytes: input.sizeBytes,
    kind: fileType.kind,
  };
}

export function validateEvidenceBytes(
  fileName: string,
  mimeType: string,
  bytes: Uint8Array
): string {
  const { kind } = validateEvidenceUploadMetadata({
    squadId: "validation",
    uploaderId: "validation",
    idempotencyKey: "00000000-0000-4000-8000-000000000000",
    fileName,
    mimeType,
    sizeBytes: bytes.byteLength,
  });

  const startsWith = (...signature: number[]) =>
    signature.every((value, index) => bytes[index] === value);
  let valid = false;

  switch (kind) {
    case "pdf":
      valid = new TextDecoder().decode(bytes.subarray(0, 5)) === "%PDF-";
      break;
    case "image":
      valid =
        mimeType === "image/png"
          ? startsWith(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)
          : startsWith(0xff, 0xd8, 0xff);
      break;
    case "audio":
      valid =
        mimeType === "audio/wav"
          ? bytes.byteLength >= 12 &&
            new TextDecoder().decode(bytes.subarray(0, 4)) === "RIFF" &&
            new TextDecoder().decode(bytes.subarray(8, 12)) === "WAVE"
          : bytes.byteLength >= 3 &&
            (new TextDecoder().decode(bytes.subarray(0, 3)) === "ID3" ||
              (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0));
      break;
    case "text":
    case "csv":
      try {
        new TextDecoder("utf-8", { fatal: true }).decode(bytes);
        valid = !bytes.includes(0);
      } catch {
        valid = false;
      }
      break;
    default:
      valid = false;
  }

  if (!valid) {
    throw new EvidenceWorkflowError(
      "Uploaded file contents do not match the declared file type",
      422
    );
  }

  return createHash("sha256").update(bytes).digest("hex");
}

export function canTransitionEvidenceStatus(from: string, to: string): boolean {
  const transitions: Record<string, readonly string[]> = {
    uploading: ["pending_review", "deletion_pending"],
    pending_review: [
      "confirmed",
      "rejected",
      "extraction_processing",
      "deletion_pending",
    ],
    extraction_pending: ["extraction_processing", "extraction_failed"],
    extraction_processing: ["extraction_completed", "extraction_failed"],
    extraction_completed: ["extraction_processing", "deletion_pending"],
    extraction_failed: ["extraction_processing", "deletion_pending"],
    confirmed: ["extraction_processing", "deletion_pending"],
    rejected: ["extraction_processing", "deletion_pending"],
    deletion_pending: [
      "uploading",
      "pending_review",
      "rejected",
      "extraction_completed",
      "extraction_failed",
      "confirmed",
    ],
  };
  return transitions[from]?.includes(to) ?? false;
}

export async function downloadEvidenceFile(
  evidence: {
    storageKey: string | null;
    status: string;
  },
  storage: { download(storageKey: string): Promise<Uint8Array> }
): Promise<Uint8Array> {
  const downloadableStatuses = [
    "pending_review",
    "confirmed",
    "rejected",
    "extraction_processing",
    "extraction_pending",
    "extraction_completed",
    "extraction_failed",
  ];
  if (!evidence.storageKey || !downloadableStatuses.includes(evidence.status)) {
    throw new EvidenceWorkflowError("Evidence file is not available", 409);
  }
  return storage.download(evidence.storageKey);
}

export interface EvidenceUploadRepository<TRecord extends EvidenceUploadRecord> {
  findByIdempotencyKey(
    squadId: string,
    uploaderId: string,
    idempotencyKey: string
  ): Promise<TRecord | null>;
  create(
    input: EvidenceUploadMetadata & { kind: string; storageKey: string }
  ): Promise<TRecord>;
  deleteUploading(id: string): Promise<void>;
}

export interface EvidenceUploadStorage {
  createSignedUpload(
    storageKey: string,
    upsert: boolean
  ): Promise<{ signedUrl: string; token: string }>;
}

export async function prepareEvidenceUpload<TRecord extends EvidenceUploadRecord>(
  metadata: Omit<EvidenceUploadMetadata, "uploaderId"> & {
    uploaderId: string;
    kind: string;
  },
  storageKey: string,
  repository: EvidenceUploadRepository<TRecord>,
  storage: EvidenceUploadStorage
): Promise<{ record: TRecord; signedUrl: string; token: string; reused: boolean }> {
  let existing = await repository.findByIdempotencyKey(
    metadata.squadId,
    metadata.uploaderId,
    metadata.idempotencyKey
  );
  const ensureSameUpload = (record: TRecord) => {
    if (
      record.fileName !== metadata.fileName ||
      record.mimeType !== metadata.mimeType ||
      record.sizeBytes !== metadata.sizeBytes
    ) {
      throw new EvidenceWorkflowError(
        "Idempotency key was already used for a different file",
        409
      );
    }
  };
  if (existing) ensureSameUpload(existing);
  let newlyCreated = false;

  if (existing?.status === "pending_review") {
    return { record: existing, signedUrl: "", token: "", reused: true };
  }
  if (existing && existing.status !== "uploading") {
    throw new EvidenceWorkflowError(
      "Evidence upload cannot be retried in its current state",
      409
    );
  }
  if (existing && !existing.storageKey) {
    throw new EvidenceWorkflowError("Evidence upload has no storage object key", 409);
  }

  let record: TRecord;
  if (existing) {
    record = existing;
  } else {
    try {
      record = await repository.create({
      ...metadata,
      storageKey,
      });
      newlyCreated = true;
    } catch (error) {
      const concurrent = await repository.findByIdempotencyKey(
        metadata.squadId,
        metadata.uploaderId,
        metadata.idempotencyKey
      );
      if (!concurrent) throw error;
      ensureSameUpload(concurrent);
      if (concurrent.status !== "uploading") {
        throw new EvidenceWorkflowError(
          "Evidence upload cannot be retried in its current state",
          409
        );
      }
      if (!concurrent.storageKey) {
        throw new EvidenceWorkflowError("Evidence upload has no storage object key", 409);
      }
      existing = concurrent;
      record = concurrent;
    }
  }

  if (!record.storageKey) {
    throw new EvidenceWorkflowError("Evidence upload has no storage object key", 409);
  }
  try {
    const signed = await storage.createSignedUpload(record.storageKey, false);
    return { record, ...signed, reused: Boolean(existing) };
  } catch (error) {
    if (newlyCreated) {
      await repository.deleteUploading(record.id);
    }
    throw error;
  }
}

export async function verifyAndPersistEvidenceUpload<T>(
  input: {
    fileName: string;
    mimeType: string;
    expectedSizeBytes: number;
  },
  storage: {
    download(): Promise<Uint8Array>;
    remove(): Promise<void>;
  },
  persist: (sha256: string) => Promise<T>
): Promise<T> {
  let bytes: Uint8Array;
  try {
    bytes = await storage.download();
  } catch (error) {
    try {
      await storage.remove();
    } catch (cleanupError) {
      throw new EvidenceWorkflowError(
        `${error instanceof Error ? error.message : "Uploaded file could not be retrieved"}; cleanup failed: ${cleanupError instanceof Error ? cleanupError.message : "unknown storage error"}`,
        502
      );
    }
    throw new EvidenceWorkflowError(
      error instanceof Error ? error.message : "Uploaded file could not be retrieved",
      502
    );
  }
  if (bytes.byteLength !== input.expectedSizeBytes) {
    await storage.remove();
    throw new EvidenceWorkflowError("Uploaded file size does not match", 422);
  }

  let sha256: string;
  try {
    sha256 = validateEvidenceBytes(input.fileName, input.mimeType, bytes);
  } catch (error) {
    await storage.remove();
    throw error;
  }

  try {
    return await persist(sha256);
  } catch (error) {
    await storage.remove();
    throw error;
  }
}
