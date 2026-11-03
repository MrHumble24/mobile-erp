/** The one IMEI format rule: exactly 15 digits. */
export const IMEI_REGEX = /^\d{15}$/

export function isImei(value: string): boolean {
  return IMEI_REGEX.test(value)
}

/** True when `code` matches either of a device's IMEIs (primary or dual-SIM imei2). */
export function matchesImei(device: { imei: string; imei2?: string | null }, code: string): boolean {
  return device.imei === code || device.imei2 === code
}
