import { fillAging } from './lib/aging.js';
import { toBreakdownRows, withExpenseShare } from './lib/share.js';
import { bucketStarts, fillTrend, truncBucket } from './lib/trend.js';
import { TrendRawRow } from './types/reports.types.js';

describe('trend zero-fill', () => {
  it('fills missing buckets with zeros and derives grossProfit', () => {
    const from = new Date('2026-01-01T00:00:00Z');
    const to = new Date('2026-01-03T23:59:59Z');
    const rows: TrendRawRow[] = [
      {
        bucket: new Date('2026-01-02T00:00:00Z'),
        revenue: 1000,
        cogs: 600,
        expenses: 100,
        unitsSold: 3,
        returnsRefunded: 50,
      },
    ];
    const out = fillTrend(rows, from, to, 'day');
    expect(out.map((p) => p.bucket)).toEqual([
      '2026-01-01',
      '2026-01-02',
      '2026-01-03',
    ]);
    expect(out[0]).toMatchObject({ revenue: 0, grossProfit: 0, unitsSold: 0 });
    expect(out[1]).toMatchObject({
      revenue: 1000,
      cogs: 600,
      grossProfit: 400,
    });
  });

  it('truncates weeks to Monday and months to the 1st', () => {
    // 2026-01-07 is a Wednesday → week starts Mon 2026-01-05.
    expect(
      truncBucket(new Date('2026-01-07T12:00:00Z'), 'week').toISOString(),
    ).toBe('2026-01-05T00:00:00.000Z');
    expect(
      truncBucket(new Date('2026-01-20T00:00:00Z'), 'month').toISOString(),
    ).toBe('2026-01-01T00:00:00.000Z');
  });

  it('enumerates month buckets across a year boundary', () => {
    const starts = bucketStarts(
      new Date('2025-12-15T00:00:00Z'),
      new Date('2026-02-10T00:00:00Z'),
      'month',
    );
    expect(starts).toEqual(['2025-12-01', '2026-01-01', '2026-02-01']);
  });
});

describe('breakdown share', () => {
  it('derives share of revenue and sorts descending', () => {
    const out = toBreakdownRows([
      { key: 'a', label: 'A', revenue: 300, cogs: 200, unitsSold: 1 },
      { key: 'b', label: 'B', revenue: 700, cogs: 400, unitsSold: 2 },
    ]);
    expect(out[0].key).toBe('b');
    expect(out[0].share).toBeCloseTo(0.7);
    expect(out[0].grossProfit).toBe(300);
    expect(out[1].share).toBeCloseTo(0.3);
  });

  it('returns zero shares when total revenue is zero', () => {
    const out = withExpenseShare([{ key: 'x', label: 'X', total: 0 }]);
    expect(out[0].share).toBe(0);
  });
});

describe('inventory aging', () => {
  it('fills the four fixed buckets in order, zeroing the absent ones', () => {
    const out = fillAging([
      { bucket: '90+', units: 2, landedValue: 800 },
      { bucket: '0-30', units: 5, landedValue: 2000 },
    ]);
    expect(out.map((r) => r.bucket)).toEqual(['0-30', '31-60', '61-90', '90+']);
    expect(out[1]).toEqual({ bucket: '31-60', units: 0, landedValue: 0 });
    expect(out[3]).toEqual({ bucket: '90+', units: 2, landedValue: 800 });
  });
});
