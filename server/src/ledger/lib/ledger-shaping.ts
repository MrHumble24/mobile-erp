import { Prisma } from '../../generated/client/client.js';
import { COST_TYPE_CODES } from '../types/ledger.types.js';

export function parseDate(value?: string): Date | undefined {
  return value ? new Date(value) : undefined;
}

/** Null the `amount` and `accountRunningBalance` of a cost-type row; leave everything else untouched. */
export function hideCostAmount<
  T extends {
    typeCode: string;
    amount: unknown;
    accountRunningBalance?: unknown;
  },
>(
  row: T,
):
  | T
  | (Omit<T, 'amount' | 'accountRunningBalance'> & {
      amount: null;
      accountRunningBalance: null;
    }) {
  return COST_TYPE_CODES.has(row.typeCode)
    ? { ...row, amount: null, accountRunningBalance: null }
    : row;
}

/** Account code → summed amount, from a Prisma groupBy result. */
export function sumMap(
  sums: { accountCode: string; _sum: { amount: Prisma.Decimal | null } }[],
): Map<string, Prisma.Decimal> {
  return new Map(
    sums.map((s) => [s.accountCode, s._sum.amount ?? new Prisma.Decimal(0)]),
  );
}
