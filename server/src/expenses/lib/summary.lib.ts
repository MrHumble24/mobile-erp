/**
 * The period immediately before [from, to] of equal length, for a
 * month-over-month style comparison. Returns empty bounds when either side is
 * open (an all-time view has no comparable previous window).
 */
export function previousPeriod(
  from?: Date,
  to?: Date,
): { from?: Date; to?: Date } {
  if (!from || !to) return {};
  const span = to.getTime() - from.getTime();
  return {
    from: new Date(from.getTime() - span - 1),
    to: new Date(from.getTime() - 1),
  };
}

/** The highest-total row, or null for an empty breakdown. Pure. */
export function pickTopCategory<T extends { total: number }>(
  rows: T[],
): T | null {
  if (rows.length === 0) return null;
  return rows.reduce((top, row) => (row.total > top.total ? row : top));
}
