import { Prisma } from '../../generated/client/client.js';
import { proportionalSplit } from './proportional-split.js';

const D = (n: number | string) => new Prisma.Decimal(n);

describe('proportionalSplit', () => {
  it('splits in proportion to the weights', () => {
    const out = proportionalSplit(D(100), [
      { accountCode: 'CASH', amount: D(60) },
      { accountCode: 'CARD', amount: D(40) },
    ]);
    expect(out).toEqual([
      { accountCode: 'CASH', amount: D(60) },
      { accountCode: 'CARD', amount: D(40) },
    ]);
  });

  it('puts the rounding remainder on the largest part so parts sum exactly', () => {
    const out = proportionalSplit(D('100.00'), [
      { accountCode: 'CASH', amount: D(1) },
      { accountCode: 'CARD', amount: D(2) },
    ]);
    const sum = out.reduce((s, p) => s.plus(p.amount), D(0));
    expect(sum.toFixed(2)).toBe('100.00');
    // Largest weight (CARD) absorbs the remainder: 66.66 + 33.34.
    expect(out.find((p) => p.accountCode === 'CARD')!.amount.toFixed(2)).toBe(
      '66.67',
    );
    expect(out.find((p) => p.accountCode === 'CASH')!.amount.toFixed(2)).toBe(
      '33.33',
    );
  });

  it('returns [] for no weights (caller falls back to CASH)', () => {
    expect(proportionalSplit(D(50), [])).toEqual([]);
  });

  it('scales a partial amount across the weights', () => {
    const out = proportionalSplit(D(50), [
      { accountCode: 'CASH', amount: D(60) },
      { accountCode: 'CARD', amount: D(40) },
    ]);
    expect(out).toEqual([
      { accountCode: 'CASH', amount: D(30) },
      { accountCode: 'CARD', amount: D(20) },
    ]);
  });
});
