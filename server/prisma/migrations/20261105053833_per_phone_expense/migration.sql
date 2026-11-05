-- Per-phone expense replaces shipment overhead (ADR 0026, supersedes ADR 0006).
-- `migrate deploy` (Railway) never runs seed.sql, so seed the lookup changes
-- here, idempotently, on both fresh and populated databases.

-- New ledger type for a per-phone expense difference.
INSERT INTO "cash_transaction_types" ("code", "label", "sortOrder") VALUES
  ('DEVICE_EXPENSE', 'Device expense', 120)
ON CONFLICT ("code") DO NOTHING;

-- OVERHEAD is retired: kept only so old history rows keep their label.
UPDATE "cash_transaction_types" SET "isActive" = false WHERE "code" = 'OVERHEAD';

-- New permission (admin only): entering or changing a phone's own expense.
INSERT INTO "permissions" ("code", "resource", "action", "description") VALUES
  ('device.expense', 'device', 'expense', 'Set or change a phone''s own expense')
ON CONFLICT ("code") DO NOTHING;
INSERT INTO "role_permissions" ("roleCode", "permissionCode")
  SELECT 'ADMIN', 'device.expense'
  WHERE EXISTS (SELECT 1 FROM "roles" WHERE "code" = 'ADMIN')
ON CONFLICT DO NOTHING;

-- AlterTable: each device gets its own expense (default 0) and an optional note.
ALTER TABLE "devices" ADD COLUMN     "unitExpense" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "unitExpenseNote" TEXT;

-- Carry each device's current overhead share into its unitExpense so landed
-- cost is unchanged (landedCost was acquisitionCost + share). No ledger rows
-- are posted: that money already left through the old OVERHEAD rows.
UPDATE "devices" SET "unitExpense" = "landedCost" - "acquisitionCost";

-- AlterTable: the shipment no longer carries its own expense (it is the sum of
-- its phones', computed in the response).
ALTER TABLE "shipments" DROP COLUMN "overheadCost";
