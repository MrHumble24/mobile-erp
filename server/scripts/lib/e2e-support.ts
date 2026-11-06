import { promises as fsp } from 'node:fs';
import { join } from 'node:path';
import { Pool } from 'pg';
import { createBackupFile } from '../../src/backups/lib/mbk-format.js';
import { runPgDump, runPgRestore } from '../../src/backups/lib/pg-tools.js';
import { RestoreRunner } from '../../src/backups/restore-runner.js';

/** Shared helpers for the restore e2e (pnpm test:restore). */

export const PASS = 'restore-e2e-passphrase';

export function required(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`${key} is not set`);
  return v;
}

export function adminUrl(): string {
  const url = new URL(required('DATABASE_URL'));
  url.pathname = '/postgres';
  return url.toString();
}

export function dbUrl(name: string): string {
  const url = new URL(required('DATABASE_URL'));
  url.pathname = `/${name}`;
  return url.toString();
}

export function randomName(tag: string): string {
  return `mbk_${tag}_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
}

export async function dropDb(admin: Pool, name: string): Promise<void> {
  await admin.query(
    `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()`,
    [name],
  );
  await admin.query(`DROP DATABASE IF EXISTS "${name}"`);
}

export async function withDb<T>(
  admin: Pool,
  name: string,
  fn: (url: string) => Promise<T>,
): Promise<T> {
  await admin.query(`CREATE DATABASE "${name}"`);
  try {
    return await fn(dbUrl(name));
  } finally {
    await dropDb(admin, name);
  }
}

export async function setMarker(url: string, value: string): Promise<void> {
  const pool = new Pool({ connectionString: url });
  try {
    await pool.query('CREATE TABLE IF NOT EXISTS marker (id int PRIMARY KEY, v text)');
    await pool.query(
      'INSERT INTO marker (id, v) VALUES (1, $1) ON CONFLICT (id) DO UPDATE SET v = $1',
      [value],
    );
  } finally {
    await pool.end();
  }
}

export async function getMarker(url: string): Promise<string | null> {
  const pool = new Pool({ connectionString: url });
  try {
    const { rows } = await pool.query<{ v: string }>('SELECT v FROM marker WHERE id = 1');
    return rows[0]?.v ?? null;
  } finally {
    await pool.end();
  }
}

/** A backup whose uploads folder content is caller-controlled. */
export async function backupUploads(
  url: string,
  uploads: string,
  work: string,
  name: string,
): Promise<string> {
  const out = join(work, `${name}.mbk`);
  await createBackupFile({
    databaseUrl: url,
    uploadsDir: uploads,
    outFile: out,
    passphrase: PASS,
    migrationName: null,
    workDir: work,
    meta: { runId: name, createdAt: new Date().toISOString(), formatVersion: 1, migrationName: null },
  });
  return out;
}

/**
 * Only a throwaway test database may be the source of a copy: its name must
 * start `mbk_`, or end `_wipe` / `_test`, or be named explicitly in
 * `E2E_ALLOW_SOURCE`. This stops an e2e pointed at a real shop (DATABASE_URL set
 * to production) from dumping customer data to a temp folder.
 */
export function assertTestSource(url: string): void {
  const name = new URL(url).pathname.replace(/^\//, '');
  const allowed =
    /^mbk_/.test(name) ||
    /_(wipe|test|shop\d*)$/.test(name) ||
    name === process.env.E2E_ALLOW_SOURCE;
  if (!allowed) {
    throw new Error(
      `Refusing to copy from "${name}": the e2e source must be a test database ` +
        `(name starting "mbk_" or ending "_wipe"/"_test"), or set ` +
        `E2E_ALLOW_SOURCE="${name}" to override.`,
    );
  }
}

/** Copy the current database (schema + applied migrations + data) into a
 * throwaway. Refuses a non-test source; always removes the temp dump. */
export async function copyFromSource(name: string, work: string): Promise<void> {
  const sourceUrl = required('DATABASE_URL');
  assertTestSource(sourceUrl);
  const dump = join(work, `${name}-src.dump`);
  try {
    await runPgDump(sourceUrl, dump);
    await runPgRestore(dbUrl(name), dump, {});
  } finally {
    await fsp.rm(dump, { force: true });
  }
}

/** Minimal fakes so RestoreRunner can drive real pg tools without Nest DI. */
export function fakeMaintenance() {
  return {
    active: false,
    begin() {
      this.active = true;
    },
    end() {
      this.active = false;
    },
    isActive() {
      return this.active;
    },
  };
}

export function fakeRecovery() {
  return {
    manual: false,
    markRestoreInProgress() {},
    clearRestoreInProgress() {},
    markManualRecovery() {
      this.manual = true;
    },
    needsManualRecovery() {
      return this.manual;
    },
  };
}

export function makeRunner(
  maint: ReturnType<typeof fakeMaintenance>,
  rec: ReturnType<typeof fakeRecovery>,
): RestoreRunner {
  return new RestoreRunner(
    maint as never,
    { endAllSessions: () => Promise.resolve() } as never,
    rec as never,
    { reconcile: () => Promise.resolve() } as never,
  );
}
