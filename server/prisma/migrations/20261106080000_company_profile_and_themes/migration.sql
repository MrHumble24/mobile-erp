-- CreateTable: themes
CREATE TABLE "themes" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "themes_pkey" PRIMARY KEY ("code")
);

-- Seed lookup themes
INSERT INTO "themes" ("code", "name", "sortOrder", "isActive", "createdAt", "updatedAt") VALUES
  ('caldera',  'Caldera Light', 10, true, now(), now()),
  ('obsidian', 'Obsidian Dark', 20, true, now(), now()),
  ('sand',     'Warm Sand',     30, true, now(), now()),
  ('nord',     'Nord Slate',    40, true, now(), now())
ON CONFLICT ("code") DO NOTHING;

-- CreateTable: company_profiles
CREATE TABLE "company_profiles" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "name" TEXT NOT NULL DEFAULT 'Malika ERP',
    "legalName" TEXT,
    "logoFile" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "country" TEXT NOT NULL DEFAULT 'UZ',
    "timeZone" TEXT NOT NULL DEFAULT 'Asia/Tashkent',
    "defaultLanguage" TEXT NOT NULL DEFAULT 'uz',
    "currencyCode" TEXT NOT NULL DEFAULT 'USD',
    "currencySign" TEXT NOT NULL DEFAULT '$',
    "currencySignPosition" TEXT NOT NULL DEFAULT 'before',
    "currencyDecimals" INTEGER NOT NULL DEFAULT 2,
    "themeCode" TEXT NOT NULL DEFAULT 'caldera',
    "sessionDuration" TEXT NOT NULL DEFAULT '12h',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_profiles_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "company_profiles_themeCode_fkey" FOREIGN KEY ("themeCode") REFERENCES "themes"("code") ON UPDATE CASCADE ON DELETE RESTRICT
);

-- Data migration: populate company_profile if stores exist
DO $$
DECLARE
  v_store_name TEXT;
  v_store_address TEXT;
  v_store_phone TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM "stores") THEN
    SELECT "name", "address", "phone" INTO v_store_name, v_store_address, v_store_phone
    FROM "stores"
    ORDER BY "createdAt" ASC
    LIMIT 1;

    INSERT INTO "company_profiles" (
      "id", "name", "address", "phone", "themeCode", "defaultLanguage", "timeZone", "currencyCode", "currencySign", "currencySignPosition", "currencyDecimals", "sessionDuration", "updatedAt"
    ) VALUES (
      'default',
      COALESCE(v_store_name, 'Malika ERP'),
      v_store_address,
      v_store_phone,
      'caldera',
      'uz',
      'Asia/Tashkent',
      'USD',
      '$',
      'before',
      2,
      '12h',
      now()
    ) ON CONFLICT ("id") DO NOTHING;
  END IF;
END $$;
