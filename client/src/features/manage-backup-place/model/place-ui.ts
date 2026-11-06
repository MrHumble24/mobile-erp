import type { PlaceView } from "@/entities/backup"

export type PlaceKind = "local" | "telegram" | "oauth"

export function placeKind(place: PlaceView): PlaceKind {
  if (place.code === "LOCAL") return "local"
  if (place.code === "TELEGRAM") return "telegram"
  return "oauth"
}

/** Status lookup → badge variant + i18n key. */
export const PLACE_STATUS_BADGE: Record<
  string,
  { variant: "emerald" | "amber" | "destructive" | "mercury"; key: string }
> = {
  OK: { variant: "emerald", key: "backups.placeStatusOk" },
  NEEDS_RECONNECT: { variant: "amber", key: "backups.placeStatusNeedsReconnect" },
  ERROR: { variant: "destructive", key: "backups.placeStatusError" },
  NEVER_USED: { variant: "mercury", key: "backups.placeStatusNeverUsed" },
}
