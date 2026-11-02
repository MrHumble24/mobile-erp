import { Badge } from "@/shared/ui/badge"
import { useI18n } from "@/shared/i18n"
import type { DeviceStatus } from "../model/device.types"

interface DeviceStatusBadgeProps {
  status: DeviceStatus | string
  className?: string
}

export function DeviceStatusBadge({ status, className }: DeviceStatusBadgeProps) {
  const { t } = useI18n()

  switch (status) {
    case "IN_STOCK":
      return (
        <Badge variant="mint" size="sm" className={className}>
          {t("inventory.statusInStock")}
        </Badge>
      )
    case "DEFECTIVE":
      return (
        <Badge variant="destructive" size="sm" className={className}>
          {t("inventory.statusDefective")}
        </Badge>
      )
    case "CONSIGNED":
      return (
        <Badge variant="blue" size="sm" className={className}>
          {t("inventory.statusConsigned")}
        </Badge>
      )
    case "SOLD":
      return (
        <Badge variant="outline" size="sm" className={className}>
          {t("inventory.statusSold")}
        </Badge>
      )
    default:
      return (
        <Badge variant="default" size="sm" className={className}>
          {status}
        </Badge>
      )
  }
}
