import { BadRequestException } from '@nestjs/common';
import { Prisma } from '../../generated/client/client.js';
import { proportionalSplit } from '../../ledger/lib/proportional-split.js';
import type { AccountNet } from '../../ledger/types/ledger.types.js';
import type { SalePayment } from '../types/sale.types.js';

/**
 * A refund may never exceed what the sale took in: the net of its SALE ledger
 * rows, or `salePrice` for a sale with no ledger rows (pre-ledger). A credit
 * sale deliberately has no SALE rows — its money flowed through CreditPayment —
 * so its return refunds nothing (cap 0); the overpayment is paid back on the
 * credit instead (ADR 0035). The cap is computed, never trusted (ADR 0028).
 */
/**
 * The cash/card money the sale actually took in: the net of its SALE ledger
 * rows, or `salePrice` for a pre-ledger sale (0 for a credit sale — its money
 * flowed through CreditPayment). A trade-in's value is NOT money paid.
 */
export function saleMoneyPaid(
  salePrice: Prisma.Decimal,
  saleNets: { amount: Prisma.Decimal }[],
  isCreditSale = false,
): Prisma.Decimal {
  if (saleNets.length > 0) {
    return saleNets.reduce(
      (sum, n) => sum.plus(n.amount),
      new Prisma.Decimal(0),
    );
  }
  return isCreditSale ? new Prisma.Decimal(0) : salePrice;
}

export function assertRefundWithinSale(
  refundAmount: number,
  salePrice: Prisma.Decimal,
  saleNets: { amount: Prisma.Decimal }[],
  isCreditSale = false,
  tradeInTotal: Prisma.Decimal = new Prisma.Decimal(0),
): void {
  // A sale with a trade-in took in cash/card (money paid) plus a phone worth the
  // trade-in value; the customer may be refunded up to both (ADR 0039). The
  // traded-in phone stays ours — the return never undoes the purchase.
  const cap = saleMoneyPaid(salePrice, saleNets, isCreditSale).plus(
    tradeInTotal,
  );
  if (new Prisma.Decimal(refundAmount).greaterThan(cap)) {
    throw new BadRequestException(
      `Refund ${refundAmount} exceeds the sale's ${cap.toFixed(2)}`,
    );
  }
}

/**
 * How a refund is spread across accounts: in proportion to the sale's SALE
 * rows, remainder on the largest part. No account pays back more than it took
 * in: what is above the money paid (a trade-in's value, ADR 0039) is handed
 * back in cash. A sale with no SALE rows (pre-ledger or a consignment settle)
 * refunds from CASH. Returns positive magnitudes; the repository posts them as
 * negative REFUND rows.
 */
export function buildRefundPostings(
  refundAmount: number,
  saleNets: AccountNet[],
): SalePayment[] {
  const total = new Prisma.Decimal(refundAmount);
  if (total.isZero()) return [];
  const paid = saleNets.reduce(
    (sum, n) => sum.plus(n.amount),
    new Prisma.Decimal(0),
  );
  const fromAccounts = total.greaterThan(paid) ? paid : total;
  const split = proportionalSplit(fromAccounts, saleNets);
  if (split.length === 0) return [{ accountCode: 'CASH', amount: total }];

  const extra = total.minus(fromAccounts);
  if (extra.isZero()) return split;
  const cash = split.find((p) => p.accountCode === 'CASH');
  if (cash) cash.amount = cash.amount.plus(extra);
  else split.push({ accountCode: 'CASH', amount: extra });
  return split;
}
