import { createHash } from 'node:crypto';
import { createReadStream, promises as fsp } from 'node:fs';
import { join } from 'node:path';

/** The manifest packed into every backup; cross-checked before a restore. */
export interface BackupManifest {
  formatVersion: number;
  appVersion: string;
  /** Last applied Prisma migration when the backup was made. */
  migrationName: string | null;
  createdAt: string;
  parts: {
    database: PartDigest;
    uploads: PartDigest;
  };
}

export interface PartDigest {
  file: string;
  size: number;
  sha256: string;
}

export const MANIFEST_NAME = 'manifest.json';
export const DATABASE_PART = 'database.dump';
export const UPLOADS_PART = 'uploads.tar';
export const FORMAT_VERSION = 1;

export function appVersion(): string {
  return process.env.npm_package_version ?? '0.0.0';
}

export async function sha256File(path: string): Promise<string> {
  const hash = createHash('sha256');
  await new Promise<void>((resolve, reject) => {
    const s = createReadStream(path);
    s.on('error', reject);
    s.on('data', (c) => hash.update(c));
    s.on('end', () => resolve());
  });
  return hash.digest('hex');
}

async function digest(dir: string, file: string): Promise<PartDigest> {
  const full = join(dir, file);
  const { size } = await fsp.stat(full);
  return { file, size, sha256: await sha256File(full) };
}

export async function buildManifest(
  dir: string,
  migrationName: string | null,
): Promise<BackupManifest> {
  return {
    formatVersion: FORMAT_VERSION,
    appVersion: appVersion(),
    migrationName,
    createdAt: new Date().toISOString(),
    parts: {
      database: await digest(dir, DATABASE_PART),
      uploads: await digest(dir, UPLOADS_PART),
    },
  };
}

/** Recompute every part's SHA-256 and size; throw on the first mismatch. */
export async function verifyParts(
  manifest: BackupManifest,
  dir: string,
): Promise<void> {
  for (const part of [manifest.parts.database, manifest.parts.uploads]) {
    const actual = await digest(dir, part.file);
    if (actual.sha256 !== part.sha256 || actual.size !== part.size) {
      throw new Error(`Checksum mismatch for ${part.file}; backup is corrupt`);
    }
  }
}

/** Migration folder names this server ships (to reject a newer backup). */
export async function knownMigrations(): Promise<Set<string>> {
  const dir = join(process.cwd(), 'prisma', 'migrations');
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  return new Set(entries.filter((e) => e.isDirectory()).map((e) => e.name));
}
