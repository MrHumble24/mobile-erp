-- CreateTable
CREATE TABLE "backup_run_statuses" (
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isTerminal" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "backup_run_statuses_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "backup_target_statuses" (
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isTerminal" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "backup_target_statuses_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "backup_providers" (
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "backup_providers_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "backup_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "scheduleEnabled" BOOLEAN NOT NULL DEFAULT false,
    "scheduleTime" TEXT NOT NULL DEFAULT '03:00',
    "keepLast" INTEGER NOT NULL DEFAULT 14,
    "lastRunOn" DATE,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "backup_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "backup_runs" (
    "id" TEXT NOT NULL,
    "triggeredById" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "fileName" TEXT,
    "sizeBytes" BIGINT,
    "checksum" TEXT,
    "migrationName" TEXT,
    "appVersion" TEXT,
    "statusCode" TEXT NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "backup_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "backup_targets" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "providerCode" TEXT NOT NULL,
    "statusCode" TEXT NOT NULL,
    "remoteRef" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "backup_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restore_runs" (
    "id" TEXT NOT NULL,
    "performedById" TEXT NOT NULL,
    "sourceRunId" TEXT,
    "sourceLabel" TEXT NOT NULL,
    "safetyRunId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "statusCode" TEXT NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "restore_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "backup_runs_startedAt_idx" ON "backup_runs"("startedAt");

-- CreateIndex
CREATE INDEX "backup_runs_statusCode_idx" ON "backup_runs"("statusCode");

-- CreateIndex
CREATE INDEX "backup_targets_runId_idx" ON "backup_targets"("runId");

-- CreateIndex
CREATE INDEX "backup_targets_providerCode_statusCode_idx" ON "backup_targets"("providerCode", "statusCode");

-- CreateIndex
CREATE INDEX "restore_runs_startedAt_idx" ON "restore_runs"("startedAt");

-- AddForeignKey
ALTER TABLE "backup_runs" ADD CONSTRAINT "backup_runs_statusCode_fkey" FOREIGN KEY ("statusCode") REFERENCES "backup_run_statuses"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "backup_targets" ADD CONSTRAINT "backup_targets_runId_fkey" FOREIGN KEY ("runId") REFERENCES "backup_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "backup_targets" ADD CONSTRAINT "backup_targets_providerCode_fkey" FOREIGN KEY ("providerCode") REFERENCES "backup_providers"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "backup_targets" ADD CONSTRAINT "backup_targets_statusCode_fkey" FOREIGN KEY ("statusCode") REFERENCES "backup_target_statuses"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restore_runs" ADD CONSTRAINT "restore_runs_sourceRunId_fkey" FOREIGN KEY ("sourceRunId") REFERENCES "backup_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restore_runs" ADD CONSTRAINT "restore_runs_statusCode_fkey" FOREIGN KEY ("statusCode") REFERENCES "backup_run_statuses"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed lookups (statuses and the first providers). Mirrored in prisma/seed.sql.
INSERT INTO "backup_run_statuses" ("code","label","sortOrder","isActive","isTerminal") VALUES
  ('RUNNING','Running',0,true,false),
  ('SUCCESS','Success',1,true,true),
  ('FAILED','Failed',2,true,true)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "backup_target_statuses" ("code","label","sortOrder","isActive","isTerminal") VALUES
  ('PENDING','Pending',0,true,false),
  ('UPLOADED','Uploaded',1,true,true),
  ('FAILED','Failed',2,true,true)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "backup_providers" ("code","label","sortOrder","isActive") VALUES
  ('LOCAL','Server disk',0,true),
  ('TELEGRAM','Telegram',1,true),
  ('GOOGLE_DRIVE','Google Drive',2,true),
  ('ONEDRIVE','Microsoft OneDrive',3,true)
ON CONFLICT ("code") DO NOTHING;

