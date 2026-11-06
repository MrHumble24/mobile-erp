import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CompanyService } from '../company/company.service.js';
import { SecretsService } from '../secrets/secrets.service.js';
import type { ConfigWithProvider } from './online-payments-config.repository.js';
import { OnlinePaymentsRepository } from './online-payments.repository.js';
import { ProviderRegistry } from './providers/provider.registry.js';
import type { ProviderConfigView } from './types/online-payment.types.js';

export function secretKeyName(providerCode: string): string {
  return `payment.${providerCode.toLowerCase()}.key`;
}

@Injectable()
export class OnlinePaymentsConfigService {
  constructor(
    private readonly repo: OnlinePaymentsRepository,
    private readonly secrets: SecretsService,
    private readonly registry: ProviderRegistry,
    private readonly company: CompanyService,
  ) {}

  private async formatConfig(
    r: ConfigWithProvider,
  ): Promise<ProviderConfigView> {
    return {
      providerCode: r.providerCode,
      label: r.provider.label,
      isEnabled: r.isEnabled,
      isTestMode: r.isTestMode,
      allowedIps: (r.allowedIps as string[] | null) ?? null,
      settings: (r.settings as Record<string, unknown>) ?? {},
      secretStatus: await this.secrets.state(secretKeyName(r.providerCode)),
    };
  }

  async listConfigs(): Promise<ProviderConfigView[]> {
    const rows = await this.repo.listConfigs();
    return Promise.all(rows.map((r) => this.formatConfig(r)));
  }

  async getConfig(code: string): Promise<ProviderConfigView> {
    const row = await this.repo.getConfig(code.toUpperCase());
    if (!row) throw new NotFoundException(`Provider ${code} not found`);
    return this.formatConfig(row);
  }

  async saveConfig(
    code: string,
    dto: {
      isEnabled?: boolean;
      isTestMode?: boolean;
      allowedIps?: string[] | null;
      settings?: Record<string, unknown>;
    },
  ): Promise<ProviderConfigView> {
    const providerCode = code.toUpperCase();
    if (!this.registry.has(providerCode)) {
      throw new NotFoundException(`Unknown payment provider ${providerCode}`);
    }

    if (dto.isEnabled) {
      const currency = await this.company.getCurrency();
      if (currency.code !== 'UZS') {
        throw new BadRequestException({
          code: 'ONLINE_PAYMENT_CURRENCY_NOT_UZS',
          message: `Online payment can be enabled only when company currency is UZS (current: ${currency.code})`,
        });
      }
    }

    await this.repo.upsertConfig(providerCode, dto);
    return this.getConfig(providerCode);
  }

  async setSecret(code: string, secret: string): Promise<void> {
    const providerCode = code.toUpperCase();
    if (!this.registry.has(providerCode)) {
      throw new NotFoundException(`Unknown payment provider ${providerCode}`);
    }
    if (!secret || typeof secret !== 'string') {
      throw new BadRequestException('Secret must be a non-empty string');
    }
    await this.secrets.set(secretKeyName(providerCode), secret);
  }

  async checkProvider(code: string): Promise<{ ok: boolean; message: string }> {
    const providerCode = code.toUpperCase();
    const adapter = this.registry.get(providerCode);
    const row = await this.repo.getConfig(providerCode);
    const secret = await this.secrets.read(secretKeyName(providerCode));
    await adapter.validate(row?.settings, secret);
    return {
      ok: true,
      message: `${row?.provider.label ?? providerCode} configuration is valid`,
    };
  }
}
