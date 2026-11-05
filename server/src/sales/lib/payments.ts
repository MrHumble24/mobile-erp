import { BadRequestException } from '@nestjs/common';
import { Prisma } from '../../generated/client/client.js';
import type { SalePaymentDto } from '../dto/create-sale.dto.js';
import type { SalePayment } from '../types/sale.types.js';

/**
 * Normalise the tender lines of a sale. `salePrice` here is what the customer
 * tenders in cash/card — the sale price minus any trade-in values and spent
 * points (ADR 0039/0043). Absent → a single CASH payment for the whole amount,
 * or no rows at all when nothing is left to pay (fully covered by trade-ins /
 * points). Otherwise every amount must be positive, accounts distinct and
 * active, and the amounts must add up to `salePrice` to the cent (400 if not).
 */
export function resolveSalePayments(
  payments: SalePaymentDto[] | undefined,
  salePrice: number,
  activeAccountCodes: string[],
): SalePayment[] {
  const due = new Prisma.Decimal(salePrice);
  if (!payments || payments.length === 0) {
    // Fully covered by trade-ins / points: no cash/card tender, so no SALE rows.
    if (due.lessThanOrEqualTo(0)) return [];
    return [{ accountCode: 'CASH', amount: due }];
  }
  const active = new Set(activeAccountCodes);
  const seen = new Set<string>();
  let sum = new Prisma.Decimal(0);
  const lines = payments.map((p) => {
    const amount = new Prisma.Decimal(p.amount);
    if (amount.lte(0)) {
      throw new BadRequestException('Each payment amount must be positive');
    }
    if (!active.has(p.accountCode)) {
      throw new BadRequestException(
        `Unknown or inactive account ${p.accountCode}`,
      );
    }
    if (seen.has(p.accountCode)) {
      throw new BadRequestException(
        `Account ${p.accountCode} appears more than once`,
      );
    }
    seen.add(p.accountCode);
    sum = sum.plus(amount);
    return { accountCode: p.accountCode, amount };
  });
  if (!sum.equals(new Prisma.Decimal(salePrice))) {
    throw new BadRequestException(
      `Payments total ${sum.toFixed(2)} must equal the sale price ${salePrice}`,
    );
  }
  return lines;
}
