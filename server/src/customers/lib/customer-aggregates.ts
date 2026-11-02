/** Minimal sale shape the aggregates need; structurally a subset of SaleView. */
export interface AggregatableSale {
  salePrice: unknown;
  soldAt: string | Date;
  warranty: { endsAt: string | Date } | null;
  return: unknown;
}

export interface CustomerAggregates {
  purchaseCount: number;
  /** Gross sum of sale prices, rounded to cents. */
  totalSpent: number;
  lastPurchaseAt: Date | null;
  /** Non-returned sales whose warranty still covers them. */
  activeWarranties: number;
  returnsCount: number;
}

/** Derives per-customer purchase stats from their sales (never stored). */
export function aggregateSales(
  sales: AggregatableSale[],
  now: Date = new Date(),
): CustomerAggregates {
  let totalSpent = 0;
  let lastPurchaseAt: Date | null = null;
  let activeWarranties = 0;
  let returnsCount = 0;

  for (const sale of sales) {
    totalSpent += Number(sale.salePrice) || 0;
    const soldAt = new Date(sale.soldAt);
    if (!lastPurchaseAt || soldAt > lastPurchaseAt) lastPurchaseAt = soldAt;
    if (sale.return) {
      returnsCount += 1;
    } else if (sale.warranty && new Date(sale.warranty.endsAt) > now) {
      activeWarranties += 1;
    }
  }

  return {
    purchaseCount: sales.length,
    totalSpent: Math.round(totalSpent * 100) / 100,
    lastPurchaseAt,
    activeWarranties,
    returnsCount,
  };
}
