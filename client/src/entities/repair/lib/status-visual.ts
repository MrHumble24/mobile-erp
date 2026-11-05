/** Maps a repair status code to its badge variant + `repairs` i18n key. */
const VISUALS: Record<string, { variant: string; key: string }> = {
  RECEIVED: { variant: "default", key: "repairs.statusReceived" },
  IN_REPAIR: { variant: "blue", key: "repairs.statusInRepair" },
  READY: { variant: "emerald", key: "repairs.statusReady" },
  GIVEN_BACK: { variant: "dark", key: "repairs.statusGivenBack" },
  CANCELLED: { variant: "destructive", key: "repairs.statusCancelled" },
}

export function statusVariant(code: string): string {
  return VISUALS[code]?.variant ?? "default"
}

export function statusI18nKey(code: string): string | undefined {
  return VISUALS[code]?.key
}
