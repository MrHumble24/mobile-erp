import {
  TrendBucket,
  TrendPoint,
  TrendRawRow,
} from '../types/reports.types.js';

/** UTC bucket start matching Postgres date_trunc(day|week|month). Week = Monday. */
export function truncBucket(date: Date, bucket: TrendBucket): Date {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  const d = date.getUTCDate();
  if (bucket === 'month') return new Date(Date.UTC(y, m, 1));
  const midnight = Date.UTC(y, m, d);
  if (bucket === 'day') return new Date(midnight);
  const mondayOffset = (date.getUTCDay() + 6) % 7; // Sun→6, Mon→0, ...
  return new Date(midnight - mondayOffset * 86_400_000);
}

function nextBucket(date: Date, bucket: TrendBucket): Date {
  if (bucket === 'month') {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
  }
  return new Date(date.getTime() + (bucket === 'week' ? 7 : 1) * 86_400_000);
}

const isoDay = (date: Date): string => date.toISOString().slice(0, 10);

/** Every expected bucket start from `from` to `to`, inclusive, as ISO dates. */
export function bucketStarts(
  from: Date,
  to: Date,
  bucket: TrendBucket,
): string[] {
  const end = truncBucket(to, bucket);
  const out: string[] = [];
  let cur = truncBucket(from, bucket);
  while (cur.getTime() <= end.getTime()) {
    out.push(isoDay(cur));
    cur = nextBucket(cur, bucket);
  }
  return out;
}

/** Zero-fill missing buckets and derive grossProfit from the aggregate rows. */
export function fillTrend(
  rows: TrendRawRow[],
  from: Date,
  to: Date,
  bucket: TrendBucket,
): TrendPoint[] {
  const byBucket = new Map(
    rows.map((r) => [isoDay(truncBucket(new Date(r.bucket), bucket)), r]),
  );
  return bucketStarts(from, to, bucket).map((key) => {
    const r = byBucket.get(key);
    const revenue = r?.revenue ?? 0;
    const cogs = r?.cogs ?? 0;
    return {
      bucket: key,
      revenue,
      cogs,
      grossProfit: revenue - cogs,
      expenses: r?.expenses ?? 0,
      unitsSold: r?.unitsSold ?? 0,
      returnsRefunded: r?.returnsRefunded ?? 0,
    };
  });
}
