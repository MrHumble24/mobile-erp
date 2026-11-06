import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { packDir } from './archive.js';
import { swapUploadsFromTar } from './uploads-swap.js';

describe('swapUploadsFromTar', () => {
  const root = mkdtempSync(join(tmpdir(), 'swap-'));

  it('replaces the uploads folder with the backup contents', async () => {
    const uploads = join(root, 'uploads');
    mkdirSync(uploads, { recursive: true });
    writeFileSync(join(uploads, 'old.txt'), 'old');
    const src = join(root, 'new-src');
    mkdirSync(src, { recursive: true });
    writeFileSync(join(src, 'new.txt'), 'new');
    const tarFile = join(root, 'new.tar');
    await packDir(src, tarFile);

    await swapUploadsFromTar(tarFile, uploads);

    expect(existsSync(join(uploads, 'old.txt'))).toBe(false);
    expect(readFileSync(join(uploads, 'new.txt'), 'utf8')).toBe('new');
    // Staging dirs are cleaned up.
    expect(existsSync(`${uploads}.restoring-old`)).toBe(false);
    expect(existsSync(`${uploads}.restoring-new`)).toBe(false);
  });

  it('leaves the original untouched when the tar is unreadable', async () => {
    const uploads = join(root, 'uploads2');
    mkdirSync(uploads, { recursive: true });
    writeFileSync(join(uploads, 'keep.txt'), 'keep');
    const badTar = join(root, 'bad.tar');
    writeFileSync(badTar, 'not a tar archive');

    await expect(swapUploadsFromTar(badTar, uploads)).rejects.toThrow();
    expect(readFileSync(join(uploads, 'keep.txt'), 'utf8')).toBe('keep');
  });
});
