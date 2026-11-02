import { ShieldAlert, ShieldCheck } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { warrantyRemainingDays } from "@/entities/sale"
import type { CustomerSaleView } from "@/entities/customer"
import { Badge } from "@/shared/ui/badge"

/** Warranty state for a purchase-history row: returned → remaining days → expired. */
export function CustomerWarrantyBadge({ sale }: { sale: CustomerSaleView }) {
  const { t } = useI18n()

  if (sale.return) {
    return <Badge variant="outline">{t("customers.returned")}</Badge>
  }
  if (!sale.warranty) {
    return <span className="text-xs text-muted-foreground">—</span>
  }
  const days = warrantyRemainingDays(sale.warranty.endsAt)
  if (days <= 0) {
    return (
      <Badge variant="outline" className="gap-1 text-muted-foreground">
        <ShieldAlert className="size-3" /> {t("customers.warrantyExpired")}
      </Badge>
    )
  }
  return (
    <Badge variant="mint" className="gap-1">
      <ShieldCheck className="size-3" /> {t("customers.daysLeft", { count: days })}
    </Badge>
  )
}
