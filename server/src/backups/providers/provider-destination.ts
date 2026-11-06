import { Injectable } from '@nestjs/common';
import type { Destination } from '../storage/backup-storage.js';
import { ProviderSecrets } from './provider-secrets.js';
import { ProvidersRepository } from './providers.repository.js';

/**
 * Builds a provider's {@link Destination} (non-secret config + its secrets) for
 * the adapter. The one place secrets are read for an upload/download — resolved
 * from the store with env fallback, never from the request.
 */
@Injectable()
export class ProviderDestination {
  constructor(
    private readonly repo: ProvidersRepository,
    private readonly secrets: ProviderSecrets,
  ) {}

  async resolve(code: string): Promise<Destination> {
    if (code === 'LOCAL') return { config: {}, secret: undefined };
    const config = (await this.repo.getConfig(code))?.config ?? {};
    const secret: Record<string, string | null> = {};
    for (const kind of this.secrets.kinds(code)) {
      secret[kind] = await this.secrets.read(code, kind);
    }
    // Rotated refresh tokens are sealed back in place of the old one (item 6).
    const onRefreshToken = this.secrets.kinds(code).includes('refreshToken')
      ? (token: string) => this.secrets.set(code, 'refreshToken', token)
      : undefined;
    return { config, secret, onRefreshToken };
  }
}
