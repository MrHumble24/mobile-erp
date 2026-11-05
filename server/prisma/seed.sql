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
  ('device.status.change', 'device',      'status.change', 'Move device between statuses'),
  ('shipment.read',        'shipment',    'read',      'View shipments'),
  ('shipment.manage',      'shipment',    'manage',    'Create / edit shipments and suppliers'),
  ('qc.read',              'qc',          'read',      'View QC inspections'),
  ('qc.create',            'qc',          'create',    'Record QC inspections'),
  ('sale.read',            'sale',        'read',      'View sales'),
  ('sale.create',          'sale',        'create',    'POS checkout'),
  ('sale.return',          'sale',        'return',    'Process warranty returns'),
  ('sale.profit.view',     'sale',        'profit.view', 'See net profit / margins'),
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
