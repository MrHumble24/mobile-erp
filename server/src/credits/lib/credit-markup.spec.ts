import { Prisma } from '../../generated/client/client.js';
import { distributeMarkup } from './credit-markup.js';

const D = (n: number | string) => new Prisma.Decimal(n);
const cents = (d: Prisma.Decimal) => Math.round(d.mul(100).toNumber());

describe('distributeMarkup', () => {
  it('returns no shares for an empty cart', () => {
    expect(distributeMarkup([], D(50))).toEqual([]);
  });

  it('returns all-zero shares when the margin is zero', () => {
    const shares = distributeMarkup([D(100), D(250)], D(0));
    expect(shares.map((s) => s.toFixed(2))).toEqual(['0.00', '0.00']);
  });

  it('puts a whole margin on a single line', () => {
    const shares = distributeMarkup([D(300)], D(30));
    expect(shares.map((s) => s.toFixed(2))).toEqual(['30.00']);
  });

  it('splits proportionally and sums to the margin exactly', () => {
    const shares = distributeMarkup([D(100), D(200), D(700)], D(33.33));
    expect(shares.reduce((s, x) => s + cents(x), 0)).toBe(3333);
  });

  it('puts the rounding remainder on the last line (cent-exact)', () => {
    // 10.00 over three equal lines: 3.33 + 3.33 + 3.34 = 10.00
    const shares = distributeMarkup([D(100), D(100), D(100)], D(10));
    expect(shares.map((s) => s.toFixed(2))).toEqual([
      '3.33',
      '3.33',
      '3.34',
    ]);
  });

  it('never produces a negative share', () => {
    const shares = distributeMarkup([D(0), D(0), D(100)], D(5));
    for (const s of shares) expect(cents(s)).toBeGreaterThanOrEqual(0);
    expect(shares.reduce((s, x) => s + cents(x), 0)).toBe(500);
  });
});
