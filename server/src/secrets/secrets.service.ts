import { Injectable } from '@nestjs/common';
import { AppKeyService } from './app-key.service.js';
import { open, seal } from './lib/aes-gcm.js';
import { SecretsRepository } from './secrets.repository.js';

/**
 * Small, general secrets store: named values sealed with AES-256-GCM under the
 * app master key. Only server code reads a value (`read`); no controller may.
 * The HTTP surface this backs can say "is it set", never what it is.
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

  /** Server-only. Returns null when the secret is not set. */
  async read(name: string): Promise<string | null> {
    const sealed = await this.repo.getSealed(name);
    if (!sealed) return null;
    return open(this.appKey.getKey(), sealed).toString('utf8');
  }

  async clear(name: string): Promise<void> {
    await this.repo.delete(name);
  }
}
