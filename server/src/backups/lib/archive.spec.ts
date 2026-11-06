import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  assertSafeEntries,
  extractSafe,
  isUnsafe,
  packDir,
  packFiles,
} from './archive.js';

describe('archive safe extraction', () => {
  const root = mkdtempSync(join(tmpdir(), 'arc-'));

  it('packs and extracts a directory tree', async () => {
    const src = join(root, 'src');
    mkdirSync(join(src, 'sub'), { recursive: true });
    writeFileSync(join(src, 'a.txt'), 'hello');
    writeFileSync(join(src, 'sub', 'b.txt'), 'world');
    const tarFile = join(root, 'tree.tar');
    await packDir(src, tarFile);

    const dest = join(root, 'out');
    mkdirSync(dest);
    await extractSafe(tarFile, dest);
    expect(readFileSync(join(dest, 'a.txt'), 'utf8')).toBe('hello');
    expect(readFileSync(join(dest, 'sub', 'b.txt'), 'utf8')).toBe('world');
  });

  it('flags absolute paths and .. traversal', () => {
    expect(isUnsafe('/etc/passwd')).toBe(true);
    expect(isUnsafe('../escape.txt')).toBe(true);
    expect(isUnsafe('uploads/../../x')).toBe(true);
    expect(isUnsafe('uploads/a/b.jpg')).toBe(false);
    expect(isUnsafe('./manifest.json')).toBe(false);
  });

  it('refuses a top-level name outside the expected set', async () => {
    const stage = join(root, 'stage2');
    mkdirSync(stage, { recursive: true });
    writeFileSync(join(stage, 'manifest.json'), '{}');
    writeFileSync(join(stage, 'rogue.bin'), 'x');
    const tarFile = join(root, 'parts.tar');
    await packFiles(stage, ['manifest.json', 'rogue.bin'], tarFile);
    await expect(
      assertSafeEntries(tarFile, new Set(['manifest.json'])),
    ).rejects.toThrow(/Unexpected/);
  });
});
