ALTER TABLE "contributions"
  DROP CONSTRAINT "contributions_member_id_fkey";

ALTER TABLE "users"
  ADD COLUMN "github_username" TEXT;

CREATE UNIQUE INDEX "users_github_username_key"
  ON "users"("github_username");

ALTER TABLE "contributions"
  ALTER COLUMN "member_id" DROP NOT NULL,
  ALTER COLUMN "quantity" DROP NOT NULL,
  ALTER COLUMN "unit" DROP NOT NULL,
  ADD COLUMN "extraction_log_id" TEXT,
  ADD COLUMN "reviewed_by_id" TEXT,
  ADD COLUMN "member_identifier" TEXT,
  ADD COLUMN "identity_match_status" TEXT NOT NULL DEFAULT 'unresolved',
  ADD COLUMN "contribution_type" TEXT,
  ADD COLUMN "description" TEXT,
  ADD COLUMN "source_reference" TEXT,
  ADD COLUMN "contribution_date" DATE,
  ADD COLUMN "reviewed_at" TIMESTAMP(3);

UPDATE "contributions"
SET "identity_match_status" = 'matched'
WHERE "member_id" IS NOT NULL;

ALTER TABLE "ai_logs"
  ADD COLUMN "attempt" INTEGER,
  ADD COLUMN "error_category" TEXT,
  ADD COLUMN "completed_at" TIMESTAMP(3);

WITH ranked_attempts AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "evidence_id"
      ORDER BY "created_at", "id"
    )::INTEGER AS attempt_number
  FROM "ai_logs"
)
UPDATE "ai_logs" AS logs
SET "attempt" = ranked_attempts.attempt_number
FROM ranked_attempts
WHERE logs."id" = ranked_attempts."id";

ALTER TABLE "ai_logs"
  ALTER COLUMN "attempt" SET DEFAULT 1,
  ALTER COLUMN "attempt" SET NOT NULL;

CREATE UNIQUE INDEX "ai_logs_evidence_id_attempt_key"
  ON "ai_logs"("evidence_id", "attempt");

CREATE INDEX "ai_logs_evidence_id_created_at_idx"
  ON "ai_logs"("evidence_id", "created_at");

CREATE INDEX "contributions_evidence_id_status_idx"
  ON "contributions"("evidence_id", "status");

CREATE INDEX "contributions_member_id_status_idx"
  ON "contributions"("member_id", "status");

ALTER TABLE "contributions"
  ADD CONSTRAINT "contributions_member_id_fkey"
  FOREIGN KEY ("member_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "contributions_extraction_log_id_fkey"
  FOREIGN KEY ("extraction_log_id") REFERENCES "ai_logs"("id")
  ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "contributions_reviewed_by_id_fkey"
  FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
