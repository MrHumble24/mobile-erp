-- Dev seed: demo stores, store settings, and demo user store links (ADR 0045, handoff 026)
-- Run: pnpm seed:dev (or prisma db execute --file prisma/seed.dev.sql)

INSERT INTO stores (id, name, "updatedAt")
SELECT gen_random_uuid(), 'Main store', now()
WHERE NOT EXISTS (SELECT 1 FROM stores WHERE name = 'Main store');

INSERT INTO stores (id, name, "updatedAt")
SELECT gen_random_uuid(), 'Branch 2', now()
WHERE NOT EXISTS (SELECT 1 FROM stores WHERE name = 'Branch 2');

INSERT INTO store_settings ("storeId", "updatedAt")
SELECT s.id, now()
FROM stores s
WHERE NOT EXISTS (SELECT 1 FROM store_settings ss WHERE ss."storeId" = s.id);

-- Dev user store assignments
-- Owner belongs to all stores; cashier belongs only to Main store.
INSERT INTO user_stores ("userId", "storeId")
SELECT u.id, s.id
FROM users u
CROSS JOIN stores s
WHERE u.email = 'owner@malika.uz'
ON CONFLICT DO NOTHING;

INSERT INTO user_stores ("userId", "storeId")
SELECT u.id, s.id
FROM users u
JOIN stores s ON s.name = 'Main store'
WHERE u.email = 'cashier@malika.uz'
ON CONFLICT DO NOTHING;
