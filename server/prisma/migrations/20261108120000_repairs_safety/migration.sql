-- AlterTable
ALTER TABLE "repairs" ADD COLUMN "version" integer NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "repair_mutations" (
    "id" TEXT NOT NULL,
    "clientMutationId" TEXT NOT NULL,
    "repairId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "repair_mutations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "repair_mutations_clientMutationId_key" ON "repair_mutations"("clientMutationId");

-- CreateIndex
CREATE INDEX "repair_mutations_repairId_idx" ON "repair_mutations"("repairId");

-- AddForeignKey
ALTER TABLE "repair_mutations" ADD CONSTRAINT "repair_mutations_repairId_fkey" FOREIGN KEY ("repairId") REFERENCES "repairs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
