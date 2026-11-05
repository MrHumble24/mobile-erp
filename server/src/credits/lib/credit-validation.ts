import { BadRequestException } from '@nestjs/common';
import { Prisma } from '../../generated/client/client.js';
import { startOfUtcDay } from './credit-math.js';

type Decimal = Prisma.Decimal;

/** Every instalment's due date must be today or later (no back-dated plans). */
export function assertFutureDueDates(dueDates: Date[], now: Date): void {
  const today = startOfUtcDay(now).getTime();
  for (const d of dueDates) {
    if (startOfUtcDay(d).getTime() < today) {
      throw new BadRequestException(
        `Instalment due date ${d.toISOString().slice(0, 10)} is in the past`,
      );
    }
  }
}

/** The down payment plus the instalments must equal the cart total exactly. */
export function assertPlanAddsUp(
  instalmentsTotal: Decimal,
  downPayment: Decimal,
  cartTotal: Decimal,
): void {
  const planned = instalmentsTotal.plus(downPayment);
  if (!planned.equals(cartTotal)) {
    throw new BadRequestException(
      `Down payment + instalments (${planned.toFixed(2)}) must equal the cart total (${cartTotal.toFixed(2)})`,
    );
  }
}

/**
 * The customer's existing outstanding plus the new unpaid part must not exceed
 * their effective limit. A null limit means no cap (no interest is ever added —
 * the limit is on principal only).
 */
export function assertWithinLimit(
  existingOutstanding: Decimal,
  newUnpaid: Decimal,
  limit: Decimal | null,
): void {
  if (limit === null) return;
  const projected = existingOutstanding.plus(newUnpaid);
  if (projected.greaterThan(limit)) {
    throw new BadRequestException(
      `Credit limit exceeded: ${projected.toFixed(2)} would be owed, limit is ${limit.toFixed(2)}`,
    );
  }
}

/** Normalise down-payment lines: accounts must be active and distinct (400). */
export function validateDownPayments(
  payments: { accountCode: string; amount: number }[],
  activeAccounts: string[],
): { accountCode: string; amount: Decimal }[] {
  const seen = new Set<string>();
  return payments.map((p) => {
    if (!activeAccounts.includes(p.accountCode)) {
      throw new BadRequestException(
        `Unknown or inactive account ${p.accountCode}`,
      );
    }
    if (seen.has(p.accountCode)) {
      throw new BadRequestException(
        `Duplicate payment account ${p.accountCode}`,
      );
    }
    seen.add(p.accountCode);
    return { accountCode: p.accountCode, amount: new Prisma.Decimal(p.amount) };
  });
}
