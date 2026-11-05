import { Prisma } from '../../generated/client/client.js';

/** The cash account whose rows reconcile against the counted drawer. */
export const CASH_ACCOUNT = 'CASH';
/** The correction row a close posts when counted ≠ expected (ADR 0036). */
export const SHIFT_DIFFERENCE_TYPE = 'SHIFT_DIFFERENCE';

const ZERO = new Prisma.Decimal(0);

/** One cash ledger row that fell inside the shift's window. `amount` is signed. */
export interface ShiftRow {
  typeCode: string;
  accountCode: string;
  amount: Prisma.Decimal;
}

export interface AccountGroup {
  accountCode: string;
  /** Σ positive amounts (money in), 2-dp string. */
  in: string;
  /** Σ |negative amounts| (money out), 2-dp string. */
  out: string;
  /** Signed net, 2-dp string. */
  net: string;
}

export interface TypeAccountCount {
  accountCode: string;
  count: number;
  total: string;
}

export interface TypeGroup {
  typeCode: string;
  count: number;
  total: string;
  byAccount: TypeAccountCount[];
}

export interface ShiftSummary {
  openingCount: string;
  expectedCash: string;
  countedCash: string | null;
  /** counted − expected, 2-dp string; null while the shift is open. */
  difference: string | null;
  /** The signed difference as a number for posting SHIFT_DIFFERENCE; null when open. */
  differenceAmount: number | null;
  /** Net of CARD movements (money in positive), 2-dp string. */
  cardTotal: string;
  byAccount: AccountGroup[];
  byType: TypeGroup[];
}

/**
 * The whole shift report arithmetic, pure. `rows` are every cash ledger row the
 * cashier posted in the window; the SHIFT_DIFFERENCE correction is never a
 * movement (it reconciles, it does not move cash) so it is dropped from every
 * grouping and from expected cash. Expected cash = opening + net of CASH
 * movements; difference = counted − expected (null while the shift is open).
 */
export function summariseShift(
  openingCount: Prisma.Decimal,
  closingCount: Prisma.Decimal | null,
  rows: ShiftRow[],
): ShiftSummary {
  const movements = rows.filter((r) => r.typeCode !== SHIFT_DIFFERENCE_TYPE);
  const cashNet = movements
    .filter((r) => r.accountCode === CASH_ACCOUNT)
    .reduce((s, r) => s.plus(r.amount), ZERO);
  const expected = openingCount.plus(cashNet);
  const difference =
    closingCount === null ? null : closingCount.minus(expected);
  const cardNet = movements
    .filter((r) => r.accountCode !== CASH_ACCOUNT)
    .reduce((s, r) => s.plus(r.amount), ZERO);

  return {
    openingCount: openingCount.toFixed(2),
    expectedCash: expected.toFixed(2),
    countedCash: closingCount === null ? null : closingCount.toFixed(2),
    difference: difference === null ? null : difference.toFixed(2),
    differenceAmount:
      difference === null ? null : Number(difference.toFixed(2)),
    cardTotal: cardNet.toFixed(2),
    byAccount: groupByAccount(movements),
    byType: groupByType(movements),
  };
}

function groupByAccount(rows: ShiftRow[]): AccountGroup[] {
  const map = new Map<string, { in: Prisma.Decimal; out: Prisma.Decimal }>();
  for (const r of rows) {
    const g = map.get(r.accountCode) ?? { in: ZERO, out: ZERO };
    if (r.amount.isNegative()) g.out = g.out.plus(r.amount.abs());
    else g.in = g.in.plus(r.amount);
    map.set(r.accountCode, g);
  }
  return [...map.entries()].map(([accountCode, g]) => ({
    accountCode,
    in: g.in.toFixed(2),
    out: g.out.toFixed(2),
    net: g.in.minus(g.out).toFixed(2),
  }));
}

interface Tally {
  count: number;
  total: Prisma.Decimal;
}
interface TypeTally extends Tally {
  byAccount: Map<string, Tally>;
}

function groupByType(rows: ShiftRow[]): TypeGroup[] {
  const map = new Map<string, TypeTally>();
  for (const r of rows) {
    const g: TypeTally = map.get(r.typeCode) ?? {
      count: 0,
      total: ZERO,
      byAccount: new Map<string, Tally>(),
    };
    g.count += 1;
    g.total = g.total.plus(r.amount);
    const a: Tally = g.byAccount.get(r.accountCode) ?? {
      count: 0,
      total: ZERO,
    };
    a.count += 1;
    a.total = a.total.plus(r.amount);
    g.byAccount.set(r.accountCode, a);
    map.set(r.typeCode, g);
  }
  return [...map.entries()].map(([typeCode, g]) => ({
    typeCode,
    count: g.count,
    total: g.total.toFixed(2),
    byAccount: [...g.byAccount.entries()].map(([accountCode, a]) => ({
      accountCode,
      count: a.count,
      total: a.total.toFixed(2),
    })),
  }));
}
