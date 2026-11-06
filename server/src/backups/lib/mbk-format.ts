import { createReadStream, createWriteStream, promises as fsp } from 'node:fs';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import {
  assertSafeEntries,
  extractSafe,
  packDir,
  packFiles,
} from './archive.js';
import { BackupTooLargeError, maxPayloadBytes } from './backup-config.js';
import {
  decryptToStream,
  encryptToFile,
  type MbkMeta,
} from './backup-crypto.js';
import {
  BackupManifest,
  DATABASE_PART,
  MANIFEST_NAME,
  UPLOADS_PART,
  buildManifest,
  verifyParts,
} from './backup-manifest.js';
import { runPgDump } from './pg-tools.js';

/**
 * The .mbk container: an encrypted tar of { manifest.json, database.dump,
 * uploads.tar }. `create` dumps, packs and encrypts; `open` decrypts, extracts
 * (safely) and checks the manifest. Both stage to a temp dir and never hold the
 * whole archive in memory.
 */

const PART_NAMES = new Set([MANIFEST_NAME, DATABASE_PART, UPLOADS_PART]);

async function stage(workDir: string, tag: string): Promise<string> {
  return fsp.mkdtemp(join(workDir, `${tag}-`));
}

export interface CreateArgs {
  databaseUrl: string;
  uploadsDir: string;
  outFile: string;
  passphrase: string;
  migrationName: string | null;
  workDir: string;
  meta: MbkMeta;
}

/** Build an encrypted backup at `outFile`. Refuses a payload over the ceiling. */
export async function createBackupFile(args: CreateArgs): Promise<void> {
  const dir = await stage(args.workDir, 'pack');
  try {
    await runPgDump(args.databaseUrl, join(dir, DATABASE_PART));
    await fsp.mkdir(args.uploadsDir, { recursive: true });
    await packDir(args.uploadsDir, join(dir, UPLOADS_PART));

    const manifest = await buildManifest(dir, args.migrationName);
    await fsp.writeFile(
      join(dir, MANIFEST_NAME),
      JSON.stringify(manifest, null, 2),
    );

    const payload = join(dir, 'payload.tar');
    await packFiles(dir, [MANIFEST_NAME, DATABASE_PART, UPLOADS_PART], payload);

    const { size } = await fsp.stat(payload);
    const limit = maxPayloadBytes();
    if (size > limit) throw new BackupTooLargeError(size, limit);

    await encryptToFile(
      createReadStream(payload),
      args.outFile,
      args.passphrase,
      args.meta,
    );
  } finally {
    await fsp.rm(dir, { recursive: true, force: true });
  }
}

export interface OpenedBackup {
  manifest: BackupManifest;
  dir: string;
  databaseDump: string;
  uploadsTar: string;
}

/**
 * Decrypt and extract `inFile` into a fresh dir under `workDir`, verifying the
 * manifest. The caller owns the returned `dir` and must remove it.
 */
export async function openBackupFile(
  inFile: string,
  passphrase: string,
  workDir: string,
): Promise<OpenedBackup> {
  const dir = await stage(workDir, 'open');
  try {
    const payload = join(dir, 'payload.tar');
    // Decrypt to disk; the stream errors (wrong key / tampering) reject here.
    await pipeline(
      await decryptToStream(inFile, passphrase),
      createWriteStream(payload),
    );

    await assertSafeEntries(payload, PART_NAMES);
    await extractSafe(payload, dir, PART_NAMES);
    await fsp.rm(payload, { force: true });

    const manifest = JSON.parse(
      await fsp.readFile(join(dir, MANIFEST_NAME), 'utf8'),
    ) as BackupManifest;
    await verifyParts(manifest, dir);

    return {
      manifest,
      dir,
      databaseDump: join(dir, DATABASE_PART),
      uploadsTar: join(dir, UPLOADS_PART),
    };
  } catch (err) {
    // Never leak a half-decrypted plaintext folder on failure.
    await fsp.rm(dir, { recursive: true, force: true });
    throw err;
  }
}
