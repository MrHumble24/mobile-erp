-- CreateTable
CREATE TABLE "online_payment_providers" (
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "online_payment_providers_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "online_payment_statuses" (
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "isTerminal" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "online_payment_statuses_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "online_payment_provider_configs" (
    "id" TEXT NOT NULL,
    "provider_code" TEXT NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "is_test_mode" BOOLEAN NOT NULL DEFAULT true,
    "allowed_ips" JSONB,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "online_payment_provider_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "online_payments" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "provider_code" TEXT NOT NULL,
    "status_code" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "provider_trans_id" TEXT,
    "provider_prepare_id" TEXT,
    "raw_payload" JSONB,
    "reason" TEXT,
    "paid_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "refunded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "online_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "online_payment_provider_configs_provider_code_key" ON "online_payment_provider_configs"("provider_code");

-- CreateIndex
CREATE INDEX "online_payments_order_id_idx" ON "online_payments"("order_id");

-- CreateIndex
CREATE INDEX "online_payments_status_code_idx" ON "online_payments"("status_code");

-- CreateIndex
CREATE UNIQUE INDEX "online_payments_provider_code_provider_trans_id_key" ON "online_payments"("provider_code", "provider_trans_id");

-- AddForeignKey
ALTER TABLE "online_payment_provider_configs" ADD CONSTRAINT "online_payment_provider_configs_provider_code_fkey" FOREIGN KEY ("provider_code") REFERENCES "online_payment_providers"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "online_payments" ADD CONSTRAINT "online_payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "storefront_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "online_payments" ADD CONSTRAINT "online_payments_provider_code_fkey" FOREIGN KEY ("provider_code") REFERENCES "online_payment_providers"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "online_payments" ADD CONSTRAINT "online_payments_status_code_fkey" FOREIGN KEY ("status_code") REFERENCES "online_payment_statuses"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Lookups and initial configurations for online payments
INSERT INTO "online_payment_providers" ("code", "label", "isActive", "sortOrder") VALUES
  ('PAYME', 'Payme', true, 10),
  ('CLICK', 'Click', true, 20)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "online_payment_statuses" ("code", "label", "isTerminal", "sortOrder") VALUES
  ('CREATED', 'Created', false, 10),
  ('PAID', 'Paid', false, 20),
  ('CANCELLED', 'Cancelled', true, 30),
  ('REFUND_DUE', 'Refund Due', false, 40),
  ('REFUNDED', 'Refunded', true, 50)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "online_payment_provider_configs" ("id", "provider_code", "is_enabled", "is_test_mode", "settings", "updated_at") VALUES
  (gen_random_uuid()::text, 'PAYME', false, true, '{}'::jsonb, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'CLICK', false, true, '{}'::jsonb, CURRENT_TIMESTAMP)
ON CONFLICT ("provider_code") DO NOTHING;

-- Ledger accounts for online payment providers
INSERT INTO "cash_accounts" ("code", "label", "sortOrder") VALUES
  ('PAYME', 'Payme', 30),
  ('CLICK', 'Click', 40)
ON CONFLICT ("code") DO NOTHING;

-- Permissions for online payment refunds
INSERT INTO "permissions" ("code", "resource", "action", "description") VALUES
  ('payment.refund', 'payment', 'refund', 'Mark an online payment refunded')
ON CONFLICT ("code") DO UPDATE SET "description" = EXCLUDED."description";

INSERT INTO "role_permissions" ("roleCode", "permissionCode")
  SELECT 'ADMIN', "code" FROM "permissions" WHERE "code" = 'payment.refund'
  AND EXISTS (SELECT 1 FROM "roles" WHERE "code" = 'ADMIN')
ON CONFLICT DO NOTHING;
