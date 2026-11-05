import { BadRequestException } from '@nestjs/common';
import { Prisma } from '../../generated/client/client.js';

type Decimal = Prisma.Decimal;
const D = (v: number | string | Decimal): Decimal => new Prisma.Decimal(v);

export interface RedeemLimits {
  /** The customer's current points balance (signed sum of their rows). */
  balance: Decimal;
  /** The final sale price (after any discount) of the line. */
  salePrice: Decimal;
  /** The largest share of the sale that may be paid with points, as a percent. */
  maxRedeemPercent: Decimal;
  /** Σ of trade-in values on the same sale (also lowers what is tendered). */
  tradeInTotal: Decimal;
}

/**
 * Validate a points redemption against the customer's balance and the sale
 * limits (ADR 0043). Points are the customer's own money, not a discount, so
 * they never count toward the cashier discount limit. Throws 400 with a stable
 * `code` on any breach. `redeem` is assumed positive.
 */
export function assertRedeemWithinLimits(
  redeem: Decimal,
  limits: RedeemLimits,
): void {
  if (redeem.greaterThan(limits.balance)) {
    throw new BadRequestException({
      message: `Redeem ${redeem.toFixed(2)} exceeds the customer's balance ${limits.balance.toFixed(2)}`,
      code: 'BONUS_REDEEM_EXCEEDS_BALANCE',
    });
  }
  const cap = round2(limits.salePrice.times(limits.maxRedeemPercent).div(100));
  if (redeem.greaterThan(cap)) {
    throw new BadRequestException({
      message: `Redeem ${redeem.toFixed(2)} exceeds the max ${cap.toFixed(2)} (${limits.maxRedeemPercent.toFixed(2)}% of the sale)`,
      code: 'BONUS_REDEEM_EXCEEDS_MAX',
    });
  }
  const due = limits.salePrice.minus(limits.tradeInTotal);
  if (redeem.greaterThan(due)) {
    throw new BadRequestException({
      message: `Redeem ${redeem.toFixed(2)} exceeds what is left to pay ${due.toFixed(2)}`,
      code: 'BONUS_REDEEM_EXCEEDS_DUE',
    });
  }
}

/** Points earned = earn percent × money actually paid (ADR 0043), rounded 2-dp. */
export function earnedPoints(paid: Decimal, earnPercent: Decimal): Decimal {
  if (paid.lessThanOrEqualTo(0) || earnPercent.lessThanOrEqualTo(0))
    return D(0);
  return round2(paid.times(earnPercent).div(100));
}

function round2(value: Decimal): Decimal {
  return value.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
}
