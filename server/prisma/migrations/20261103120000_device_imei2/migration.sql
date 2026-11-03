-- AlterTable
ALTER TABLE "devices" ADD COLUMN     "imei2" VARCHAR(15);

-- CreateIndex
CREATE UNIQUE INDEX "devices_imei2_key" ON "devices"("imei2");

-- Cross-column guard: a unit's second IMEI must differ from its first.
ALTER TABLE "devices" ADD CONSTRAINT "devices_imei2_ne_imei" CHECK ("imei2" IS NULL OR "imei2" <> "imei");
