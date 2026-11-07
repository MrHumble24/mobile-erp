/** Maps a repair status code to its badge variant + `repairs` i18n key.
 *  The variant union is checked here, so a typo cannot reach the Badge. */
export type RepairBadgeVariant = "default" | "blue" | "emerald" | "dark" | "destructive"

const VISUALS: Record<string, { variant: RepairBadgeVariant; key: string }> = {
  RECEIVED: { variant: "default", key: "repairs.statusReceived" },
  IN_REPAIR: { variant: "blue", key: "repairs.statusInRepair" },
  READY: { variant: "emerald", key: "repairs.statusReady" },
  GIVEN_BACK: { variant: "dark", key: "repairs.statusGivenBack" },
  CANCELLED: { variant: "destructive", key: "repairs.statusCancelled" },
}

export function statusVariant(code: string): RepairBadgeVariant {
  return VISUALS[code]?.variant ?? "default"
}

export function statusI18nKey(code: string): string | undefined {
  return VISUALS[code]?.key
}
