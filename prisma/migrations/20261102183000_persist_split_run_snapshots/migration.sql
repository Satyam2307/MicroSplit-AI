ALTER TABLE "split_runs"
ADD COLUMN "calculation_version" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "rule_snapshot_json" TEXT;

ALTER TABLE "split_lines"
ADD COLUMN "membership_id" TEXT;

CREATE INDEX "split_lines_membership_id_idx" ON "split_lines"("membership_id");

ALTER TABLE "split_lines"
ADD CONSTRAINT "split_lines_membership_id_fkey"
FOREIGN KEY ("membership_id") REFERENCES "memberships"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "split_runs_revenue_event_id_calculation_version_idx"
ON "split_runs"("revenue_event_id", "calculation_version");
