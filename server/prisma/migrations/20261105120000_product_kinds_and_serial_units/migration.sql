-- Product kinds + serial units (ADR 0029, Change 8 first half). `migrate deploy`
-- (Railway) never runs seed.sql, so the product_kinds lookup rows the code
-- depends on are inserted here too, idempotently, on fresh and populated DBs.

-- CreateTable: how a product's stock is counted.
CREATE TABLE "product_kinds" (
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "product_kinds_pkey" PRIMARY KEY ("code")
);

-- Seed the three kinds before device_models.kindCode references them.
INSERT INTO "product_kinds" ("code", "label", "sortOrder") VALUES
  ('IMEI',     'Phone (IMEI)',        10),
  ('SERIAL',   'Serial (console/laptop/watch)', 20),
  ('QUANTITY', 'Accessory (quantity)', 30)
ON CONFLICT ("code") DO NOTHING;

-- CreateTable: user-managed product grouping.
CREATE TABLE "product_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_categories_name_key" ON "product_categories"("name");

-- AlterTable: catalog columns on the product. Existing models become IMEI via
-- the column default; the FK is satisfied because 'IMEI' is seeded above.
ALTER TABLE "device_models"
  ADD COLUMN "kindCode" TEXT NOT NULL DEFAULT 'IMEI',
  ADD COLUMN "categoryId" TEXT,
  ADD COLUMN "barcode" TEXT,
  ADD COLUMN "modelCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "device_models_barcode_key" ON "device_models"("barcode");
CREATE INDEX "device_models_kindCode_idx" ON "device_models"("kindCode");
CREATE INDEX "device_models_categoryId_idx" ON "device_models"("categoryId");
CREATE INDEX "device_models_modelCode_idx" ON "device_models"("modelCode");

-- AddForeignKey
ALTER TABLE "device_models" ADD CONSTRAINT "device_models_kindCode_fkey" FOREIGN KEY ("kindCode") REFERENCES "product_kinds"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "device_models" ADD CONSTRAINT "device_models_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "product_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: a unit is now identified by an IMEI *or* a serial number.
ALTER TABLE "devices" ALTER COLUMN "imei" DROP NOT NULL;
ALTER TABLE "devices" ADD COLUMN "serialNumber" VARCHAR(64);

-- CreateIndex
CREATE UNIQUE INDEX "devices_serialNumber_key" ON "devices"("serialNumber");

-- Exactly one identifier: an IMEI unit has `imei` and no `serialNumber`; a
-- serial unit has `serialNumber` and no `imei`/`imei2`. (imei2 <> imei stays
-- backstopped by devices_imei2_ne_imei from the imei2 migration.)
ALTER TABLE "devices" ADD CONSTRAINT "devices_identity_one_of" CHECK (
  ("imei" IS NOT NULL AND "serialNumber" IS NULL)
  OR ("imei" IS NULL AND "imei2" IS NULL AND "serialNumber" IS NOT NULL)
);
