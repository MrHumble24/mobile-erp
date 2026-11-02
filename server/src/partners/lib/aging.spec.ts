import { Prisma } from '../../generated/client/client.js';
import { AGING_BUCKETS, bucketOpenConsignments } from './aging.js';

const NOW = new Date('2026-06-01T00:00:00.000Z');
const D = (n: number) => new Prisma.Decimal(n);
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000);
const inDays = (n: number) => new Date(NOW.getTime() + n * 86_400_000);

describe('bucketOpenConsignments', () => {
  it('always returns all five buckets, zero-filled', () => {
    const buckets = bucketOpenConsignments([], NOW);
    expect(buckets.map((b) => b.bucket)).toEqual([...AGING_BUCKETS]);
    expect(buckets.every((b) => b.count === 0 && b.amount.eq(0))).toBe(true);
  });

  it('counts not-yet-due items as current', () => {
    const [current] = bucketOpenConsignments(
      [{ dueDate: inDays(5), agreedPrice: D(100) }],
      NOW,
    );
    expect(current.count).toBe(1);
    expect(current.amount.eq(100)).toBe(true);
  });

  it('places items in the correct overdue bucket by age', () => {
    const buckets = bucketOpenConsignments(
      [
        { dueDate: daysAgo(10), agreedPrice: D(10) }, // d1_30
        { dueDate: daysAgo(45), agreedPrice: D(20) }, // d31_60
        { dueDate: daysAgo(75), agreedPrice: D(30) }, // d61_90
        { dueDate: daysAgo(200), agreedPrice: D(40) }, // d90_plus
      ],
      NOW,
    );
    const by = Object.fromEntries(buckets.map((b) => [b.bucket, b]));
    expect(by.d1_30.amount.eq(10)).toBe(true);
    expect(by.d31_60.amount.eq(20)).toBe(true);
    expect(by.d61_90.amount.eq(30)).toBe(true);
    expect(by.d90_plus.amount.eq(40)).toBe(true);
  });

  it('sums amount and count within a bucket', () => {
    const [, d1_30] = bucketOpenConsignments(
      [
        { dueDate: daysAgo(5), agreedPrice: D(100) },
        { dueDate: daysAgo(15), agreedPrice: D(250) },
      ],
      NOW,
    );
    expect(d1_30.count).toBe(2);
    expect(d1_30.amount.eq(350)).toBe(true);
  });
});
