-- CreateTable
CREATE TABLE "storefront_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "showPrices" BOOLEAN NOT NULL DEFAULT true,
    "contactPhone" TEXT,
    "contactTelegram" TEXT,
    "categoryIds" JSONB NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "storefront_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storefront_order_statuses" (
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isTerminal" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "storefront_order_statuses_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "storefront_orders" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "specs" JSONB NOT NULL DEFAULT '{}',
    "customerName" VARCHAR(100) NOT NULL,
    "customerPhone" VARCHAR(30) NOT NULL,
    "note" VARCHAR(1000),
    "statusCode" TEXT NOT NULL DEFAULT 'NEW',
    "handledById" TEXT,
    "handledAt" TIMESTAMP(3),
    "saleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "storefront_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storefront_order_status_history" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "fromStatusCode" TEXT,
    "toStatusCode" TEXT NOT NULL,
    "changedById" TEXT,
    "note" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "storefront_order_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "storefront_orders_storeId_idx" ON "storefront_orders"("storeId");

-- CreateIndex
CREATE INDEX "storefront_orders_modelId_idx" ON "storefront_orders"("modelId");

-- CreateIndex
CREATE INDEX "storefront_orders_statusCode_idx" ON "storefront_orders"("statusCode");

-- CreateIndex
CREATE INDEX "storefront_orders_createdAt_idx" ON "storefront_orders"("createdAt");

-- CreateIndex
CREATE INDEX "storefront_order_status_history_orderId_changedAt_idx" ON "storefront_order_status_history"("orderId", "changedAt");

-- AddForeignKey
ALTER TABLE "storefront_orders" ADD CONSTRAINT "storefront_orders_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storefront_orders" ADD CONSTRAINT "storefront_orders_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "device_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storefront_orders" ADD CONSTRAINT "storefront_orders_statusCode_fkey" FOREIGN KEY ("statusCode") REFERENCES "storefront_order_statuses"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storefront_orders" ADD CONSTRAINT "storefront_orders_handledById_fkey" FOREIGN KEY ("handledById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storefront_orders" ADD CONSTRAINT "storefront_orders_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storefront_order_status_history" ADD CONSTRAINT "storefront_order_status_history_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "storefront_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storefront_order_status_history" ADD CONSTRAINT "storefront_order_status_history_fromStatusCode_fkey" FOREIGN KEY ("fromStatusCode") REFERENCES "storefront_order_statuses"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storefront_order_status_history" ADD CONSTRAINT "storefront_order_status_history_toStatusCode_fkey" FOREIGN KEY ("toStatusCode") REFERENCES "storefront_order_statuses"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storefront_order_status_history" ADD CONSTRAINT "storefront_order_status_history_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Lookups & Reference data
INSERT INTO "storefront_order_statuses" ("code", "label", "sortOrder", "isTerminal", "isActive") VALUES
  ('NEW', 'New', 10, false, true),
  ('CONTACTED', 'Contacted', 20, false, true),
  ('DONE', 'Done', 30, true, true),
  ('CANCELLED', 'Cancelled', 40, true, true)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "storefront_settings" ("id", "enabled", "showPrices", "categoryIds", "updatedAt") VALUES
  (1, false, true, '[]'::jsonb, now())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "permissions" ("code", "resource", "action", "description") VALUES
  ('order.read',   'order', 'read',   'View storefront orders'),
  ('order.manage', 'order', 'manage', 'Manage storefront order status')
ON CONFLICT ("code") DO UPDATE SET "description" = EXCLUDED."description";

INSERT INTO "role_permissions" ("roleCode", "permissionCode")
SELECT r.role, r.perm
FROM (VALUES
  ('ADMIN', 'order.read'),
  ('ADMIN', 'order.manage'),
  ('CASHIER', 'order.read'),
  ('CASHIER', 'order.manage')
) AS r(role, perm)
JOIN "roles" ro ON ro."code" = r.role
JOIN "permissions" p ON p."code" = r.perm
ON CONFLICT DO NOTHING;

