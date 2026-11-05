import { isImei } from "./imei"

/** Serial number: 3-64 letters or digits, no spaces (ADR 0029, server SERIAL_REGEX). */
export const SERIAL_REGEX = /^[A-Z0-9]{3,64}$/

/** Trim + upper-case, the way the server stores it. */
export function normalizeSerial(value: string): string {
  return value.trim().toUpperCase()
}

export function isSerial(value: string): boolean {
  return SERIAL_REGEX.test(normalizeSerial(value))
}

/**
 * Classify a typed/scanned code into the one identifier field a write expects.
 * A valid IMEI goes as `imei`; anything else is sent as a (normalized)
 * `serialNumber` and the server resolves it (ADR 0029).
 */
export function codeToIdentifier(code: string): { imei: string } | { serialNumber: string } {
  const trimmed = code.trim()
  return isImei(trimmed) ? { imei: trimmed } : { serialNumber: normalizeSerial(trimmed) }
}
