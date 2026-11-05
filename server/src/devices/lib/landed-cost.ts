/**
 * Landed cost of one unit = acquisitionCost + customsFee + unitExpense, exact
 * to the cent (integer-cent math, no float drift). This is the single home of
 * the rule; intake, the unit-expense edit and the customs-fee edit all call it.
 * Supersedes the even overhead spread of ADR 0006 — cost is now per-phone, not
 * batch-allocated. See docs/decisions/0026-per-phone-expense.md.
 */
export function computeLandedCost(
  acquisitionCost: number,
  customsFee: number,
  unitExpense: number,
): string {
  const cents =
    toCents(acquisitionCost) + toCents(customsFee) + toCents(unitExpense);
  return (cents / 100).toFixed(2);
}

function toCents(amount: number): number {
  return Math.round(amount * 100);
}
