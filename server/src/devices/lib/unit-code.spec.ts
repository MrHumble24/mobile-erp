import { BadRequestException } from '@nestjs/common';
import {
  isValidSerial,
  normalizeSerial,
  resolveUnitCode,
  unitCodeWhere,
} from './unit-code.js';

describe('normalizeSerial', () => {
  it('trims and upper-cases', () => {
    expect(normalizeSerial('  abc-123 ')).toBe('ABC-123');
  });
});

describe('isValidSerial', () => {
  it('accepts 3-64 non-space chars', () => {
    expect(isValidSerial('ABC')).toBe(true);
    expect(isValidSerial('A'.repeat(64))).toBe(true);
  });
  it('rejects too short, too long, or with spaces', () => {
    expect(isValidSerial('AB')).toBe(false);
    expect(isValidSerial('A'.repeat(65))).toBe(false);
    expect(isValidSerial('AB C')).toBe(false);
  });
});

describe('unitCodeWhere', () => {
  it('tries imei, second imei, then serial (upper-cased)', () => {
    expect(unitCodeWhere('abc123')).toEqual({
      OR: [{ imei: 'abc123' }, { imei2: 'abc123' }, { serialNumber: 'ABC123' }],
    });
  });
});

describe('resolveUnitCode', () => {
  it('returns the imei as typed', () => {
    expect(resolveUnitCode({ imei: '123456789012345' })).toBe(
      '123456789012345',
    );
  });
  it('normalises a serial', () => {
    expect(resolveUnitCode({ serialNumber: ' sn-9 ' })).toBe('SN-9');
  });
  it('rejects neither present', () => {
    expect(() => resolveUnitCode({})).toThrow(BadRequestException);
  });
  it('rejects both present', () => {
    expect(() => resolveUnitCode({ imei: '1', serialNumber: 'X' })).toThrow(
      BadRequestException,
    );
  });
});
