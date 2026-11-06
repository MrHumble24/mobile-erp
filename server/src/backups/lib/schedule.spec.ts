import { isScheduleDue, todayDateOnly } from './schedule.js';

describe('isScheduleDue', () => {
  const at = (h: number, m: number) => new Date(2026, 0, 10, h, m);

  it('fires once the time is reached and it has not run today', () => {
    expect(isScheduleDue(at(3, 0), '03:00', null)).toBe(true);
    expect(isScheduleDue(at(4, 30), '03:00', null)).toBe(true);
  });

  it('does not fire before the scheduled time', () => {
    expect(isScheduleDue(at(2, 59), '03:00', null)).toBe(false);
  });

  it('does not fire twice on the same day', () => {
    const ran = todayDateOnly(at(3, 1));
    expect(isScheduleDue(at(3, 5), '03:00', ran)).toBe(false);
  });

  it('fires again the next day', () => {
    const yesterday = new Date(2026, 0, 9);
    expect(isScheduleDue(at(3, 5), '03:00', yesterday)).toBe(true);
  });
});
