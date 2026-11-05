-- AlterTable
ALTER TABLE "cash_transactions" ADD COLUMN     "creditPaymentId" TEXT;

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "creditLimit" DECIMAL(14,2);

-- AlterTable
ALTER TABLE "sales" ADD COLUMN     "creditId" TEXT;

-- AlterTable
ALTER TABLE "store_settings" ADD COLUMN     "customerCreditEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "defaultCreditLimit" DECIMAL(14,2);

-- CreateTable
CREATE TABLE "customer_credits" (
    "id" TEXT NOT NULL,
    "clientKey" TEXT,
    "storeId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_credits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_instalments" (
    "id" TEXT NOT NULL,
    "creditId" TEXT NOT NULL,
    "dueDate" DATE NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_instalments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_payments" (
    "id" TEXT NOT NULL,
    "creditId" TEXT NOT NULL,
    "accountCode" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "receivedById" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customer_credits_clientKey_key" ON "customer_credits"("clientKey");

-- CreateIndex
CREATE INDEX "customer_credits_customerId_idx" ON "customer_credits"("customerId");

-- CreateIndex
CREATE INDEX "customer_credits_storeId_idx" ON "customer_credits"("storeId");

-- CreateIndex
CREATE INDEX "credit_instalments_creditId_idx" ON "credit_instalments"("creditId");

-- CreateIndex
CREATE INDEX "credit_instalments_dueDate_idx" ON "credit_instalments"("dueDate");

-- CreateIndex
CREATE INDEX "credit_payments_creditId_idx" ON "credit_payments"("creditId");

-- CreateIndex
CREATE INDEX "cash_transactions_creditPaymentId_idx" ON "cash_transactions"("creditPaymentId");

-- CreateIndex
CREATE INDEX "sales_creditId_idx" ON "sales"("creditId");

-- AddForeignKey
ALTER TABLE "customer_credits" ADD CONSTRAINT "customer_credits_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_credits" ADD CONSTRAINT "customer_credits_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_credits" ADD CONSTRAINT "customer_credits_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_instalments" ADD CONSTRAINT "credit_instalments_creditId_fkey" FOREIGN KEY ("creditId") REFERENCES "customer_credits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_payments" ADD CONSTRAINT "credit_payments_creditId_fkey" FOREIGN KEY ("creditId") REFERENCES "customer_credits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_payments" ADD CONSTRAINT "credit_payments_accountCode_fkey" FOREIGN KEY ("accountCode") REFERENCES "cash_accounts"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_payments" ADD CONSTRAINT "credit_payments_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_transactions" ADD CONSTRAINT "cash_transactions_creditPaymentId_fkey" FOREIGN KEY ("creditPaymentId") REFERENCES "credit_payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_creditId_fkey" FOREIGN KEY ("creditId") REFERENCES "customer_credits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Lookups + permissions this code depends on (ADR 0035). `migrate deploy`
-- (Railway) never runs seed.sql, so the rows are inserted here too, idempotently.
INSERT INTO "cash_transaction_types" ("code", "label", "sortOrder") VALUES
  ('CREDIT_PAYMENT', 'Credit payment', 140)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "permissions" ("code", "resource", "action", "description") VALUES
  ('sale.credit', 'sale', 'credit', 'Sell on customer credit (nasiya)')
ON CONFLICT ("code") DO UPDATE SET "description" = EXCLUDED."description";

-- ADMIN gets every permission; cashiers get sale.credit only when the owner grants it.
INSERT INTO "role_permissions" ("roleCode", "permissionCode")
  SELECT 'ADMIN', 'sale.credit'
  WHERE EXISTS (SELECT 1 FROM "roles" WHERE "code" = 'ADMIN')
ON CONFLICT DO NOTHING;
