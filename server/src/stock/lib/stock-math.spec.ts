import { averageCost, foldStock, valuation } from './stock-math.js';

const purchase = (quantity: number, cost: number) => ({
  quantity,
  unitCostSnapshot: cost,
  typeCode: 'PURCHASE',
});
const sale = (quantity: number, cost: number) => ({
  quantity: -quantity,
  unitCostSnapshot: cost,
  typeCode: 'SALE',
});

describe('stock-math', () => {
  it('averages two purchases at different costs', () => {
    // 10 @ 20 then 10 @ 30 → 20 pieces, value 500, avg 25.
    const agg = foldStock([purchase(10, 20), purchase(10, 30)]);
    expect(agg.quantity).toBe(20);
    expect(agg.value.toFixed(2)).toBe('500.00');
    expect(averageCost(agg).toFixed(2)).toBe('25.00');
  });

  it('keeps a consistent average after a sale between two purchases', () => {
    // 10 @ 20, sell 4 at the then-average 20, then 10 @ 30.
    // 16 pieces, value 120 + 300 = 420, avg 26.25.
    const agg = foldStock([purchase(10, 20), sale(4, 20), purchase(10, 30)]);
    expect(agg.quantity).toBe(16);
    expect(agg.value.toFixed(2)).toBe('420.00');
    expect(averageCost(agg).toFixed(2)).toBe('26.25');
  });

  it('falls back to the latest purchase cost at zero stock', () => {
    // bought 10 @ 20, bought 10 @ 30, sold all 20 → qty 0.
    const agg = foldStock([purchase(10, 20), purchase(10, 30), sale(20, 25)]);
    expect(agg.quantity).toBe(0);
    expect(averageCost(agg).toFixed(2)).toBe('30.00');
  });

  it('falls back to the latest purchase cost below zero (oversold)', () => {
    // 10 @ 20 then sold 14 → qty -4, latest purchase 20.
    const agg = foldStock([purchase(10, 20), sale(14, 20)]);
    expect(agg.quantity).toBe(-4);
    expect(averageCost(agg).toFixed(2)).toBe('20.00');
  });

  it('is zero for a product never bought or sold', () => {
    const agg = foldStock([]);
    expect(valuation(agg).averageCost.toFixed(2)).toBe('0.00');
    expect(valuation(agg).value.toFixed(2)).toBe('0.00');
  });
});
