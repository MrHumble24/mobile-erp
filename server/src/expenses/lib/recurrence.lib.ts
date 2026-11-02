/** Supported recurrence cadences. A fixed set — validated at the DTO, no lookup table. */
export type ExpenseFrequency = 'monthly' | 'weekly';
export const EXPENSE_FREQUENCIES: readonly ExpenseFrequency[] = [
  'monthly',
  'weekly',
];

/**
 * The next due date after `from` for a cadence. Monthly keeps the day-of-month,
 * clamped to the target month's last day (Jan 31 → Feb 28/29). Pure, no I/O.
 */
export function nextDueDate(from: Date, frequency: ExpenseFrequency): Date {
  const next = new Date(from);
  if (frequency === 'weekly') {
    next.setDate(next.getDate() + 7);
    return next;
  }
  const day = next.getDate();
  next.setDate(1);
  next.setMonth(next.getMonth() + 1);
  const lastDay = new Date(
    next.getFullYear(),
    next.getMonth() + 1,
    0,
  ).getDate();
  next.setDate(Math.min(day, lastDay));
  return next;
}
