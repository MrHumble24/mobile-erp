const moneyFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
})

/** Formats a USD amount: `$1,250`. Accepts string or number; nullish → "-". */
export function formatMoney(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "-"
  const num = typeof value === "string" ? Number(value) : value
  if (Number.isNaN(num)) return "-"
  return `$${moneyFormatter.format(num)}`
}

/** Formats an ISO date as a local `dd.mm.yyyy` string; nullish → "-". */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleDateString("uz-UZ")
}

/** Formats an ISO date-time as a local human string; nullish → "-". */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleString("uz-UZ")
}
