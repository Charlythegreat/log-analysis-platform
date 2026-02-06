-- AlterTable: make raw_log NOT NULL, tighten source column, add ingestion_source
ALTER TABLE "log_entries"
  ALTER COLUMN "raw_log" SET NOT NULL,
  ALTER COLUMN "raw_log" SET DEFAULT '',
  ALTER COLUMN "source" SET DATA TYPE VARCHAR(255),
  ALTER COLUMN "message" SET DATA TYPE TEXT;

ALTER TABLE "log_entries"
  ADD COLUMN "ingestion_source" VARCHAR(64) NOT NULL DEFAULT 'api';

-- CreateIndex
CREATE INDEX "log_entries_ingestion_source_idx" ON "log_entries"("ingestion_source");


