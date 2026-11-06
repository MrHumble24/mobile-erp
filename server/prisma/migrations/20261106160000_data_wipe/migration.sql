-- CreateTable
CREATE TABLE "data_wipe_runs" (
    "id" TEXT NOT NULL,
    "performedById" TEXT NOT NULL,
    "contacts" BOOLEAN NOT NULL DEFAULT false,
    "catalog" BOOLEAN NOT NULL DEFAULT false,
    "safetyRunId" TEXT,
    "rowsErased" JSONB NOT NULL DEFAULT '{}',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "statusCode" TEXT NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "data_wipe_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "data_wipe_runs_startedAt_idx" ON "data_wipe_runs"("startedAt");

-- AddForeignKey
ALTER TABLE "data_wipe_runs" ADD CONSTRAINT "data_wipe_runs_statusCode_fkey" FOREIGN KEY ("statusCode") REFERENCES "backup_run_statuses"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Danger-zone permission (ADR 0057). Additive and idempotent.
INSERT INTO "permissions" ("code", "resource", "action", "description")
VALUES
  ('data.wipe', 'data', 'wipe', 'Erase the shop''s data (danger zone)')
ON CONFLICT ("code") DO UPDATE SET "description" = EXCLUDED."description";

-- Grant to ADMIN only — and only for roles that already exist. On a brand-new
-- database the roles come from seed.sql (which runs after migrations and grants
-- ADMIN every permission itself), so this JOIN does nothing there and never
-- fails on an empty database.
INSERT INTO "role_permissions" ("roleCode", "permissionCode")
SELECT v.role, v.perm
FROM (VALUES ('ADMIN', 'data.wipe')) AS v(role, perm)
JOIN "roles" r ON r."code" = v.role
ON CONFLICT DO NOTHING;
