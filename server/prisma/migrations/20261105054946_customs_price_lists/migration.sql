-- Customs fee per phone (ADR 0027). `migrate deploy` (Railway) never runs
-- seed.sql, so seed the lookup type and the two permissions here, idempotently.
INSERT INTO "cash_transaction_types" ("code", "label", "sortOrder") VALUES
  ('CUSTOMS', 'Customs fee', 130)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "permissions" ("code", "resource", "action", "description") VALUES
  ('customs.read',   'customs', 'read',   'View customs price lists and fees'),
  ('customs.manage', 'customs', 'manage', 'Create price-list versions and fix fees')
ON CONFLICT ("code") DO NOTHING;
INSERT INTO "role_permissions" ("roleCode", "permissionCode")
  SELECT 'ADMIN', code FROM "permissions" WHERE code IN ('customs.read', 'customs.manage')
  AND EXISTS (SELECT 1 FROM "roles" WHERE "code" = 'ADMIN')
ON CONFLICT DO NOTHING;

-- AlterTable
ALTER TABLE "device_models" ADD COLUMN     "customsCode" TEXT;

-- AlterTable
ALTER TABLE "devices" ADD COLUMN     "customsFee" DECIMAL(14,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "customs_price_lists" (
    "id" TEXT NOT NULL,
    "effectiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customs_price_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customs_price_list_items" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "customsCode" TEXT NOT NULL,
    "description" TEXT,
    "fee" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "customs_price_list_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customs_price_lists_effectiveAt_idx" ON "customs_price_lists"("effectiveAt");

-- CreateIndex
CREATE INDEX "customs_price_list_items_customsCode_idx" ON "customs_price_list_items"("customsCode");

-- CreateIndex
CREATE UNIQUE INDEX "customs_price_list_items_listId_customsCode_key" ON "customs_price_list_items"("listId", "customsCode");

-- AddForeignKey
ALTER TABLE "customs_price_lists" ADD CONSTRAINT "customs_price_lists_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customs_price_list_items" ADD CONSTRAINT "customs_price_list_items_listId_fkey" FOREIGN KEY ("listId") REFERENCES "customs_price_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
