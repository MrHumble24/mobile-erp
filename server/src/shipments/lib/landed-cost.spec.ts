import { computeLandedCost } from './landed-cost.js';

describe('computeLandedCost', () => {
  it('spreads overhead evenly', () => {
    expect(computeLandedCost(100, 30, 3)).toBe('110.00');
  });

  it('rounds the per-unit share half-up to 2 decimals', () => {
    // 100 / 3 = 33.333... -> 33.33
    expect(computeLandedCost(0, 100, 3)).toBe('33.33');
    // 10 / 4 = 2.50 exact
    expect(computeLandedCost(1, 10, 4)).toBe('3.50');
    // 5 / 2 = 2.50 -> half-up keeps .50, add to 0 -> 2.50
    expect(computeLandedCost(0, 5, 2)).toBe('2.50');
    // half-up boundary: 1 cent / 2 = 0.5 cent -> rounds up to 1 cent
    expect(computeLandedCost(0, 0.01, 2)).toBe('0.01');
  });

  it('returns acquisition cost unchanged when there are no devices', () => {
    expect(computeLandedCost(250.5, 999, 0)).toBe('250.50');
  });

  it('adds acquisition and share without float drift', () => {
    expect(computeLandedCost(199.99, 10, 3)).toBe('203.32');
  });
});
