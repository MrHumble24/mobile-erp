import { BadRequestException } from '@nestjs/common';
import { Prisma } from '../../generated/client/client.js';
import { assertRedeemWithinLimits, earnedPoints } from './bonus-math.js';

const D = (v: number) => new Prisma.Decimal(v);

describe('earnedPoints', () => {
  it('is earn percent × money paid, rounded to 2dp', () => {
    expect(earnedPoints(D(1_000_000), D(1)).toFixed(2)).toBe('10000.00');
    expect(earnedPoints(D(90_000), D(1)).toFixed(2)).toBe('900.00');
    expect(earnedPoints(D(100), D(2.5)).toFixed(2)).toBe('2.50');
  });

  it('is zero when nothing was paid or the percent is zero', () => {
    expect(earnedPoints(D(0), D(1)).toFixed(2)).toBe('0.00');
    expect(earnedPoints(D(1000), D(0)).toFixed(2)).toBe('0.00');
  });
});

describe('assertRedeemWithinLimits', () => {
  const base = {
    balance: D(10_000),
    salePrice: D(100_000),
    maxRedeemPercent: D(50),
    tradeInTotal: D(0),
  };

  it('allows a redemption within balance, cap and due', () => {
    expect(() => assertRedeemWithinLimits(D(10_000), base)).not.toThrow();
  });

  it('rejects more than the balance', () => {
    expect(() => assertRedeemWithinLimits(D(10_001), base)).toThrow(
      BadRequestException,
    );
  });

  it('rejects more than the max-redeem share of the sale', () => {
    // 50% of 100,000 = 50,000; balance raised so the cap is what bites.
    expect(() =>
      assertRedeemWithinLimits(D(60_000), { ...base, balance: D(100_000) }),
    ).toThrow(/BONUS_REDEEM_EXCEEDS_MAX|exceeds the max/);
  });

  it('rejects more than what is left to pay after trade-ins', () => {
    expect(() =>
      assertRedeemWithinLimits(D(10_000), {
        ...base,
        balance: D(100_000),
        maxRedeemPercent: D(100),
        tradeInTotal: D(95_000),
      }),
    ).toThrow(/BONUS_REDEEM_EXCEEDS_DUE|left to pay/);
  });
});
