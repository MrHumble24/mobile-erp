import { isPlausiblePhone } from './phone.js';

describe('isPlausiblePhone', () => {
  it('accepts valid local and international numbers', () => {
    expect(isPlausiblePhone('+998901234567')).toBe(true);
    expect(isPlausiblePhone('998901234567')).toBe(true);
    expect(isPlausiblePhone('+998 (90) 123-45-67')).toBe(true);
    expect(isPlausiblePhone('+1 555 123 4567')).toBe(true);
    expect(isPlausiblePhone('1234567')).toBe(true);
  });

  it('rejects invalid or implausible numbers', () => {
    expect(isPlausiblePhone(undefined)).toBe(false);
    expect(isPlausiblePhone('')).toBe(false);
    expect(isPlausiblePhone('123')).toBe(false); // too short
    expect(isPlausiblePhone('12345678901234567')).toBe(false); // too long (>15 digits)
    expect(isPlausiblePhone('+99890abc4567')).toBe(false); // letters
    expect(isPlausiblePhone('phone number')).toBe(false);
  });
});
