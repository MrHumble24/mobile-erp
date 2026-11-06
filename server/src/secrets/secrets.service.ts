import { Injectable, OnModuleInit } from '@nestjs/common';
import { randomBytes, createCipheriv, createDecipheriv } from 'node:crypto';
import {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  chmodSync,
} from 'node:fs';
import { join } from 'node:path';
import { PrismaService } from '../prisma/prisma.service.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit recommended for GCM

@Injectable()
export class SecretsService implements OnModuleInit {
  private masterKey: Buffer | null = null;
  private readonly dataDir = process.env.DATA_DIR?.trim() || './data';

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit(): void {
    this.initMasterKey();
  }

  /**
   * Initializes the 32-byte master key.
   * Checks process.env.MASTER_KEY first; otherwise reads or creates
   * <DATA_DIR>/master.key with mode 0o600 (owner-only permissions).
   */
  initMasterKey(): Buffer {
    if (this.masterKey) return this.masterKey;

    const envKey = process.env.MASTER_KEY?.trim();
    if (envKey) {
      this.masterKey = Buffer.from(
        envKey,
        envKey.length === 64 ? 'hex' : 'utf8',
      ).subarray(0, 32);
      if (this.masterKey.length < 32) {
        // Pad to 32 bytes deterministically if short
        this.masterKey = Buffer.concat([
          this.masterKey,
          Buffer.alloc(32 - this.masterKey.length),
        ]);
      }
      return this.masterKey;
    }

    mkdirSync(this.dataDir, { recursive: true });
    const keyPath = join(this.dataDir, 'master.key');

    if (existsSync(keyPath)) {
      const hex = readFileSync(keyPath, 'utf8').trim();
      this.masterKey = Buffer.from(hex, 'hex');
    } else {
      this.masterKey = randomBytes(32);
      writeFileSync(keyPath, this.masterKey.toString('hex'), {
        mode: 0o600,
        encoding: 'utf8',
      });
      try {
        chmodSync(keyPath, 0o600);
      } catch {
        // Ignore chmod errors on systems without POSIX permissions
      }
    }

    return this.masterKey;
  }

  encrypt(plaintext: string): string {
    const key = this.initMasterKey();
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();

    // Format: iv:tag:ciphertext (all in hex)
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
  }

  decrypt(payload: string): string {
    const key = this.initMasterKey();
    const parts = payload.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted payload format');
    }
    const [ivHex, tagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  }

  async isSet(name: string): Promise<boolean> {
    const row = await this.prisma.appSecret.findUnique({
      where: { name },
      select: { name: true },
    });
    return !!row;
  }

  async get(name: string): Promise<string | null> {
    const row = await this.prisma.appSecret.findUnique({
      where: { name },
      select: { value: true },
    });
    if (!row) return null;
    try {
      return this.decrypt(row.value);
    } catch {
      return null;
    }
  }

  async set(name: string, plaintext: string): Promise<void> {
    const encrypted = this.encrypt(plaintext);
    await this.prisma.appSecret.upsert({
      where: { name },
      create: { name, value: encrypted },
      update: { value: encrypted },
    });
  }

  async delete(name: string): Promise<void> {
    await this.prisma.appSecret.deleteMany({
      where: { name },
    });
  }
}
