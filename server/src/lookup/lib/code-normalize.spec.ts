import {
  appleModelNumber,
  boxCodeKey,
  imeiTac,
  samsungModelCodeKey,
} from './code-normalize.js';

describe('appleModelNumber', () => {
  it('matches A followed by 4 digits, upper-cased', () => {
    expect(appleModelNumber('a3473')).toBe('A3473');
    expect(appleModelNumber(' A3716 ')).toBe('A3716');
    expect(appleModelNumber('A3718')).toBe('A3718');
  });

  it('returns null for non-A numbers', () => {
    expect(appleModelNumber('MU793')).toBeNull();
    expect(appleModelNumber('A12')).toBeNull();
    expect(appleModelNumber('A12345')).toBeNull();
    expect(appleModelNumber('SM-S918B')).toBeNull();
  });
});

describe('samsungModelCodeKey', () => {
  it('normalizes Samsung model codes, uppercase, stripping suffixes', () => {
    expect(samsungModelCodeKey('sm-s918b/ds')).toBe('SM-S918B');
    expect(samsungModelCodeKey('SM-S918B')).toBe('SM-S918B');
    expect(samsungModelCodeKey('sms918b')).toBe('SM-S918B');
    expect(samsungModelCodeKey('sc-02k')).toBe('SC-02K');
  });
});

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
