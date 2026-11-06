-- AlterTable
ALTER TABLE "data_wipe_runs" ADD COLUMN "performedByName" TEXT;

-- Factory reset permission. Additive and idempotent.
INSERT INTO "permissions" ("code", "resource", "action", "description")
VALUES
  ('data.reset', 'data', 'reset', 'Factory reset: erase everything and return to setup (danger zone)')
ON CONFLICT ("code") DO UPDATE SET "description" = EXCLUDED."description";

-- Grant to ADMIN only.
INSERT INTO "role_permissions" ("roleCode", "permissionCode")
SELECT v.role, v.perm
FROM (VALUES ('ADMIN', 'data.reset')) AS v(role, perm)
JOIN "roles" r ON r."code" = v.role
ON CONFLICT DO NOTHING;
