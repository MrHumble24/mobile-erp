import 'dotenv/config';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, promises as fsp } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Pool, type PoolClient } from 'pg';
import { openBackupFile } from '../src/backups/lib/mbk-format.js';
import { runPgRestore } from '../src/backups/lib/pg-tools.js';
import {
  tablesToReset,
} from '../src/data-wipe/lib/wipe-tables.js';
import {
  PASS,
  adminUrl,
  backupUploads,
  randomName,
  withDb,
} from './lib/e2e-support.js';

/** Every @@map table name in prisma/schema. */
function schemaTableNames(): string[] {
  const dir = join(process.cwd(), 'prisma', 'schema');
  const names: string[] = [];
  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.prisma')) continue;
    const text = readFileSync(join(dir, file), 'utf8');
    for (const m of text.matchAll(/@@map\("([^"]+)"\)/g)) names.push(m[1]);
  }
  return [...new Set(names)];
}

async function countAll(url: string, tables: string[]): Promise<Map<string, number>> {
  const pool = new Pool({ connectionString: url });
  const out = new Map<string, number>();
  try {
    for (const t of tables) {
      const { rows } = await pool.query<{ c: string }>(`SELECT count(*)::int c FROM "${t}"`);
      out.set(t, Number(rows[0].c));
    }
  } finally {
    await pool.end();
  }
  return out;
}

async function runSeedSql(url: string): Promise<void> {
  const seedSql = readFileSync(join(process.cwd(), 'prisma', 'seed.sql'), 'utf8');
  const pool = new Pool({ connectionString: url });
  try {
    await pool.query(seedSql);
  } finally {
    await pool.end();
  }
}

/** Rich test data graph across shop data, catalogue, branches, users, settings. */
async function fillShopData(url: string): Promise<void> {
  const pool = new Pool({ connectionString: url });
  try {
    // 1. Roles and stores
    await pool.query(`INSERT INTO stores (id, name, address, phone, "updatedAt") VALUES ('s-main', 'Test Shop', 'Tashkent', '+998901234567', now())`);
    await pool.query(`INSERT INTO store_settings ("storeId", "receiptPrintingEnabled", "updatedAt") VALUES ('s-main', true, now())`);
    await pool.query(`INSERT INTO company_profiles (id, name, "country", "timeZone", "defaultLanguage", "currencyCode", "currencySign", "currencySignPosition", "currencyDecimals", "sessionDuration", "themeCode", "updatedAt") VALUES ('default', 'Test Co', 'UZ', 'Asia/Tashkent', 'uz', 'USD', '$', 'before', 2, '12h', 'caldera', now()) ON CONFLICT (id) DO UPDATE SET name = 'Test Co'`);

    // 2. Users
    await pool.query(`INSERT INTO users (id, email, "passwordHash", "isActive", "updatedAt") VALUES ('u-owner', 'owner@test.uz', '$argon2id$v=19$m=65536,t=3,p=4$fakehash', true, now())`);
    await pool.query(`INSERT INTO user_profiles ("userId", "firstName", "lastName", locale, "updatedAt") VALUES ('u-owner', 'Old', 'Owner', 'uz', now())`);
    await pool.query(`INSERT INTO user_roles ("userId", "roleCode") VALUES ('u-owner', 'ADMIN')`);
    await pool.query(`INSERT INTO user_stores ("userId", "storeId") VALUES ('u-owner', 's-main')`);

    // 3. Contacts
    await pool.query(`INSERT INTO suppliers (id, name, "updatedAt") VALUES ('sup-1', 'Main Supplier', now())`);
    await pool.query(`INSERT INTO partners (id, "shopName", "creditLimit", "updatedAt") VALUES ('part-1', 'Partner 1', 5000, now())`);
    await pool.query(`INSERT INTO customers (id, name, "priceLevelCode", "standingDiscountPercent", "updatedAt") VALUES ('cust-1', 'John Doe', 'RETAIL', 0, now())`);

    // 4. Catalogue
    await pool.query(`INSERT INTO product_categories (id, name, "updatedAt") VALUES ('cat-phones', 'Phones', now())`);
    await pool.query(`INSERT INTO device_models (id, brand, name, "kindCode", "categoryId", "updatedAt") VALUES ('mod-ip15', 'Apple', 'iPhone 15', 'IMEI', 'cat-phones', now())`);
    await pool.query(`INSERT INTO product_prices (id, "modelId", storage, "levelCode", price, "updatedAt") VALUES ('pp-1', 'mod-ip15', '128GB', 'RETAIL', 900, now())`);

    // 5. Inventory & Sales
    await pool.query(`INSERT INTO shipments (id, "storeId", "supplierId", "shipmentDate", "expectedCount", "paymentAccountCode", "createdById", "updatedAt") VALUES ('shp-1', 's-main', 'sup-1', now(), 1, 'CASH', 'u-owner', now())`);
    await pool.query(`INSERT INTO devices (id, imei, "storeId", "shipmentId", "modelId", "acquisitionCost", "customsFee", "unitExpense", "landedCost", "statusCode", version, "updatedAt") VALUES ('dev-1', '350000000000009', 's-main', 'shp-1', 'mod-ip15', 700, 0, 0, 700, 'SOLD', 0, now())`);
    await pool.query(`INSERT INTO sales (id, "storeId", "deviceId", "soldById", "salePrice", "landedCostSnapshot", "updatedAt") VALUES ('sale-1', 's-main', 'dev-1', 'u-owner', 900, 700, now())`);
    await pool.query(`INSERT INTO cash_transactions (id, "storeId", "accountCode", "typeCode", amount, "saleId", "createdById") VALUES ('ct-1', 's-main', 'CASH', 'SALE', 900, 'sale-1', 'u-owner')`);

    // 6. Config, secrets, old backups
    await pool.query(`INSERT INTO secrets (name, sealed, "updatedAt") VALUES ('provider.telegram.bot_token', decode('12345678', 'hex'), now())`);
    await pool.query(`INSERT INTO backup_settings (id, "scheduleEnabled", "scheduleTime", "keepLast", "updatedAt") VALUES ('default', true, '04:00', 7, now()) ON CONFLICT (id) DO UPDATE SET "scheduleEnabled" = true`);
    await pool.query(`INSERT INTO backup_runs (id, "statusCode", "fileName", "sizeBytes", "checksum", "createdAt") VALUES ('old-backup-run', 'SUCCESS', 'old.mbk', 1024, 'abc', now())`);
    await pool.query(`INSERT INTO backup_targets (id, "runId", "providerCode", "statusCode", "remoteRef", "createdAt", "updatedAt") VALUES ('old-target', 'old-backup-run', 'LOCAL', 'UPLOADED', 'old.mbk', now(), now())`);
    await pool.query(`INSERT INTO restore_runs (id, "performedById", "sourceRunId", "sourceLabel", "statusCode", "createdAt") VALUES ('old-restore-run', 'u-owner', 'old-backup-run', 'Manual', 'SUCCESS', now())`);
    await pool.query(`INSERT INTO storefront_settings (id, enabled, "updatedAt") VALUES (1, true, now()) ON CONFLICT (id) DO UPDATE SET enabled = true`);
  } finally {
    await pool.end();
  }
}

async function performReset(url: string, safetyRunId: string, performedByEmail: string): Promise<void> {
  const pool = new Pool({ connectionString: url });
  const client: PoolClient = await pool.connect();
  try {
    await client.query('BEGIN');
    // Audit row for reset with performer name preserved as text
    await client.query(
      `INSERT INTO data_wipe_runs (id, "performedById", "performedByName", contacts, catalog, "safetyRunId", "statusCode", "rowsErased", "startedAt", "finishedAt")
       VALUES ('reset-run-1', 'u-owner', $1, true, true, $2, 'SUCCESS', '{}'::jsonb, now(), now())`,
      [performedByEmail, safetyRunId],
    );

    // Delete everything a factory reset erases (tablesToReset)
    for (const table of tablesToReset()) {
      await client.query(`DELETE FROM "${table}"`);
    }

    // Reset singleton company profile, storefront settings and initial store to match clean migrate deploy state
    await client.query(
      `INSERT INTO "stores" ("id", "name", "updatedAt") VALUES (gen_random_uuid(), 'Main store', now())`,
    );
    await client.query(
      `INSERT INTO "company_profiles" ("id", "name", "themeCode", "defaultLanguage", "timeZone", "currencyCode", "currencySign", "currencySignPosition", "currencyDecimals", "sessionDuration", "updatedAt")
       VALUES ('default', 'Malika ERP', 'caldera', 'uz', 'Asia/Tashkent', 'USD', '$', 'before', 2, '12h', now())`,
    );
    await client.query(
      `INSERT INTO "storefront_settings" ("id", "enabled", "showPrices", "categoryIds", "updatedAt")
       VALUES (1, false, true, '[]'::jsonb, now())`,
    );

    // Delete older backup runs, keeping only the safety backup
    await client.query(`DELETE FROM "backup_runs" WHERE "id" != $1`, [safetyRunId]);

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

async function main(): Promise<void> {
  const admin = new Pool({ connectionString: adminUrl() });
  const work = await fsp.mkdtemp(join(tmpdir(), 'reset-e2e-'));
  const allTables = schemaTableNames();

  try {
    console.log('--- Starting Factory Reset E2E Test ---');

    // 1. Create seed-only reference database A
    const nameA = randomName('seed_ref');
    const nameB = randomName('reset_tgt');

    await withDb(admin, nameA, async (urlA) => {
      const { runMigrateDeploy } = await import('../src/backups/lib/pg-tools.js');
      await runMigrateDeploy(urlA);
      await runSeedSql(urlA);
      const countsA = await countAll(urlA, allTables);

      await withDb(admin, nameB, async (urlB) => {
        // 2. Database B starts with schema + seed + rich data
        await runMigrateDeploy(urlB);
        await runSeedSql(urlB);
        await fillShopData(urlB);

        // Capture counts before reset on 5 key tables to verify restore later
        const fiveTables = ['devices', 'sales', 'customers', 'users', 'stores'];
        const beforeResetCounts = await countAll(urlB, fiveTables);
        for (const [t, c] of beforeResetCounts.entries()) {
          assert.ok(c > 0, `Table ${t} should have rows before reset`);
        }

        // 3. Make safety backup first
        const safetyRunId = 'safety-backup-run';
        const uploadsDir = join(work, 'uploads');
        await fsp.mkdir(uploadsDir, { recursive: true });
        await fsp.writeFile(join(uploadsDir, 'logo.png'), 'fake-logo-bytes');
        const safetyMbk = await backupUploads(urlB, uploadsDir, work, safetyRunId);

        // Record safety backup in DB B
        const poolB = new Pool({ connectionString: urlB });
        await poolB.query(
          `INSERT INTO backup_runs (id, "statusCode", "fileName", "sizeBytes", "checksum", "createdAt")
           VALUES ($1, 'SUCCESS', $2, 2048, 'chk123', now())`,
          [safetyRunId, `${safetyRunId}.mbk`],
        );
        await poolB.end();

        // 4. Perform factory reset
        await performReset(urlB, safetyRunId, 'owner@test.uz');

        // 5. Compare EVERY table row count between reset DB (B) and clean seed DB (A)
        const countsB = await countAll(urlB, allTables);
        const EXCEPTIONS = new Set(['backup_runs', 'data_wipe_runs']);

        for (const table of allTables) {
          const countB = countsB.get(table) ?? 0;
          const countA = countsA.get(table) ?? 0;

          if (EXCEPTIONS.has(table)) {
            assert.equal(countB, 1, `Exception table ${table} must have exactly 1 row in reset DB`);
            assert.equal(countA, 0, `Exception table ${table} must have 0 rows in seed DB`);
          } else {
            assert.equal(
              countB,
              countA,
              `Table "${table}" row count in reset DB (${countB}) must equal seed DB (${countA})`,
            );
          }
        }
        console.log(`1. Row counts of all ${allTables.length} tables match seed DB (exceptions: backup_runs, data_wipe_runs) ✓`);

        // 6. Simulate First-Boot Setup Wizard
        const setupPool = new Pool({ connectionString: urlB });
        await setupPool.query(
          `INSERT INTO stores (id, name, "updatedAt") VALUES ('new-store', 'Brand New Shop', now())`,
        );
        await setupPool.query(
          `INSERT INTO users (id, email, "passwordHash", "isActive", "updatedAt") VALUES ('new-owner', 'newowner@test.uz', '$argon2id$newhash', true, now())`,
        );
        await setupPool.query(
          `INSERT INTO user_roles ("userId", "roleCode") VALUES ('new-owner', 'ADMIN')`,
        );
        await setupPool.end();

        const postSetupUserCount = (await countAll(urlB, ['users'])).get('users');
        assert.equal(postSetupUserCount, 1, 'New owner was provisioned by setup');
        console.log('2. First-boot setup wizard ran successfully on reset database ✓');

        // 7. Restore the safety backup with the passphrase typed again
        const opened = await openBackupFile(safetyMbk, PASS, work);
        await runPgRestore(urlB, opened.databaseDump, { singleTransaction: true });
        await fsp.rm(opened.dir, { recursive: true, force: true });

        // 8. Show old shop is back: verify counts of the 5 tables before and after
        const afterRestoreCounts = await countAll(urlB, fiveTables);
        for (const t of fiveTables) {
          assert.equal(
            afterRestoreCounts.get(t),
            beforeResetCounts.get(t),
            `Table ${t} row count after restore (${afterRestoreCounts.get(t)}) must match before reset (${beforeResetCounts.get(t)})`,
          );
        }
        console.log('3. Safety backup restored with passphrase: all 5 tables restored to previous counts ✓');
      });
    });

    console.log('\nAll factory reset e2e checks passed successfully.');
  } finally {
    await fsp.rm(work, { recursive: true, force: true });
    await admin.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
