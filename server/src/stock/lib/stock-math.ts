import { Prisma } from '../../generated/client/client.js';

const D = (v: Prisma.Decimal | number | string): Prisma.Decimal =>
  new Prisma.Decimal(v);

/** One movement, as much of it as the arithmetic needs. */
export interface StockMovementLite {
  quantity: number;
  unitCostSnapshot: Prisma.Decimal | number | string;
  typeCode: string;
}

/**
 * A product's stock position in one store, folded once from its movements.
 * `value` is Σ(quantity × unitCostSnapshot); it may be negative when stock is
 * oversold. `latestPurchaseCost` is the unit cost of the newest PURCHASE row
 * (0 when the product was never bought), used only when quantity ≤ 0.
 */
export interface StockAggregate {
  quantity: number;
  value: Prisma.Decimal;
  latestPurchaseCost: Prisma.Decimal;
}

export interface StockValuation {
  quantity: number;
  value: Prisma.Decimal;
  averageCost: Prisma.Decimal;
}

/**
 * Fold a movement list (ascending by occurredAt) into an aggregate. Used by the
 * spec and by the repository when it already holds the rows; the repository's
 * SQL path produces the same `StockAggregate` so there is one source of truth
 * for the average rule below.
 */
export function foldStock(movements: StockMovementLite[]): StockAggregate {
  let quantity = 0;
  let value = D(0);
  let latestPurchaseCost = D(0);
  for (const m of movements) {
    quantity += m.quantity;
    value = value.plus(D(m.unitCostSnapshot).times(m.quantity));
    if (m.typeCode === 'PURCHASE') latestPurchaseCost = D(m.unitCostSnapshot);
  }
  return { quantity, value, latestPurchaseCost };
}

/**
 * Moving-average unit cost. While stock is positive it is value ÷ quantity; at
 * zero or below (an offline till may oversell, stock below zero is allowed) it
 * falls back to the latest purchase price — 0 when nothing was ever bought.
 * This is the single source of truth for a product's cost per piece; every
 * outgoing movement stamps the value it returns as its `unitCostSnapshot`.
 */
export function averageCost(agg: StockAggregate): Prisma.Decimal {
  return agg.quantity > 0
    ? agg.value.div(agg.quantity)
    : agg.latestPurchaseCost;
}

export function valuation(agg: StockAggregate): StockValuation {
  return {
    quantity: agg.quantity,
    value: agg.value,
    averageCost: averageCost(agg),
  };
}
