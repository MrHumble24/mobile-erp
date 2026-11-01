/**
 * Landed cost per unit = acquisitionCost + overheadCost / deviceCount,
 * rounded to 2 decimals, half-up. Pure integer-cent math so there is no
 * float drift and no dependency on the Prisma Decimal runtime.
 * See docs/decisions/0006-landed-cost-allocation.md.
 */
export function computeLandedCost(
  acquisitionCost: number,
  overheadCost: number,
  deviceCount: number,
): string {
  const acqCents = toCents(acquisitionCost);
  if (deviceCount <= 0) return fromCents(acqCents);
  const shareCents = halfUpDiv(toCents(overheadCost), deviceCount);
  return fromCents(acqCents + shareCents);
}

function toCents(amount: number): number {
  return Math.round(amount * 100);
}

function fromCents(cents: number): string {
  return (cents / 100).toFixed(2);
}

/** Integer division rounded half-up. Inputs are non-negative money cents. */
function halfUpDiv(numerator: number, divisor: number): number {
  const quotient = Math.floor(numerator / divisor);
  const remainder = numerator - quotient * divisor;
  return remainder * 2 >= divisor ? quotient + 1 : quotient;
}
