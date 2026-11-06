import { timingSafeEqual } from 'node:crypto';

/**
 * Constant-time string equality check to prevent timing attacks.
 * Returns false immediately if lengths differ, otherwise uses timingSafeEqual.
 */
export function timingSafeEqualString(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
