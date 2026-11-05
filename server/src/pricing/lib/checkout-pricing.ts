import { BadRequestException } from '@nestjs/common';
import { Prisma } from '../../generated/client/client.js';

type Decimal = Prisma.Decimal;
const D = (v: number | string | Decimal): Decimal => new Prisma.Decimal(v);

export type DiscountMode = 'PERCENT' | 'AMOUNT';

export interface DiscountInput {
  mode: DiscountMode;
  value: number;
}

export interface DiscountSettings {
  enabled: boolean;
  percentAllowed: boolean;
  amountAllowed: boolean;
  /** Largest discount a cashier may give without the owner, as a percent. */
  maxDiscountPercent: Decimal;
}

export interface CheckoutPricingInput {
  /** Resolved list price for the whole line (per-piece × quantity), or null. */
  listPrice: Decimal | null;
  /** The price the caller sent (always present on the DTO). */
  requestedSalePrice: Decimal;
  discount?: DiscountInput;
  settings: DiscountSettings;
  /** The customer's standing discount percent (0 when none). */
  customerStandingPercent: Decimal;
  canOverridePrice: boolean;
  canDiscountUnlimited: boolean;
  /**
   * Sync replay (offline queue): the sale already happened at the counter, so
   * nothing is rejected. `claimedListPrice` is the till's own list price if it
   * sent one (`undefined` = not sent → derive from the resolved list price).
   */
  trustClientPrice?: boolean;
  claimedListPrice?: Decimal | null;
}

export interface CheckoutPricing {
  salePrice: Decimal;
  listPriceSnapshot: Decimal | null;
}

/**
 * The money rules of a priced checkout (ADR 0034). Returns the final sale price
 * and the list-price snapshot to freeze; the discount amount is derived later
 * (snapshot − salePrice), never stored. Throws 400 on any rule breach — except
 * on the sync replay path, which trusts the till.
 */
export function resolveCheckoutPricing(
  input: CheckoutPricingInput,
): CheckoutPricing {
  if (input.trustClientPrice) return replay(input);

  const { listPrice, requestedSalePrice } = input;

  if (listPrice === null) {
    // The shop set no price for this line: old behaviour — the sent price is
    // the price, no discount recorded.
    if (input.discount) {
      throw new BadRequestException(
        'No list price is set for this line, so a discount cannot be applied',
      );
    }
    return { salePrice: requestedSalePrice, listPriceSnapshot: null };
  }

  if (input.canOverridePrice) {
    // Free price: the difference from the list price is the discount.
    return { salePrice: requestedSalePrice, listPriceSnapshot: listPrice };
  }

  const amount = discountAmount(input, listPrice);
  const finalPrice = listPrice.minus(amount);
  if (!requestedSalePrice.equals(finalPrice)) {
    throw new BadRequestException(
      `salePrice ${requestedSalePrice.toFixed(2)} does not match the server price ${finalPrice.toFixed(2)} ` +
        `(list ${listPrice.toFixed(2)} − discount ${amount.toFixed(2)})`,
    );
  }
  return { salePrice: finalPrice, listPriceSnapshot: listPrice };
}

/** The validated, rounded discount amount for the line (0 when none). */
function discountAmount(
  input: CheckoutPricingInput,
  listPrice: Decimal,
): Decimal {
  const d = input.discount;
  if (!d) return D(0);

  if (!input.settings.enabled) {
    throw new BadRequestException('Discounts are turned off');
  }
  if (d.mode === 'PERCENT' && !input.settings.percentAllowed) {
    throw new BadRequestException('Percent discounts are not allowed');
  }
  if (d.mode === 'AMOUNT' && !input.settings.amountAllowed) {
    throw new BadRequestException('Fixed-amount discounts are not allowed');
  }

  const cap = Prisma.Decimal.max(
    input.settings.maxDiscountPercent,
    input.customerStandingPercent,
  );

  if (d.mode === 'PERCENT') {
    if (!input.canDiscountUnlimited && D(d.value).greaterThan(cap)) {
      throw new BadRequestException(
        `Discount ${d.value}% exceeds the limit of ${cap.toFixed(2)}%`,
      );
    }
    return round2(listPrice.times(d.value).div(100));
  }

  // AMOUNT
  const amount = round2(D(d.value));
  if (amount.greaterThan(listPrice)) {
    throw new BadRequestException('Discount exceeds the list price');
  }
  if (!input.canDiscountUnlimited) {
    const percent = amount.div(listPrice).times(100);
    // tiny tolerance for the division rounding
    if (percent.minus(cap).greaterThan('0.0001')) {
      throw new BadRequestException(
        `Discount ${percent.toFixed(2)}% exceeds the limit of ${cap.toFixed(2)}%`,
      );
    }
  }
  return amount;
}

/** Sync replay: trust the till; store the claimed list price or derive it. */
function replay(input: CheckoutPricingInput): CheckoutPricing {
  const snapshot =
    input.claimedListPrice !== undefined
      ? input.claimedListPrice
      : input.listPrice;
  return { salePrice: input.requestedSalePrice, listPriceSnapshot: snapshot };
}

function round2(value: Decimal): Decimal {
  return value.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
}
