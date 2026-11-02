/**
 * Categorical series colors in FIXED role order (see app/styles --chart-1..8).
 * Never cycle or reassign when a filter changes the series count; a 9th
 * category folds into "Other".
 */
export const SERIES_VARS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
  "var(--chart-7)",
  "var(--chart-8)",
] as const

export const OTHER_COLOR = "var(--color-ash)"
export const OTHER_KEY = "__other__"

/** Sequential single-hue ramp light→dark, for magnitude series (aging). */
export const SEQUENTIAL_VARS = [
  "var(--chart-seq-1)",
  "var(--chart-seq-2)",
  "var(--chart-seq-3)",
  "var(--chart-seq-4)",
] as const

export interface SeriesPoint {
  key: string
  label: string
  value: number
  share: number
}

/**
 * Keep the top `limit` rows (assumed sorted desc) and fold the tail into a
 * single non-clickable "Other" row summing value and share.
 */
export function capWithOther(
  rows: SeriesPoint[],
  limit: number,
  otherLabel: string
): SeriesPoint[] {
  if (rows.length <= limit) return rows
  const head = rows.slice(0, limit)
  const tail = rows.slice(limit)
  const other: SeriesPoint = {
    key: OTHER_KEY,
    label: otherLabel,
    value: tail.reduce((s, r) => s + r.value, 0),
    share: tail.reduce((s, r) => s + r.share, 0),
  }
  return [...head, other]
}
