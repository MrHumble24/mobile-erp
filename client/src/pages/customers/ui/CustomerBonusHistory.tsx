import { useI18n } from "@/shared/i18n"
import { formatDate, formatNumber } from "@/shared/lib/format"
import type { BonusHistoryRow } from "@/entities/bonus"
import { Badge } from "@/shared/ui/badge"

const TYPE_KEYS: Record<string, string> = {
  EARN: "customers.bonusTypeEarn",
  SPEND: "customers.bonusTypeSpend",
  RETURN: "customers.bonusTypeReturn",
  CORRECTION: "customers.bonusTypeCorrection",
}

function typeLabel(typeCode: string, t: (key: string) => string): string {
  const key = TYPE_KEYS[typeCode]
  return key ? t(key) : typeCode
}

function signedPoints(amount: string): string {
  const value = Number(amount)
  if (Number.isNaN(value)) return amount
  return `${value > 0 ? "+" : ""}${formatNumber(amount)}`
}

/** The points ledger rows: date, type, signed amount, note and who posted it. */
export function CustomerBonusHistory({ history }: { history: BonusHistoryRow[] }) {
  const { t } = useI18n()

  if (history.length === 0) {
    return <p className="text-xs text-muted-foreground">{t("customers.bonusEmptyHistory")}</p>
  }

  return (
    <ul className="divide-y divide-border rounded-[12px] border border-border">
      {history.map((row) => (
        <li key={row.id} className="flex items-start justify-between gap-3 p-2.5">
          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" size="sm">
                {typeLabel(row.typeCode, t)}
              </Badge>
              <span className="text-[11px] text-muted-foreground">
                {formatDate(row.occurredAt)}
              </span>
            </div>
            {row.note && (
              <p className="text-xs text-muted-foreground break-words">{row.note}</p>
            )}
            {row.createdBy && (
              <p className="text-[11px] text-muted-foreground">
                {t("customers.bonusBy")}: {row.createdBy.name}
              </p>
            )}
          </div>
          <span
            className={`shrink-0 text-sm font-semibold tabular-nums ${
              Number(row.amount) > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
            }`}
          >
            {signedPoints(row.amount)}
          </span>
        </li>
      ))}
    </ul>
  )
}
