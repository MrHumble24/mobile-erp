-- AlterTable: add deactivatedAt to stores
ALTER TABLE "stores" ADD COLUMN "deactivatedAt" TIMESTAMP(3);

-- AlterTable: add transferId to stock_movements
ALTER TABLE "stock_movements" ADD COLUMN "transferId" TEXT;

-- AlterTable: migrate store_settings from singleton id to storeId PK
ALTER TABLE "store_settings" ADD COLUMN "storeId" TEXT;

UPDATE "store_settings"
SET "storeId" = (SELECT "id" FROM "stores" ORDER BY "createdAt" ASC LIMIT 1)
WHERE "storeId" IS NULL;

DO $$
DECLARE
  v_store_id TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM "store_settings" WHERE "storeId" IS NULL) THEN
    SELECT "id" INTO v_store_id FROM "stores" LIMIT 1;
    IF v_store_id IS NULL THEN
      v_store_id := gen_random_uuid()::text;
      INSERT INTO "stores" ("id", "name", "updatedAt")
      VALUES (v_store_id, 'Main store', now());
    END IF;
    UPDATE "store_settings" SET "storeId" = v_store_id WHERE "storeId" IS NULL;
  END IF;
END $$;

ALTER TABLE "store_settings" DROP CONSTRAINT "store_settings_pkey";
ALTER TABLE "store_settings" ALTER COLUMN "storeId" SET NOT NULL;
ALTER TABLE "store_settings" DROP COLUMN "id";
ALTER TABLE "store_settings" ADD CONSTRAINT "store_settings_pkey" PRIMARY KEY ("storeId");

-- CreateTable: user_stores
CREATE TABLE "user_stores" (
    "userId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_stores_pkey" PRIMARY KEY ("userId","storeId")
);

-- CreateTable: stock_transfers
CREATE TABLE "stock_transfers" (
    "id" TEXT NOT NULL,
    "sourceStoreId" TEXT NOT NULL,
    "targetStoreId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentById" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3),
    "receivedById" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancelledById" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable: stock_transfer_lines
CREATE TABLE "stock_transfer_lines" (
    "id" TEXT NOT NULL,
    "transferId" TEXT NOT NULL,
    "lineType" TEXT NOT NULL,
    "deviceId" TEXT,
    "previousStatusCode" TEXT,
    "modelId" TEXT,
    "quantity" INTEGER,
    "unitCostSnapshot" DECIMAL(14,2),
    "note" TEXT,

    CONSTRAINT "stock_transfer_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes
CREATE INDEX "user_stores_storeId_idx" ON "user_stores"("storeId");
CREATE INDEX "stock_transfers_sourceStoreId_idx" ON "stock_transfers"("sourceStoreId");
CREATE INDEX "stock_transfers_targetStoreId_idx" ON "stock_transfers"("targetStoreId");
CREATE INDEX "stock_transfers_status_idx" ON "stock_transfers"("status");
CREATE INDEX "stock_transfer_lines_transferId_idx" ON "stock_transfer_lines"("transferId");
CREATE INDEX "stock_transfer_lines_deviceId_idx" ON "stock_transfer_lines"("deviceId");
CREATE INDEX "stock_transfer_lines_modelId_idx" ON "stock_transfer_lines"("modelId");
CREATE INDEX "stock_movements_transferId_idx" ON "stock_movements"("transferId");

-- AddForeignKeys
ALTER TABLE "user_stores" ADD CONSTRAINT "user_stores_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_stores" ADD CONSTRAINT "user_stores_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "store_settings" ADD CONSTRAINT "store_settings_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_sourceStoreId_fkey" FOREIGN KEY ("sourceStoreId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_targetStoreId_fkey" FOREIGN KEY ("targetStoreId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_sentById_fkey" FOREIGN KEY ("sentById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_cancelledById_fkey" FOREIGN KEY ("cancelledById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "stock_transfer_lines" ADD CONSTRAINT "stock_transfer_lines_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "stock_transfers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stock_transfer_lines" ADD CONSTRAINT "stock_transfer_lines_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "stock_transfer_lines" ADD CONSTRAINT "stock_transfer_lines_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "device_models"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "stock_transfers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Lookups & Reference data
INSERT INTO "device_statuses" ("code", "label", "sortOrder", "isTerminal")
VALUES ('IN_TRANSIT', 'In transit', 35, false)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "stock_movement_types" ("code", "label", "sortOrder")
VALUES
  ('TRANSFER_OUT', 'Transfer out', 70),
  ('TRANSFER_IN', 'Transfer in', 80)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "permissions" ("code", "resource", "action", "description")
VALUES
  ('store.manage',     'store',    'manage',  'Create, edit and deactivate stores'),
  ('store.all',        'store',    'all',     'Access every store and all-stores view'),
  ('transfer.create',  'transfer', 'create',  'Create and send stock transfers'),
  ('transfer.receive', 'transfer', 'receive', 'Receive stock transfers'),
  ('transfer.read',    'transfer', 'read',    'View stock transfers')
ON CONFLICT ("code") DO UPDATE SET "description" = EXCLUDED."description";

INSERT INTO "role_permissions" ("roleCode", "permissionCode")
VALUES
  ('ADMIN', 'store.manage'),
  ('ADMIN', 'store.all'),
  ('ADMIN', 'transfer.create'),
  ('ADMIN', 'transfer.receive'),
  ('ADMIN', 'transfer.read'),
  ('CASHIER', 'transfer.read'),
  ('CASHIER', 'transfer.create'),
  ('CASHIER', 'transfer.receive')
ON CONFLICT DO NOTHING;

-- Populate existing users into user_stores for existing stores
INSERT INTO "user_stores" ("userId", "storeId")
SELECT u."id", s."id"
FROM "users" u
CROSS JOIN "stores" s
ON CONFLICT DO NOTHING;
