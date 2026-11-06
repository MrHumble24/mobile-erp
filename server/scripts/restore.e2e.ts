import 'dotenv/config';
import assert from 'node:assert/strict';
import { promises as fsp } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Pool } from 'pg';
import { createBackupFile, openBackupFile } from '../src/backups/lib/mbk-format.js';
import { runPgRestore } from '../src/backups/lib/pg-tools.js';

/**
 * Real-database restore proof (pnpm test:restore). Kept out of `pnpm test` so the
 * unit suite stays fast and DB-free. Creates and drops its own throwaway
 * databases with random names — never touches a database it did not create.
 *
 *   1. make data → back up → change data → restore → data is the first data again
 *   2. a restore made to fail half-way leaves the changed data untouched
 */

const PASS = 'restore-e2e-passphrase';

function adminUrl(): string {
  const url = new URL(required('DATABASE_URL'));
  url.pathname = '/postgres';
  return url.toString();
}

function dbUrl(name: string): string {
  const url = new URL(required('DATABASE_URL'));
  url.pathname = `/${name}`;
  return url.toString();
}

function required(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`${key} is not set`);
  return v;
}

async function withDb<T>(admin: Pool, name: string, fn: (url: string) => Promise<T>): Promise<T> {
  await admin.query(`CREATE DATABASE "${name}"`);
  try {
    return await fn(dbUrl(name));
  } finally {
    await admin.query(
      `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()`,
      [name],
    );
    await admin.query(`DROP DATABASE IF EXISTS "${name}"`);
  }
}

async function setMarker(url: string, value: string): Promise<void> {
  const pool = new Pool({ connectionString: url });
  try {
    await pool.query('CREATE TABLE IF NOT EXISTS marker (id int PRIMARY KEY, v text)');
    await pool.query('INSERT INTO marker (id, v) VALUES (1, $1) ON CONFLICT (id) DO UPDATE SET v = $1', [value]);
  } finally {
    await pool.end();
  }
}

async function getMarker(url: string): Promise<string | null> {
  const pool = new Pool({ connectionString: url });
  try {
    const { rows } = await pool.query<{ v: string }>('SELECT v FROM marker WHERE id = 1');
    return rows[0]?.v ?? null;
  } finally {
    await pool.end();
  }
}

async function backup(url: string, work: string, name: string): Promise<string> {
  const uploads = join(work, `uploads-${name}`);
  await fsp.mkdir(uploads, { recursive: true });
  await fsp.writeFile(join(uploads, 'pic.txt'), 'a product picture');
  const out = join(work, `${name}.mbk`);
  await createBackupFile({ databaseUrl: url, uploadsDir: uploads, outFile: out, passphrase: PASS, migrationName: null, workDir: work });
  return out;
}

async function roundTrip(admin: Pool, work: string): Promise<void> {
  const name = `mbk_rt_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  await withDb(admin, name, async (url) => {
    await setMarker(url, 'FIRST');
    const mbk = await backup(url, work, name);

    await setMarker(url, 'CHANGED'); // the data we then throw away by restoring

    const opened = await openBackupFile(mbk, PASS, work);
    await runPgRestore(url, opened.databaseDump, { singleTransaction: true });
    await fsp.rm(opened.dir, { recursive: true, force: true });

    assert.equal(await getMarker(url), 'FIRST', 'restore should bring the first data back');
  });
  console.log('1. round-trip: data restored to its first value  ✓');
}

async function failHalfway(admin: Pool, work: string): Promise<void> {
  const name = `mbk_fail_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  await withDb(admin, name, async (url) => {
    await setMarker(url, 'BACKED_UP');
    const mbk = await backup(url, work, name);

    await setMarker(url, 'CHANGED_AFTER'); // must survive the failed restore

    const opened = await openBackupFile(mbk, PASS, work);
    // Corrupt the dump so pg_restore errors partway through its transaction.
    const dump = opened.databaseDump;
    const { size } = await fsp.stat(dump);
    const fh = await fsp.open(dump, 'r+');
    await fh.truncate(Math.floor(size / 2));
    await fh.close();

    let threw = false;
    try {
      await runPgRestore(url, dump, { singleTransaction: true });
    } catch {
      threw = true;
    }
    await fsp.rm(opened.dir, { recursive: true, force: true });

    assert.ok(threw, 'a corrupt restore should fail');
    assert.equal(await getMarker(url), 'CHANGED_AFTER', 'a failed restore must leave data untouched');
  });
  console.log('2. fail-half-way: changed data left untouched     ✓');
}

async function main(): Promise<void> {
  const work = await fsp.mkdtemp(join(tmpdir(), 'restore-e2e-'));
  const admin = new Pool({ connectionString: adminUrl() });
  try {
    await roundTrip(admin, work);
    await failHalfway(admin, work);
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
