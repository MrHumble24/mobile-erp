import { AgingBucket, InventoryAgingRow } from '../types/reports.types.js';

export const AGING_BUCKETS: readonly AgingBucket[] = [
  '0-30',
  '31-60',
  '61-90',
  '90+',
] as const;

/** Fill the four fixed aging buckets in order, zeroing any the query omitted. */
export function fillAging(
  rows: Array<{ bucket: string; units: number; landedValue: number }>,
): InventoryAgingRow[] {
  const byBucket = new Map(rows.map((r) => [r.bucket, r]));
  return AGING_BUCKETS.map((bucket) => {
    const r = byBucket.get(bucket);
    return {
      bucket,
      units: r?.units ?? 0,
      landedValue: r?.landedValue ?? 0,
    };
  });
}
