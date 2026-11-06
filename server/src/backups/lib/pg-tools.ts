import { Logger } from '@nestjs/common';
import { spawn } from 'node:child_process';
import { join } from 'node:path';

const logger = new Logger('pg-tools');

/**
 * Safe wrappers around pg_dump / pg_restore and `prisma migrate deploy`. Every
 * child is spawned with an argument array (never a shell, never a string built
 * from input); the database password is passed in the child's environment
 * (PGPASSWORD), never on the command line.
 */

export type PgEnv = NodeJS.ProcessEnv;

/** Turn a DATABASE_URL into PG* env vars so no secret touches argv. */
export function pgEnv(databaseUrl: string): PgEnv {
  const u = new URL(databaseUrl);
  const env: PgEnv = { ...process.env };
  if (u.hostname) env.PGHOST = u.hostname;
  if (u.port) env.PGPORT = u.port;
  if (u.username) env.PGUSER = decodeURIComponent(u.username);
  if (u.password) env.PGPASSWORD = decodeURIComponent(u.password);
  const db = u.pathname.replace(/^\//, '');
  if (db) env.PGDATABASE = db;
  const sslmode = u.searchParams.get('sslmode');
  if (sslmode) env.PGSSLMODE = sslmode;
  return env;
}

/** The database name inside a DATABASE_URL. */
export function dbName(databaseUrl: string): string {
  return new URL(databaseUrl).pathname.replace(/^\//, '');
}

function bin(name: string): string {
  const dir = process.env.PG_BIN_DIR?.trim();
  return dir ? join(dir, name) : name;
}

interface RunResult {
  stdout: string;
  stderr: string;
}

function run(cmd: string, args: string[], env: PgEnv): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { env, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d: Buffer) => (stdout += d.toString()));
    child.stderr.on('data', (d: Buffer) => (stderr += d.toString()));
    const tool = cmd.split('/').pop() ?? cmd;
    child.on('error', () =>
      // Keep the OS error off the HTTP body / audit columns.
      reject(new Error(`${tool} could not be started`)),
    );
    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        // Full stderr is logged on the server only; the thrown message is generic.
        const detail = (stderr.trim() || stdout.trim()).slice(0, 2000);
        if (detail) logger.error(`${tool} exited ${code}: ${detail}`);
        reject(new Error(`${tool} failed (exit ${code ?? 'unknown'})`));
      }
    });
  });
}

function majorOf(versionText: string): number {
  const m = versionText.match(/(\d+)(?:\.\d+)?/);
  return m ? Number(m[1]) : NaN;
}

/**
 * Fails unless pg_dump and pg_restore exist and their major version is at least
 * the running server's. A dump by an older client cannot reliably restore a
 * newer server's database.
 */
export async function assertPgTools(serverMajor: number): Promise<void> {
  for (const tool of ['pg_dump', 'pg_restore']) {
    let out: RunResult;
    try {
      out = await run(bin(tool), ['--version'], process.env);
    } catch {
      throw new Error(
        `${tool} is not available on the server (set PG_BIN_DIR or install postgresql-client).`,
      );
    }
    const major = majorOf(out.stdout);
    if (Number.isFinite(serverMajor) && major < serverMajor) {
      throw new Error(
        `${tool} ${major} is older than the database server (${serverMajor}); backups need a matching or newer client.`,
      );
    }
  }
}

/** pg_dump in custom format to `outFile`. */
export async function runPgDump(
  databaseUrl: string,
  outFile: string,
): Promise<void> {
  await run(
    bin('pg_dump'),
    ['--format=custom', '--no-owner', '--file', outFile],
    pgEnv(databaseUrl),
  );
}

/** pg_restore into the DATABASE_URL's database. */
export async function runPgRestore(
  databaseUrl: string,
  dumpFile: string,
  opts: { singleTransaction?: boolean } = {},
): Promise<void> {
  const args = [
    '--clean',
    '--if-exists',
    '--no-owner',
    '--dbname',
    dbName(databaseUrl),
  ];
  if (opts.singleTransaction) args.push('--single-transaction');
  args.push(dumpFile);
  await run(bin('pg_restore'), args, pgEnv(databaseUrl));
}

/** Apply pending Prisma migrations to the target database. */
export async function runMigrateDeploy(databaseUrl: string): Promise<void> {
  await run('npx', ['prisma', 'migrate', 'deploy'], {
    ...process.env,
    DATABASE_URL: databaseUrl,
  });
}
