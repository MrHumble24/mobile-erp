import { useI18n } from "@/shared/i18n"
import { Badge } from "@/shared/ui/badge"

export function ShipmentProgressBadge({
  received,
  expected,
}: {
  received: number
  expected: number
}) {
  const { t } = useI18n()
  const complete = received >= expected
  return (
    <Badge variant={complete ? "mint" : "outline"} size="sm">
      {received} / {expected} · {complete ? t("shipments.statusComplete") : t("shipments.statusOpen")}
    </Badge>
  )
}
