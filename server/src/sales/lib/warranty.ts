const MS_PER_DAY = 86_400_000;

/** Warranty window: starts at the sale time, ends `days` later. */
export function warrantyEndsAt(startsAt: Date, days: number): Date {
  return new Date(startsAt.getTime() + days * MS_PER_DAY);
}

/**
 * Whole days of cover left, floored at 0. A partial remaining day counts as 1
 * (ceil) so a customer returning on the last day is still in warranty.
 */
export function remainingWarrantyDays(
  endsAt: Date,
  now: Date = new Date(),
): number {
  const ms = endsAt.getTime() - now.getTime();
  if (ms <= 0) return 0;
  return Math.ceil(ms / MS_PER_DAY);
}
