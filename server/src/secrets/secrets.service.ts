import { Injectable } from '@nestjs/common';
import { AppKeyService } from './app-key.service.js';
import { open, seal } from './lib/aes-gcm.js';
import { SecretsRepository } from './secrets.repository.js';

/**
 * A secret's state: `set` (present and readable with the current master key),
 * `missing` (never stored), `unreadable` (stored but sealed under a different
 * master key — the DATA_DIR file was lost or replaced; T1).
 */
export type SecretState = 'set' | 'missing' | 'unreadable';

/**
 * Small, general secrets store: named values sealed with AES-256-GCM under the
 * app master key. Only server code reads a value (`read`); no controller may.
 * The HTTP surface this backs can say which {@link SecretState} it is in, never
 * what the value is.
 */
@Injectable()
export class SecretsService {
  constructor(
    private readonly repo: SecretsRepository,
    private readonly appKey: AppKeyService,
  ) {}

  async set(name: string, value: string): Promise<void> {
    const sealed = seal(this.appKey.getKey(), Buffer.from(value, 'utf8'));
    await this.repo.upsert(name, sealed);
  }

  isSet(name: string): Promise<boolean> {
    return this.repo.exists(name);
  }

  /** Classify a secret without throwing — `unreadable` when the key is wrong. */
  async state(name: string): Promise<SecretState> {
    const sealed = await this.repo.getSealed(name);
    if (!sealed) return 'missing';
    try {
      open(this.appKey.getKey(), sealed);
      return 'set';
    } catch {
      return 'unreadable';
    }
  }

  /**
   * Server-only. Returns null when the secret is not set; throws when it is
   * present but cannot be decrypted (the caller maps this to a clear 400).
   */
  async read(name: string): Promise<string | null> {
    const sealed = await this.repo.getSealed(name);
    if (!sealed) return null;
    return open(this.appKey.getKey(), sealed).toString('utf8');
  }

  async clear(name: string): Promise<void> {
    await this.repo.delete(name);
  }
}
