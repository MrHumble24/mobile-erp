import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

export type ConfigWithProvider = Prisma.OnlinePaymentProviderConfigGetPayload<{
  include: { provider: true };
}>;

@Injectable()
export class OnlinePaymentsConfigRepository {
  constructor(protected readonly prisma: PrismaService) {}

  async listConfigs(): Promise<ConfigWithProvider[]> {
    return this.prisma.onlinePaymentProviderConfig.findMany({
      include: { provider: true },
      orderBy: { provider: { sortOrder: 'asc' } },
    });
  }

  async getConfig(providerCode: string): Promise<ConfigWithProvider | null> {
    return this.prisma.onlinePaymentProviderConfig.findUnique({
      where: { providerCode },
      include: { provider: true },
    });
  }

  async upsertConfig(
    providerCode: string,
    data: {
      isEnabled?: boolean;
      isTestMode?: boolean;
      allowedIps?: string[] | null;
      settings?: Record<string, unknown>;
    },
  ): Promise<ConfigWithProvider> {
    const updateData: Prisma.OnlinePaymentProviderConfigUpdateInput = {};
    if (data.isEnabled !== undefined) updateData.isEnabled = data.isEnabled;
    if (data.isTestMode !== undefined) updateData.isTestMode = data.isTestMode;
    if (data.allowedIps !== undefined) {
      updateData.allowedIps =
        data.allowedIps === null ? Prisma.DbNull : data.allowedIps;
    }
    if (data.settings !== undefined) {
      updateData.settings = data.settings as Prisma.InputJsonValue;
    }

    return this.prisma.onlinePaymentProviderConfig.upsert({
      where: { providerCode },
      create: {
        providerCode,
        isEnabled: data.isEnabled ?? false,
        isTestMode: data.isTestMode ?? true,
        allowedIps: data.allowedIps
          ? (data.allowedIps as Prisma.InputJsonValue)
          : Prisma.DbNull,
        settings: data.settings ? (data.settings as Prisma.InputJsonValue) : {},
      },
      update: updateData,
      include: { provider: true },
    });
  }
}
