import { BadRequestException } from '@nestjs/common';
import { signedManualAmount } from './signed-amount.js';

describe('signedManualAmount', () => {
  it('leaves a deposit positive', () => {
    expect(signedManualAmount('DEPOSIT', 100)).toBe(100);
  });

  it('flips a withdrawal negative (client sends a positive magnitude)', () => {
    expect(signedManualAmount('WITHDRAWAL', 100)).toBe(-100);
  });

  it('passes a signed opening / correction through', () => {
    expect(signedManualAmount('OPENING', 500)).toBe(500);
    expect(signedManualAmount('OPENING', -500)).toBe(-500);
    expect(signedManualAmount('CORRECTION', -42, 'miscount')).toBe(-42);
  });

  it('rejects a zero amount for any type', () => {
    expect(() => signedManualAmount('DEPOSIT', 0)).toThrow(BadRequestException);
    expect(() => signedManualAmount('OPENING', 0)).toThrow(BadRequestException);
  });

  it('rejects a negative magnitude for deposit / withdrawal', () => {
    expect(() => signedManualAmount('DEPOSIT', -5)).toThrow(
      BadRequestException,
    );
    expect(() => signedManualAmount('WITHDRAWAL', -5)).toThrow(
      BadRequestException,
    );
  });

  it('rejects a correction without a note', () => {
    expect(() => signedManualAmount('CORRECTION', -42)).toThrow(
      BadRequestException,
    );
    expect(() => signedManualAmount('CORRECTION', -42, '   ')).toThrow(
      BadRequestException,
    );
  });
});
