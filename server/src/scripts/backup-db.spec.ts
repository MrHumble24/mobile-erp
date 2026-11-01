import { execFileSync, spawnSync } from 'node:child_process';
import {
  mkdtempSync,
  writeFileSync,
  chmodSync,
  readdirSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

// Exercises scripts/backup-db.sh with a fake pg_dump on PATH so no live
// Postgres is needed. Proves the encrypt + checksum path and the passphrase guard.
const SCRIPT = resolve(__dirname, '../../scripts/backup-db.sh');
const STUB_BYTES = 'PGDMP-fake-custom-archive-bytes-1234567890';

function makeWorkspace() {
  const root = mkdtempSync(join(tmpdir(), 'backup-test-'));
  const bin = join(root, 'bin');
  const backups = join(root, 'backups');
  execFileSync('mkdir', ['-p', bin, backups]);
  const stub = join(bin, 'pg_dump');
  writeFileSync(stub, `#!/bin/sh\nprintf '%s' '${STUB_BYTES}'\n`);
  chmodSync(stub, 0o755);
  return { root, bin, backups };
}

function run(env: NodeJS.ProcessEnv, bin: string) {
  return spawnSync('sh', [SCRIPT], {
    encoding: 'utf8',
    env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, ...env },
  });
}

describe('backup-db.sh', () => {
  it('writes an encrypted dump plus a .sha256, decryptable back to the source bytes', () => {
    const { root, bin, backups } = makeWorkspace();
    try {
      const res = run(
        {
          DATABASE_URL: 'postgresql://ignored',
          BACKUP_PASSPHRASE: 'test-pass',
          BACKUP_DIR: backups,
          BACKUP_ENV_FILE: '/nonexistent',
        },
        bin,
      );
      expect(res.status).toBe(0);

      const files = readdirSync(backups);
      const enc = files.find((f) => f.endsWith('.dump.enc'));
      expect(enc).toBeDefined();
      expect(files).toContain(`${enc}.sha256`);

      const decrypted = execFileSync(
        'openssl',
        [
          'enc',
          '-d',
          '-aes-256-cbc',
          '-pbkdf2',
          '-pass',
          'env:BACKUP_PASSPHRASE',
          '-in',
          join(backups, enc!),
        ],
        {
          env: { ...process.env, BACKUP_PASSPHRASE: 'test-pass' },
          encoding: 'utf8',
        },
      );
      expect(decrypted).toBe(STUB_BYTES);

      execFileSync('shasum', ['-a', '256', '-c', `${enc}.sha256`], {
        cwd: backups,
      });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('exits non-zero when BACKUP_PASSPHRASE is empty', () => {
    const { root, bin, backups } = makeWorkspace();
    try {
      const res = run(
        {
          DATABASE_URL: 'postgresql://ignored',
          BACKUP_PASSPHRASE: '',
          BACKUP_DIR: backups,
          BACKUP_ENV_FILE: '/nonexistent',
        },
        bin,
      );
      expect(res.status).not.toBe(0);
      expect(res.stderr).toMatch(/BACKUP_PASSPHRASE is empty/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
