-- Lookups this migration depends on. `migrate deploy` (Railway) never runs
-- seed.sql, so seed the new transaction types here, and re-assert the CASH/CARD
-- accounts the new FK defaults reference (idempotent on both fresh and populated
-- databases). Nothing is backfilled: existing rows get no ledger rows.
INSERT INTO "cash_accounts" ("code", "label", "sortOrder") VALUES
  ('CASH', 'Cash', 10),
  ('CARD', 'Card', 20)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "cash_transaction_types" ("code", "label", "sortOrder") VALUES
  ('SALE',            'Sale',             60),
  ('REFUND',          'Refund',           70),
  ('PARTNER_PAYMENT', 'Partner payment',  80),
  ('PURCHASE',        'Device purchase',  90),
  ('OVERHEAD',        'Shipment overhead',100),
  ('EXPENSE',         'Expense',          110)
ON CONFLICT ("code") DO NOTHING;

-- AlterTable
ALTER TABLE "cash_transactions" ADD COLUMN     "deviceId" TEXT,
ADD COLUMN     "expenseId" TEXT,
ADD COLUMN     "partnerPaymentId" TEXT,
ADD COLUMN     "saleId" TEXT,
ADD COLUMN     "shipmentId" TEXT;

-- AlterTable
ALTER TABLE "expense_recurrences" ADD COLUMN     "accountCode" TEXT NOT NULL DEFAULT 'CASH';

-- AlterTable
ALTER TABLE "shipments" ADD COLUMN     "paymentAccountCode" TEXT NOT NULL DEFAULT 'CASH';

-- CreateIndex
CREATE INDEX "cash_transactions_saleId_idx" ON "cash_transactions"("saleId");

-- CreateIndex
CREATE INDEX "cash_transactions_expenseId_idx" ON "cash_transactions"("expenseId");

-- CreateIndex
CREATE INDEX "cash_transactions_partnerPaymentId_idx" ON "cash_transactions"("partnerPaymentId");

-- CreateIndex
CREATE INDEX "cash_transactions_deviceId_idx" ON "cash_transactions"("deviceId");

-- CreateIndex
CREATE INDEX "cash_transactions_shipmentId_idx" ON "cash_transactions"("shipmentId");

-- CreateIndex
CREATE INDEX "expense_recurrences_accountCode_idx" ON "expense_recurrences"("accountCode");

-- CreateIndex
CREATE INDEX "shipments_paymentAccountCode_idx" ON "shipments"("paymentAccountCode");

-- AddForeignKey
ALTER TABLE "expense_recurrences" ADD CONSTRAINT "expense_recurrences_accountCode_fkey" FOREIGN KEY ("accountCode") REFERENCES "cash_accounts"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_transactions" ADD CONSTRAINT "cash_transactions_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_transactions" ADD CONSTRAINT "cash_transactions_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "expenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_transactions" ADD CONSTRAINT "cash_transactions_partnerPaymentId_fkey" FOREIGN KEY ("partnerPaymentId") REFERENCES "partner_payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_transactions" ADD CONSTRAINT "cash_transactions_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_transactions" ADD CONSTRAINT "cash_transactions_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "shipments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_paymentAccountCode_fkey" FOREIGN KEY ("paymentAccountCode") REFERENCES "cash_accounts"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
