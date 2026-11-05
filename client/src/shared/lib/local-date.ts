/** yyyy-mm-dd of `d` in the user's timezone. */
export function localIsoDate(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/** Today's local calendar day. */
export function todayIso(now: Date = new Date()): string {
  return localIsoDate(now)
}

/** UTC instant of 00:00:00.000 on the given local day. */
export function localDayStart(date: string): string | undefined {
  return date ? new Date(`${date}T00:00:00`).toISOString() : undefined
}

/** UTC instant of 23:59:59.999 on the given local day. */
export function localDayEnd(date: string): string | undefined {
  return date ? new Date(`${date}T23:59:59.999`).toISOString() : undefined
}
