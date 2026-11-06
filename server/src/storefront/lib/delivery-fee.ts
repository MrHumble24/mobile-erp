import { BadRequestException } from '@nestjs/common';
import { Prisma } from '../../generated/client/client.js';

export interface DeliveryZoneInput {
  id: string;
  fee: Prisma.Decimal | number | string;
  isActive: boolean;
}

export interface DeliveryFeeInput {
  fulfillmentMethod: string;
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  pricingMode: string;
  flatFee?: Prisma.Decimal | number | string | null;
  freeFrom?: Prisma.Decimal | number | string | null;
  orderPrice?: Prisma.Decimal | number | string | null;
  zone?: DeliveryZoneInput | null;
}

/**
 * Pure calculation of the delivery fee for an order.
 * - PICKUP: 0 when pickup is enabled; refused when off.
 * - DELIVERY: refused when off.
 * - Free when orderPrice >= deliveryFreeFrom.
 * - Otherwise determined by pricingMode (FREE: 0, FLAT: flatFee, BY_ZONE: zone.fee).
 */
export function calculateDeliveryFee(input: DeliveryFeeInput): Prisma.Decimal {
  const method = input.fulfillmentMethod.toUpperCase();

  if (method === 'PICKUP') {
    if (!input.pickupEnabled) {
      throw new BadRequestException({
        code: 'PICKUP_DISABLED',
        message: 'Store pickup is currently disabled',
      });
    }
    return new Prisma.Decimal(0);
  }

  if (method === 'DELIVERY') {
    if (!input.deliveryEnabled) {
      throw new BadRequestException({
        code: 'DELIVERY_DISABLED',
        message: 'Delivery is currently disabled',
      });
    }

    if (
      input.freeFrom !== null &&
      input.freeFrom !== undefined &&
      input.orderPrice !== null &&
      input.orderPrice !== undefined
    ) {
      const price = new Prisma.Decimal(input.orderPrice);
      const threshold = new Prisma.Decimal(input.freeFrom);
      if (price.greaterThanOrEqualTo(threshold)) {
        return new Prisma.Decimal(0);
      }
    }

    const mode = input.pricingMode.toUpperCase();
    if (mode === 'FREE') {
      return new Prisma.Decimal(0);
    }
    if (mode === 'FLAT') {
      if (input.flatFee === null || input.flatFee === undefined) {
        throw new BadRequestException({
          code: 'DELIVERY_FEE_NOT_CONFIGURED',
          message: 'Flat delivery fee is not configured',
        });
      }
      return new Prisma.Decimal(input.flatFee);
    }
    if (mode === 'BY_ZONE') {
      if (!input.zone || !input.zone.isActive) {
        throw new BadRequestException({
          code: 'DELIVERY_ZONE_INVALID',
          message: 'Delivery zone is missing, unknown, or inactive',
        });
      }
      return new Prisma.Decimal(input.zone.fee);
    }

    throw new BadRequestException({
      code: 'DELIVERY_MODE_UNKNOWN',
      message: `Unknown delivery pricing mode: ${input.pricingMode}`,
    });
  }

  throw new BadRequestException({
    code: 'INVALID_FULFILLMENT_METHOD',
    message: `Invalid fulfillment method: ${input.fulfillmentMethod}`,
  });
}
