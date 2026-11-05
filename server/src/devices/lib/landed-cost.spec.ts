import { computeLandedCost } from './landed-cost.js';

describe('computeLandedCost', () => {
  it('sums acquisition, customs and expense', () => {
    expect(computeLandedCost(100, 20, 30)).toBe('150.00');
  });

  it('is acquisition alone when customs and expense are zero', () => {
    expect(computeLandedCost(199.99, 0, 0)).toBe('199.99');
  });

  it('keeps cents exact (no float drift)', () => {
    expect(computeLandedCost(0.1, 0.2, 0)).toBe('0.30');
    expect(computeLandedCost(10.01, 0.01, 0.01)).toBe('10.03');
  });
});
