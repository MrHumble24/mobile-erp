-- AlterTable
ALTER TABLE "cash_transactions" ADD COLUMN     "repairId" TEXT,
ADD COLUMN     "repairPaymentId" TEXT;

-- AlterTable
ALTER TABLE "store_settings" ADD COLUMN     "repairsEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "repair_statuses" (
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isTerminal" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "repair_statuses_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "repairs" (
    "id" TEXT NOT NULL,
    "ticketNumber" INTEGER NOT NULL,
    "storeId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "deviceName" TEXT NOT NULL,
    "modelId" TEXT,
    "imei" TEXT,
    "serialNumber" TEXT,
    "problem" TEXT NOT NULL,
    "agreedPrice" DECIMAL(14,2) NOT NULL,
    "warrantyDays" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "masterUserId" TEXT,
    "outsideMasterName" TEXT,
    "outsideMasterPhone" TEXT,
    "outsideCost" DECIMAL(14,2),
    "statusCode" TEXT NOT NULL DEFAULT 'RECEIVED',
    "receivedById" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "repairs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repair_status_history" (
    "id" TEXT NOT NULL,
    "repairId" TEXT NOT NULL,
    "fromStatusCode" TEXT,
    "toStatusCode" TEXT NOT NULL,
    "changedById" TEXT NOT NULL,
    "note" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "repair_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repair_parts" (
    "id" TEXT NOT NULL,
    "repairId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitCostSnapshot" DECIMAL(14,2) NOT NULL,
    "addedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "repair_parts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repair_payments" (
    "id" TEXT NOT NULL,
    "repairId" TEXT NOT NULL,
    "accountCode" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "receivedById" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "repair_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "repairs_storeId_idx" ON "repairs"("storeId");

-- CreateIndex
CREATE INDEX "repairs_customerId_idx" ON "repairs"("customerId");

-- CreateIndex
CREATE INDEX "repairs_statusCode_idx" ON "repairs"("statusCode");

-- CreateIndex
CREATE INDEX "repairs_imei_idx" ON "repairs"("imei");

-- CreateIndex
CREATE INDEX "repairs_receivedAt_idx" ON "repairs"("receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "repairs_storeId_ticketNumber_key" ON "repairs"("storeId", "ticketNumber");

-- CreateIndex
CREATE INDEX "repair_status_history_repairId_changedAt_idx" ON "repair_status_history"("repairId", "changedAt");

-- CreateIndex
CREATE INDEX "repair_parts_repairId_idx" ON "repair_parts"("repairId");

-- CreateIndex
CREATE INDEX "repair_parts_modelId_idx" ON "repair_parts"("modelId");

-- CreateIndex
CREATE INDEX "repair_payments_repairId_idx" ON "repair_payments"("repairId");

-- CreateIndex
CREATE INDEX "repair_payments_occurredAt_idx" ON "repair_payments"("occurredAt");

-- CreateIndex
CREATE INDEX "cash_transactions_repairPaymentId_idx" ON "cash_transactions"("repairPaymentId");

-- CreateIndex
CREATE INDEX "cash_transactions_repairId_idx" ON "cash_transactions"("repairId");

-- AddForeignKey
ALTER TABLE "cash_transactions" ADD CONSTRAINT "cash_transactions_repairPaymentId_fkey" FOREIGN KEY ("repairPaymentId") REFERENCES "repair_payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_transactions" ADD CONSTRAINT "cash_transactions_repairId_fkey" FOREIGN KEY ("repairId") REFERENCES "repairs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repairs" ADD CONSTRAINT "repairs_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repairs" ADD CONSTRAINT "repairs_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repairs" ADD CONSTRAINT "repairs_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "device_models"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repairs" ADD CONSTRAINT "repairs_masterUserId_fkey" FOREIGN KEY ("masterUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repairs" ADD CONSTRAINT "repairs_statusCode_fkey" FOREIGN KEY ("statusCode") REFERENCES "repair_statuses"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repairs" ADD CONSTRAINT "repairs_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_status_history" ADD CONSTRAINT "repair_status_history_repairId_fkey" FOREIGN KEY ("repairId") REFERENCES "repairs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_status_history" ADD CONSTRAINT "repair_status_history_fromStatusCode_fkey" FOREIGN KEY ("fromStatusCode") REFERENCES "repair_statuses"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_status_history" ADD CONSTRAINT "repair_status_history_toStatusCode_fkey" FOREIGN KEY ("toStatusCode") REFERENCES "repair_statuses"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_status_history" ADD CONSTRAINT "repair_status_history_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_parts" ADD CONSTRAINT "repair_parts_repairId_fkey" FOREIGN KEY ("repairId") REFERENCES "repairs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_parts" ADD CONSTRAINT "repair_parts_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "device_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_parts" ADD CONSTRAINT "repair_parts_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_payments" ADD CONSTRAINT "repair_payments_repairId_fkey" FOREIGN KEY ("repairId") REFERENCES "repairs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_payments" ADD CONSTRAINT "repair_payments_accountCode_fkey" FOREIGN KEY ("accountCode") REFERENCES "cash_accounts"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_payments" ADD CONSTRAINT "repair_payments_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Lookups + permissions this code depends on (ADR 0040). `migrate deploy`
-- (Railway) never runs seed.sql, so the rows are inserted here too, idempotently.
INSERT INTO "repair_statuses" ("code", "label", "sortOrder", "isTerminal") VALUES
  ('RECEIVED',   'Received',   10, false),
  ('IN_REPAIR',  'In repair',  20, false),
  ('READY',      'Ready',      30, false),
  ('GIVEN_BACK', 'Given back', 40, true),
  ('CANCELLED',  'Cancelled',  50, true)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "stock_movement_types" ("code", "label", "sortOrder") VALUES
  ('REPAIR_USE', 'Repair use', 60)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "cash_transaction_types" ("code", "label", "sortOrder") VALUES
  ('REPAIR_PAYMENT', 'Repair payment', 170),
  ('REPAIR_OUTSIDE', 'Repair outside master', 180)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "permissions" ("code", "resource", "action", "description") VALUES
  ('repair.read',    'repair', 'read',    'View repair tickets'),
  ('repair.manage',  'repair', 'manage',  'Create / edit repair tickets, status and parts'),
  ('repair.payment', 'repair', 'payment', 'Take repair payments and pay outside masters')
ON CONFLICT ("code") DO UPDATE SET "description" = EXCLUDED."description";

-- ADMIN gets every permission; others only when the owner grants them.
INSERT INTO "role_permissions" ("roleCode", "permissionCode")
  SELECT 'ADMIN', "code" FROM "permissions"
  WHERE "code" IN ('repair.read', 'repair.manage', 'repair.payment')
    AND EXISTS (SELECT 1 FROM "roles" WHERE "code" = 'ADMIN')
ON CONFLICT DO NOTHING;
