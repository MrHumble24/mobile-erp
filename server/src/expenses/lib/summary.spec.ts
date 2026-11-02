import { pickTopCategory, previousPeriod } from './summary.lib.js';

describe('previousPeriod', () => {
  it('returns the equal-length window immediately before [from,to]', () => {
    const from = new Date('2026-02-01T00:00:00.000Z');
    const to = new Date('2026-02-28T23:59:59.999Z');
    const prev = previousPeriod(from, to);
    expect(prev.to!.getTime()).toBe(from.getTime() - 1);
    const span = to.getTime() - from.getTime();
    expect(prev.from!.getTime()).toBe(from.getTime() - span - 1);
  });

  it('returns empty bounds when the window is open', () => {
    expect(previousPeriod(undefined, new Date())).toEqual({});
    expect(previousPeriod(new Date(), undefined)).toEqual({});
  });
});

describe('pickTopCategory', () => {
  it('returns the highest-total row', () => {
    const top = pickTopCategory([
      { name: 'a', total: 10 },
      { name: 'b', total: 50 },
      { name: 'c', total: 30 },
    ]);
    expect(top?.name).toBe('b');
  });

  it('returns null for an empty breakdown', () => {
    expect(pickTopCategory([])).toBeNull();
  });
});
