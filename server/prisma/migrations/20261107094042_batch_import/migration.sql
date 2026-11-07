-- AlterTable
ALTER TABLE "devices" ADD COLUMN     "acquisitionCostOriginal" DECIMAL(14,2);

-- AlterTable
ALTER TABLE "shipments" ADD COLUMN     "exchangeRate" DECIMAL(14,4);
