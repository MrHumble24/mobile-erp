import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from '../dto/reset-password.dto.js';

export const RESET_PASSWORD_USAGE =
  'Set RESET_EMAIL and RESET_PASSWORD, then run pnpm reset-password.';

export type ResetPasswordInput =
  | { ok: true; email: string; password: string }
  | { ok: false; message: string };

/**
 * Reads the locked-out-owner reset values from the environment (never argv:
 * arguments leak into shell history and the process list) and applies the same
 * password rule as `ResetPasswordDto`.
 */
export function parseResetPasswordInput(env: {
  RESET_EMAIL?: string;
  RESET_PASSWORD?: string;
}): ResetPasswordInput {
  const email = env.RESET_EMAIL?.trim() ?? '';
  const password = env.RESET_PASSWORD ?? '';
  if (!email || !password) {
    return { ok: false, message: RESET_PASSWORD_USAGE };
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return {
      ok: false,
      message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`,
    };
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return {
      ok: false,
      message: `Password must be at most ${PASSWORD_MAX_LENGTH} characters.`,
    };
  }
  return { ok: true, email, password };
}
