import { Prisma } from '../../generated/client/client.js';

type Decimal = Prisma.Decimal;

/**
 * Split ONE disclosed Murabaha margin (ADR 0068) across the credit's cash-priced
 * lines, in integer cents so the shares add up to the margin exactly. The
 * rounding remainder lands on the last line. The caller folds each share into
 * that line's Sale.salePrice, which keeps the derived agreed total, returns and
 * the credit-limit gate correct without touching credit-math.ts.
 *
 * This is a DISTRIBUTION, not growth: the margin is fixed once at creation and
 * no interest, late fee or penalty is ever computed from it.
 */
export function distributeMarkup(
  cashPrices: Decimal[],
  markup: Decimal,
): Decimal[] {
  if (cashPrices.length === 0) return [];

  const cents = (d: Decimal): number => Math.round(d.mul(100).toNumber());
  const cashCents = cashPrices.map(cents);
  const totalCash = cashCents.reduce((s, c) => s + c, 0);
  const markupCents = cents(markup);

  const shares = cashCents.map((c) =>
    totalCash > 0 ? Math.floor((markupCents * c) / totalCash) : 0,
  );
  const allocated = shares.reduce((s, c) => s + c, 0);
  shares[shares.length - 1] += markupCents - allocated;

  return shares.map((c) => new Prisma.Decimal(c).div(100));
}
