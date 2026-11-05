-- AlterTable
ALTER TABLE "store_settings" ADD COLUMN     "priceTagsEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "receiptPaperWidthMm" INTEGER NOT NULL DEFAULT 80,
ADD COLUMN     "receiptPrintingEnabled" BOOLEAN NOT NULL DEFAULT false;
