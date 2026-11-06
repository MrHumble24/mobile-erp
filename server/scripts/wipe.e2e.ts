import 'dotenv/config';
import assert from 'node:assert/strict';
import { promises as fsp } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Pool, type PoolClient } from 'pg';
import { openBackupFile } from '../src/backups/lib/mbk-format.js';
import { runPgRestore } from '../src/backups/lib/pg-tools.js';
import {
  ALWAYS_TABLES,
  CATALOG_TABLES,
  CONTACTS_TABLES,
  KEPT_TABLES,
  tablesToErase,
  type WipeOptions,
} from '../src/data-wipe/lib/wipe-tables.js';
import {
  PASS,
  adminUrl,
  backupUploads,
  copyFromSource,
  dropDb,
  randomName,
  withDb,
} from './lib/e2e-support.js';

/**
 * Real-database proof of the data wipe (pnpm test:wipe). Kept out of `pnpm test`
 * so the unit suite stays fast and DB-free. Creates and drops its own throwaway
 * databases; never touches a database it did not create.
 *
 *   1. erase with no extras: every ALWAYS table empty, CONTACTS/CATALOG/KEPT kept
 *   2. erase with both extras: those empty too, KEPT untouched
 *   3. a failure injected mid-erase leaves every table exactly as it was
 *   4. erase, then restore the safety backup: the data is back
 */

/** A small connected graph across every group, using existing lookups. */
async function seed(url: string): Promise<void> {
  const pool = new Pool({ connectionString: url });
  try {
    const store = (await pool.query<{ id: string }>('SELECT id FROM stores LIMIT 1')).rows[0];
    const user = (await pool.query<{ id: string }>('SELECT id FROM users LIMIT 1')).rows[0];
    assert.ok(store && user, 'the copied database must have a store and a user');
    const s = store.id;
    const u = user.id;
    await pool.query(`INSERT INTO suppliers (id, name, "updatedAt") VALUES ('w-sup', 'W Supplier', now())`);
    await pool.query(`INSERT INTO partners (id, "shopName", "creditLimit", "updatedAt") VALUES ('w-par', 'W Partner', 0, now())`);
    await pool.query(`INSERT INTO customers (id, name, "priceLevelCode", "standingDiscountPercent", "updatedAt") VALUES ('w-cus', 'W Customer', 'RETAIL', 0, now())`);
    await pool.query(`INSERT INTO product_categories (id, name, "updatedAt") VALUES ('w-cat', 'W Category', now())`);
    await pool.query(`INSERT INTO device_models (id, brand, name, "kindCode", "categoryId", "updatedAt") VALUES ('w-mod', 'W', 'Model', 'IMEI', 'w-cat', now())`);
    await pool.query(`INSERT INTO product_prices (id, "modelId", storage, "levelCode", price, "updatedAt") VALUES ('w-pp', 'w-mod', '', 'RETAIL', 100, now())`);
    await pool.query(`INSERT INTO stock_alert_rules (id, "modelId", storage, threshold, "updatedAt") VALUES ('w-sar', 'w-mod', '128GB', 2, now())`);
    await pool.query(`INSERT INTO shipments (id, "storeId", "supplierId", "shipmentDate", "expectedCount", "paymentAccountCode", "createdById", "updatedAt") VALUES ('w-shp', $1, 'w-sup', now(), 1, 'CASH', $2, now())`, [s, u]);
    await pool.query(`INSERT INTO devices (id, imei, "storeId", "shipmentId", "modelId", "acquisitionCost", "customsFee", "unitExpense", "landedCost", "statusCode", version, "updatedAt") VALUES ('w-dev', '350000000000001', $1, 'w-shp', 'w-mod', 100, 0, 0, 100, 'IN_STOCK', 0, now())`, [s]);
    await pool.query(`INSERT INTO unit_prices (id, "deviceId", "levelCode", price, "updatedAt") VALUES ('w-up', 'w-dev', 'WHOLESALE', 90, now())`);
    await pool.query(`INSERT INTO sales (id, "storeId", "deviceId", "soldById", "salePrice", "landedCostSnapshot", "updatedAt") VALUES ('w-sale', $1, 'w-dev', $2, 120, 100, now())`, [s, u]);
    await pool.query(`INSERT INTO cash_transactions (id, "storeId", "accountCode", "typeCode", amount, "saleId", "createdById") VALUES ('w-ct', $1, 'CASH', 'SALE', 120, 'w-sale', $2)`, [s, u]);
  } finally {
    await pool.end();
  }
}

async function countAll(url: string): Promise<Map<string, number>> {
  const pool = new Pool({ connectionString: url });
  const out = new Map<string, number>();
  try {
    const tables = [...ALWAYS_TABLES, ...CONTACTS_TABLES, ...CATALOG_TABLES, ...KEPT_TABLES];
    for (const t of tables) {
      const { rows } = await pool.query<{ c: string }>(`SELECT count(*)::int c FROM "${t}"`);
      out.set(t, Number(rows[0].c));
    }
  } finally {
    await pool.end();
  }
  return out;
}

/** Mirrors DataWipeRepository.erase: one transaction, FK-safe order, no cascade.
 * `failAfter` throws after that many deletes to prove nothing is erased. */
async function erase(url: string, opts: WipeOptions, failAfter?: number): Promise<void> {
  const pool = new Pool({ connectionString: url });
  const client: PoolClient = await pool.connect();
  try {
    await client.query('BEGIN');
    let done = 0;
    for (const table of tablesToErase(opts)) {
      await client.query(`DELETE FROM "${table}"`);
      if (failAfter !== undefined && ++done >= failAfter) {
        throw new Error('injected mid-erase failure');
      }
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

function assertAlwaysEmpty(after: Map<string, number>): void {
  for (const t of ALWAYS_TABLES) assert.equal(after.get(t), 0, `${t} must be empty`);
}

function assertUnchanged(before: Map<string, number>, after: Map<string, number>, tables: readonly string[]): void {
  for (const t of tables) assert.equal(after.get(t), before.get(t), `${t} must be unchanged`);
}

async function noExtras(admin: Pool, work: string): Promise<void> {
  const name = randomName('wipe_min');
  await withDb(admin, name, async (url) => {
    await copyFromSource(name, work);
    await seed(url);
    const before = await countAll(url);
    assert.ok((before.get('sales') ?? 0) > 0 && (before.get('devices') ?? 0) > 0, 'seed must add rows');
    await erase(url, { contacts: false, catalog: false });
    const after = await countAll(url);
    assertAlwaysEmpty(after);
    assertUnchanged(before, after, CONTACTS_TABLES);
    assertUnchanged(before, after, CATALOG_TABLES);
    assertUnchanged(before, after, KEPT_TABLES);
  });
  console.log('1. erase, no extras: ALWAYS empty, CONTACTS/CATALOG/KEPT kept   ✓');
}

async function bothExtras(admin: Pool, work: string): Promise<void> {
  const name = randomName('wipe_all');
  await withDb(admin, name, async (url) => {
    await copyFromSource(name, work);
    await seed(url);
    const before = await countAll(url);
    await erase(url, { contacts: true, catalog: true });
    const after = await countAll(url);
    assertAlwaysEmpty(after);
    for (const t of CONTACTS_TABLES) assert.equal(after.get(t), 0, `${t} must be empty`);
    for (const t of CATALOG_TABLES) assert.equal(after.get(t), 0, `${t} must be empty`);
    assertUnchanged(before, after, KEPT_TABLES);
  });
  console.log('2. erase, both extras: those empty too, KEPT untouched          ✓');
}

async function failHalfway(admin: Pool, work: string): Promise<void> {
  const name = randomName('wipe_fail');
  await withDb(admin, name, async (url) => {
    await copyFromSource(name, work);
    await seed(url);
    const before = await countAll(url);
    await assert.rejects(erase(url, { contacts: true, catalog: true }, 5), /injected mid-erase/);
    const after = await countAll(url);
    assertUnchanged(before, after, [...ALWAYS_TABLES, ...CONTACTS_TABLES, ...CATALOG_TABLES, ...KEPT_TABLES]);
  });
  console.log('3. failure mid-erase: every table exactly as it was             ✓');
}

async function eraseThenRestore(admin: Pool, work: string): Promise<void> {
  const name = randomName('wipe_restore');
  await withDb(admin, name, async (url) => {
    await copyFromSource(name, work);
    await seed(url);
    const before = await countAll(url);
    const uploads = join(work, `${name}-up`);
    await fsp.mkdir(uploads, { recursive: true });
    const mbk = await backupUploads(url, uploads, work, name); // the safety backup
    await erase(url, { contacts: true, catalog: true });
    const opened = await openBackupFile(mbk, PASS, work);
    await runPgRestore(url, opened.databaseDump, { singleTransaction: true });
    await fsp.rm(opened.dir, { recursive: true, force: true });
    const after = await countAll(url);
    assertUnchanged(before, after, [...ALWAYS_TABLES, ...CONTACTS_TABLES, ...CATALOG_TABLES, ...KEPT_TABLES]);
  });
  console.log('4. erase then restore the safety backup: the data is back       ✓');
}

async function main(): Promise<void> {
  const admin = new Pool({ connectionString: adminUrl() });
  const work = await fsp.mkdtemp(join(tmpdir(), 'wipe-e2e-'));
  try {
    await noExtras(admin, work);
    await bothExtras(admin, work);
    await failHalfway(admin, work);
    await eraseThenRestore(admin, work);
    console.log('\nAll data-wipe e2e checks passed.');
  } finally {
    await fsp.rm(work, { recursive: true, force: true });
    await admin.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
