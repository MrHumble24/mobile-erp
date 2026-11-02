-- AlterTable: expense vendor, soft-delete and recurrence link
ALTER TABLE "expenses" ADD COLUMN     "vendor" TEXT,
ADD COLUMN     "recurrenceId" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "expense_recurrences" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "description" TEXT,
    "vendor" TEXT,
    "frequency" TEXT NOT NULL,
    "nextDueAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expense_recurrences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "expenses_deletedAt_idx" ON "expenses"("deletedAt");

-- CreateIndex
CREATE INDEX "expense_recurrences_nextDueAt_idx" ON "expense_recurrences"("nextDueAt");

-- CreateIndex
CREATE INDEX "expense_recurrences_categoryId_idx" ON "expense_recurrences"("categoryId");

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_recurrenceId_fkey" FOREIGN KEY ("recurrenceId") REFERENCES "expense_recurrences"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_recurrences" ADD CONSTRAINT "expense_recurrences_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "expense_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
