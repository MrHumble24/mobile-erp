-- AlterTable
ALTER TABLE "store_settings" ADD COLUMN     "storeName" TEXT,
ADD COLUMN     "storeAddress" TEXT,
ADD COLUMN     "storePhone" TEXT,
ADD COLUMN     "receiptFooter" TEXT,
ADD COLUMN     "defaultNasiyaDueDays" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "overdueReminderDays" INTEGER NOT NULL DEFAULT 3;
