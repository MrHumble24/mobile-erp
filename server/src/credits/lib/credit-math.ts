import { Prisma } from '../../generated/client/client.js';

type Decimal = Prisma.Decimal;

const ZERO = new Prisma.Decimal(0);

/** One instalment of the frozen payment plan. */
export interface InstalmentInput {
  id: string;
  dueDate: Date;
  amount: Decimal;
}

export interface CreditMathInput {
  /** Sale prices of the credit's NOT-returned sales; their sum is the agreed total. */
  salePrices: Decimal[];
  /** Signed payment amounts (+ money in, − overpayment refund); their sum is paid. */
  paymentAmounts: Decimal[];
  instalments: InstalmentInput[];
  /** "Now": an instalment whose due date is before this day counts as past. */
  now: Date;
}

/** An instalment with how much of it is covered and whether it is overdue. */
export interface InstalmentStanding {
  id: string;
  dueDate: Date;
  amount: Decimal;
  paid: Decimal;
  overdue: boolean;
}

/** Everything about a credit derived from its sales, payments and plan. */
export interface CreditStanding {
  agreedTotal: Decimal;
  paid: Decimal;
  /** agreedTotal − paid; negative when the customer has overpaid. */
  outstanding: Decimal;
  /** max(paid − agreedTotal, 0): how much may be refunded after a return. */
  overpaid: Decimal;
  /** True when nothing more is owed (outstanding ≤ 0). No status column exists. */
  settled: boolean;
  /** Σ (amount − paid) over overdue instalments. */
  overdueAmount: Decimal;
  instalments: InstalmentStanding[];
}

/**
 * The one source of truth for credit arithmetic (ADR 0035). Nothing here is
 * stored: the agreed total is the sum of the not-returned sales, paid is the
 * sum of payments, outstanding is their difference, and the part of the plan
 * that is no longer owed is allocated to instalments in due-date order. There is deliberately no interest, no late
 * fee and no penalty in this computation.
 */
export function computeCreditStanding(input: CreditMathInput): CreditStanding {
  const agreedTotal = sum(input.salePrices);
  const paid = sum(input.paymentAmounts);
  const outstanding = agreedTotal.minus(paid);
  const overpaid = paid.greaterThan(agreedTotal)
    ? paid.minus(agreedTotal)
    : ZERO;

  const dayStart = startOfUtcDay(input.now);
  // The plan covers only what was left after the down payment, so what still
  // has to be paid on the plan is exactly the outstanding. Allocating all of
  // `paid` would let the down payment hide the first instalment.
  const owed = outstanding.greaterThan(ZERO) ? outstanding : ZERO;
  const covered = sum(input.instalments.map((i) => i.amount)).minus(owed);
  let remaining = covered.greaterThan(ZERO) ? covered : ZERO;
  let overdueAmount = ZERO;
  const instalments = [...input.instalments]
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
    .map((inst) => {
      const applied = remaining.greaterThan(inst.amount)
        ? inst.amount
        : remaining;
      remaining = remaining.minus(applied);
      const covered = applied.greaterThanOrEqualTo(inst.amount);
      const overdue = inst.dueDate.getTime() < dayStart.getTime() && !covered;
      if (overdue)
        overdueAmount = overdueAmount.plus(inst.amount.minus(applied));
      return {
        id: inst.id,
        dueDate: inst.dueDate,
        amount: inst.amount,
        paid: applied,
        overdue,
      };
    });

  return {
    agreedTotal,
    paid,
    outstanding,
    overpaid,
    settled: outstanding.lessThanOrEqualTo(ZERO),
    overdueAmount,
    instalments,
  };
}

/** Midnight UTC of the given instant; DATE instalments arrive at 00:00 UTC. */
export function startOfUtcDay(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

function sum(values: Decimal[]): Decimal {
  return values.reduce((acc, v) => acc.plus(v), ZERO);
}
