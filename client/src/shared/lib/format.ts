export interface MoneyFormatOptions {
  code: string
  sign: string
  signPosition: "before" | "after"
  decimals: number
}

let activeCurrency: MoneyFormatOptions = {
  code: "USD",
  sign: "$",
  signPosition: "before",
  decimals: 2,
}

export function setCurrencyConfig(config: Partial<MoneyFormatOptions>): void {
  activeCurrency = {
    ...activeCurrency,
    ...config,
  }
}

export function getCurrencyConfig(): MoneyFormatOptions {
  return activeCurrency
}

const countFormatter = new Intl.NumberFormat("en-US")

/**
 * Formats a money amount using dynamic company currency:
 * `$1,250` or `$1,250.50` or `1,250 so'm`. One line, tabular, never shortened (ADR 0048).
 * Accepts string or number; nullish → "-".
 */
export function formatMoney(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "-"
  const num = typeof value === "string" ? Number(value) : value
  if (Number.isNaN(num)) return "-"

  const decimals = activeCurrency.decimals
  const hasCents = decimals > 0 && Math.abs(num % 1) >= 0.005
  const isNegative = num < 0

  const formattedAbs = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: hasCents ? decimals : 0,
    maximumFractionDigits: decimals,
  }).format(Math.abs(num))

  const signPrefix = isNegative ? "-" : ""

  if (activeCurrency.signPosition === "after") {
    return `${signPrefix}${formattedAbs} ${activeCurrency.sign}`
  }
  return `${signPrefix}${activeCurrency.sign}${formattedAbs}`
}

/** Formats a plain number with thousand separators: `1,250`. Accepts string or number; nullish → "-". */
export function formatNumber(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "-"
  const num = typeof value === "string" ? Number(value) : value
  if (Number.isNaN(num)) return "-"
  return countFormatter.format(num)
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
