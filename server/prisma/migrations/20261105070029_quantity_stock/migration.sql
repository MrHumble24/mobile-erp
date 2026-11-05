-- Quantity-product stock (ADR 0030, Change 8 second half). `migrate deploy`
-- (Railway) never runs seed.sql, so every lookup row and permission this code
-- depends on is inserted here too, idempotently, on fresh and populated DBs.

-- DropForeignKey
ALTER TABLE "sales" DROP CONSTRAINT "sales_deviceId_fkey";

-- AlterTable
ALTER TABLE "device_models" ADD COLUMN     "salePrice" DECIMAL(14,2);

-- AlterTable
ALTER TABLE "sales" ADD COLUMN     "modelId" TEXT,
ADD COLUMN     "quantity" INTEGER,
ALTER COLUMN "deviceId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "stock_movement_types" (
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "stock_movement_types_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "typeCode" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitCostSnapshot" DECIMAL(14,2) NOT NULL,
    "shipmentId" TEXT,
    "saleId" TEXT,
    "note" TEXT,
    "createdById" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stock_movements_storeId_modelId_idx" ON "stock_movements"("storeId", "modelId");

-- CreateIndex
CREATE INDEX "stock_movements_modelId_idx" ON "stock_movements"("modelId");

-- CreateIndex
CREATE INDEX "stock_movements_typeCode_idx" ON "stock_movements"("typeCode");

-- CreateIndex
CREATE INDEX "stock_movements_shipmentId_idx" ON "stock_movements"("shipmentId");

-- CreateIndex
CREATE INDEX "stock_movements_saleId_idx" ON "stock_movements"("saleId");

-- CreateIndex
CREATE INDEX "stock_movements_occurredAt_idx" ON "stock_movements"("occurredAt");

-- CreateIndex
CREATE INDEX "sales_modelId_idx" ON "sales"("modelId");

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "device_models"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "device_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_typeCode_fkey" FOREIGN KEY ("typeCode") REFERENCES "stock_movement_types"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "shipments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed stock movement types before any stock_movements row references them.
INSERT INTO "stock_movement_types" ("code", "label", "sortOrder") VALUES
  ('PURCHASE',         'Purchase',         10),
  ('SALE',             'Sale',             20),
  ('RETURN',           'Return',           30),
  ('WRITE_OFF',        'Write-off',        40),
  ('COUNT_CORRECTION', 'Count correction', 50)
ON CONFLICT ("code") DO NOTHING;

-- A stock movement is never a no-op.
ALTER TABLE "stock_movements"
  ADD CONSTRAINT "stock_movements_quantity_nonzero" CHECK ("quantity" <> 0);

-- A sale is a unit sale (device, no model/quantity) or a quantity sale (model +
-- quantity, no device) — never both, never neither. The service rejects the bad
-- combination with a clean 400 first; this backstops it.
ALTER TABLE "sales" ADD CONSTRAINT "sales_unit_xor_quantity" CHECK (
  ("deviceId" IS NOT NULL AND "modelId" IS NULL AND "quantity" IS NULL)
  OR ("deviceId" IS NULL AND "modelId" IS NOT NULL AND "quantity" IS NOT NULL)
);

-- Permission the stock-adjust route depends on (write-off + count correction).
-- ADMIN only by default; reading stock reuses device.read. The ADMIN role is
-- granted every permission by the SELECT below, so only the row + mapping here.
INSERT INTO "permissions" ("code", "resource", "action", "description") VALUES
  ('stock.adjust', 'stock', 'adjust', 'Write off stock and correct counts')
ON CONFLICT ("code") DO UPDATE SET "description" = EXCLUDED."description";

INSERT INTO "role_permissions" ("roleCode", "permissionCode")
  SELECT 'ADMIN', 'stock.adjust'
  WHERE EXISTS (SELECT 1 FROM "roles" WHERE "code" = 'ADMIN')
ON CONFLICT DO NOTHING;
