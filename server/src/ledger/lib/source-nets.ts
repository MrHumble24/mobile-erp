import { Prisma } from '../../generated/client/client.js';
import type { AccountNet, LedgerSourceField } from '../types/ledger.types.js';

interface GroupRow {
  accountCode: string;
  _sum: { amount: Prisma.Decimal | null };
}

/**
 * Fold `groupBy([field, accountCode])` rows into a map keyed by the source id,
 * each value the per-account nets (money in positive, out negative). The source
 * id is read dynamically because the grouped field name varies.
 */
export function foldSourceNets(
  field: LedgerSourceField,
  rows: GroupRow[],
): Map<string, AccountNet[]> {
  const byId = new Map<string, AccountNet[]>();
  for (const row of rows) {
    const id = (row as unknown as Record<string, string | null>)[field];
    if (!id) continue;
    const list = byId.get(id) ?? [];
    list.push({
      accountCode: row.accountCode,
      amount: row._sum.amount ?? new Prisma.Decimal(0),
    });
    byId.set(id, list);
  }
  return byId;
}

/** The account a source's money currently sits against: the one with nonzero net. */
export function currentAccount(nets: AccountNet[] | undefined): string | null {
  if (!nets) return null;
  const nonZero = nets.filter((n) => !n.amount.isZero());
  if (nonZero.length === 0) return null;
  // One account is expected; if several, the most negative (most money out).
  return nonZero.reduce((a, b) => (a.amount.lte(b.amount) ? a : b)).accountCode;
}
