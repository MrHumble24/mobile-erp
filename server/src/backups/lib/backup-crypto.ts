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
 *   header JSON       plaintext { v, kdf, iv, meta }  (no secrets; see below)
 *   ciphertext        AES-256-GCM, with the header bytes as additional
 *                     authenticated data (AAD) so a tampered header fails the tag
 *   authTag           16 bytes  trailing (validated on decrypt)
 *
 * The header is plaintext because `meta` (run id, creation time, format) must be
 * readable to list and reconcile backups without the passphrase; the AAD makes
 * it tamper-evident. Everything is validated before any key is derived.
 */

const MAGIC = Buffer.from('MBK1', 'ascii');
const TAG_BYTES = 16;
const SALT_BYTES = 16;
const IV_BYTES = 12;
const MAXMEM = 64 * 1024 * 1024;
const MAX_HEADER_BYTES = 8 * 1024; // an attacker cannot drive a large allocation
const FORMAT_VERSION = 1;
// The only KDF parameters this build writes; anything else is rejected.
const KDF = { N: 1 << 15, r: 8, p: 1, keylen: 32 };

export interface MbkMeta {
  runId: string;
  createdAt: string;
  formatVersion: number;
  /** Last applied migration at backup time; lets the list/version check read it
   * without the passphrase (it is also in the encrypted manifest). */
  migrationName: string | null;
}

interface MbkHeader {
  v: number;
  kdf: { salt: string; N: number; r: number; p: number; keylen: number };
  iv: string;
  meta: MbkMeta;
}

function deriveKey(passphrase: string, salt: Buffer): Buffer {
  return scryptSync(passphrase, salt, KDF.keylen, {
    N: KDF.N,
    r: KDF.r,
    p: KDF.p,
    maxmem: MAXMEM,
  });
}

/** Frames the header and returns both the file bytes and the JSON bytes (the
 * JSON alone is the GCM AAD — the same bytes `readHeader` reconstructs). */
function encodeHeader(header: MbkHeader): { framed: Buffer; json: Buffer } {
  const json = Buffer.from(JSON.stringify(header), 'utf8');
  if (json.length > MAX_HEADER_BYTES)
    throw new Error('Backup header too large');
  const len = Buffer.allocUnsafe(4);
  len.writeUInt32BE(json.length, 0);
  return { framed: Buffer.concat([MAGIC, len, json]), json };
}

/** Reject any header we did not write, before deriving a key or allocating. */
function validateHeader(h: MbkHeader): void {
  if (h.v !== FORMAT_VERSION)
    throw new Error(`Unsupported backup version ${h.v}`);
  const k = h.kdf;
  if (
    !k ||
    k.keylen !== KDF.keylen ||
    k.N !== KDF.N ||
    k.r !== KDF.r ||
    k.p !== KDF.p ||
    typeof k.salt !== 'string' ||
    k.salt.length !== SALT_BYTES * 2 ||
    typeof h.iv !== 'string' ||
    h.iv.length !== IV_BYTES * 2
  ) {
    throw new Error(
      'Backup header is malformed or uses unsupported parameters',
    );
  }
}

/** Reads, validates and returns the plaintext header plus the body offset and
 * the exact header bytes (needed as GCM AAD). */
async function readHeader(path: string): Promise<{
  header: MbkHeader;
  offset: number;
  headerBytes: Buffer;
}> {
  const fd = await fsp.open(path, 'r');
  try {
    const prefix = Buffer.allocUnsafe(8);
    await fd.read(prefix, 0, 8, 0);
    if (!prefix.subarray(0, 4).equals(MAGIC)) {
      throw new Error('Not a backup file (bad magic)');
    }
    const headerLen = prefix.readUInt32BE(4);
    if (headerLen === 0 || headerLen > MAX_HEADER_BYTES) {
      throw new Error('Backup header length is out of range');
    }
    const headerBytes = Buffer.allocUnsafe(headerLen);
    await fd.read(headerBytes, 0, headerLen, 8);
    const header = JSON.parse(headerBytes.toString('utf8')) as MbkHeader;
    validateHeader(header);
    return { header, offset: 8 + headerLen, headerBytes };
  } finally {
    await fd.close();
  }
}

/** The backup's self-describing metadata (no passphrase needed). */
export async function readMbkMeta(path: string): Promise<MbkMeta> {
  const { header } = await readHeader(path);
  return header.meta;
}

/** Encrypts `input` into `outPath`. Fresh salt + iv; tag appended at the end. */
export async function encryptToFile(
  input: Readable,
  outPath: string,
  passphrase: string,
  meta: MbkMeta,
): Promise<void> {
  const salt = randomBytes(SALT_BYTES);
  const iv = randomBytes(IV_BYTES);
  const key = deriveKey(passphrase, salt);
  const header: MbkHeader = {
    v: FORMAT_VERSION,
    kdf: { salt: salt.toString('hex'), ...KDF },
    iv: iv.toString('hex'),
    meta,
  };
  const { framed, json } = encodeHeader(header);

  const out = createWriteStream(outPath);
  out.write(framed);

  const cipher = createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(json);
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
 * Returns a readable plaintext stream for the backup at `path`. The GCM tag and
 * the header AAD are set before streaming, so `final()` throws on a wrong
 * passphrase or any tampering (of the body or the header) — surfaced as a
 * stream 'error'.
 */
export async function decryptToStream(
  path: string,
  passphrase: string,
): Promise<Readable> {
  const { header, offset, headerBytes } = await readHeader(path);
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
  const key = deriveKey(passphrase, salt);
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAAD(headerBytes);
  decipher.setAuthTag(tag);

  const body = createReadStream(path, { start: offset, end: tagStart - 1 });
  body.on('error', (e) => decipher.destroy(e));
  return body.pipe(decipher);
}
