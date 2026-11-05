/**
 * counted − expected, in cents to avoid float drift, returned as a 2-dp string.
 * Mirrors the server's close arithmetic so the cashier sees the same figure
 * before confirming (ADR 0036).
 */
export function shiftDifference(
  counted: string | number,
  expected: string | number
): string {
  const cents = Math.round(Number(counted) * 100) - Math.round(Number(expected) * 100)
  return (cents / 100).toFixed(2)
}

/** A short classification of a difference for colour + wording. */
export type DifferenceKind = "none" | "short" | "over"

export function differenceKind(difference: string | number): DifferenceKind {
  const cents = Math.round(Number(difference) * 100)
  if (cents === 0) return "none"
  return cents < 0 ? "short" : "over"
}
