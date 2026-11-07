-- Dev seed for the repairs feature (Change 13 / ADR 0040). Idempotent: safe to
-- re-run. Run: pnpm seed:repairs-dev (from server/).
-- Fixed UUIDs keep every row identifiable and conflict-free across runs.

-- 1. Turn the feature on in every dev store (off by default, ADR 0040).
UPDATE store_settings SET "repairsEnabled" = true WHERE NOT "repairsEnabled";

-- 2. Uzbek fallback labels for the seeded statuses. The client resolves known
--    codes through i18n; these labels are the fallback for unknown codes and
--    any server-side rendering (Uzbek is the primary UI language).
UPDATE repair_statuses SET label = 'Qabul qilindi'  WHERE code = 'RECEIVED';
UPDATE repair_statuses SET label = 'Ta''mirda'      WHERE code = 'IN_REPAIR';
UPDATE repair_statuses SET label = 'Tayyor'         WHERE code = 'READY';
UPDATE repair_statuses SET label = 'Topshirildi'    WHERE code = 'GIVEN_BACK';
UPDATE repair_statuses SET label = 'Bekor qilindi'  WHERE code = 'CANCELLED';

-- 3. One QUANTITY product so the "Add part" flow has something to pick.
INSERT INTO device_models (id, brand, name, "isActive", "kindCode", attributes, "updatedAt")
SELECT 'a0000000-0000-4000-8000-000000000001', 'Universal', 'Ekran (ehtiyot qism)', true, 'QUANTITY', '[]'::jsonb, now()
WHERE NOT EXISTS (SELECT 1 FROM device_models WHERE id = 'a0000000-0000-4000-8000-000000000001');

-- 4. Stock for that part in every store (PURCHASE movement, append-only).
INSERT INTO stock_movements (id, "storeId", "modelId", "typeCode", quantity, "unitCostSnapshot", "createdById", "occurredAt", "createdAt", note)
SELECT
  'a0000000-0000-4000-8000-0000000000' || LPAD(s.seq::text, 2, '0'),
  s.id,
  'a0000000-0000-4000-8000-000000000001',
  'PURCHASE',
  10,
  25.00,
  u.id,
  now(),
  now(),
  'Dev seed: repair parts'
FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY name) AS seq FROM stores) s
CROSS JOIN (SELECT id FROM users WHERE email = 'owner@malika.uz' LIMIT 1) u
WHERE NOT EXISTS (
  SELECT 1 FROM stock_movements sm
  WHERE sm.id = 'a0000000-0000-4000-8000-0000000000' || LPAD(s.seq::text, 2, '0')
);

-- 5. One demo ticket in Main store with its initial RECEIVED history row.
INSERT INTO repairs (id, "ticketNumber", "storeId", "customerId", "deviceName", problem, "agreedPrice", "warrantyDays", "statusCode", "receivedById", "receivedAt", "createdAt", "updatedAt")
SELECT
  'a0000000-0000-4000-8000-000000000101',
  1,
  st.id,
  c.id,
  'iPhone 12',
  'Ekran singan, almashtirish kerak',
  350000.00,
  30,
  'RECEIVED',
  u.id,
  now(),
  now(),
  now()
FROM (SELECT id FROM stores WHERE name = 'Main store' LIMIT 1) st
CROSS JOIN (SELECT id FROM customers ORDER BY "createdAt" LIMIT 1) c
CROSS JOIN (SELECT id FROM users WHERE email = 'owner@malika.uz' LIMIT 1) u
WHERE NOT EXISTS (SELECT 1 FROM repairs WHERE id = 'a0000000-0000-4000-8000-000000000101');

INSERT INTO repair_status_history (id, "repairId", "fromStatusCode", "toStatusCode", "changedById", "changedAt", note)
SELECT 'a0000000-0000-4000-8000-000000000102', r.id, NULL, 'RECEIVED', r."receivedById", now(), 'Dev seed: ticket opened'
FROM repairs r
WHERE r.id = 'a0000000-0000-4000-8000-000000000101'
  AND NOT EXISTS (SELECT 1 FROM repair_status_history WHERE id = 'a0000000-0000-4000-8000-000000000102');
