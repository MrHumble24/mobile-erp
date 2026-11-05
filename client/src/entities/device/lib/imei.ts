/** The one IMEI format rule: exactly 15 digits. */
export const IMEI_REGEX = /^\d{15}$/

export function isImei(value: string): boolean {
  return IMEI_REGEX.test(value)
}

/**
 * True when `code` matches any of a unit's codes: either IMEI, or its serial
 * number. Case-insensitive — the server stores serials upper-cased but the user
 * may type them in any case (the by-code lookup is case-insensitive too).
 */
export function matchesUnitCode(
  device: { imei?: string | null; imei2?: string | null; serialNumber?: string | null },
  code: string,
): boolean {
  const c = code.trim().toUpperCase()
  return (
    device.imei?.toUpperCase() === c ||
    device.imei2?.toUpperCase() === c ||
    device.serialNumber?.toUpperCase() === c
  )
}
