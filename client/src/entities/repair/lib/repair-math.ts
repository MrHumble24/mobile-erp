/**
 * Pure repair arithmetic for the UI (ADR 0040). The server is the source of
 * truth and returns `paid`/`outstanding`; these mirror its rules so the UI can
 * decide, without a round-trip, whether money is still owed (hand-over warning)
 * or has been overpaid (a refund is due). Money is handled in integer cents to
 * avoid float drift.
 */

function toCents(value: string | number): number {
  return Math.round(Number(value) * 100)
}

/** agreedPrice − paid, in currency units. Negative = overpaid. */
export function leftToPay(agreedPrice: string | number, paid: string | number): number {
  return (toCents(agreedPrice) - toCents(paid)) / 100
}

/** True when money is still owed on the ticket. */
export function isOwed(agreedPrice: string | number, paid: string | number): boolean {
  return toCents(agreedPrice) - toCents(paid) > 0
}

/** True when the customer has paid more than the agreed price. */
export function isOverpaid(agreedPrice: string | number, paid: string | number): boolean {
  return toCents(agreedPrice) - toCents(paid) < 0
}
