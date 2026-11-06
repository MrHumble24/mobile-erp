import 'dotenv/config';
import assert from 'node:assert/strict';
import { promises as fsp } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Pool } from 'pg';
import { openBackupFile } from '../src/backups/lib/mbk-format.js';
import { runPgRestore } from '../src/backups/lib/pg-tools.js';
import { UploadSwap } from '../src/backups/lib/uploads-swap.js';
import {
  PASS,
  adminUrl,
  backupUploads,
  copyFromSource,
  dbUrl,
  dropDb,
  fakeMaintenance,
  fakeRecovery,
  getMarker,
  makeRunner,
  randomName,
  setMarker,
  withDb,
} from './lib/e2e-support.js';

/**
 * Real-database restore proof (pnpm test:restore). Kept out of `pnpm test` so the
 * unit suite stays fast and DB-free. Creates and drops its own throwaway
 * databases with random names — never touches a database it did not create.
 *
 *   1. make data → back up → change data → restore → data is the first data again
 *   2. a restore made to fail half-way leaves the changed data untouched
 *   3. a step after pg_restore (uploads swap) fails → DB + uploads roll back and
 *      the app leaves maintenance (A2)
 *   4. migrate deploy fails after pg_restore → same rollback (A2)
 */

async function roundTrip(admin: Pool, work: string): Promise<void> {
  const name = randomName('rt');
  await withDb(admin, name, async (url) => {
    await setMarker(url, 'FIRST');
    const uploads = join(work, `${name}-up`);
    await fsp.mkdir(uploads, { recursive: true });
    const mbk = await backupUploads(url, uploads, work, name);

    await setMarker(url, 'CHANGED'); // thrown away by the restore

    const opened = await openBackupFile(mbk, PASS, work);
    await runPgRestore(url, opened.databaseDump, { singleTransaction: true });
    await fsp.rm(opened.dir, { recursive: true, force: true });

    assert.equal(await getMarker(url), 'FIRST', 'restore should bring the first data back');
  });
  console.log('1. round-trip: data restored to its first value          ✓');
}

async function failHalfway(admin: Pool, work: string): Promise<void> {
  const name = randomName('fail');
  await withDb(admin, name, async (url) => {
    await setMarker(url, 'BACKED_UP');
    const uploads = join(work, `${name}-up`);
    await fsp.mkdir(uploads, { recursive: true });
    const mbk = await backupUploads(url, uploads, work, name);

    await setMarker(url, 'CHANGED_AFTER'); // must survive the failed restore

    const opened = await openBackupFile(mbk, PASS, work);
    const dump = opened.databaseDump;
    const { size } = await fsp.stat(dump);
    const fh = await fsp.open(dump, 'r+');
    await fh.truncate(Math.floor(size / 2)); // corrupt so pg_restore errors mid-tx
    await fh.close();

    let threw = false;
    try {
      await runPgRestore(url, dump, { singleTransaction: true });
    } catch {
      threw = true;
    }
    await fsp.rm(opened.dir, { recursive: true, force: true });

    assert.ok(threw, 'a corrupt restore should fail');
    assert.equal(await getMarker(url), 'CHANGED_AFTER', 'a failed restore leaves data untouched');
  });
  console.log('2. fail-half-way: changed data left untouched             ✓');
}

interface Hooks {
  /** Runs against the DB before the backup is made (breaks the backed-up state). */
  beforeBackup?: (url: string) => Promise<void>;
  /** Runs after the uploads swap is prepared (sabotages a later step). */
  afterPrepare?: (ctx: { url: string; live: string }) => Promise<void>;
}

/** Drives the real RestoreRunner so a post-pg_restore failure rolls back. */
async function rollbackScenario(
  admin: Pool,
  work: string,
  label: string,
  hooks: Hooks,
): Promise<void> {
  const name = randomName('rb');
  await admin.query(`CREATE DATABASE "${name}"`);
  const live = join(work, `${name}-live`);
  try {
    await copyFromSource(name, work);
    const url = dbUrl(name);
    await setMarker(url, 'FIRST');
    await fsp.mkdir(live, { recursive: true });
    await fsp.writeFile(join(live, 'pic.txt'), 'ORIGINAL');
    if (hooks.beforeBackup) await hooks.beforeBackup(url);
    const mbk = await backupUploads(url, live, work, name); // FIRST + ORIGINAL

    // Pre-restore state that a rollback must restore.
    await setMarker(url, 'CHANGED');
    await fsp.writeFile(join(live, 'pic.txt'), 'CHANGED-PIC');
    const safety = await backupUploads(url, live, work, `${name}-safety`);

    const opened = await openBackupFile(mbk, PASS, work);
    const safetyOpened = await openBackupFile(safety, PASS, work);
    const swap = await UploadSwap.prepare(opened.uploadsTar, live);
    if (hooks.afterPrepare) await hooks.afterPrepare({ url, live });

    const maint = fakeMaintenance();
    const rec = fakeRecovery();
    let threw = false;
    try {
      await makeRunner(maint, rec).perform({
        databaseUrl: url,
        databaseDump: opened.databaseDump,
        swap,
        safetyDump: safetyOpened.databaseDump,
      });
    } catch {
      threw = true;
    }

    assert.ok(threw, `${label}: the restore should fail`);
    assert.equal(await getMarker(url), 'CHANGED', `${label}: database rolled back`);
    assert.equal(
      await fsp.readFile(join(live, 'pic.txt'), 'utf8'),
      'CHANGED-PIC',
      `${label}: uploads rolled back`,
    );
    assert.equal(maint.active, false, `${label}: maintenance ended`);
    assert.equal(rec.manual, false, `${label}: no manual recovery needed`);
  } finally {
    await fsp.rm(live, { recursive: true, force: true });
    await dropDb(admin, name);
  }
}

async function rollbackOnSwapFail(admin: Pool, work: string): Promise<void> {
  await rollbackScenario(admin, work, 'swap-fail', {
    // Remove the staged incoming folder so swap.commit() fails after pg_restore.
    afterPrepare: ({ live }) => fsp.rm(`${live}.incoming`, { recursive: true, force: true }),
  });
  console.log('3. rollback on uploads-swap failure: data + uploads back  ✓');
}

async function rollbackOnMigrateFail(admin: Pool, work: string): Promise<void> {
  await rollbackScenario(admin, work, 'migrate-fail', {
    // Empty the migration log in the backed-up state: after pg_restore,
    // `prisma migrate deploy` re-applies migration 1 onto existing tables and
    // errors — a deterministic post-pg_restore failure.
    beforeBackup: async (url) => {
      const pool = new Pool({ connectionString: url });
      try {
        await pool.query('DELETE FROM "_prisma_migrations"');
      } finally {
        await pool.end();
      }
    },
  });
  console.log('4. rollback on migrate failure: data + uploads back       ✓');
}

async function main(): Promise<void> {
  const work = await fsp.mkdtemp(join(tmpdir(), 'restore-e2e-'));
  const admin = new Pool({ connectionString: adminUrl() });
  try {
    await roundTrip(admin, work);
    await failHalfway(admin, work);
    await rollbackOnSwapFail(admin, work);
    await rollbackOnMigrateFail(admin, work);
    console.log('\nrestore e2e: PASS');
  } finally {
    await admin.end();
    await fsp.rm(work, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error('\nrestore e2e: FAIL\n', err);
  process.exit(1);
});
