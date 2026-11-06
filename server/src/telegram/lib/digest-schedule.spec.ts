import { shouldSendDigest, todayMarker } from './digest-schedule.js';

// Local 2026-11-01 20:00.
const now = new Date(2026, 10, 1, 20, 0, 0);

describe('shouldSendDigest', () => {
  it('fires at the closing minute when no digest went out today', () => {
    expect(shouldSendDigest(now, '20:00', null)).toBe(true);
  });

  it('does not fire twice on the same day', () => {
    expect(shouldSendDigest(now, '20:00', todayMarker(now))).toBe(false);
  });

  it('does not fire outside the closing minute', () => {
    expect(shouldSendDigest(now, '21:00', null)).toBe(false);
  });

  it('fires again once the marker is a previous day', () => {
    const yesterday = new Date(Date.UTC(2026, 9, 31));
    expect(shouldSendDigest(now, '20:00', yesterday)).toBe(true);
  });

  it('respects specific company timezone (Tashkent +5)', () => {
    // 15:00 UTC = 20:00 in Asia/Tashkent
    const utcNow = new Date('2026-11-01T15:00:00.000Z');
    expect(shouldSendDigest(utcNow, '20:00', null, 'Asia/Tashkent')).toBe(true);
    expect(shouldSendDigest(utcNow, '15:00', null, 'Asia/Tashkent')).toBe(
      false,
    );

    const marker = todayMarker(utcNow, 'Asia/Tashkent');
    expect(shouldSendDigest(utcNow, '20:00', marker, 'Asia/Tashkent')).toBe(
      false,
    );
  });
});
