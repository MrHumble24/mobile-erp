import { normalizeUzPhone } from './customer-phone.js';

describe('normalizeUzPhone', () => {
  it('canonicalizes spaced +998 input', () => {
    expect(normalizeUzPhone('+998 90 123 45 67')).toBe('+998901234567');
  });

  it('prefixes bare 9 national digits', () => {
    expect(normalizeUzPhone('901234567')).toBe('+998901234567');
  });

  it('adds the plus to a leading 998', () => {
    expect(normalizeUzPhone('998901234567')).toBe('+998901234567');
  });

  it('strips dashes and parentheses', () => {
    expect(normalizeUzPhone('(90) 123-45-67')).toBe('+998901234567');
  });

  it('returns undefined for empty or whitespace', () => {
    expect(normalizeUzPhone(undefined)).toBeUndefined();
    expect(normalizeUzPhone('   ')).toBeUndefined();
  });

  it('keeps unrecognized input trimmed', () => {
    expect(normalizeUzPhone('  +1 202 555 0100 ')).toBe('+1 202 555 0100');
  });
});
