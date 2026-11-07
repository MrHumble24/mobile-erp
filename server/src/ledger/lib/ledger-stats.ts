import { Prisma } from '../../generated/client/client.js';
import {
  COST_TYPE_CODES,
  type LedgerAccountBreakdownItem,
  type LedgerStats,
  type LedgerTimelinePoint,
  type LedgerTypeBreakdownItem,
} from '../types/ledger.types.js';

export interface StatsRow {
  amount: Prisma.Decimal;
  typeCode: string;
  accountCode: string;
  occurredAt: Date;
  type: { label: string };
  account: { label: string };
}

/**
 * Fold ledger rows into totals, a daily timeline and per-type / per-account
 * breakdowns. Cost-type rows are skipped for a caller without the cost permission.
 * OPENING rows are the account's starting snapshot, not money movement in the
 * period: they stay out of the inflow / outflow / net figures and the timeline /
 * breakdowns, and surface on their own as `summary.opening`.
 */
export function aggregateStats(
  rows: StatsRow[],
  canViewCost: boolean,
): LedgerStats {
  let totalIn = new Prisma.Decimal(0);
  let totalOut = new Prisma.Decimal(0);
  let openingTotal = new Prisma.Decimal(0);
  let inCount = 0;
  let outCount = 0;

  const timelineMap = new Map<
    string,
    { inflow: number; outflow: number; net: number }
  >();
  const typeMap = new Map<
    string,
    {
      typeCode: string;
      typeLabel: string;
      direction: 'in' | 'out';
      amount: Prisma.Decimal;
      count: number;
    }
  >();
  const accountMap = new Map<
    string,
    {
      accountCode: string;
      accountLabel: string;
      inflow: Prisma.Decimal;
      outflow: Prisma.Decimal;
      net: Prisma.Decimal;
    }
  >();

  for (const row of rows) {
    const isCost = COST_TYPE_CODES.has(row.typeCode);
    if (!canViewCost && isCost) {
      continue;
    }

    const amt = row.amount;
    const numAmt = Number(amt);
    const isPositive = numAmt > 0;
    const absAmt = Math.abs(numAmt);

    // A starting snapshot is neither period income nor expense.
    if (row.typeCode === 'OPENING') {
      openingTotal = openingTotal.plus(amt);
      continue;
    }

    if (isPositive) {
      totalIn = totalIn.plus(amt);
      inCount++;
    } else {
      totalOut = totalOut.plus(amt.abs());
      outCount++;
    }

    const dateKey = row.occurredAt.toISOString().slice(0, 10);
    const point = timelineMap.get(dateKey) ?? {
      inflow: 0,
      outflow: 0,
      net: 0,
    };
    if (isPositive) {
      point.inflow += numAmt;
      point.net += numAmt;
    } else {
      point.outflow += absAmt;
      point.net += numAmt;
    }
    timelineMap.set(dateKey, point);

    const typeKey = row.typeCode;
    const typeItem = typeMap.get(typeKey) ?? {
      typeCode: row.typeCode,
      typeLabel: row.type.label,
      direction: isPositive ? 'in' : 'out',
      amount: new Prisma.Decimal(0),
      count: 0,
    };
    typeItem.amount = typeItem.amount.plus(amt.abs());
    typeItem.count++;
    typeMap.set(typeKey, typeItem);

    const accKey = row.accountCode;
    const accItem = accountMap.get(accKey) ?? {
      accountCode: row.accountCode,
      accountLabel: row.account.label,
      inflow: new Prisma.Decimal(0),
      outflow: new Prisma.Decimal(0),
      net: new Prisma.Decimal(0),
    };
    if (isPositive) {
      accItem.inflow = accItem.inflow.plus(amt);
    } else {
      accItem.outflow = accItem.outflow.plus(amt.abs());
    }
    accItem.net = accItem.net.plus(amt);
    accountMap.set(accKey, accItem);
  }

  const netFlow = totalIn.minus(totalOut);

  const timeline: LedgerTimelinePoint[] = Array.from(timelineMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, val]) => ({
      date,
      inflow: Number(val.inflow.toFixed(2)),
      outflow: Number(val.outflow.toFixed(2)),
      net: Number(val.net.toFixed(2)),
    }));

  const totalOutNum = Number(totalOut.toFixed(2));
  const totalInNum = Number(totalIn.toFixed(2));

  const byType: LedgerTypeBreakdownItem[] = Array.from(typeMap.values())
    .map((t) => {
      const amtNum = Number(t.amount.toFixed(2));
      const base = t.direction === 'in' ? totalInNum : totalOutNum;
      const percentage =
        base > 0 ? Number(((amtNum / base) * 100).toFixed(1)) : 0;
      return {
        typeCode: t.typeCode,
        typeLabel: t.typeLabel,
        direction: t.direction,
        amount: amtNum,
        count: t.count,
        percentage,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  const byAccount: LedgerAccountBreakdownItem[] = Array.from(
    accountMap.values(),
  ).map((a) => ({
    accountCode: a.accountCode,
    accountLabel: a.accountLabel,
    inflow: Number(a.inflow.toFixed(2)),
    outflow: Number(a.outflow.toFixed(2)),
    net: Number(a.net.toFixed(2)),
  }));

  return {
    summary: {
      totalIn: totalIn.toFixed(2),
      totalOut: totalOut.toFixed(2),
      netFlow: netFlow.toFixed(2),
      transactionCount: inCount + outCount,
      inCount,
      outCount,
      opening: openingTotal.toFixed(2),
    },
    timeline,
    byType,
    byAccount,
  };
}
