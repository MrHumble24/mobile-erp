import { BadRequestException } from '@nestjs/common';
import { Prisma } from '../../generated/client/client.js';
import { proportionalSplit } from '../../ledger/lib/proportional-split.js';
import type { AccountNet } from '../../ledger/types/ledger.types.js';
import type { SalePayment } from '../types/sale.types.js';

/**
 * A refund may never exceed what the sale took in: the net of its SALE ledger
 * rows, or `salePrice` for a sale with no ledger rows (pre-ledger). The cap is
 * computed, never trusted from the client (ADR 0028).
 */
export function assertRefundWithinSale(
  refundAmount: number,
  salePrice: Prisma.Decimal,
  saleNets: { amount: Prisma.Decimal }[],
): void {
  const cap =
    saleNets.length > 0
      ? saleNets.reduce((sum, n) => sum.plus(n.amount), new Prisma.Decimal(0))
      : salePrice;
  if (new Prisma.Decimal(refundAmount).greaterThan(cap)) {
    throw new BadRequestException(
      `Refund ${refundAmount} exceeds the sale's ${cap.toFixed(2)}`,
    );
  }
}

/**
 * How a refund is spread across accounts: in proportion to the sale's SALE
 * rows, remainder on the largest part. A sale with no SALE rows (pre-ledger or
 * a consignment settle) refunds from CASH. Returns positive magnitudes; the
 * repository posts them as negative REFUND rows.
 */
export function buildRefundPostings(
  refundAmount: number,
  saleNets: AccountNet[],
): SalePayment[] {
  const total = new Prisma.Decimal(refundAmount);
  if (total.isZero()) return [];
  const split = proportionalSplit(total, saleNets);
  if (split.length > 0) return split;
  return [{ accountCode: 'CASH', amount: total }];
}
