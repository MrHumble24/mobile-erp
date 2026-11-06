import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { PROVIDER_STATUS } from '../types/backup.types.js';
import type { ProviderConfigJson } from './types/provider.types.js';

/** Prisma access for provider config rows and the OAuth-state table. */
@Injectable()
export class ProvidersRepository {
  constructor(private readonly prisma: PrismaService) {}

  listConfigs() {
    return this.prisma.backupProviderConfig.findMany();
  }

  getConfig(code: string) {
    return this.prisma.backupProviderConfig.findUnique({
      where: { providerCode: code },
    });
  }

  private upsert(code: string, data: Record<string, unknown>) {
    return this.prisma.backupProviderConfig.upsert({
      where: { providerCode: code },
      create: { providerCode: code, ...data },
      update: data,
    });
  }

  setEnabled(code: string, enabled: boolean) {
    return this.upsert(code, { enabled });
  }

  /** Merge non-secret settings into the JSON column. */
  async mergeConfig(code: string, patch: Partial<ProviderConfigJson>) {
    const current = (await this.getConfig(code))?.config as
      ProviderConfigJson | undefined;
    const merged = { ...(current ?? {}), ...patch };
    return this.upsert(code, { config: merged });
  }

  setStatus(
    code: string,
    statusCode: string,
    extra: { lastError?: string | null; lastSuccessAt?: Date } = {},
  ) {
    return this.upsert(code, { statusCode, ...extra });
  }

  /** Forget a connection: clear the stored account, reset status, switch off. */
  disconnect(code: string) {
    return this.upsert(code, {
      enabled: false,
      statusCode: PROVIDER_STATUS.NEVER_USED,
      lastError: null,
      lastSuccessAt: null,
      config: {},
    });
  }

  // --- OAuth state ----------------------------------------------------------
  createOauthState(data: {
    state: string;
    providerCode: string;
    userId: string;
    codeVerifier: string | null;
    redirectTo: string;
    expiresAt: Date;
  }) {
    return this.prisma.backupOauthState.create({ data });
  }

  /** Consume a state: it must exist, be unused, unexpired and this provider's.
   * Returns the row (and marks it used) or null. */
  async consumeOauthState(state: string, providerCode: string) {
    const row = await this.prisma.backupOauthState.findUnique({
      where: { state },
    });
    if (
      !row ||
      row.usedAt !== null ||
      row.providerCode !== providerCode ||
      row.expiresAt.getTime() < Date.now()
    ) {
      return null;
    }
    await this.prisma.backupOauthState.update({
      where: { state },
      data: { usedAt: new Date() },
    });
    return row;
  }

  deleteExpiredOauthStates() {
    return this.prisma.backupOauthState.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }

  /** Telegram chat ids used for the shops' staff alerts — a backup chat must not
   * be one of these (cross-domain read of store_settings, deliberate). */
  async storeAlertChatIds(): Promise<string[]> {
    const rows = await this.prisma.storeSettings.findMany({
      where: { telegramChatId: { not: null } },
      select: { telegramChatId: true },
    });
    return rows
      .map((r) => r.telegramChatId)
      .filter((c): c is string => c !== null);
  }
}
