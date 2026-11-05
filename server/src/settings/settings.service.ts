import { Injectable } from '@nestjs/common';
import { Prisma, StoreSettings } from '../generated/client/client.js';
import { StoresService } from '../stores/stores.service.js';
import { UpdateSettingsDto } from './dto/update-settings.dto.js';
import { SettingsRepository } from './settings.repository.js';

/** Config persisted in store_settings; store identity is merged in from stores. */
type SettingsRow = Omit<
  UpdateSettingsDto,
  'storeName' | 'storeAddress' | 'storePhone'
>;

/** Response shape: settings row + store identity (unchanged API contract). */
export interface StoreSettingsView extends StoreSettings {
  storeName: string | null;
  storeAddress: string | null;
  storePhone: string | null;
}

/** Schema defaults, returned when the singleton row has not been seeded yet. */
const DEFAULTS: StoreSettings = {
  id: 1,
  receiptFooter: null,
  telegramChatId: null,
  closingTime: '20:00',
  defaultWarrantyDays: 14,
  minMarginPercent: new Prisma.Decimal(0),
  lowStockThreshold: 2,
  defaultNasiyaDueDays: 30,
  overdueReminderDays: 3,
  discountsEnabled: false,
  discountPercentAllowed: true,
  discountAmountAllowed: true,
  discountPresetsPercent: [],
  discountPresetsAmount: [],
  maxDiscountPercent: new Prisma.Decimal(0),
  customerCreditEnabled: false,
  defaultCreditLimit: null,
  shiftsEnabled: false,
  repairsEnabled: false,
  bonusEnabled: false,
  bonusEarnPercent: new Prisma.Decimal(0),
  bonusMaxRedeemPercent: new Prisma.Decimal(0),
  digestSentOn: null,
  updatedAt: new Date(0),
};

/**
 * Store-wide configuration singleton. `get()` is this module's public API:
 * later waves (warranty, Telegram digest) inject SettingsService and call it.
 * Store identity (name/address/phone) lives in stores; this service merges it
 * in on read and writes it back through StoresService, so the API is unchanged.
 */
@Injectable()
export class SettingsService {
  constructor(
    private readonly repo: SettingsRepository,
    private readonly stores: StoresService,
  ) {}

  async get(): Promise<StoreSettingsView> {
    const row = (await this.repo.get()) ?? DEFAULTS;
    return this.withIdentity(row);
  }

  async update(dto: UpdateSettingsDto): Promise<StoreSettingsView> {
    const { storeName, storeAddress, storePhone, ...rest } = dto;
    await this.stores.updateIdentity({
      name: storeName,
      address: storeAddress,
      phone: storePhone,
    });
    const row = await this.repo.upsert(rest);
    return this.withIdentity(row);
  }

  /** Records that the closing digest went out, so the minute-cron fires once a day. */
  markDigestSent(on: Date): Promise<StoreSettings> {
    return this.repo.markDigestSent(on);
  }

  private async withIdentity(row: StoreSettings): Promise<StoreSettingsView> {
    const identity = await this.stores.getIdentity();
    return {
      ...row,
      storeName: identity.name,
      storeAddress: identity.address,
      storePhone: identity.phone,
    };
  }
}

export type { SettingsRow };
