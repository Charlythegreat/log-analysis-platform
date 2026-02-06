-- CreateEnum
CREATE TYPE "log_level" AS ENUM ('debug', 'info', 'warn', 'error', 'fatal');

-- CreateTable
CREATE TABLE "log_entries" (
    "id" UUID NOT NULL,
    "level" "log_level" NOT NULL,
    "message" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "raw_log" TEXT,
    "format" VARCHAR(32),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "log_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "log_entries_level_idx" ON "log_entries"("level");

-- CreateIndex
CREATE INDEX "log_entries_source_idx" ON "log_entries"("source");

-- CreateIndex
CREATE INDEX "log_entries_timestamp_idx" ON "log_entries"("timestamp");

-- CreateIndex
CREATE INDEX "log_entries_created_at_idx" ON "log_entries"("created_at");
