import { promises as fsp } from 'node:fs';
import { resolve } from 'node:path';
import { openBackupFile } from '../src/backups/lib/mbk-format.js';

/**
 * Decrypt and unpack a .mbk backup with no database and no running app — the
 * last resort when the server is gone (handoff 023, supersedes verify-backup.sh).
 *
 *   BACKUP_PASSPHRASE=... pnpm tsx scripts/open-backup.ts <file.mbk> <out-dir>
 *
 * Leaves `database.dump` (restore with `pg_restore`) and `uploads.tar`
 * (the product pictures) in <out-dir>, and prints the manifest. The passphrase
 * is read from the environment and never echoed.
 */
async function main(): Promise<void> {
  const [file, outDir] = process.argv.slice(2);
  const passphrase = process.env.BACKUP_PASSPHRASE?.trim();
  if (!file || !outDir) {
    console.error('usage: BACKUP_PASSPHRASE=... tsx scripts/open-backup.ts <file.mbk> <out-dir>');
    process.exit(2);
  }
  if (!passphrase) {
    console.error('Set BACKUP_PASSPHRASE in the environment (never on the command line).');
    process.exit(2);
  }

  await fsp.mkdir(outDir, { recursive: true });
  const opened = await openBackupFile(resolve(file), passphrase, resolve(outDir));

  // Move the two parts up into outDir and drop the temp staging dir.
  for (const part of ['database.dump', 'uploads.tar']) {
    await fsp.rename(`${opened.dir}/${part}`, `${resolve(outDir)}/${part}`);
  }
  await fsp.rm(opened.dir, { recursive: true, force: true });

  console.log('Backup opened. Manifest:');
  console.log(JSON.stringify(opened.manifest, null, 2));
  console.log(`\nWrote:\n  ${outDir}/database.dump  (pg_restore this)\n  ${outDir}/uploads.tar    (product pictures)`);
}

main().catch((err) => {
  console.error('open-backup failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
