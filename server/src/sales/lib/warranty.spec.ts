import { remainingWarrantyDays, warrantyEndsAt } from './warranty.js';

describe('warranty math', () => {
  const start = new Date('2026-01-01T10:00:00.000Z');

  it('ends N days after the start', () => {
    expect(warrantyEndsAt(start, 14).toISOString()).toBe(
      '2026-01-15T10:00:00.000Z',
    );
  });

  it('counts remaining days, partial day rounds up', () => {
    const ends = warrantyEndsAt(start, 14);
    const now = new Date('2026-01-14T22:00:00.000Z'); // 12h left
    expect(remainingWarrantyDays(ends, now)).toBe(1);
  });

  it('returns full days when well inside the window', () => {
    const ends = warrantyEndsAt(start, 14);
    expect(remainingWarrantyDays(ends, start)).toBe(14);
  });

  it('floors at 0 once expired', () => {
    const ends = warrantyEndsAt(start, 14);
    const now = new Date('2026-02-01T10:00:00.000Z');
    expect(remainingWarrantyDays(ends, now)).toBe(0);
  });
});
