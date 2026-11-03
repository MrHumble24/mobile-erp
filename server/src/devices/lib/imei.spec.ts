import { anyImeiWhere, IMEI_REGEX } from './imei.js';

describe('IMEI_REGEX', () => {
  it('accepts exactly 15 digits and rejects anything else', () => {
    expect(IMEI_REGEX.test('123456789012345')).toBe(true);
    expect(IMEI_REGEX.test('12345678901234')).toBe(false); // 14
    expect(IMEI_REGEX.test('1234567890123456')).toBe(false); // 16
    expect(IMEI_REGEX.test('12345678901234a')).toBe(false);
  });
});

describe('anyImeiWhere', () => {
  it('matches the value against either IMEI column (dual-SIM lookup)', () => {
    expect(anyImeiWhere('123456789012345')).toEqual({
      OR: [{ imei: '123456789012345' }, { imei2: '123456789012345' }],
    });
  });
});
