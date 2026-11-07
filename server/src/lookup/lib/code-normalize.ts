/**
 * Turns whatever was typed or scanned into a lookup key (ADR 0031).
 *
 * A code is:
 * - A 15-digit IMEI (→ its 8-digit TAC)
 * - An Apple hardware model number (e.g. `A3473` → `A3473`)
 * - A Samsung model code (e.g. `SM-S918B` → `SM-S918B`)
 * - An Apple box code (→ its 5-char base, e.g. `MU793`)
 */

/** The 8-digit TAC of a 15-digit IMEI, or null when the input is not one. */
export function imeiTac(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  return digits.length === 15 ? digits.slice(0, 8) : null;
}

/** Apple hardware model number (A-number), e.g. `A3473`, `a3716` → `A3473`. */
export function appleModelNumber(raw: string): string | null {
  const cleaned = raw.replace(/\s+/g, '').toUpperCase();
  return /^A\d{4}$/.test(cleaned) ? cleaned : null;
}

/**
 * Normalises a Samsung model code: uppercase, strip trailing slashes/suffixes
 * (e.g. `SM-S918B/DS` → `SM-S918B`), ensure `SM-` dash when user typed `SMS918B`.
 */
export function samsungModelCodeKey(raw: string): string {
  const cleaned = raw.trim().toUpperCase().replace(/\/.*$/, '');
  return cleaned.replace(/^SM(?=[A-Z0-9])/i, 'SM-');
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
