-- CreateTable
CREATE TABLE "backup_provider_configs" (
    "providerCode" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB NOT NULL DEFAULT '{}',
    "statusCode" TEXT NOT NULL DEFAULT 'NEVER_USED',
    "lastSuccessAt" TIMESTAMP(3),
    "lastError" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "backup_provider_configs_pkey" PRIMARY KEY ("providerCode")
);

-- CreateTable
CREATE TABLE "backup_provider_statuses" (
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "backup_provider_statuses_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "backup_oauth_states" (
    "state" TEXT NOT NULL,
    "providerCode" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "codeVerifier" TEXT,
    "redirectTo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "backup_oauth_states_pkey" PRIMARY KEY ("state")
);

-- CreateIndex
CREATE INDEX "backup_provider_configs_statusCode_idx" ON "backup_provider_configs"("statusCode");

-- CreateIndex
CREATE INDEX "backup_oauth_states_expiresAt_idx" ON "backup_oauth_states"("expiresAt");

-- AddForeignKey
ALTER TABLE "backup_provider_configs" ADD CONSTRAINT "backup_provider_configs_providerCode_fkey" FOREIGN KEY ("providerCode") REFERENCES "backup_providers"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "backup_provider_configs" ADD CONSTRAINT "backup_provider_configs_statusCode_fkey" FOREIGN KEY ("statusCode") REFERENCES "backup_provider_statuses"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed the place-status lookup. Mirrored in prisma/seed.sql.
INSERT INTO "backup_provider_statuses" ("code","label","sortOrder","isActive") VALUES
  ('NEVER_USED','Never used',0,true),
  ('OK','OK',1,true),
  ('NEEDS_RECONNECT','Needs reconnecting',2,true),
  ('ERROR','Error',3,true)
ON CONFLICT ("code") DO NOTHING;

