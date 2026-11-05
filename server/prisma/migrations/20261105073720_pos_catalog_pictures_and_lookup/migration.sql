-- POS catalog pictures + code lookup (ADR 0031, Change 5). Adds the product
-- picture column and the three reference tables. No new permission or lookup
-- rows: pictures use `device.update`, the catalog + lookup use `device.read`,
-- learning a link uses `device.update` — all already seeded. The reference rows
-- themselves are too big for a migration; `pnpm ref:import` loads them.

-- AlterTable
ALTER TABLE "device_models" ADD COLUMN     "imageFileName" TEXT;

-- CreateTable
CREATE TABLE "ref_apple_box_codes" (
    "boxCode" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "color" TEXT,
    "storage" TEXT,
    "ram" TEXT,

    CONSTRAINT "ref_apple_box_codes_pkey" PRIMARY KEY ("boxCode")
);

-- CreateTable
CREATE TABLE "ref_imei_tacs" (
    "tac" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,

    CONSTRAINT "ref_imei_tacs_pkey" PRIMARY KEY ("tac")
);

-- CreateTable
CREATE TABLE "ref_model_links" (
    "id" TEXT NOT NULL,
    "refKey" TEXT NOT NULL,
    "refBrand" TEXT NOT NULL,
    "refModel" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ref_model_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ref_model_links_refKey_key" ON "ref_model_links"("refKey");

-- CreateIndex
CREATE INDEX "ref_model_links_modelId_idx" ON "ref_model_links"("modelId");

-- AddForeignKey
ALTER TABLE "ref_model_links" ADD CONSTRAINT "ref_model_links_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "device_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;
