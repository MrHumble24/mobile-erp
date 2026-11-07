-- AlterTable
ALTER TABLE "devices" ADD COLUMN     "acquisitionCostOriginal" DECIMAL(14,2);

-- AlterTable
ALTER TABLE "shipments" ADD COLUMN     "exchangeRate" DECIMAL(14,4);

-- CreateTable
CREATE TABLE "ref_apple_model_numbers" (
    "id" TEXT NOT NULL,
    "modelNumber" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "color" TEXT,
    "storage" TEXT,
    "ram" TEXT,
    "boxCode" TEXT,

    CONSTRAINT "ref_apple_model_numbers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ref_samsung_model_codes" (
    "modelCode" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "series" TEXT,
    "codename" TEXT,
    "storageOptions" TEXT[],
    "colorOptions" TEXT[],

    CONSTRAINT "ref_samsung_model_codes_pkey" PRIMARY KEY ("modelCode")
);

-- CreateIndex
CREATE INDEX "ref_apple_model_numbers_modelNumber_idx" ON "ref_apple_model_numbers"("modelNumber");

-- CreateIndex
CREATE INDEX "ref_apple_model_numbers_model_idx" ON "ref_apple_model_numbers"("model");

-- CreateIndex
CREATE INDEX "ref_samsung_model_codes_model_idx" ON "ref_samsung_model_codes"("model");
