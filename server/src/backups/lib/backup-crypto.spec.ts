import { randomBytes } from 'node:crypto';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { decryptToStream, encryptToFile } from './backup-crypto.js';

async function collect(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const c of stream) chunks.push(c as Buffer);
  return Buffer.concat(chunks);
}

describe('backup-crypto (streaming AES-256-GCM)', () => {
  const dir = mkdtempSync(join(tmpdir(), 'mbk-'));
  const pass = 'correct horse battery staple';
  const plain = randomBytes(200_000); // > one chunk, exercises streaming

  it('encrypt then decrypt returns the same bytes', async () => {
    const out = join(dir, 'a.mbk');
    await encryptToFile(Readable.from(plain), out, pass);
    const back = await collect(await decryptToStream(out, pass));
    expect(back.equals(plain)).toBe(true);
  });

  it('the file on disk does not contain the plaintext', async () => {
    const out = join(dir, 'b.mbk');
    const marker = Buffer.from('TOP-SECRET-MARKER');
    await encryptToFile(Readable.from(marker), out, pass);
    expect(readFileSync(out).includes(marker)).toBe(false);
  });

  it('a wrong passphrase fails cleanly', async () => {
    const out = join(dir, 'c.mbk');
    await encryptToFile(Readable.from(plain), out, pass);
    await expect(
      collect(await decryptToStream(out, 'wrong')),
    ).rejects.toThrow();
  });

  it('a flipped byte fails the auth tag', async () => {
    const out = join(dir, 'd.mbk');
    await encryptToFile(Readable.from(plain), out, pass);
    const buf = readFileSync(out);
    buf[buf.length - 20] ^= 0x01; // inside the ciphertext region
    writeFileSync(out, buf);
    await expect(collect(await decryptToStream(out, pass))).rejects.toThrow();
  });

  it('rejects a file that is not a backup', async () => {
    const out = join(dir, 'e.mbk');
    writeFileSync(out, Buffer.from('not a backup at all'));
    await expect(decryptToStream(out, pass)).rejects.toThrow(/bad magic/);
  });
});
