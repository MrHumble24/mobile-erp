-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "priceLevelCode" TEXT NOT NULL DEFAULT 'RETAIL',
ADD COLUMN     "standingDiscountPercent" DECIMAL(5,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "sales" ADD COLUMN     "listPriceSnapshot" DECIMAL(14,2),
ADD COLUMN     "priceLevelCode" TEXT;

-- AlterTable
ALTER TABLE "store_settings" ADD COLUMN     "discountAmountAllowed" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "discountPercentAllowed" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "discountPresetsAmount" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "discountPresetsPercent" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "discountsEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxDiscountPercent" DECIMAL(5,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "price_levels" (
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "price_levels_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "product_prices" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "storage" TEXT NOT NULL DEFAULT '',
    "levelCode" TEXT NOT NULL,
    "price" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unit_prices" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "levelCode" TEXT NOT NULL,
    "price" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "unit_prices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_prices_modelId_idx" ON "product_prices"("modelId");

-- CreateIndex
CREATE UNIQUE INDEX "product_prices_modelId_storage_levelCode_key" ON "product_prices"("modelId", "storage", "levelCode");

-- CreateIndex
CREATE INDEX "unit_prices_deviceId_idx" ON "unit_prices"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "unit_prices_deviceId_levelCode_key" ON "unit_prices"("deviceId", "levelCode");

-- CreateIndex
CREATE INDEX "customers_priceLevelCode_idx" ON "customers"("priceLevelCode");

-- CreateIndex
CREATE INDEX "sales_priceLevelCode_idx" ON "sales"("priceLevelCode");

-- Seed the three price levels BEFORE the FKs validate (existing customers
-- default to 'RETAIL'). `migrate deploy` (Railway) never runs seed.sql, so the
-- rows every FK depends on are inserted here too, idempotently (ADR 0034).
INSERT INTO "price_levels" ("code", "label", "sortOrder") VALUES
  ('RETAIL',    'Retail (walk-in)', 10),
  ('WHOLESALE', 'Wholesale',        20),
  ('PARTNER',   'Partner shop',     30)
ON CONFLICT ("code") DO NOTHING;

-- AddForeignKey
ALTER TABLE "product_prices" ADD CONSTRAINT "product_prices_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "device_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_prices" ADD CONSTRAINT "product_prices_levelCode_fkey" FOREIGN KEY ("levelCode") REFERENCES "price_levels"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit_prices" ADD CONSTRAINT "unit_prices_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit_prices" ADD CONSTRAINT "unit_prices_levelCode_fkey" FOREIGN KEY ("levelCode") REFERENCES "price_levels"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_priceLevelCode_fkey" FOREIGN KEY ("priceLevelCode") REFERENCES "price_levels"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_priceLevelCode_fkey" FOREIGN KEY ("priceLevelCode") REFERENCES "price_levels"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- Permissions this code depends on (ADR 0034). ADMIN gets every permission via
-- the SELECT grant below, so only the rows + the ADMIN mapping are needed here;
-- cashiers get none by default.
INSERT INTO "permissions" ("code", "resource", "action", "description") VALUES
  ('price.manage',            'price', 'manage',             'Set product and unit prices for every level'),
  ('sale.price.override',     'sale',  'price.override',     'Sell at a free price, ignoring the list price'),
  ('sale.discount.unlimited', 'sale',  'discount.unlimited', 'Give a discount above the cashier limit')
ON CONFLICT ("code") DO UPDATE SET "description" = EXCLUDED."description";

INSERT INTO "role_permissions" ("roleCode", "permissionCode")
  SELECT 'ADMIN', code FROM "permissions"
  WHERE code IN ('price.manage', 'sale.price.override', 'sale.discount.unlimited')
    AND EXISTS (SELECT 1 FROM "roles" WHERE "code" = 'ADMIN')
ON CONFLICT DO NOTHING;
