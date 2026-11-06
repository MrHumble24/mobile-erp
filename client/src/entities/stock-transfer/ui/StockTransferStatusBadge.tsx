import { Badge } from "@/shared/ui/badge"
import { useI18n } from "@/shared/i18n"

interface StockTransferStatusBadgeProps {
  status: "SENT" | "RECEIVED" | "CANCELLED" | string
  className?: string
}

export function StockTransferStatusBadge({
  status,
  className,
}: StockTransferStatusBadgeProps) {
  const { t } = useI18n()

  switch (status) {
    case "SENT":
      return (
        <Badge variant="amber" size="sm" className={className}>
          {t("transfers.statusSent")}
        </Badge>
      )
    case "RECEIVED":
      return (
        <Badge variant="mint" size="sm" className={className}>
          {t("transfers.statusReceived")}
        </Badge>
      )
    case "CANCELLED":
      return (
        <Badge variant="mercury" size="sm" className={className}>
          {t("transfers.statusCancelled")}
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
