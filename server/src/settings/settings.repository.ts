import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { SettingsRow } from './settings.service.js';

const SINGLETON_ID = 1;

/** All Prisma access for the single StoreSettings row (id = 1). */
@Injectable()
export class SettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  get() {
    return this.prisma.storeSettings.findUnique({
      where: { id: SINGLETON_ID },
    });
  }

  upsert(data: SettingsRow) {
    return this.prisma.storeSettings.upsert({
      where: { id: SINGLETON_ID },
      create: { id: SINGLETON_ID, ...data },
      update: data,
    });
  }

  markDigestSent(on: Date) {
    return this.prisma.storeSettings.upsert({
      where: { id: SINGLETON_ID },
      create: { id: SINGLETON_ID, digestSentOn: on },
      update: { digestSentOn: on },
    });
  }
}
