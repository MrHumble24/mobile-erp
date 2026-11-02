import { aggregateSales } from './customer-aggregates.js';

const now = new Date('2024-06-01T00:00:00Z');
const future = '2024-09-01T00:00:00Z';
const past = '2024-03-01T00:00:00Z';

describe('aggregateSales', () => {
  it('returns zeros for no sales', () => {
    expect(aggregateSales([], now)).toEqual({
      purchaseCount: 0,
      totalSpent: 0,
      lastPurchaseAt: null,
      activeWarranties: 0,
      returnsCount: 0,
    });
  });

  it('sums prices, tracks last purchase and counts active warranties', () => {
    const result = aggregateSales(
      [
        {
          salePrice: '100.50',
          soldAt: '2024-01-10',
          warranty: { endsAt: future },
          return: null,
        },
        {
          salePrice: 200,
          soldAt: '2024-05-20',
          warranty: { endsAt: past },
          return: null,
        },
      ],
      now,
    );
    expect(result.purchaseCount).toBe(2);
    expect(result.totalSpent).toBe(300.5);
    expect(result.lastPurchaseAt).toEqual(new Date('2024-05-20'));
    expect(result.activeWarranties).toBe(1);
    expect(result.returnsCount).toBe(0);
  });

  it('counts returns and never counts a returned sale as active warranty', () => {
    const result = aggregateSales(
      [
        {
          salePrice: 50,
          soldAt: '2024-05-01',
          warranty: { endsAt: future },
          return: { returnedAt: past },
        },
      ],
      now,
    );
    expect(result.returnsCount).toBe(1);
    expect(result.activeWarranties).toBe(0);
  });
});
