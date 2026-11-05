-- Reference data. Idempotent: safe to re-run (ON CONFLICT DO NOTHING / DO UPDATE).
-- Run: pnpm prisma db seed

-- Lifecycle lookups ----------------------------------------------------------
INSERT INTO device_statuses (code, label, "sortOrder", "isTerminal") VALUES
  ('IN_STOCK',  'In stock',   10, false),
  ('DEFECTIVE', 'Defective',  20, false),
  ('CONSIGNED', 'Consigned',  30, false),
  ('SOLD',      'Sold',       40, true)
ON CONFLICT (code) DO NOTHING;

INSERT INTO consignment_statuses (code, label, "sortOrder", "isTerminal") VALUES
  ('OUT',      'Out with partner', 10, false),
  ('SETTLED',  'Settled',          20, true),
  ('RETURNED', 'Returned',         30, true)
ON CONFLICT (code) DO NOTHING;

-- Product kinds (ADR 0029). Also inserted by the migration for `migrate deploy`.
INSERT INTO product_kinds (code, label, "sortOrder") VALUES
  ('IMEI',     'Phone (IMEI)',                  10),
  ('SERIAL',   'Serial (console/laptop/watch)', 20),
  ('QUANTITY', 'Accessory (quantity)',          30)
ON CONFLICT (code) DO NOTHING;

-- Quantity stock movement types (ADR 0030). Also inserted by the migration.
INSERT INTO stock_movement_types (code, label, "sortOrder") VALUES
  ('PURCHASE',         'Purchase',         10),
  ('SALE',             'Sale',             20),
  ('RETURN',           'Return',           30),
  ('WRITE_OFF',        'Write-off',        40),
  ('COUNT_CORRECTION', 'Count correction', 50)
ON CONFLICT (code) DO NOTHING;

-- Price levels (Change 12, ADR 0034). Also inserted by the migration.
INSERT INTO price_levels (code, label, "sortOrder") VALUES
  ('RETAIL',    'Retail (walk-in)', 10),
  ('WHOLESALE', 'Wholesale',        20),
  ('PARTNER',   'Partner shop',     30)
ON CONFLICT (code) DO NOTHING;

INSERT INTO cosmetic_grades (code, label, "sortOrder") VALUES
  ('A', 'Like new', 10), ('B', 'Minor wear', 20), ('C', 'Visible wear', 30), ('D', 'Heavy wear', 40)
ON CONFLICT (code) DO NOTHING;

INSERT INTO defect_types (code, label, "sortOrder") VALUES
  ('SCREEN_SCRATCHES', 'Screen scratches', 10),
  ('FACE_ID',          'Face ID / biometrics issue', 20),
  ('CAMERA',           'Camera issue', 30),
  ('BATTERY',          'Battery below threshold', 40),
  ('SPEAKER_MIC',      'Speaker / microphone issue', 50),
  ('CHARGING_PORT',    'Charging port issue', 60)
ON CONFLICT (code) DO NOTHING;

INSERT INTO expense_categories (id, name, "sortOrder", "updatedAt") VALUES
  (gen_random_uuid(), 'Rent', 10, now()),
  (gen_random_uuid(), 'Salary', 20, now()),
  (gen_random_uuid(), 'Utilities', 30, now()),
  (gen_random_uuid(), 'Accessories', 40, now()),
  (gen_random_uuid(), 'Repair', 50, now()),
  (gen_random_uuid(), 'Other', 90, now())
ON CONFLICT (name) DO NOTHING;

-- Cash/card ledger lookups (ADR 0024). Accounts are added as rows over time.
INSERT INTO cash_accounts (code, label, "sortOrder") VALUES
  ('CASH', 'Cash', 10),
  ('CARD', 'Card', 20)
ON CONFLICT (code) DO NOTHING;

-- 2a seeds the manual + transfer types; 2b adds the automatic ones (posted by
-- the sale/return/expense/partner-payment/purchase/overhead paths, never picked
-- from this list by a user). Mirrored in the 2b migration for `migrate deploy`.
INSERT INTO cash_transaction_types (code, label, "sortOrder") VALUES
  ('OPENING',         'Opening balance',  10),
  ('DEPOSIT',         'Deposit',          20),
  ('WITHDRAWAL',      'Withdrawal',       30),
  ('CORRECTION',      'Correction',       40),
  ('TRANSFER',        'Transfer',         50),
  ('SALE',            'Sale',             60),
  ('REFUND',          'Refund',           70),
  ('PARTNER_PAYMENT', 'Partner payment',  80),
  ('PURCHASE',        'Device purchase',  90),
  ('OVERHEAD',        'Shipment overhead',100),
  ('EXPENSE',         'Expense',          110),
  ('DEVICE_EXPENSE',  'Device expense',   120),
  ('CUSTOMS',         'Customs fee',      130),
  ('CREDIT_PAYMENT',  'Credit payment',   140),
  ('SHIFT_DIFFERENCE','Shift difference', 150)
ON CONFLICT (code) DO NOTHING;

-- ADR 0026: per-phone expense supersedes shipment overhead. OVERHEAD stays in
-- the lookup (old history rows reference it) but is retired from the pickers.
UPDATE cash_transaction_types SET "isActive" = false WHERE code = 'OVERHEAD';

INSERT INTO store_settings (id, "updatedAt") VALUES (1, now()) ON CONFLICT (id) DO NOTHING;

-- Single store (ADR 0023). Store identity lives here; admins edit it via settings.
-- Idempotent: insert only when no store exists yet.
INSERT INTO stores (id, name, "updatedAt")
SELECT gen_random_uuid(), 'Main store', now()
WHERE NOT EXISTS (SELECT 1 FROM stores);

-- Permissions: "<resource>.<action>" ----------------------------------------
INSERT INTO permissions (code, resource, action, description) VALUES
  ('device.read',          'device',      'read',      'View inventory'),
  ('device.create',        'device',      'create',    'Register devices (IMEI intake)'),
  ('device.update',        'device',      'update',    'Edit device specs / target price'),
  ('device.cost.view',     'device',      'cost.view', 'See acquisition and landed cost'),
  ('device.expense',       'device',      'expense',   'Set or change a phone''s own expense'),
  ('customs.read',         'customs',     'read',      'View customs price lists and fees'),
  ('customs.manage',       'customs',     'manage',    'Create price-list versions and fix fees'),
  ('device.status.change', 'device',      'status.change', 'Move device between statuses'),
  ('shipment.read',        'shipment',    'read',      'View shipments'),
  ('shipment.manage',      'shipment',    'manage',    'Create / edit shipments and suppliers'),
  ('qc.read',              'qc',          'read',      'View QC inspections'),
  ('qc.create',            'qc',          'create',    'Record QC inspections'),
  ('sale.read',            'sale',        'read',      'View sales'),
  ('sale.create',          'sale',        'create',    'POS checkout'),
  ('sale.return',          'sale',        'return',    'Process warranty returns'),
  ('sale.profit.view',     'sale',        'profit.view', 'See net profit / margins'),
  ('sale.price.override',  'sale',        'price.override', 'Sell at a free price, ignoring the list price'),
  ('sale.discount.unlimited','sale',      'discount.unlimited', 'Give a discount above the cashier limit'),
  ('sale.credit',          'sale',        'credit',    'Sell on customer credit (nasiya)'),
  ('shift.manage',         'shift',       'manage',    'List and force-close any cashier''s shift'),
  ('price.manage',         'price',       'manage',    'Set product and unit prices for every level'),
  ('customer.read',        'customer',    'read',      'View customers'),
  ('customer.manage',      'customer',    'manage',    'Create / edit customers'),
  ('consignment.read',     'consignment', 'read',      'View consignments'),
  ('consignment.create',   'consignment', 'create',    'Hand devices to partners'),
  ('consignment.settle',   'consignment', 'settle',    'Settle or return consignments'),
  ('partner.read',         'partner',     'read',      'View partners and balances'),
  ('partner.manage',       'partner',     'manage',    'Create / edit partners'),
  ('partner.payment',      'partner',     'payment',   'Record partner payments'),
  ('expense.read',         'expense',     'read',      'View expenses'),
  ('expense.manage',       'expense',     'manage',    'Create / edit / delete expenses'),
  ('expense.category.manage','expense',   'category.manage', 'Manage expense categories'),
  ('balance.read',         'balance',     'read',      'View store cash/card balances and ledger history'),
  ('balance.manage',       'balance',     'manage',    'Record manual ledger entries and transfers'),
  ('stock.adjust',         'stock',       'adjust',    'Write off stock and correct counts'),
  ('report.finance',       'report',      'finance',   'Financial reports'),
  ('user.read',            'user',        'read',      'View users'),
  ('user.manage',          'user',        'manage',    'Create users, assign roles and permissions'),
  ('role.manage',          'role',        'manage',    'Create roles, edit role permissions'),
  ('settings.manage',      'settings',    'manage',    'Store settings and Telegram'),
  ('sync.resolve',         'sync',        'resolve',   'Resolve offline sync conflicts')
ON CONFLICT (code) DO UPDATE SET description = EXCLUDED.description;

-- Roles ----------------------------------------------------------------------
INSERT INTO roles (code, name, description, "isSystem", "updatedAt") VALUES
  ('ADMIN',   'Store Owner',       'Full access',                         true, now()),
  ('CASHIER', 'Manager / Cashier', 'POS, customers, consignment transfers', true, now()),
  ('QC',      'Inventory / QC',    'Intake, shipments, quality control',   true, now())
ON CONFLICT (code) DO NOTHING;

-- Role × permission matrix -----------------------------------------------------
INSERT INTO role_permissions ("roleCode", "permissionCode")
  SELECT 'ADMIN', code FROM permissions
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions ("roleCode", "permissionCode") VALUES
  ('CASHIER', 'device.read'), ('CASHIER', 'shipment.read'),
  ('CASHIER', 'sale.read'), ('CASHIER', 'sale.create'), ('CASHIER', 'sale.return'),
  ('CASHIER', 'customer.read'), ('CASHIER', 'customer.manage'),
  ('CASHIER', 'consignment.read'), ('CASHIER', 'consignment.create'),
  ('CASHIER', 'partner.read'),
  ('QC', 'device.read'), ('QC', 'device.create'), ('QC', 'device.update'), ('QC', 'device.status.change'),
  ('QC', 'shipment.read'), ('QC', 'shipment.manage'),
  ('QC', 'qc.read'), ('QC', 'qc.create')
ON CONFLICT DO NOTHING;
