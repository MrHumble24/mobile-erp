-- CreateTable
CREATE TABLE "cash_accounts" (
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "cash_accounts_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "cash_transaction_types" (
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "cash_transaction_types_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "cash_transactions" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "accountCode" TEXT NOT NULL,
    "typeCode" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "transferId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cash_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cash_transactions_storeId_idx" ON "cash_transactions"("storeId");

-- CreateIndex
CREATE INDEX "cash_transactions_accountCode_idx" ON "cash_transactions"("accountCode");

-- CreateIndex
CREATE INDEX "cash_transactions_typeCode_idx" ON "cash_transactions"("typeCode");

-- CreateIndex
CREATE INDEX "cash_transactions_occurredAt_idx" ON "cash_transactions"("occurredAt");

-- CreateIndex
CREATE INDEX "cash_transactions_transferId_idx" ON "cash_transactions"("transferId");

-- AddForeignKey
ALTER TABLE "cash_transactions" ADD CONSTRAINT "cash_transactions_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_transactions" ADD CONSTRAINT "cash_transactions_accountCode_fkey" FOREIGN KEY ("accountCode") REFERENCES "cash_accounts"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_transactions" ADD CONSTRAINT "cash_transactions_typeCode_fkey" FOREIGN KEY ("typeCode") REFERENCES "cash_transaction_types"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_transactions" ADD CONSTRAINT "cash_transactions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- A money movement is never zero (positive = in, negative = out).
ALTER TABLE "cash_transactions" ADD CONSTRAINT "cash_transactions_amount_nonzero" CHECK ("amount" <> 0);

-- At most one OPENING row per store and account (append-only ledger; the
-- opening balance is set exactly once). Partial unique index — the service
-- also guards this, but the database is the source of truth.
CREATE UNIQUE INDEX "cash_transactions_one_opening_per_account"
  ON "cash_transactions" ("storeId", "accountCode")
  WHERE "typeCode" = 'OPENING';
