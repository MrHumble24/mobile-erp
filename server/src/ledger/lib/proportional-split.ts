import { Prisma } from '../../generated/client/client.js';
import type { AccountNet } from '../types/ledger.types.js';

/**
 * Split `total` across accounts in proportion to `weights` (each positive), at
 * 2-dp money precision. The rounding remainder lands on the largest weight so
 * the parts always add back up to `total` exactly. Returns positive amounts;
 * an empty `weights` (or zero total weight) yields `[]` — the caller decides
 * the fallback (e.g. refund from CASH).
 */
export function proportionalSplit(
  total: Prisma.Decimal,
  weights: AccountNet[],
): AccountNet[] {
  const sumW = weights.reduce(
    (s, w) => s.plus(w.amount),
    new Prisma.Decimal(0),
  );
  if (weights.length === 0 || sumW.isZero()) return [];

  const parts = weights.map((w) => ({
    accountCode: w.accountCode,
    amount: total.times(w.amount).div(sumW).toDecimalPlaces(2),
  }));
  const allocated = parts.reduce(
    (s, p) => s.plus(p.amount),
    new Prisma.Decimal(0),
  );
  const remainder = total.minus(allocated);
  if (!remainder.isZero()) {
    const largest = weights.reduce((a, b) => (a.amount.gte(b.amount) ? a : b));
    const target = parts.find((p) => p.accountCode === largest.accountCode)!;
    target.amount = target.amount.plus(remainder);
  }
  return parts.filter((p) => !p.amount.isZero());
}
