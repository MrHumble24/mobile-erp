import { Injectable } from '@nestjs/common';
import {
  SecretsService,
  type SecretState,
} from '../../secrets/secrets.service.js';

/** The secret kinds each provider needs, with their store name and env fallback.
 * No secret is ever returned over HTTP — only its {@link SecretState}. */
export const PROVIDER_SECRETS = {
  TELEGRAM: {
    botToken: {
      name: 'provider.telegram.bot_token',
      env: 'TELEGRAM_BOT_TOKEN',
    },
  },
  GOOGLE_DRIVE: {
    clientId: {
      name: 'provider.google_drive.client_id',
      env: 'GOOGLE_OAUTH_CLIENT_ID',
    },
    clientSecret: {
      name: 'provider.google_drive.client_secret',
      env: 'GOOGLE_OAUTH_CLIENT_SECRET',
    },
    refreshToken: { name: 'provider.google_drive.refresh_token', env: null },
  },
  ONEDRIVE: {
    clientId: {
      name: 'provider.onedrive.client_id',
      env: 'MICROSOFT_OAUTH_CLIENT_ID',
    },
    clientSecret: {
      name: 'provider.onedrive.client_secret',
      env: 'MICROSOFT_OAUTH_CLIENT_SECRET',
    },
    refreshToken: { name: 'provider.onedrive.refresh_token', env: null },
  },
} as const;

type ProviderCode = keyof typeof PROVIDER_SECRETS;
type SecretKind<P extends ProviderCode> = keyof (typeof PROVIDER_SECRETS)[P];

function spec(
  code: string,
  kind: string,
): { name: string; env: string | null } | null {
  const provider = (
    PROVIDER_SECRETS as Record<
      string,
      Record<string, { name: string; env: string | null }>
    >
  )[code];
  return provider?.[kind] ?? null;
}

/** Reads/writes provider secrets through the store, falling back to env. */
@Injectable()
export class ProviderSecrets {
  constructor(private readonly secrets: SecretsService) {}

  kinds(code: string): string[] {
    return Object.keys(
      (PROVIDER_SECRETS as Record<string, object>)[code] ?? {},
    );
  }

  /** Readable store value first, then the env fallback. Never throws. */
  async read(code: string, kind: string): Promise<string | null> {
    const s = spec(code, kind);
    if (!s) return null;
    if ((await this.secrets.state(s.name)) === 'set') {
      return this.secrets.read(s.name);
    }
    return (s.env && process.env[s.env]?.trim()) || null;
  }

  /** `set` when a usable value exists (readable store value or env fallback). */
  async state(code: string, kind: string): Promise<SecretState> {
    const s = spec(code, kind);
    if (!s) return 'missing';
    const st = await this.secrets.state(s.name);
    if (st === 'set') return 'set';
    if (s.env && process.env[s.env]?.trim()) return 'set';
    return st; // 'missing' or 'unreadable'
  }

  async set(code: string, kind: string, value: string): Promise<void> {
    const s = spec(code, kind);
    if (s) await this.secrets.set(s.name, value);
  }

  async clear(code: string, kind: string): Promise<void> {
    const s = spec(code, kind);
    if (s) await this.secrets.clear(s.name);
  }
}

export type { ProviderCode, SecretKind };
