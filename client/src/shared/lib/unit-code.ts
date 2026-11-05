/**
 * A stock unit is identified by exactly one of an IMEI or a serial number
 * (ADR 0029). This is the single place the app turns that pair into the one
 * code to show. Structural (no entity import) so every slice — including
 * sibling entities that may not import each other — shares it.
 */
export interface UnitCodeRef {
  imei?: string | null
  serialNumber?: string | null
}

/** The code that identifies a unit for display: its IMEI, else its serial number. */
export function unitCode(unit: UnitCodeRef): string {
  return unit.imei ?? unit.serialNumber ?? ""
}
