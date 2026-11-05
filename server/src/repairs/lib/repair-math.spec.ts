import { Prisma } from '../../generated/client/client.js';
import { computeRepairFinance, warrantyUntilOf } from './repair-math.js';

const D = (n: number) => new Prisma.Decimal(n);

describe('computeRepairFinance', () => {
  it('derives paid, outstanding, parts cost and profit', () => {
    const fin = computeRepairFinance({
      agreedPrice: D(500_000),
      paymentAmounts: [D(200_000), D(300_000)],
      parts: [
        { quantity: 2, unitCostSnapshot: D(30_000) },
        { quantity: 1, unitCostSnapshot: D(15_000) },
      ],
      outsidePaid: D(0),
      givenBackAt: null,
      warrantyDays: 30,
      now: new Date(),
    });
    expect(fin.paid.toFixed(2)).toBe('500000.00');
    expect(fin.outstanding.toFixed(2)).toBe('0.00');
    expect(fin.owed.toFixed(2)).toBe('0.00');
    expect(fin.partsCost.toFixed(2)).toBe('75000.00'); // 2*30000 + 1*15000
    expect(fin.profit.toFixed(2)).toBe('425000.00'); // 500000 - 75000 - 0
  });

  it('subtracts the outside cost from profit and leaves money owed when short-paid', () => {
    const fin = computeRepairFinance({
      agreedPrice: D(500_000),
      paymentAmounts: [D(200_000)],
      parts: [],
      outsidePaid: D(150_000),
      givenBackAt: null,
      warrantyDays: 0,
      now: new Date(),
    });
    expect(fin.outstanding.toFixed(2)).toBe('300000.00');
    expect(fin.owed.toFixed(2)).toBe('300000.00');
    expect(fin.profit.toFixed(2)).toBe('50000.00'); // 200000 - 0 - 150000
  });

  it('refund lowers paid; overpay makes outstanding negative but owed zero', () => {
    const fin = computeRepairFinance({
      agreedPrice: D(100_000),
      paymentAmounts: [D(120_000), D(-20_000)],
      parts: [],
      outsidePaid: D(0),
      givenBackAt: null,
      warrantyDays: 0,
      now: new Date(),
    });
    expect(fin.paid.toFixed(2)).toBe('100000.00');
    expect(fin.owed.toFixed(2)).toBe('0.00');
  });

  it('warranty runs from the given-back instant', () => {
    const givenBack = new Date('2026-01-01T00:00:00Z');
    const during = computeRepairFinance({
      agreedPrice: D(0),
      paymentAmounts: [],
      parts: [],
      outsidePaid: D(0),
      givenBackAt: givenBack,
      warrantyDays: 30,
      now: new Date('2026-01-20T00:00:00Z'),
    });
    expect(during.underWarranty).toBe(true);
    const after = computeRepairFinance({
      agreedPrice: D(0),
      paymentAmounts: [],
      parts: [],
      outsidePaid: D(0),
      givenBackAt: givenBack,
      warrantyDays: 30,
      now: new Date('2026-03-01T00:00:00Z'),
    });
    expect(after.underWarranty).toBe(false);
  });
});

describe('warrantyUntilOf', () => {
  it('is null before given-back or with no warranty', () => {
    expect(warrantyUntilOf(null, 30)).toBeNull();
    expect(warrantyUntilOf(new Date(), 0)).toBeNull();
  });

  it('adds the warranty days to the given-back date', () => {
    const until = warrantyUntilOf(new Date('2026-01-01T00:00:00Z'), 30);
    expect(until?.toISOString()).toBe('2026-01-31T00:00:00.000Z');
  });
});
