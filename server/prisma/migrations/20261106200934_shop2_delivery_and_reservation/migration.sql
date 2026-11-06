-- CreateTable
CREATE TABLE "delivery_pricing_modes" (
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "delivery_pricing_modes_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "delivery_zones" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "fee" DECIMAL(14,2) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storefront_fulfillment_methods" (
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "storefront_fulfillment_methods_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "storefront_payment_methods" (
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "storefront_payment_methods_pkey" PRIMARY KEY ("code")
);

-- Insert lookup rows needed before foreign keys
INSERT INTO "delivery_pricing_modes" ("code", "label", "sortOrder", "isActive") VALUES
  ('FREE',    'Free',     10, true),
  ('FLAT',    'Flat fee', 20, true),
  ('BY_ZONE', 'By zone',  30, true)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "storefront_fulfillment_methods" ("code", "label", "sortOrder", "isActive") VALUES
  ('PICKUP',   'Pickup',   10, true),
  ('DELIVERY', 'Delivery', 20, true)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "storefront_payment_methods" ("code", "label", "sortOrder", "isActive") VALUES
  ('ON_RECEIPT', 'On receipt', 10, true),
  ('ONLINE',     'Online',     20, true)
ON CONFLICT ("code") DO NOTHING;

-- Status lookups update
INSERT INTO "storefront_order_statuses" ("code", "label", "sortOrder", "isTerminal", "isActive") VALUES
  ('SHIPPED', 'Shipped', 25, false, true)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "device_statuses" ("code", "label", "sortOrder", "isTerminal") VALUES
  ('RESERVED', 'Reserved', 25, false)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "cash_transaction_types" ("code", "label", "sortOrder", "isActive") VALUES
  ('DELIVERY_FEE', 'Delivery fee', 190, true)
ON CONFLICT ("code") DO NOTHING;

-- AlterTable
ALTER TABLE "cash_transactions" ADD COLUMN "orderId" TEXT;

-- AlterTable
ALTER TABLE "storefront_orders" ADD COLUMN "address" VARCHAR(500),
ADD COLUMN "deliveryFeeSnapshot" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN "deliveryZoneId" TEXT,
ADD COLUMN "deviceId" TEXT,
ADD COLUMN "fulfillmentMethodCode" TEXT NOT NULL DEFAULT 'PICKUP',
ADD COLUMN "paymentMethodCode" TEXT NOT NULL DEFAULT 'ON_RECEIPT',
ADD COLUMN "priceSnapshot" DECIMAL(14,2);

-- AlterTable
ALTER TABLE "storefront_settings" ADD COLUMN "deliveryEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "deliveryFlatFee" DECIMAL(14,2),
ADD COLUMN "deliveryFreeFrom" DECIMAL(14,2),
ADD COLUMN "deliveryNote" VARCHAR(300),
ADD COLUMN "deliveryPricingModeCode" TEXT NOT NULL DEFAULT 'FREE',
ADD COLUMN "pickupEnabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX "delivery_zones_name_key" ON "delivery_zones"("name");

-- CreateIndex
CREATE INDEX "cash_transactions_orderId_idx" ON "cash_transactions"("orderId");

-- CreateIndex
CREATE INDEX "storefront_orders_fulfillmentMethodCode_idx" ON "storefront_orders"("fulfillmentMethodCode");

-- CreateIndex
CREATE INDEX "storefront_orders_paymentMethodCode_idx" ON "storefront_orders"("paymentMethodCode");

-- CreateIndex
CREATE INDEX "storefront_orders_deliveryZoneId_idx" ON "storefront_orders"("deliveryZoneId");

-- CreateIndex
CREATE INDEX "storefront_orders_deviceId_idx" ON "storefront_orders"("deviceId");

-- Partial unique index ensuring at most one open order holds a device unit
CREATE UNIQUE INDEX "storefront_orders_device_held_idx" ON "storefront_orders" ("deviceId")
WHERE "deviceId" IS NOT NULL AND "statusCode" IN ('NEW', 'CONTACTED', 'SHIPPED');

-- AddForeignKey
ALTER TABLE "cash_transactions" ADD CONSTRAINT "cash_transactions_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "storefront_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storefront_settings" ADD CONSTRAINT "storefront_settings_deliveryPricingModeCode_fkey" FOREIGN KEY ("deliveryPricingModeCode") REFERENCES "delivery_pricing_modes"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storefront_orders" ADD CONSTRAINT "storefront_orders_fulfillmentMethodCode_fkey" FOREIGN KEY ("fulfillmentMethodCode") REFERENCES "storefront_fulfillment_methods"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storefront_orders" ADD CONSTRAINT "storefront_orders_deliveryZoneId_fkey" FOREIGN KEY ("deliveryZoneId") REFERENCES "delivery_zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storefront_orders" ADD CONSTRAINT "storefront_orders_paymentMethodCode_fkey" FOREIGN KEY ("paymentMethodCode") REFERENCES "storefront_payment_methods"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storefront_orders" ADD CONSTRAINT "storefront_orders_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
