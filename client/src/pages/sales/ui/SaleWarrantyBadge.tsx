import { ShieldAlert, ShieldCheck } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { warrantyRemainingDays, type SaleView } from "@/entities/sale"
import { Badge } from "@/shared/ui/badge"

/** Warranty state for a sale: returned → remaining days → expired. */
export function SaleWarrantyBadge({ sale }: { sale: SaleView }) {
  const { t } = useI18n()

  if (sale.return) {
    return <Badge variant="outline">{t("sales.returned")}</Badge>
  }
  if (!sale.warranty) {
    return <span className="text-xs text-muted-foreground">—</span>
  }
  const days = warrantyRemainingDays(sale.warranty.endsAt)
  if (days <= 0) {
    return (
      <Badge variant="outline" className="gap-1 text-muted-foreground">
        <ShieldAlert className="size-3" /> {t("sales.warrantyExpired")}
      </Badge>
    )
  }
  return (
    <Badge variant="mint" className="gap-1">
      <ShieldCheck className="size-3" /> {t("sales.daysShort", { count: days })}
    </Badge>
  )
}
