-- CreateTable
CREATE TABLE "secrets" (
    "name" TEXT NOT NULL,
    "sealed" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "secrets_pkey" PRIMARY KEY ("name")
);
