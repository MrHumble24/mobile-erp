import { randomBytes } from 'node:crypto';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import {
  decryptToStream,
  encryptToFile,
  readMbkMeta,
} from './backup-crypto.js';

async function collect(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const c of stream) chunks.push(c as Buffer);
  return Buffer.concat(chunks);
}

const META = {
  runId: 'run-123',
  createdAt: '2026-11-06T00:00:00.000Z',
  formatVersion: 1,
  migrationName: '20261106130000_backups',
};

describe('backup-crypto (streaming AES-256-GCM)', () => {
  const dir = mkdtempSync(join(tmpdir(), 'mbk-'));
  const pass = 'correct horse battery staple';
  const plain = randomBytes(200_000); // > one chunk, exercises streaming

  it('encrypt then decrypt returns the same bytes', async () => {
    const out = join(dir, 'a.mbk');
    await encryptToFile(Readable.from(plain), out, pass, META);
    const back = await collect(await decryptToStream(out, pass));
    expect(back.equals(plain)).toBe(true);
  });

  it('exposes the metadata without the passphrase', async () => {
    const out = join(dir, 'meta.mbk');
    await encryptToFile(Readable.from(plain), out, pass, META);
    expect(await readMbkMeta(out)).toEqual(META);
  });

  it('the file on disk does not contain the plaintext', async () => {
    const out = join(dir, 'b.mbk');
    const marker = Buffer.from('TOP-SECRET-MARKER');
    await encryptToFile(Readable.from(marker), out, pass, META);
    expect(readFileSync(out).includes(marker)).toBe(false);
  });

  it('a wrong passphrase fails cleanly', async () => {
    const out = join(dir, 'c.mbk');
    await encryptToFile(Readable.from(plain), out, pass, META);
    await expect(
      collect(await decryptToStream(out, 'wrong')),
    ).rejects.toThrow();
  });

  it('a flipped body byte fails the auth tag', async () => {
    const out = join(dir, 'd.mbk');
    await encryptToFile(Readable.from(plain), out, pass, META);
    const buf = readFileSync(out);
    buf[buf.length - 20] ^= 0x01; // inside the ciphertext region
    writeFileSync(out, buf);
    await expect(collect(await decryptToStream(out, pass))).rejects.toThrow();
  });

  it('a tampered header (AAD) fails decryption', async () => {
    const out = join(dir, 'aad.mbk');
    await encryptToFile(Readable.from(plain), out, pass, META);
    const buf = readFileSync(out);
    // Flip a byte inside the JSON header (after the 8-byte magic+len prefix);
    // the tamper is caught either at setup or when the stream is consumed.
    buf[40] ^= 0x01;
    writeFileSync(out, buf);
    await expect(decryptToStream(out, pass).then(collect)).rejects.toThrow();
  });

  it('rejects a file that is not a backup', async () => {
    const out = join(dir, 'e.mbk');
    writeFileSync(out, Buffer.from('not a backup at all'));
    await expect(decryptToStream(out, pass)).rejects.toThrow(/bad magic/);
  });

  it('rejects a header with an absurd length before allocating', async () => {
    const out = join(dir, 'huge.mbk');
    const buf = Buffer.alloc(32);
    Buffer.from('MBK1', 'ascii').copy(buf, 0);
    buf.writeUInt32BE(0x7fffffff, 4); // claimed header length ~2 GiB
    writeFileSync(out, buf);
    await expect(decryptToStream(out, pass)).rejects.toThrow(/out of range/);
  });

  it('rejects unsupported KDF parameters in the header', async () => {
    const out = join(dir, 'kdf.mbk');
    const header = JSON.stringify({
      v: 1,
      kdf: { salt: '00'.repeat(16), N: 1024, r: 8, p: 1, keylen: 32 },
      iv: '00'.repeat(12),
      meta: META,
    });
    const json = Buffer.from(header, 'utf8');
    const prefix = Buffer.alloc(8);
    Buffer.from('MBK1', 'ascii').copy(prefix, 0);
    prefix.writeUInt32BE(json.length, 4);
    writeFileSync(out, Buffer.concat([prefix, json, Buffer.alloc(40)]));
    await expect(decryptToStream(out, pass)).rejects.toThrow(
      /unsupported parameters/,
    );
  });
});
