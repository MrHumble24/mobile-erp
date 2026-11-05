import { BadRequestException } from '@nestjs/common';
import { Prisma } from '../../generated/client/client.js';
import {
  resolveCheckoutPricing,
  type CheckoutPricingInput,
  type DiscountSettings,
} from './checkout-pricing.js';

const D = (v: number) => new Prisma.Decimal(v);

const enabled: DiscountSettings = {
  enabled: true,
  percentAllowed: true,
  amountAllowed: true,
  maxDiscountPercent: D(5),
};

function base(over: Partial<CheckoutPricingInput> = {}): CheckoutPricingInput {
  return {
    listPrice: D(1000),
    requestedSalePrice: D(1000),
    settings: enabled,
    customerStandingPercent: D(0),
    canOverridePrice: false,
    canDiscountUnlimited: false,
    ...over,
  };
}

describe('resolveCheckoutPricing (ADR 0034)', () => {
  it('a list price with no discount: salePrice must equal it, snapshot frozen', () => {
    const r = resolveCheckoutPricing(base());
    expect(r.salePrice.toFixed(2)).toBe('1000.00');
    expect(r.listPriceSnapshot!.toFixed(2)).toBe('1000.00');
  });

  it('a percent discount within the limit', () => {
    const r = resolveCheckoutPricing(
      base({
        requestedSalePrice: D(950),
        discount: { mode: 'PERCENT', value: 5 },
      }),
    );
    expect(r.salePrice.toFixed(2)).toBe('950.00');
    expect(r.listPriceSnapshot!.toFixed(2)).toBe('1000.00');
  });

  it('a fixed-amount discount', () => {
    const r = resolveCheckoutPricing(
      base({
        requestedSalePrice: D(960),
        discount: { mode: 'AMOUNT', value: 40 },
      }),
    );
    expect(r.salePrice.toFixed(2)).toBe('960.00');
  });

  it('rejects a salePrice that does not match the computed price', () => {
    expect(() =>
      resolveCheckoutPricing(
        base({
          requestedSalePrice: D(900),
          discount: { mode: 'PERCENT', value: 5 },
        }),
      ),
    ).toThrow(BadRequestException);
  });

  it('rejects a discount when discounts are disabled', () => {
    expect(() =>
      resolveCheckoutPricing(
        base({
          settings: { ...enabled, enabled: false },
          requestedSalePrice: D(950),
          discount: { mode: 'PERCENT', value: 5 },
        }),
      ),
    ).toThrow(/turned off/);
  });

  it('rejects a disallowed mode', () => {
    expect(() =>
      resolveCheckoutPricing(
        base({
          settings: { ...enabled, amountAllowed: false },
          requestedSalePrice: D(960),
          discount: { mode: 'AMOUNT', value: 40 },
        }),
      ),
    ).toThrow(/not allowed/);
  });

  it('rejects a percent discount over the cashier maximum', () => {
    expect(() =>
      resolveCheckoutPricing(
        base({
          requestedSalePrice: D(900),
          discount: { mode: 'PERCENT', value: 10 },
        }),
      ),
    ).toThrow(/exceeds the limit/);
  });

  it('allows over the maximum with sale.discount.unlimited', () => {
    const r = resolveCheckoutPricing(
      base({
        canDiscountUnlimited: true,
        requestedSalePrice: D(900),
        discount: { mode: 'PERCENT', value: 10 },
      }),
    );
    expect(r.salePrice.toFixed(2)).toBe('900.00');
  });

  it("a customer's standing discount raises the ceiling", () => {
    const r = resolveCheckoutPricing(
      base({
        customerStandingPercent: D(10),
        requestedSalePrice: D(900),
        discount: { mode: 'PERCENT', value: 10 },
      }),
    );
    expect(r.salePrice.toFixed(2)).toBe('900.00');
  });

  it('sale.price.override accepts any price; the gap becomes the discount', () => {
    const r = resolveCheckoutPricing(
      base({ canOverridePrice: true, requestedSalePrice: D(700) }),
    );
    expect(r.salePrice.toFixed(2)).toBe('700.00');
    expect(r.listPriceSnapshot!.toFixed(2)).toBe('1000.00');
  });

  it('no list price: the sent price is used, no snapshot, discount rejected', () => {
    const r = resolveCheckoutPricing(
      base({ listPrice: null, requestedSalePrice: D(800) }),
    );
    expect(r.salePrice.toFixed(2)).toBe('800.00');
    expect(r.listPriceSnapshot).toBeNull();
    expect(() =>
      resolveCheckoutPricing(
        base({ listPrice: null, discount: { mode: 'PERCENT', value: 5 } }),
      ),
    ).toThrow(/No list price/);
  });

  it('sync replay is never rejected on a mismatch; claimed list price stored', () => {
    const r = resolveCheckoutPricing(
      base({
        trustClientPrice: true,
        requestedSalePrice: D(123),
        claimedListPrice: D(1000),
        discount: { mode: 'PERCENT', value: 99 },
      }),
    );
    expect(r.salePrice.toFixed(2)).toBe('123.00');
    expect(r.listPriceSnapshot!.toFixed(2)).toBe('1000.00');
  });

  it('sync replay with no claimed list price derives from the resolved one', () => {
    const r = resolveCheckoutPricing(
      base({ trustClientPrice: true, requestedSalePrice: D(123) }),
    );
    expect(r.listPriceSnapshot!.toFixed(2)).toBe('1000.00');
  });

  it('rejects a fixed amount above the list price', () => {
    expect(() =>
      resolveCheckoutPricing(
        base({
          canDiscountUnlimited: true,
          requestedSalePrice: D(0),
          discount: { mode: 'AMOUNT', value: 2000 },
        }),
      ),
    ).toThrow(/exceeds the list price/);
  });
});
