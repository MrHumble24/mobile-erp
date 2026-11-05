-- DropForeignKey
ALTER TABLE "devices" DROP CONSTRAINT "devices_shipmentId_fkey";

-- AlterTable
ALTER TABLE "cash_transactions" ADD COLUMN     "customerPurchaseId" TEXT;

-- AlterTable
ALTER TABLE "devices" ALTER COLUMN "shipmentId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "customer_purchases" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "pricePaid" DECIMAL(14,2) NOT NULL,
    "saleId" TEXT,
    "createdById" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customer_purchases_storeId_idx" ON "customer_purchases"("storeId");

-- CreateIndex
CREATE INDEX "customer_purchases_customerId_idx" ON "customer_purchases"("customerId");

-- CreateIndex
CREATE INDEX "customer_purchases_deviceId_idx" ON "customer_purchases"("deviceId");

-- CreateIndex
CREATE INDEX "customer_purchases_saleId_idx" ON "customer_purchases"("saleId");

-- CreateIndex
CREATE INDEX "customer_purchases_occurredAt_idx" ON "customer_purchases"("occurredAt");

-- CreateIndex
CREATE INDEX "cash_transactions_customerPurchaseId_idx" ON "cash_transactions"("customerPurchaseId");

-- AddForeignKey
ALTER TABLE "customer_purchases" ADD CONSTRAINT "customer_purchases_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_purchases" ADD CONSTRAINT "customer_purchases_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_purchases" ADD CONSTRAINT "customer_purchases_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_purchases" ADD CONSTRAINT "customer_purchases_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_purchases" ADD CONSTRAINT "customer_purchases_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "shipments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_transactions" ADD CONSTRAINT "cash_transactions_customerPurchaseId_fkey" FOREIGN KEY ("customerPurchaseId") REFERENCES "customer_purchases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Lookups + permissions this code depends on (ADR 0039). `migrate deploy`
-- (Railway) never runs seed.sql, so the rows are inserted here too, idempotently.
INSERT INTO "cash_transaction_types" ("code", "label", "sortOrder") VALUES
  ('CUSTOMER_PURCHASE', 'Customer purchase', 160)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "permissions" ("code", "resource", "action", "description") VALUES
  ('purchase.create', 'purchase', 'create', 'Buy used phones from customers'),
  ('purchase.read',   'purchase', 'read',   'View customer purchases')
ON CONFLICT ("code") DO UPDATE SET "description" = EXCLUDED."description";

-- ADMIN gets every permission; cashiers get purchase.* only when the owner grants it.
INSERT INTO "role_permissions" ("roleCode", "permissionCode")
  SELECT 'ADMIN', "code" FROM "permissions" WHERE "code" IN ('purchase.create', 'purchase.read')
  AND EXISTS (SELECT 1 FROM "roles" WHERE "code" = 'ADMIN')
ON CONFLICT DO NOTHING;
