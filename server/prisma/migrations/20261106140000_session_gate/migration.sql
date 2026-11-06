-- CreateTable
CREATE TABLE "session_gate" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "validAfterSec" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_gate_pkey" PRIMARY KEY ("id")
);
