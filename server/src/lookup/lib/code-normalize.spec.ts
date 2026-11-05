import { boxCodeKey, imeiTac } from './code-normalize.js';

describe('boxCodeKey', () => {
  it('strips the region suffix, spaces and case: mu793ll/a → MU793', () => {
    expect(boxCodeKey('mu793ll/a')).toBe('MU793');
    expect(boxCodeKey('MU793LL/A')).toBe('MU793');
    expect(boxCodeKey(' MU793 ')).toBe('MU793');
    expect(boxCodeKey('MU793')).toBe('MU793');
  });
});

describe('imeiTac', () => {
  it('returns the first 8 digits of a 15-digit IMEI', () => {
    expect(imeiTac('359824370000001')).toBe('35982437');
    expect(imeiTac('35 9824 37-000 0001')).toBe('35982437');
  });

  it('is null for anything that is not 15 digits (a box code, short, long)', () => {
    expect(imeiTac('MU793')).toBeNull();
    expect(imeiTac('35982437')).toBeNull();
    expect(imeiTac('3598243700000012345')).toBeNull();
  });
});
