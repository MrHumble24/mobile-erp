import { Prisma } from '../../generated/client/client.js';

/** Aging bucket codes, youngest to oldest. Stable keys the client labels. */
export const AGING_BUCKETS = [
  'current',
  'd1_30',
  'd31_60',
  'd61_90',
  'd90_plus',
] as const;
export type AgingBucketCode = (typeof AGING_BUCKETS)[number];

export interface AgingBucket {
  bucket: AgingBucketCode;
  count: number;
  /** Σ agreedPrice of OUT consignments in this bucket (gross, pre-payments). */
  amount: Prisma.Decimal;
}

export interface OpenConsignmentAge {
  dueDate: Date;
  agreedPrice: Prisma.Decimal;
}

const DAY_MS = 86_400_000;

function bucketFor(daysOverdue: number): AgingBucketCode {
  if (daysOverdue <= 0) return 'current';
  if (daysOverdue <= 30) return 'd1_30';
  if (daysOverdue <= 60) return 'd31_60';
  if (daysOverdue <= 90) return 'd61_90';
  return 'd90_plus';
}

/**
 * Buckets a partner's OUT consignments by how far past due they are. Pure, so
 * the aging maths is unit-tested without a database. Always returns all five
 * buckets in order, zero-filled.
 */
export function bucketOpenConsignments(
  rows: OpenConsignmentAge[],
  now: Date = new Date(),
): AgingBucket[] {
  const byBucket = new Map<AgingBucketCode, AgingBucket>(
    AGING_BUCKETS.map((bucket) => [
      bucket,
      { bucket, count: 0, amount: new Prisma.Decimal(0) },
    ]),
  );
  for (const row of rows) {
    const daysOverdue = Math.floor(
      (now.getTime() - row.dueDate.getTime()) / DAY_MS,
    );
    const entry = byBucket.get(bucketFor(daysOverdue))!;
    entry.count += 1;
    entry.amount = entry.amount.plus(row.agreedPrice);
  }
  return AGING_BUCKETS.map((bucket) => byBucket.get(bucket)!);
}
