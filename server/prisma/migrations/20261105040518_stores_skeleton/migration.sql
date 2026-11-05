-- Stores skeleton (ADR 0023). Creates the single store, anchors every stock and
-- money row to it, and moves store identity out of store_settings.
-- Ordered to apply cleanly to a populated DB and a brand-new empty one:
-- create store -> seed one -> add nullable -> backfill -> NOT NULL -> FKs.

-- CreateTable
CREATE TABLE "stores" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- Seed exactly one store from store_settings identity (fallback when the
-- singleton row is absent, so a fresh DB still gets a store).
INSERT INTO "stores" ("id", "name", "address", "phone", "updatedAt")
SELECT gen_random_uuid(),
       COALESCE(s."storeName", 'Main store'),
       s."storeAddress",
       s."storePhone",
       now()
FROM (SELECT 1) AS one
LEFT JOIN "store_settings" s ON s."id" = 1;

-- Add storeId nullable, backfill all existing rows to the single store, enforce.
ALTER TABLE "devices"             ADD COLUMN "storeId" TEXT;
ALTER TABLE "shipments"           ADD COLUMN "storeId" TEXT;
ALTER TABLE "sales"               ADD COLUMN "storeId" TEXT;
ALTER TABLE "expenses"            ADD COLUMN "storeId" TEXT;
ALTER TABLE "expense_recurrences" ADD COLUMN "storeId" TEXT;
ALTER TABLE "consignments"        ADD COLUMN "storeId" TEXT;
ALTER TABLE "partner_payments"    ADD COLUMN "storeId" TEXT;

UPDATE "devices"             SET "storeId" = (SELECT "id" FROM "stores" LIMIT 1);
UPDATE "shipments"           SET "storeId" = (SELECT "id" FROM "stores" LIMIT 1);
UPDATE "sales"               SET "storeId" = (SELECT "id" FROM "stores" LIMIT 1);
UPDATE "expenses"            SET "storeId" = (SELECT "id" FROM "stores" LIMIT 1);
UPDATE "expense_recurrences" SET "storeId" = (SELECT "id" FROM "stores" LIMIT 1);
UPDATE "consignments"        SET "storeId" = (SELECT "id" FROM "stores" LIMIT 1);
UPDATE "partner_payments"    SET "storeId" = (SELECT "id" FROM "stores" LIMIT 1);

ALTER TABLE "devices"             ALTER COLUMN "storeId" SET NOT NULL;
ALTER TABLE "shipments"           ALTER COLUMN "storeId" SET NOT NULL;
ALTER TABLE "sales"               ALTER COLUMN "storeId" SET NOT NULL;
ALTER TABLE "expenses"            ALTER COLUMN "storeId" SET NOT NULL;
ALTER TABLE "expense_recurrences" ALTER COLUMN "storeId" SET NOT NULL;
ALTER TABLE "consignments"        ALTER COLUMN "storeId" SET NOT NULL;
ALTER TABLE "partner_payments"    ALTER COLUMN "storeId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "consignments_storeId_idx" ON "consignments"("storeId");

-- CreateIndex
CREATE INDEX "devices_storeId_idx" ON "devices"("storeId");

-- CreateIndex
CREATE INDEX "expense_recurrences_storeId_idx" ON "expense_recurrences"("storeId");

-- CreateIndex
CREATE INDEX "expenses_storeId_idx" ON "expenses"("storeId");

-- CreateIndex
CREATE INDEX "partner_payments_storeId_idx" ON "partner_payments"("storeId");

-- CreateIndex
CREATE INDEX "sales_storeId_idx" ON "sales"("storeId");

-- CreateIndex
CREATE INDEX "shipments_storeId_idx" ON "shipments"("storeId");

-- AddForeignKey
ALTER TABLE "consignments" ADD CONSTRAINT "consignments_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_payments" ADD CONSTRAINT "partner_payments_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_recurrences" ADD CONSTRAINT "expense_recurrences_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Store identity now lives in stores; drop it from the settings singleton (copied above).
ALTER TABLE "store_settings" DROP COLUMN "storeAddress",
DROP COLUMN "storeName",
DROP COLUMN "storePhone";
