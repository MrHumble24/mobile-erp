import * as React from "react"
import type { StatsRange } from "@/entities/qc"

export const STATS_PRESETS = ["today", "7d", "30d", "custom"] as const
export type StatsPreset = (typeof STATS_PRESETS)[number]

function startOfToday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function daysAgo(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d
}

function presetRange(preset: StatsPreset): StatsRange {
  switch (preset) {
    case "today":
      return { from: startOfToday().toISOString() }
    case "7d":
      return { from: daysAgo(7).toISOString() }
    case "30d":
      return { from: daysAgo(30).toISOString() }
    default:
      return {}
  }
}

/** Date-range state for the stats tab: presets plus a custom from/to. */
export function useStatsRange() {
  const [preset, setPreset] = React.useState<StatsPreset>("30d")
  const [customFrom, setCustomFrom] = React.useState("")
  const [customTo, setCustomTo] = React.useState("")

  const range: StatsRange = React.useMemo(() => {
    if (preset !== "custom") return presetRange(preset)
    return {
      from: customFrom ? new Date(customFrom).toISOString() : undefined,
      to: customTo ? new Date(customTo).toISOString() : undefined,
    }
  }, [preset, customFrom, customTo])

  return { preset, setPreset, customFrom, setCustomFrom, customTo, setCustomTo, range }
}
