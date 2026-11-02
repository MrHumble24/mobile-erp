import { Injectable } from '@nestjs/common';
import { Prisma, StoreSettings } from '../generated/client/client.js';
import { UpdateSettingsDto } from './dto/update-settings.dto.js';
import { SettingsRepository } from './settings.repository.js';

/** Schema defaults, returned when the singleton row has not been seeded yet. */
const DEFAULTS: StoreSettings = {
  id: 1,
  storeName: null,
  storeAddress: null,
  storePhone: null,
  receiptFooter: null,
  telegramChatId: null,
  closingTime: '20:00',
  defaultWarrantyDays: 14,
  minMarginPercent: new Prisma.Decimal(0),
  lowStockThreshold: 2,
  defaultNasiyaDueDays: 30,
  overdueReminderDays: 3,
  digestSentOn: null,
  updatedAt: new Date(0),
};

/**
 * Store-wide configuration singleton. `get()` is this module's public API:
 * later waves (warranty, Telegram digest) inject SettingsService and call it.
 */
@Injectable()
export class SettingsService {
  constructor(private readonly repo: SettingsRepository) {}

  async get(): Promise<StoreSettings> {
    return (await this.repo.get()) ?? DEFAULTS;
  }

  update(dto: UpdateSettingsDto): Promise<StoreSettings> {
    return this.repo.upsert(dto);
  }

  /** Records that the closing digest went out, so the minute-cron fires once a day. */
  markDigestSent(on: Date): Promise<StoreSettings> {
    return this.repo.markDigestSent(on);
  }
}
