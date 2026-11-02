import {
  BreakdownRawRow,
  BreakdownRow,
  ExpenseReportRow,
  ExpenseReportRowWithShare,
} from '../types/reports.types.js';

/** Derive grossProfit + revenue share and sort descending by revenue. */
export function toBreakdownRows(rows: BreakdownRawRow[]): BreakdownRow[] {
  const totalRevenue = rows.reduce((sum, r) => sum + r.revenue, 0);
  return rows
    .map((r) => ({
      ...r,
      grossProfit: r.revenue - r.cogs,
      share: totalRevenue > 0 ? r.revenue / totalRevenue : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

/** Attach each expense row's share of the total. */
export function withExpenseShare(
  rows: ExpenseReportRow[],
): ExpenseReportRowWithShare[] {
  const total = rows.reduce((sum, r) => sum + r.total, 0);
  return rows.map((r) => ({
    ...r,
    share: total > 0 ? r.total / total : 0,
  }));
}
