import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { corsOrigins, publicOrigin } from '../../common/lib/origins.js';
import type { Destination } from '../storage/backup-storage.js';
import {
  buildConsentUrl,
  exchangeCode,
  makePkce,
} from '../storage/lib/oauth-client.js';
import { specFor } from '../storage/lib/oauth-providers.js';
import { StorageRegistry } from '../storage/storage.registry.js';
import {
  OAUTH_NOT_SUPPORTED,
  OAUTH_RETURN_URL_INVALID,
  OAUTH_STATE_INVALID,
  PROVIDER_NOT_CONFIGURED,
  PROVIDER_STATUS,
} from '../types/backup.types.js';
import { ProviderDestination } from './provider-destination.js';
import { ProviderSecrets } from './provider-secrets.js';
import { ProvidersRepository } from './providers.repository.js';

const STATE_TTL_MS = 10 * 60 * 1000;

interface WithAccountInfo {
  accountInfo(
    dest: Destination,
  ): Promise<{ accountName?: string; accountEmail?: string }>;
}

/** The OAuth connect flow for Drive / OneDrive (PART 4). `state` is random,
 * single-use, short-lived and bound to the user + provider; the return URL must
 * be a trusted origin (no open redirect); PKCE throughout. */
@Injectable()
export class OauthService {
  private readonly logger = new Logger(OauthService.name);

  constructor(
    private readonly repo: ProvidersRepository,
    private readonly secrets: ProviderSecrets,
    private readonly registry: StorageRegistry,
    private readonly destination: ProviderDestination,
  ) {}

  redirectUri(code: string): string {
    return `${publicOrigin()}/backups/oauth/${code}/callback`;
  }

  async start(
    code: string,
    userId: string,
    returnTo: string,
  ): Promise<{ url: string }> {
    const spec = specFor(code);
    if (!spec)
      throw new BadRequestException({
        code: OAUTH_NOT_SUPPORTED,
        message: 'Not an OAuth place',
      });
    // Refuse an untrusted return URL first, before anything else (no open redirect).
    this.assertTrustedReturn(returnTo);
    const clientId = await this.secrets.read(code, 'clientId');
    if (
      !clientId ||
      (await this.secrets.state(code, 'clientSecret')) !== 'set'
    ) {
      throw new ConflictException({
        code: PROVIDER_NOT_CONFIGURED,
        message: 'Set the OAuth client id and secret first',
      });
    }

    await this.repo.deleteExpiredOauthStates().catch(() => undefined);
    const pkce = makePkce();
    const state = randomBytes(24).toString('hex');
    await this.repo.createOauthState({
      state,
      providerCode: code,
      userId,
      codeVerifier: pkce.verifier,
      redirectTo: returnTo,
      expiresAt: new Date(Date.now() + STATE_TTL_MS),
    });
    const url = buildConsentUrl(spec, {
      clientId,
      redirectUri: this.redirectUri(code),
      state,
      codeChallenge: pkce.challenge,
    });
    return { url };
  }

  /** Returns where to send the browser next (always a trusted URL). */
  async callback(
    code: string,
    state: string,
    authCode: string,
  ): Promise<string> {
    const row = await this.repo.consumeOauthState(state, code);
    if (!row) {
      throw new BadRequestException({
        code: OAUTH_STATE_INVALID,
        message: 'Invalid or used state',
      });
    }
    try {
      await this.exchangeAndStore(code, authCode, row.codeVerifier ?? '');
      return withParam(row.redirectTo, 'backupConnected', code);
    } catch (err) {
      this.logger.warn(`OAuth callback for ${code} failed: ${String(err)}`);
      return withParam(row.redirectTo, 'backupError', code);
    }
  }

  private async exchangeAndStore(
    code: string,
    authCode: string,
    codeVerifier: string,
  ): Promise<void> {
    const spec = specFor(code)!;
    const clientId = (await this.secrets.read(code, 'clientId')) ?? '';
    const clientSecret = (await this.secrets.read(code, 'clientSecret')) ?? '';
    const tokens = await exchangeCode(spec, {
      clientId,
      clientSecret,
      code: authCode,
      redirectUri: this.redirectUri(code),
      codeVerifier,
    });
    if (!tokens.refreshToken) {
      throw new UnprocessableEntityException(
        'The provider did not return a refresh token (offline access)',
      );
    }
    await this.secrets.set(code, 'refreshToken', tokens.refreshToken);
    await this.storeAccount(code);
    await this.repo.setStatus(code, PROVIDER_STATUS.OK, {
      lastError: null,
      lastSuccessAt: new Date(),
    });
  }

  private async storeAccount(code: string): Promise<void> {
    const adapter = this.registry.get(code) as unknown as WithAccountInfo;
    if (typeof adapter.accountInfo !== 'function') return;
    try {
      const dest = await this.destination.resolve(code);
      const info = await adapter.accountInfo(dest);
      await this.repo.mergeConfig(code, {
        accountName: info.accountName,
        accountEmail: info.accountEmail,
      });
    } catch (err) {
      this.logger.warn(`Could not read ${code} account: ${String(err)}`);
    }
  }

  private assertTrustedReturn(returnTo: string): void {
    let origin: string;
    try {
      origin = new URL(returnTo).origin;
    } catch {
      throw new BadRequestException({
        code: OAUTH_RETURN_URL_INVALID,
        message: 'Bad return URL',
      });
    }
    const allowed = new Set([...corsOrigins(), publicOrigin()]);
    if (!allowed.has(origin)) {
      throw new BadRequestException({
        code: OAUTH_RETURN_URL_INVALID,
        message: 'Untrusted return URL',
      });
    }
  }
}

function withParam(url: string, key: string, value: string): string {
  const u = new URL(url);
  u.searchParams.set(key, value);
  return u.toString();
}
