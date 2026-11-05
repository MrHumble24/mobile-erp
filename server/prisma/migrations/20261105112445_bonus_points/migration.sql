-- AlterTable
ALTER TABLE "store_settings" ADD COLUMN     "bonusEarnPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "bonusEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "bonusMaxRedeemPercent" DECIMAL(5,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "bonus_transaction_types" (
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "bonus_transaction_types_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "bonus_transactions" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "typeCode" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "saleId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bonus_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bonus_transactions_storeId_idx" ON "bonus_transactions"("storeId");

-- CreateIndex
CREATE INDEX "bonus_transactions_customerId_idx" ON "bonus_transactions"("customerId");

-- CreateIndex
CREATE INDEX "bonus_transactions_saleId_idx" ON "bonus_transactions"("saleId");

-- CreateIndex
CREATE INDEX "bonus_transactions_typeCode_idx" ON "bonus_transactions"("typeCode");

-- CreateIndex
CREATE INDEX "bonus_transactions_occurredAt_idx" ON "bonus_transactions"("occurredAt");

-- AddForeignKey
ALTER TABLE "bonus_transactions" ADD CONSTRAINT "bonus_transactions_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bonus_transactions" ADD CONSTRAINT "bonus_transactions_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bonus_transactions" ADD CONSTRAINT "bonus_transactions_typeCode_fkey" FOREIGN KEY ("typeCode") REFERENCES "bonus_transaction_types"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bonus_transactions" ADD CONSTRAINT "bonus_transactions_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bonus_transactions" ADD CONSTRAINT "bonus_transactions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- A points row is always a real movement, never zero (service enforces too).
ALTER TABLE "bonus_transactions" ADD CONSTRAINT "bonus_transactions_amount_nonzero" CHECK ("amount" <> 0);

-- Lookup seed (mirrored in prisma/seed.sql). Posted automatically by the sale /
-- return / correction paths, never picked from this list by a user.
INSERT INTO "bonus_transaction_types" ("code", "label", "sortOrder") VALUES
  ('EARN',       'Earned on a sale',   10),
  ('SPEND',      'Spent on a sale',    20),
  ('RETURN',     'Adjusted by a return', 30),
  ('CORRECTION', 'Manual correction',  40)
ON CONFLICT ("code") DO NOTHING;

-- Permission this code depends on (ADR 0043). `migrate deploy` applies it on a
-- fresh deploy; seed.sql mirrors it. ADMIN gets it; a cashier only if granted.
INSERT INTO "permissions" ("code", "resource", "action", "description") VALUES
  ('bonus.adjust', 'bonus', 'adjust', 'Manually correct a customer''s bonus points')
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "role_permissions" ("roleCode", "permissionCode")
  SELECT 'ADMIN', 'bonus.adjust'
  WHERE EXISTS (SELECT 1 FROM "roles" WHERE "code" = 'ADMIN')
ON CONFLICT DO NOTHING;
