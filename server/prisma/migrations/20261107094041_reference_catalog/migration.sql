-- Lookup reference tables (commit c78c668c) existed in the schema without a
-- migration; live databases got them by `db push`. IF NOT EXISTS keeps
-- `migrate deploy` working on both fresh and already-pushed databases.
CREATE TABLE IF NOT EXISTS "ref_apple_model_numbers" (
    "id" TEXT NOT NULL,
    "modelNumber" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "color" TEXT,
    "storage" TEXT,
    "ram" TEXT,
    "boxCode" TEXT,

    CONSTRAINT "ref_apple_model_numbers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ref_samsung_model_codes" (
    "modelCode" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "series" TEXT,
    "codename" TEXT,
    "storageOptions" TEXT[],
    "colorOptions" TEXT[],

    CONSTRAINT "ref_samsung_model_codes_pkey" PRIMARY KEY ("modelCode")
);

CREATE INDEX IF NOT EXISTS "ref_apple_model_numbers_modelNumber_idx" ON "ref_apple_model_numbers"("modelNumber");
CREATE INDEX IF NOT EXISTS "ref_apple_model_numbers_model_idx" ON "ref_apple_model_numbers"("model");
CREATE INDEX IF NOT EXISTS "ref_samsung_model_codes_model_idx" ON "ref_samsung_model_codes"("model");
