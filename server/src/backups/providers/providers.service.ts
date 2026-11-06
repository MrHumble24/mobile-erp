import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ProviderAuthError } from '../storage/lib/provider-http.js';
import { StorageRegistry } from '../storage/storage.registry.js';
import {
  BACKUP_CHAT_IS_STAFF_CHAT,
  PROVIDER_LOCAL_LOCKED,
  PROVIDER_NOT_AVAILABLE,
  PROVIDER_NOT_CONNECTED,
  PROVIDER_NOT_FOUND,
  PROVIDER_STATUS,
} from '../types/backup.types.js';
import { ProviderDestination } from './provider-destination.js';
import { ProviderSecrets } from './provider-secrets.js';
import { ProvidersRepository } from './providers.repository.js';
import { BackupsRepository } from '../backups.repository.js';
import type { PlaceView, ProviderConfigJson } from './types/provider.types.js';

const OAUTH_CODES = new Set(['GOOGLE_DRIVE', 'ONEDRIVE']);

/** Manages the storage places: list, switch on/off, settings, secrets, test,
 * disconnect. Secrets are write-only; answers carry only presence. */
@Injectable()
export class ProvidersService {
  private readonly logger = new Logger(ProvidersService.name);

  constructor(
    private readonly repo: ProvidersRepository,
    private readonly backupsRepo: BackupsRepository,
    private readonly registry: StorageRegistry,
    private readonly secrets: ProviderSecrets,
    private readonly destination: ProviderDestination,
  ) {}

  async listPlaces(): Promise<PlaceView[]> {
    const providers = await this.backupsRepo.listProviders();
    const configs = new Map(
      (await this.repo.listConfigs()).map((c) => [c.providerCode, c]),
    );
    return Promise.all(
      providers.map((p) =>
        this.place(p.code, p.label, configs.get(p.code) ?? null),
      ),
    );
  }

  /** LOCAL + every switched-on, connected place — where a run sends. */
  async enabledCodes(): Promise<string[]> {
    const configs = await this.repo.listConfigs();
    const remote: string[] = [];
    for (const c of configs) {
      if (
        c.enabled &&
        this.registry.has(c.providerCode) &&
        (await this.connected(c.providerCode))
      ) {
        remote.push(c.providerCode);
      }
    }
    return ['LOCAL', ...remote];
  }

  async setEnabled(code: string, enabled: boolean): Promise<PlaceView> {
    this.assertNotLocal(code);
    this.assertAvailable(code);
    if (enabled && !(await this.connected(code))) {
      throw new ConflictException({
        code: PROVIDER_NOT_CONNECTED,
        message: 'Set up and test this place before switching it on',
      });
    }
    await this.repo.setEnabled(code, enabled);
    return this.placeOf(code);
  }

  async setSettings(
    code: string,
    settings: ProviderConfigJson,
  ): Promise<PlaceView> {
    this.assertNotLocal(code);
    if (code === 'TELEGRAM' && settings.chatId) {
      const staff = await this.repo.storeAlertChatIds();
      if (staff.includes(settings.chatId)) {
        throw new BadRequestException({
          code: BACKUP_CHAT_IS_STAFF_CHAT,
          message:
            'The backup chat must not be a shop alert chat; use a private backup chat',
        });
      }
    }
    await this.repo.mergeConfig(code, settings);
    return this.placeOf(code);
  }

  async setSecret(code: string, kind: string, value: string): Promise<void> {
    this.assertNotLocal(code);
    if (!this.secrets.kinds(code).includes(kind) || kind === 'refreshToken') {
      throw new BadRequestException(`Unknown secret '${kind}' for ${code}`);
    }
    await this.secrets.set(code, kind, value);
  }

  /** Upload+remove a tiny file (or send a message) to prove the place works. */
  async test(code: string): Promise<PlaceView> {
    this.assertNotLocal(code);
    this.assertAvailable(code);
    const dest = await this.destination.resolve(code);
    try {
      await this.registry.get(code).validate(dest.config, dest.secret);
      await this.recordResult(code, true);
    } catch (err) {
      await this.recordResult(code, false, err);
    }
    return this.placeOf(code);
  }

  async disconnect(code: string): Promise<PlaceView> {
    this.assertNotLocal(code);
    if (OAUTH_CODES.has(code)) await this.secrets.clear(code, 'refreshToken');
    await this.repo.disconnect(code);
    return this.placeOf(code);
  }

  /** Record a run's or test's per-place outcome on the config row. */
  async recordResult(code: string, ok: boolean, err?: unknown): Promise<void> {
    if (code === 'LOCAL') return;
    if (ok) {
      await this.repo.setStatus(code, PROVIDER_STATUS.OK, {
        lastError: null,
        lastSuccessAt: new Date(),
      });
      return;
    }
    const status =
      err instanceof ProviderAuthError
        ? PROVIDER_STATUS.NEEDS_RECONNECT
        : PROVIDER_STATUS.ERROR;
    const message = err instanceof Error ? err.message : String(err);
    this.logger.warn(`Place ${code} failed: ${message}`);
    await this.repo.setStatus(code, status, { lastError: message });
  }

  // --- helpers --------------------------------------------------------------
  private async connected(code: string): Promise<boolean> {
    if (code === 'TELEGRAM') {
      const cfg = (await this.repo.getConfig(code))?.config as
        ProviderConfigJson | undefined;
      return (
        (await this.secrets.state(code, 'botToken')) === 'set' && !!cfg?.chatId
      );
    }
    if (OAUTH_CODES.has(code))
      return (await this.secrets.state(code, 'refreshToken')) === 'set';
    return false;
  }

  private async configured(code: string): Promise<boolean> {
    if (code === 'TELEGRAM')
      return (await this.secrets.state(code, 'botToken')) === 'set';
    if (OAUTH_CODES.has(code)) {
      return (
        (await this.secrets.state(code, 'clientId')) === 'set' &&
        (await this.secrets.state(code, 'clientSecret')) === 'set'
      );
    }
    return code === 'LOCAL';
  }

  private async place(
    code: string,
    label: string,
    config: Awaited<ReturnType<ProvidersRepository['getConfig']>>,
  ): Promise<PlaceView> {
    const available = this.registry.has(code);
    const caps = available
      ? this.registry.get(code).capabilities
      : { list: false, download: false, delete: false, maxPartBytes: null };
    if (code === 'LOCAL') {
      return {
        code,
        label,
        available,
        configured: true,
        connected: true,
        enabled: true,
        status: PROVIDER_STATUS.OK,
        lastSuccessAt: null,
        lastError: null,
        capabilities: caps,
        settings: {},
        locked: true,
      };
    }
    return {
      code,
      label,
      available,
      configured: await this.configured(code),
      connected: await this.connected(code),
      enabled: config?.enabled ?? false,
      status: config?.statusCode ?? PROVIDER_STATUS.NEVER_USED,
      lastSuccessAt: config?.lastSuccessAt ?? null,
      lastError: config?.lastError ?? null,
      capabilities: caps,
      settings: (config?.config as ProviderConfigJson) ?? {},
      locked: false,
    };
  }

  private async placeOf(code: string): Promise<PlaceView> {
    const provider = (await this.backupsRepo.listProviders()).find(
      (p) => p.code === code,
    );
    if (!provider)
      throw new NotFoundException({
        code: PROVIDER_NOT_FOUND,
        message: 'Unknown place',
      });
    return this.place(code, provider.label, await this.repo.getConfig(code));
  }

  private assertNotLocal(code: string): void {
    if (code === 'LOCAL') {
      throw new ForbiddenException({
        code: PROVIDER_LOCAL_LOCKED,
        message: 'Server disk is always on',
      });
    }
  }

  private assertAvailable(code: string): void {
    if (!this.registry.has(code)) {
      throw new BadRequestException({
        code: PROVIDER_NOT_AVAILABLE,
        message: 'This place is not available on this server',
      });
    }
  }
}
