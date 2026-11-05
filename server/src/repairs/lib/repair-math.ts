import { Prisma } from '../../generated/client/client.js';

type Decimal = Prisma.Decimal;

const ZERO = new Prisma.Decimal(0);
const DAY_MS = 86_400_000;

/** One part on a ticket: positive pieces and their frozen unit cost. */
export interface RepairPartCost {
  quantity: number;
  unitCostSnapshot: Decimal;
}

export interface RepairMathInput {
  agreedPrice: Decimal;
  /** Signed payment amounts (+ in, − refund). Their sum is paid / income. */
  paymentAmounts: Decimal[];
  parts: RepairPartCost[];
  /** How much has already been paid to the outside master (positive). */
  outsidePaid: Decimal;
  /** When the ticket was given back, or null if not yet. */
  givenBackAt: Date | null;
  warrantyDays: number;
  now: Date;
}

export interface RepairFinance {
  /** Σ payments (net of refunds) = money the customer paid = income. */
  paid: Decimal;
  /** agreedPrice − paid; negative when overpaid. */
  outstanding: Decimal;
  /** max(outstanding, 0): money still owed by the customer. */
  owed: Decimal;
  partsCost: Decimal;
  outsidePaid: Decimal;
  /** paid − partsCost − outsidePaid. */
  profit: Decimal;
  warrantyUntil: Date | null;
  underWarranty: boolean;
}

/**
 * The one source of truth for repair arithmetic (ADR 0040). Nothing here is
 * stored: paid is the sum of payments, parts cost the sum of parts, outstanding
 * the difference, profit = income − parts − outside, and the warranty window
 * runs from the given-back instant. There is no interest or late fee anywhere.
 */
export function computeRepairFinance(i: RepairMathInput): RepairFinance {
  const paid = i.paymentAmounts.reduce((s, a) => s.plus(a), ZERO);
  const partsCost = i.parts.reduce(
    (s, p) => s.plus(new Prisma.Decimal(p.quantity).times(p.unitCostSnapshot)),
    ZERO,
  );
  const outstanding = i.agreedPrice.minus(paid);
  const owed = outstanding.greaterThan(ZERO) ? outstanding : ZERO;
  const profit = paid.minus(partsCost).minus(i.outsidePaid);
  const warrantyUntil = warrantyUntilOf(i.givenBackAt, i.warrantyDays);
  const underWarranty =
    warrantyUntil !== null && i.now.getTime() <= warrantyUntil.getTime();
  return {
    paid,
    outstanding,
    owed,
    partsCost,
    outsidePaid: i.outsidePaid,
    profit,
    warrantyUntil,
    underWarranty,
  };
}

/** givenBackAt + warrantyDays, or null when not given back / no warranty. */
export function warrantyUntilOf(
  givenBackAt: Date | null,
  warrantyDays: number,
): Date | null {
  if (!givenBackAt || warrantyDays <= 0) return null;
  return new Date(givenBackAt.getTime() + warrantyDays * DAY_MS);
}
