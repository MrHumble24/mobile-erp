import { localIsoDate } from "./local-date.ts"

export const RANGE_PRESETS = [
  "today",
  "7d",
  "30d",
  "month",
  "lastMonth",
  "custom",
] as const
export type RangePreset = (typeof RANGE_PRESETS)[number]

/**
 * yyyy-mm-dd bounds for a preset. `custom` passes `from`/`to` through unchanged.
 * Stack-level helper — carries no business meaning, shared by any date filter.
 */
export function presetDates(
  preset: RangePreset,
  from: string,
  to: string,
  now: Date = new Date()
): { fromDate: string; toDate: string } {
  if (preset === "custom") return { fromDate: from, toDate: to }
  const start = new Date(now)
  if (preset === "today") {
    return { fromDate: localIsoDate(now), toDate: localIsoDate(now) }
  }
  if (preset === "7d") start.setDate(now.getDate() - 6)
  else if (preset === "30d") start.setDate(now.getDate() - 29)
  else if (preset === "month") start.setDate(1)
  else {
    start.setMonth(now.getMonth() - 1, 1)
    const end = new Date(now.getFullYear(), now.getMonth(), 0)
    return { fromDate: localIsoDate(start), toDate: localIsoDate(end) }
  }
  return { fromDate: localIsoDate(start), toDate: localIsoDate(now) }
}
