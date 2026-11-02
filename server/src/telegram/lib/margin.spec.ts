import { isBelowMargin, marginPercent } from './margin.js';

describe('marginPercent', () => {
  it('computes (salePrice − landedCost) / salePrice * 100', () => {
    expect(marginPercent(300, 200)).toBeCloseTo(33.33, 2);
  });

  it('returns 0 for a non-positive sale price', () => {
    expect(marginPercent(0, 0)).toBe(0);
  });
});

describe('isBelowMargin', () => {
  it('flags a sale under its target price', () => {
    expect(isBelowMargin(300, 200, 350, 10)).toBe(true);
  });

  it('flags a sale whose margin is under the minimum', () => {
    expect(isBelowMargin(300, 200, 250, 40)).toBe(true);
  });

  it('passes a sale at/above target with healthy margin', () => {
    expect(isBelowMargin(300, 200, 250, 10)).toBe(false);
  });

  it('ignores the target clause when targetPrice is null', () => {
    expect(isBelowMargin(300, 200, null, 10)).toBe(false);
  });
});
