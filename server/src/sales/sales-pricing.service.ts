import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { Prisma } from '../generated/client/client.js';
import {
  resolveCheckoutPricing,
  type DiscountSettings,
} from '../pricing/lib/checkout-pricing.js';
import { PricingService } from '../pricing/pricing.service.js';
import { SettingsService } from '../settings/settings.service.js';
import { CreateSaleDto } from './dto/create-sale.dto.js';

type Decimal = Prisma.Decimal;

/** Customer defaults that steer checkout pricing (null = walk-in, no card). */
export interface CustomerPricing {
  priceLevelCode: string;
  standingDiscountPercent: Decimal;
}

/** The outcome handed to the checkout repository. */
export interface PricingOutcome {
  salePrice: Decimal;
  listPriceSnapshot: Decimal | null;
  priceLevelCode: string;
}

export interface CheckoutOptions {
  /** Offline replay (sync push): trust the till, never reject (ADR 0034). */
  trustClientPrice?: boolean;
}

/** One home for the checkout list-price + discount money rules (ADR 0034). */
@Injectable()
export class SalesPricingService {
  constructor(
    private readonly pricing: PricingService,
    private readonly settings: SettingsService,
  ) {}

  async forUnit(
    caller: AuthenticatedUser,
    dto: CreateSaleDto,
    device: {
      id: string;
      modelId: string;
      specs: Prisma.JsonValue;
      targetPrice: Decimal | null;
      model: { salePrice: Decimal | null };
    },
    customer: CustomerPricing | null,
    options?: CheckoutOptions,
  ): Promise<PricingOutcome> {
    const { level, settings, standing } = await this.context(dto, customer);
    const listPrice = await this.pricing.listPriceForUnit(level, {
      deviceId: device.id,
      modelId: device.modelId,
      storage: storageOf(device.specs),
      targetPrice: device.targetPrice,
      salePrice: device.model.salePrice,
    });
    return this.decide(
      caller,
      dto,
      listPrice,
      level,
      settings,
      standing,
      options,
    );
  }

  async forQuantity(
    caller: AuthenticatedUser,
    dto: CreateSaleDto,
    modelId: string,
    quantity: number,
    salePrice: Decimal | null,
    customer: CustomerPricing | null,
    options?: CheckoutOptions,
  ): Promise<PricingOutcome> {
    const { level, settings, standing } = await this.context(dto, customer);
    const perPiece = await this.pricing.listPriceForProduct(level, {
      modelId,
      storage: '',
      salePrice,
    });
    const listPrice = perPiece === null ? null : perPiece.times(quantity);
    return this.decide(
      caller,
      dto,
      listPrice,
      level,
      settings,
      standing,
      options,
    );
  }

  private decide(
    caller: AuthenticatedUser,
    dto: CreateSaleDto,
    listPrice: Decimal | null,
    level: string,
    settings: DiscountSettings,
    standing: Decimal,
    options?: CheckoutOptions,
  ): PricingOutcome {
    const outcome = resolveCheckoutPricing({
      listPrice,
      requestedSalePrice: new Prisma.Decimal(dto.salePrice),
      discount: dto.discount,
      settings,
      customerStandingPercent: standing,
      canOverridePrice: caller.permissions.has('sale.price.override'),
      canDiscountUnlimited: caller.permissions.has('sale.discount.unlimited'),
      trustClientPrice: options?.trustClientPrice,
      claimedListPrice:
        dto.listPrice === undefined
          ? undefined
          : new Prisma.Decimal(dto.listPrice),
    });
    return { ...outcome, priceLevelCode: level };
  }

  private async context(
    dto: CreateSaleDto,
    customer: CustomerPricing | null,
  ): Promise<{ level: string; settings: DiscountSettings; standing: Decimal }> {
    const row = await this.settings.get();
    const level = dto.priceLevelCode ?? customer?.priceLevelCode ?? 'RETAIL';
    await this.pricing.assertLevel(level);
    return {
      level,
      settings: {
        enabled: row.discountsEnabled,
        percentAllowed: row.discountPercentAllowed,
        amountAllowed: row.discountAmountAllowed,
        maxDiscountPercent: new Prisma.Decimal(row.maxDiscountPercent),
      },
      standing: customer
        ? new Prisma.Decimal(customer.standingDiscountPercent)
        : new Prisma.Decimal(0),
    };
  }
}

function storageOf(specs: Prisma.JsonValue): string {
  if (specs && typeof specs === 'object' && !Array.isArray(specs)) {
    const value = (specs as Record<string, unknown>).storage;
    if (typeof value === 'string') return value;
  }
  return '';
}
