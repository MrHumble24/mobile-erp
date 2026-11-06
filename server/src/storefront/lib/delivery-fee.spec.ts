import { BadRequestException } from '@nestjs/common';
import { Prisma } from '../../generated/client/client.js';
import { calculateDeliveryFee } from './delivery-fee.js';

describe('calculateDeliveryFee', () => {
  const baseSettings = {
    pickupEnabled: true,
    deliveryEnabled: true,
    pricingMode: 'FLAT',
    flatFee: new Prisma.Decimal(30000),
    freeFrom: new Prisma.Decimal(5000000),
  };

  it('calculates pickup fee as 0 when pickup is enabled', () => {
    const fee = calculateDeliveryFee({
      ...baseSettings,
      fulfillmentMethod: 'PICKUP',
      orderPrice: 100000,
    });
    expect(fee.toNumber()).toBe(0);
  });

  it('refuses pickup when pickup is disabled', () => {
    expect(() =>
      calculateDeliveryFee({
        ...baseSettings,
        pickupEnabled: false,
        fulfillmentMethod: 'PICKUP',
      }),
    ).toThrow(BadRequestException);
  });

  it('refuses delivery when delivery is disabled', () => {
    expect(() =>
      calculateDeliveryFee({
        ...baseSettings,
        deliveryEnabled: false,
        fulfillmentMethod: 'DELIVERY',
        orderPrice: 100000,
      }),
    ).toThrow(BadRequestException);
  });

  it('returns 0 for FREE delivery pricing mode', () => {
    const fee = calculateDeliveryFee({
      ...baseSettings,
      pricingMode: 'FREE',
      fulfillmentMethod: 'DELIVERY',
      orderPrice: 100000,
    });
    expect(fee.toNumber()).toBe(0);
  });

  it('flat 30000, free from 5000000: order of 4999999 pays 30000', () => {
    const fee = calculateDeliveryFee({
      ...baseSettings,
      pricingMode: 'FLAT',
      flatFee: 30000,
      freeFrom: 5000000,
      fulfillmentMethod: 'DELIVERY',
      orderPrice: 4999999,
    });
    expect(fee.toNumber()).toBe(30000);
  });

  it('flat 30000, free from 5000000: order of 5000000 pays 0', () => {
    const fee = calculateDeliveryFee({
      ...baseSettings,
      pricingMode: 'FLAT',
      flatFee: 30000,
      freeFrom: 5000000,
      fulfillmentMethod: 'DELIVERY',
      orderPrice: 5000000,
    });
    expect(fee.toNumber()).toBe(0);
  });

  it('flat 30000, free from 5000000: order of 5000001 pays 0', () => {
    const fee = calculateDeliveryFee({
      ...baseSettings,
      pricingMode: 'FLAT',
      flatFee: 30000,
      freeFrom: 5000000,
      fulfillmentMethod: 'DELIVERY',
      orderPrice: 5000001,
    });
    expect(fee.toNumber()).toBe(0);
  });

  it('flat 30000 with null price (ask): pays flat fee 30000', () => {
    const fee = calculateDeliveryFee({
      ...baseSettings,
      pricingMode: 'FLAT',
      flatFee: 30000,
      freeFrom: 5000000,
      fulfillmentMethod: 'DELIVERY',
      orderPrice: null,
    });
    expect(fee.toNumber()).toBe(30000);
  });

  it('returns zone fee when BY_ZONE and zone is active', () => {
    const fee = calculateDeliveryFee({
      ...baseSettings,
      pricingMode: 'BY_ZONE',
      fulfillmentMethod: 'DELIVERY',
      orderPrice: 1000000,
      zone: { id: 'zone-1', fee: new Prisma.Decimal(25000), isActive: true },
    });
    expect(fee.toNumber()).toBe(25000);
  });

  it('refuses BY_ZONE when zone is missing', () => {
    expect(() =>
      calculateDeliveryFee({
        ...baseSettings,
        pricingMode: 'BY_ZONE',
        fulfillmentMethod: 'DELIVERY',
        orderPrice: 1000000,
        zone: null,
      }),
    ).toThrow(BadRequestException);
  });

  it('refuses BY_ZONE when zone is inactive', () => {
    expect(() =>
      calculateDeliveryFee({
        ...baseSettings,
        pricingMode: 'BY_ZONE',
        fulfillmentMethod: 'DELIVERY',
        orderPrice: 1000000,
        zone: { id: 'zone-1', fee: 25000, isActive: false },
      }),
    ).toThrow(BadRequestException);
  });
});
