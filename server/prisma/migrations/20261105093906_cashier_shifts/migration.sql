-- AlterTable
ALTER TABLE "cash_transactions" ADD COLUMN     "shiftId" TEXT;

-- AlterTable
ALTER TABLE "store_settings" ADD COLUMN     "shiftsEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "shifts" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "cashierId" TEXT NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "openingCount" DECIMAL(14,2) NOT NULL,
    "closedAt" TIMESTAMP(3),
    "closingCount" DECIMAL(14,2),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shifts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shifts_storeId_idx" ON "shifts"("storeId");

-- CreateIndex
CREATE INDEX "shifts_cashierId_idx" ON "shifts"("cashierId");

-- CreateIndex
CREATE INDEX "shifts_openedAt_idx" ON "shifts"("openedAt");

-- CreateIndex
CREATE INDEX "cash_transactions_shiftId_idx" ON "cash_transactions"("shiftId");

-- AddForeignKey
ALTER TABLE "cash_transactions" ADD CONSTRAINT "cash_transactions_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "shifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- At most one open shift per cashier (ADR 0036). Partial unique index: Prisma
-- cannot express the `closedAt IS NULL` condition, so it lives here.
CREATE UNIQUE INDEX "shifts_one_open_per_cashier" ON "shifts"("cashierId") WHERE "closedAt" IS NULL;

-- Lookups + permissions this code depends on (ADR 0036). `migrate deploy`
-- (Railway) never runs seed.sql, so the rows are inserted here too, idempotently.
INSERT INTO "cash_transaction_types" ("code", "label", "sortOrder") VALUES
  ('SHIFT_DIFFERENCE', 'Shift difference', 150)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "permissions" ("code", "resource", "action", "description") VALUES
  ('shift.manage', 'shift', 'manage', 'List and force-close any cashier''s shift')
ON CONFLICT ("code") DO UPDATE SET "description" = EXCLUDED."description";

-- ADMIN gets every permission; cashiers manage only their own shift (sale.create).
INSERT INTO "role_permissions" ("roleCode", "permissionCode")
  SELECT 'ADMIN', 'shift.manage'
  WHERE EXISTS (SELECT 1 FROM "roles" WHERE "code" = 'ADMIN')
ON CONFLICT DO NOTHING;
