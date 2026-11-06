import { useI18n } from "@/shared/i18n"
import { formatNumber } from "@/shared/lib/format"

/** A customer's points next to their name; null balance (bonus off) renders nothing. */
export function CustomerPoints({ points }: { points: string | null }) {
  const { t } = useI18n()
  if (points === null) return null
  return (
    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
      {t("customers.bonusPickerPoints", { points: formatNumber(points) })}
    </span>
  )
}
