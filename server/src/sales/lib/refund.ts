import { Prisma } from '../../generated/client/client.js';
import { proportionalSplit } from '../../ledger/lib/proportional-split.js';
import type { AccountNet } from '../../ledger/types/ledger.types.js';
import type { SalePayment } from '../types/sale.types.js';

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
