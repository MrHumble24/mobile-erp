const MS_PER_DAY = 86_400_000

/**
 * Whole days of warranty left, floored at 0. A partial remaining day counts as 1
 * (ceil) — same rule as the server's `remainingWarrantyDays`.
 */
export function warrantyRemainingDays(
  endsAt: string | null | undefined,
  now: Date = new Date()
): number {
  if (!endsAt) return 0
  const ms = new Date(endsAt).getTime() - now.getTime()
  if (Number.isNaN(ms) || ms <= 0) return 0
  return Math.ceil(ms / MS_PER_DAY)
}
