-- AlterTable memberships
ALTER TABLE "memberships" ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'UTC';
ALTER TABLE "memberships" ADD COLUMN "focus_sessions_opt_in" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable split_lines
ALTER TABLE "split_lines" ADD COLUMN "work_amount_minor" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "split_lines" ADD COLUMN "consistency_amount_minor" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "split_lines" ADD COLUMN "streak_days" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "split_lines" ADD COLUMN "freeze_days_used" INTEGER NOT NULL DEFAULT 0;

-- CreateTable freeze_grants
CREATE TABLE "freeze_grants" (
    "id" TEXT NOT NULL,
    "squad_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "approver_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "freeze_grants_pkey" PRIMARY KEY ("id")
);

-- CreateTable focus_sessions
CREATE TABLE "focus_sessions" (
    "id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "ended_at" TIMESTAMP(3),
    "source" TEXT NOT NULL DEFAULT 'manual',
    "evidence_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "conflict_flag" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "focus_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "freeze_grants_member_id_date_key" ON "freeze_grants"("member_id", "date");

-- CreateIndex
CREATE INDEX "focus_sessions_member_id_started_at_idx" ON "focus_sessions"("member_id", "started_at");

-- AddForeignKey
ALTER TABLE "freeze_grants" ADD CONSTRAINT "freeze_grants_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "freeze_grants" ADD CONSTRAINT "freeze_grants_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "focus_sessions" ADD CONSTRAINT "focus_sessions_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "focus_sessions" ADD CONSTRAINT "focus_sessions_evidence_id_fkey" FOREIGN KEY ("evidence_id") REFERENCES "evidence"("id") ON DELETE SET NULL ON UPDATE CASCADE;
