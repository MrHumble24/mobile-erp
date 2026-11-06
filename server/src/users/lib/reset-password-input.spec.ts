import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from '../../users/dto/reset-password.dto.js';
import {
  parseResetPasswordInput,
  RESET_PASSWORD_USAGE,
} from './reset-password-input.js';

describe('parseResetPasswordInput', () => {
  it('asks for both variables when either is missing', () => {
    for (const env of [
      {},
      { RESET_EMAIL: 'owner@example.com' },
      { RESET_PASSWORD: 'long-enough' },
    ]) {
      expect(parseResetPasswordInput(env)).toEqual({
        ok: false,
        message: RESET_PASSWORD_USAGE,
      });
    }
  });

  it('rejects a password below the DTO minimum', () => {
    const result = parseResetPasswordInput({
      RESET_EMAIL: 'owner@example.com',
      RESET_PASSWORD: 'a'.repeat(PASSWORD_MIN_LENGTH - 1),
    });
    expect(result).toEqual({
      ok: false,
      message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`,
    });
  });

  it('rejects a password above the DTO maximum', () => {
    const result = parseResetPasswordInput({
      RESET_EMAIL: 'owner@example.com',
      RESET_PASSWORD: 'a'.repeat(PASSWORD_MAX_LENGTH + 1),
    });
    expect(result).toEqual({
      ok: false,
      message: `Password must be at most ${PASSWORD_MAX_LENGTH} characters.`,
    });
  });

  it('accepts the DTO boundaries and trims the email', () => {
    expect(
      parseResetPasswordInput({
        RESET_EMAIL: '  owner@example.com  ',
        RESET_PASSWORD: 'a'.repeat(PASSWORD_MIN_LENGTH),
      }),
    ).toEqual({
      ok: true,
      email: 'owner@example.com',
      password: 'a'.repeat(PASSWORD_MIN_LENGTH),
    });
    expect(
      parseResetPasswordInput({
        RESET_EMAIL: 'owner@example.com',
        RESET_PASSWORD: 'a'.repeat(PASSWORD_MAX_LENGTH),
      }).ok,
    ).toBe(true);
  });
});
