import {
  getLocalDateString,
  getLocalHhMm,
  startOfLocalDay,
} from './time-zone.js';

describe('time-zone utils', () => {
  it('formats local date string correctly for Tashkent (+5)', () => {
    // 2026-11-05 20:00:00 UTC is 2026-11-06 01:00:00 in Tashkent
    const date = new Date('2026-11-05T20:00:00.000Z');
    expect(getLocalDateString(date, 'Asia/Tashkent')).toBe('2026-11-06');
  });

  it('formats local HH:mm correctly for Tashkent', () => {
    const date = new Date('2026-11-05T14:30:00.000Z');
    expect(getLocalHhMm(date, 'Asia/Tashkent')).toBe('19:30');
  });

  it('computes exact UTC start of local day for Tashkent (+5)', () => {
    // Midnight of 2026-11-06 in Tashkent is 2026-11-05T19:00:00.000Z
    const start = startOfLocalDay('2026-11-06', 'Asia/Tashkent');
    expect(start.toISOString()).toBe('2026-11-05T19:00:00.000Z');
  });
});
