import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { SettingsRow } from './settings.service.js';

/** All Prisma access for StoreSettings rows (one row per store, ADR 0045). */
@Injectable()
export class SettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  get(storeId: string) {
    return this.prisma.storeSettings.findUnique({
      where: { storeId },
    });
  }

  upsert(storeId: string, data: SettingsRow) {
    return this.prisma.storeSettings.upsert({
      where: { storeId },
      create: { storeId, ...data },
      update: data,
    });
  }

  markDigestSent(storeId: string, on: Date) {
    return this.prisma.storeSettings.upsert({
      where: { storeId },
      create: { storeId, digestSentOn: on },
      update: { digestSentOn: on },
    });
  }
}
