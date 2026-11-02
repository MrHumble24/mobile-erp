/** Margin percent of a sale: (salePrice − landedCost) / salePrice * 100. */
export function marginPercent(salePrice: number, landedCost: number): number {
  if (salePrice <= 0) return 0;
  return ((salePrice - landedCost) / salePrice) * 100;
}

/**
 * A sale is alert-worthy when it undercut its target price, or its margin fell
 * below the store's minimum. targetPrice null skips the first clause.
 */
export function isBelowMargin(
  salePrice: number,
  landedCost: number,
  targetPrice: number | null,
  minMarginPercent: number,
): boolean {
  const belowTarget = targetPrice !== null && salePrice < targetPrice;
  return belowTarget || marginPercent(salePrice, landedCost) < minMarginPercent;
}
