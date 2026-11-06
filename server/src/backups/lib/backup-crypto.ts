import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from 'node:crypto';
import { createReadStream, createWriteStream, promises as fsp } from 'node:fs';
import { Readable } from 'node:stream';

/**
 * Streaming AES-256-GCM for backup files. The key is derived from the backup
 * passphrase with scrypt (fresh salt per file). Nothing is held whole in
 * memory: the plaintext stream is piped through the cipher to disk.
 *
 * File layout:
 *   "MBK1"            4 bytes   magic
 *   headerLen         uint32be  byte length of the JSON header
 *   header JSON       plaintext { v, kdf:{salt,N,r,p,keylen}, iv }  (no secrets)
 *   ciphertext        AES-256-GCM
 *   authTag           16 bytes  trailing (validated on decrypt)
 */

const MAGIC = Buffer.from('MBK1', 'ascii');
const TAG_BYTES = 16;
const SALT_BYTES = 16;
const IV_BYTES = 12;
const MAXMEM = 64 * 1024 * 1024;
const SCRYPT: KdfParams = { N: 1 << 15, r: 8, p: 1, keylen: 32 };

interface KdfParams {
  N: number;
  r: number;
  p: number;
  keylen: number;
}

interface MbkHeader {
  v: number;
  kdf: KdfParams & { salt: string };
  iv: string;
}

function deriveKey(
  passphrase: string,
  salt: Buffer,
  params: KdfParams,
): Buffer {
  return scryptSync(passphrase, salt, params.keylen, {
    N: params.N,
    r: params.r,
    p: params.p,
    maxmem: MAXMEM,
  });
}

function encodeHeader(header: MbkHeader): Buffer {
  const json = Buffer.from(JSON.stringify(header), 'utf8');
  const len = Buffer.allocUnsafe(4);
  len.writeUInt32BE(json.length, 0);
  return Buffer.concat([MAGIC, len, json]);
}

/** Reads and parses the plaintext header; returns it and the body offset. */
async function readHeader(
  path: string,
): Promise<{ header: MbkHeader; offset: number }> {
  const fd = await fsp.open(path, 'r');
  try {
    const prefix = Buffer.allocUnsafe(8);
    await fd.read(prefix, 0, 8, 0);
    if (!prefix.subarray(0, 4).equals(MAGIC)) {
      throw new Error('Not a backup file (bad magic)');
    }
    const headerLen = prefix.readUInt32BE(4);
    const jsonBuf = Buffer.allocUnsafe(headerLen);
    await fd.read(jsonBuf, 0, headerLen, 8);
    const header = JSON.parse(jsonBuf.toString('utf8')) as MbkHeader;
    return { header, offset: 8 + headerLen };
  } finally {
    await fd.close();
  }
}

/** Encrypts `input` into `outPath`. Fresh salt + iv; tag appended at the end. */
export async function encryptToFile(
  input: Readable,
  outPath: string,
  passphrase: string,
): Promise<void> {
  const salt = randomBytes(SALT_BYTES);
  const iv = randomBytes(IV_BYTES);
  const key = deriveKey(passphrase, salt, SCRYPT);
  const header: MbkHeader = {
    v: 1,
    kdf: {
      salt: salt.toString('hex'),
      N: SCRYPT.N,
      r: SCRYPT.r,
      p: SCRYPT.p,
      keylen: SCRYPT.keylen,
    },
    iv: iv.toString('hex'),
  };

  const out = createWriteStream(outPath);
  out.write(encodeHeader(header));

  const cipher = createCipheriv('aes-256-gcm', key, iv);
  // Pipe ciphertext onto the open file without closing it, so the GCM tag can
  // be appended after the body. Errors on any stage reject the promise.
  await new Promise<void>((resolve, reject) => {
    const fail = (e: unknown) =>
      reject(e instanceof Error ? e : new Error(String(e)));
    input.on('error', fail);
    cipher.on('error', fail);
    out.on('error', fail);
    cipher.pipe(out, { end: false });
    cipher.on('end', () => {
      out.end(cipher.getAuthTag(), () => resolve());
    });
    input.pipe(cipher);
  });
}

/**
 * Returns a readable plaintext stream for the backup at `path`. The GCM tag is
 * set before streaming, so `final()` throws on a wrong passphrase or any
 * tampering — surfaced as a stream 'error'.
 */
export async function decryptToStream(
  path: string,
  passphrase: string,
): Promise<Readable> {
  const { header, offset } = await readHeader(path);
  if (header.v !== 1) throw new Error(`Unsupported backup version ${header.v}`);
  const stat = await fsp.stat(path);
  const tagStart = stat.size - TAG_BYTES;
  if (tagStart <= offset) throw new Error('Backup file is truncated');

  const fd = await fsp.open(path, 'r');
  let tag: Buffer;
  try {
    tag = Buffer.allocUnsafe(TAG_BYTES);
    await fd.read(tag, 0, TAG_BYTES, tagStart);
  } finally {
    await fd.close();
  }

  const salt = Buffer.from(header.kdf.salt, 'hex');
  const iv = Buffer.from(header.iv, 'hex');
  const key = deriveKey(passphrase, salt, header.kdf);
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);

  const body = createReadStream(path, { start: offset, end: tagStart - 1 });
  body.on('error', (e) => decipher.destroy(e));
  return body.pipe(decipher);
}
