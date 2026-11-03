ALTER TABLE "memberships"
ADD COLUMN "payout_receiver_confirmed_at" TIMESTAMP(3);

ALTER TABLE "payout_items"
ADD COLUMN "recipient_email" TEXT NOT NULL DEFAULT '';

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM "payout_batches"
        GROUP BY "run_id"
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'Cannot enforce one payout batch per split run: duplicate payout_batches.run_id values exist';
    END IF;
END $$;

CREATE UNIQUE INDEX "payout_batches_run_id_key"
ON "payout_batches"("run_id");

CREATE TABLE "paypal_webhook_events" (
    "id" TEXT NOT NULL,
    "paypal_event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "paypal_webhook_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "paypal_webhook_events_paypal_event_id_key"
ON "paypal_webhook_events"("paypal_event_id");
