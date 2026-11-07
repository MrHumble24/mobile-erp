-- CP4: optional link from a repair ticket to one of our own inventory units.
-- A ticket for a customer's phone still uses free-text deviceName/imei.
ALTER TABLE "repairs" ADD COLUMN "deviceId" TEXT;

CREATE INDEX "repairs_deviceId_idx" ON "repairs"("deviceId");

ALTER TABLE "repairs"
  ADD CONSTRAINT "repairs_deviceId_fkey"
  FOREIGN KEY ("deviceId") REFERENCES "devices"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
