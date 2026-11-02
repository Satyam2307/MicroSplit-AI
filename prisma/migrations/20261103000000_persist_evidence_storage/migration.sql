ALTER TABLE "evidence"
  ALTER COLUMN "file_url" DROP NOT NULL,
  ALTER COLUMN "sha256" DROP NOT NULL,
  ADD COLUMN "storage_key" TEXT,
  ADD COLUMN "idempotency_key" TEXT,
  ADD COLUMN "reviewed_by_id" TEXT,
  ADD COLUMN "reviewed_at" TIMESTAMP(3);

CREATE UNIQUE INDEX "evidence_storage_key_key"
  ON "evidence"("storage_key");

CREATE UNIQUE INDEX "evidence_squad_id_uploader_id_idempotency_key_key"
  ON "evidence"("squad_id", "uploader_id", "idempotency_key");

CREATE INDEX "evidence_squad_id_created_at_idx"
  ON "evidence"("squad_id", "created_at");

ALTER TABLE "evidence"
  ADD CONSTRAINT "evidence_reviewed_by_id_fkey"
  FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
