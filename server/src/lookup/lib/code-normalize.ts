/**
 * Turns whatever was typed or scanned into a lookup key (ADR 0031).
 *
 * A code is either a 15-digit IMEI (→ its 8-digit TAC) or an Apple box code
 * (→ its 5-char base). The two never overlap: an IMEI is all digits, a box code
 * carries letters.
 */

/** The 8-digit TAC of a 15-digit IMEI, or null when the input is not one. */
export function imeiTac(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  return digits.length === 15 ? digits.slice(0, 8) : null;
}

/**
 * The 5-char base of an Apple part number, upper-cased, with the region suffix
 * and stray spaces stripped: `mu793ll/a` → `MU793`, ` MU793 ` → `MU793`. Every
 * retail box code in the lists is exactly 5 chars, so the base is the first 5
 * alphanumerics.
 */
export function boxCodeKey(raw: string): string {
  return raw
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 5);
}
