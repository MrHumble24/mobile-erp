import { nextDueDate } from './recurrence.lib.js';

describe('nextDueDate', () => {
  it('adds 7 days for weekly', () => {
    const next = nextDueDate(new Date(2026, 0, 10), 'weekly');
    expect(next.getMonth()).toBe(0);
    expect(next.getDate()).toBe(17);
  });

  it('adds one month keeping the day for monthly', () => {
    const next = nextDueDate(new Date(2026, 0, 10), 'monthly');
    expect(next.getMonth()).toBe(1); // February
    expect(next.getDate()).toBe(10);
  });

  it('clamps a month-end day to the shorter target month', () => {
    const next = nextDueDate(new Date(2026, 0, 31), 'monthly');
    expect(next.getMonth()).toBe(1); // February
    expect(next.getDate()).toBe(28); // 2026 is not a leap year
  });
});
