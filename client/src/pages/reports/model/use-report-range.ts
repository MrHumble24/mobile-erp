import * as React from "react"
import { useSearchParams } from "react-router"
import type { TrendBucket } from "@/entities/report"

export const RANGE_PRESETS = [
  "today",
  "7d",
  "30d",
  "month",
  "lastMonth",
  "custom",
] as const
export type RangePreset = (typeof RANGE_PRESETS)[number]

const iso = (d: Date): string => d.toISOString().slice(0, 10)

/** yyyy-mm-dd bounds for a preset (custom reads explicit from/to). */
function presetDates(
  preset: RangePreset,
  from: string,
  to: string
): { fromDate: string; toDate: string } {
  if (preset === "custom") return { fromDate: from, toDate: to }
  const now = new Date()
  const start = new Date(now)
  if (preset === "today") {
    return { fromDate: iso(now), toDate: iso(now) }
  }
  if (preset === "7d") start.setDate(now.getDate() - 6)
  else if (preset === "30d") start.setDate(now.getDate() - 29)
  else if (preset === "month") start.setDate(1)
  else {
    start.setMonth(now.getMonth() - 1, 1)
    const end = new Date(now.getFullYear(), now.getMonth(), 0)
    return { fromDate: iso(start), toDate: iso(end) }
  }
  return { fromDate: iso(start), toDate: iso(now) }
}

function bucketFor(fromDate: string, toDate: string): TrendBucket {
  const days =
    (new Date(toDate).getTime() - new Date(fromDate).getTime()) / 86_400_000 + 1
  if (days <= 31) return "day"
  if (days <= 180) return "week"
  return "month"
}

export interface ReportRange {
  preset: RangePreset
  fromDate: string
  toDate: string
  from: string
  to: string
  bucket: TrendBucket
  setPreset: (p: RangePreset) => void
  setFromDate: (d: string) => void
  setToDate: (d: string) => void
}

/** Shareable date-range filter stored in URL search params. */
export function useReportRange(): ReportRange {
  const [params, setParams] = useSearchParams()
  const preset = (params.get("preset") as RangePreset | null) ?? "30d"
  const urlFrom = params.get("from") ?? ""
  const urlTo = params.get("to") ?? ""
  const { fromDate, toDate } = presetDates(preset, urlFrom, urlTo)

  const patch = React.useCallback(
    (next: Record<string, string | null>) => {
      setParams(
        (prev) => {
          const p = new URLSearchParams(prev)
          for (const [k, v] of Object.entries(next)) {
            if (v === null || v === "") p.delete(k)
            else p.set(k, v)
          }
          return p
        },
        { replace: true }
      )
    },
    [setParams]
  )

  return {
    preset,
    fromDate,
    toDate,
    from: fromDate ? `${fromDate}T00:00:00.000Z` : "",
    to: toDate ? `${toDate}T23:59:59.999Z` : "",
    bucket: bucketFor(fromDate || toDate, toDate || fromDate),
    setPreset: (p) =>
      patch(p === "custom" ? { preset: p } : { preset: p, from: null, to: null }),
    setFromDate: (d) => patch({ preset: "custom", from: d }),
    setToDate: (d) => patch({ preset: "custom", to: d }),
  }
}
