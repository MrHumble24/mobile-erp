import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

/**
 * AES-256-GCM for small in-memory values (the secrets store). The sealed blob
 * is self-describing: iv(12) ++ authTag(16) ++ ciphertext. Streaming backup
 * files use their own cipher (backups/lib/backup-crypto.ts) — this one is for
 * short secrets only.
 */

const IV_BYTES = 12;
const TAG_BYTES = 16;
const KEY_BYTES = 32;

export function seal(key: Buffer, plaintext: Buffer): Buffer {
  if (key.length !== KEY_BYTES) throw new Error('seal: key must be 32 bytes');
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const body = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]);
}

export function open(key: Buffer, sealed: Buffer): Buffer {
  if (key.length !== KEY_BYTES) throw new Error('open: key must be 32 bytes');
  if (sealed.length < IV_BYTES + TAG_BYTES)
    throw new Error('open: blob too short');
  const iv = sealed.subarray(0, IV_BYTES);
  const tag = sealed.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
  const body = sealed.subarray(IV_BYTES + TAG_BYTES);
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  // final() throws if the key is wrong or the blob was tampered with.
  return Buffer.concat([decipher.update(body), decipher.final()]);
}
