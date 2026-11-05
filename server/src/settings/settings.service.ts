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

/** Schema defaults, returned when the settings row has not been created yet. */
const DEFAULTS: StoreSettings = {
  storeId: '',
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
  receiptPrintingEnabled: false,
  receiptPaperWidthMm: 80,
  priceTagsEnabled: false,
  digestSentOn: null,
  updatedAt: new Date(0),
};

/**
 * Store-wide configuration service (scoped per store, ADR 0045).
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
    const storeId = await this.stores.currentStoreId();
    const row = (await this.repo.get(storeId)) ?? { ...DEFAULTS, storeId };
    return this.withIdentity(storeId, row);
  }

  async update(dto: UpdateSettingsDto): Promise<StoreSettingsView> {
    const storeId = await this.stores.currentStoreId();
    const { storeName, storeAddress, storePhone, ...rest } = dto;
    await this.stores.updateIdentity({
      name: storeName,
      address: storeAddress,
      phone: storePhone,
    });
    const row = await this.repo.upsert(storeId, rest);
    return this.withIdentity(storeId, row);
  }

  /** Records that the closing digest went out for a store. */
  async markDigestSent(on: Date, storeId?: string): Promise<StoreSettings> {
    const targetStoreId = storeId ?? (await this.stores.currentStoreId());
    return this.repo.markDigestSent(targetStoreId, on);
  }

  private async withIdentity(
    storeId: string,
    row: StoreSettings,
  ): Promise<StoreSettingsView> {
    const identity = await this.stores.getIdentity(storeId);
    return {
      ...row,
      storeName: identity.name,
      storeAddress: identity.address,
      storePhone: identity.phone,
    };
  }
}

export type { SettingsRow };
