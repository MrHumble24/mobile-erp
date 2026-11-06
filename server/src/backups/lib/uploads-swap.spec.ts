import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { packDir } from './archive.js';
import { UploadSwap } from './uploads-swap.js';

describe('UploadSwap', () => {
  const root = mkdtempSync(join(tmpdir(), 'swap-'));

  async function makeTar(
    name: string,
    file: string,
    body: string,
  ): Promise<string> {
    const src = join(root, `src-${name}`);
    mkdirSync(src, { recursive: true });
    writeFileSync(join(src, file), body);
    const tarFile = join(root, `${name}.tar`);
    await packDir(src, tarFile);
    return tarFile;
  }

  it('commit replaces the live folder; staging folders are cleaned up', async () => {
    const live = join(root, 'uploads1');
    mkdirSync(live, { recursive: true });
    writeFileSync(join(live, 'old.txt'), 'old');
    const tar = await makeTar('a', 'new.txt', 'new');

    const swap = await UploadSwap.prepare(tar, live);
    await swap.commit();
    await swap.finalize();

    expect(existsSync(join(live, 'old.txt'))).toBe(false);
    expect(readFileSync(join(live, 'new.txt'), 'utf8')).toBe('new');
    expect(existsSync(`${live}.old`)).toBe(false);
    expect(existsSync(`${live}.incoming`)).toBe(false);
  });

  it('rollback after commit restores the original folder', async () => {
    const live = join(root, 'uploads2');
    mkdirSync(live, { recursive: true });
    writeFileSync(join(live, 'keep.txt'), 'keep');
    const tar = await makeTar('b', 'new.txt', 'new');

    const swap = await UploadSwap.prepare(tar, live);
    await swap.commit(); // live now has new.txt
    await swap.rollback(); // original keep.txt must come back

    expect(readFileSync(join(live, 'keep.txt'), 'utf8')).toBe('keep');
    expect(existsSync(join(live, 'new.txt'))).toBe(false);
    await swap.finalize();
  });

  it('rollback before commit just drops the incoming folder', async () => {
    const live = join(root, 'uploads3');
    mkdirSync(live, { recursive: true });
    writeFileSync(join(live, 'keep.txt'), 'keep');
    const tar = await makeTar('c', 'new.txt', 'new');

    const swap = await UploadSwap.prepare(tar, live);
    await swap.rollback();

    expect(readFileSync(join(live, 'keep.txt'), 'utf8')).toBe('keep');
    expect(existsSync(`${live}.incoming`)).toBe(false);
  });

  it('a commit that fails half-way leaves the original folder in place', async () => {
    const live = join(root, 'uploads5');
    mkdirSync(live, { recursive: true });
    writeFileSync(join(live, 'keep.txt'), 'keep');
    const tar = await makeTar('e', 'new.txt', 'new');

    const swap = await UploadSwap.prepare(tar, live);
    rmSync(`${live}.incoming`, { recursive: true, force: true }); // sabotage
    await expect(swap.commit()).rejects.toThrow();

    expect(readFileSync(join(live, 'keep.txt'), 'utf8')).toBe('keep');
  });

  it('prepare fails (unreadable tar) before touching the live folder', async () => {
    const live = join(root, 'uploads4');
    mkdirSync(live, { recursive: true });
    writeFileSync(join(live, 'keep.txt'), 'keep');
    const badTar = join(root, 'bad.tar');
    writeFileSync(badTar, 'not a tar');

    await expect(UploadSwap.prepare(badTar, live)).rejects.toThrow();
    expect(readFileSync(join(live, 'keep.txt'), 'utf8')).toBe('keep');
  });
});
