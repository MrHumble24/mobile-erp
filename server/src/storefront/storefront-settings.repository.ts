import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { StorefrontSettingsView } from './types/storefront.types.js';

@Injectable()
export class StorefrontSettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings(): Promise<StorefrontSettingsView> {
    const row = await this.prisma.storefrontSettings.findUnique({
      where: { id: 1 },
    });
    if (!row) {
      return {
        enabled: false,
        showPrices: true,
        contactPhone: null,
        contactTelegram: null,
        categoryIds: [],
        pickupEnabled: true,
        deliveryEnabled: false,
        deliveryPricingModeCode: 'FREE',
        deliveryFlatFee: null,
        deliveryFreeFrom: null,
        deliveryNote: null,
      };
    }
    const catIds = Array.isArray(row.categoryIds)
      ? (row.categoryIds as string[])
      : [];
    return {
      enabled: row.enabled,
      showPrices: row.showPrices,
      contactPhone: row.contactPhone,
      contactTelegram: row.contactTelegram,
      categoryIds: catIds,
      pickupEnabled: row.pickupEnabled,
      deliveryEnabled: row.deliveryEnabled,
      deliveryPricingModeCode: row.deliveryPricingModeCode,
      deliveryFlatFee: row.deliveryFlatFee
        ? row.deliveryFlatFee.toFixed(2)
        : null,
      deliveryFreeFrom: row.deliveryFreeFrom
        ? row.deliveryFreeFrom.toFixed(2)
        : null,
      deliveryNote: row.deliveryNote,
    };
  }

  async updateSettings(
    data: Partial<StorefrontSettingsView>,
  ): Promise<StorefrontSettingsView> {
    const updatePayload: Prisma.StorefrontSettingsUpdateInput = {};
    if (data.enabled !== undefined) updatePayload.enabled = data.enabled;
    if (data.showPrices !== undefined)
      updatePayload.showPrices = data.showPrices;
    if (data.contactPhone !== undefined)
      updatePayload.contactPhone = data.contactPhone;
    if (data.contactTelegram !== undefined)
      updatePayload.contactTelegram = data.contactTelegram;
    if (data.categoryIds !== undefined)
      updatePayload.categoryIds = data.categoryIds;
    if (data.pickupEnabled !== undefined)
      updatePayload.pickupEnabled = data.pickupEnabled;
    if (data.deliveryEnabled !== undefined)
      updatePayload.deliveryEnabled = data.deliveryEnabled;
    if (data.deliveryPricingModeCode !== undefined)
      updatePayload.deliveryPricingMode = {
        connect: { code: data.deliveryPricingModeCode },
      };
    if (data.deliveryFlatFee !== undefined)
      updatePayload.deliveryFlatFee =
        data.deliveryFlatFee !== null
          ? new Prisma.Decimal(data.deliveryFlatFee)
          : null;
    if (data.deliveryFreeFrom !== undefined)
      updatePayload.deliveryFreeFrom =
        data.deliveryFreeFrom !== null
          ? new Prisma.Decimal(data.deliveryFreeFrom)
          : null;
    if (data.deliveryNote !== undefined)
      updatePayload.deliveryNote = data.deliveryNote;

    const row = await this.prisma.storefrontSettings.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        enabled: data.enabled ?? false,
        showPrices: data.showPrices ?? true,
        contactPhone: data.contactPhone ?? null,
        contactTelegram: data.contactTelegram ?? null,
        categoryIds: data.categoryIds ?? [],
        pickupEnabled: data.pickupEnabled ?? true,
        deliveryEnabled: data.deliveryEnabled ?? false,
        deliveryPricingModeCode: data.deliveryPricingModeCode ?? 'FREE',
        deliveryFlatFee:
          data.deliveryFlatFee !== undefined && data.deliveryFlatFee !== null
            ? new Prisma.Decimal(data.deliveryFlatFee)
            : null,
        deliveryFreeFrom:
          data.deliveryFreeFrom !== undefined && data.deliveryFreeFrom !== null
            ? new Prisma.Decimal(data.deliveryFreeFrom)
            : null,
        deliveryNote: data.deliveryNote ?? null,
      },
      update: updatePayload,
    });

    const catIds = Array.isArray(row.categoryIds)
      ? (row.categoryIds as string[])
      : [];
    return {
      enabled: row.enabled,
      showPrices: row.showPrices,
      contactPhone: row.contactPhone,
      contactTelegram: row.contactTelegram,
      categoryIds: catIds,
      pickupEnabled: row.pickupEnabled,
      deliveryEnabled: row.deliveryEnabled,
      deliveryPricingModeCode: row.deliveryPricingModeCode,
      deliveryFlatFee: row.deliveryFlatFee
        ? row.deliveryFlatFee.toFixed(2)
        : null,
      deliveryFreeFrom: row.deliveryFreeFrom
        ? row.deliveryFreeFrom.toFixed(2)
        : null,
      deliveryNote: row.deliveryNote,
    };
  }
}
