import { Badge } from "@/shared/ui/badge"
import { useI18n } from "@/shared/i18n"
import type { OrderStatusCode } from "../api/order.types"

const STATUS_VARIANTS: Record<OrderStatusCode, "blue" | "violet" | "amber" | "emerald" | "destructive"> = {
  NEW: "blue",
  CONTACTED: "violet",
  SHIPPED: "amber",
  DONE: "emerald",
  CANCELLED: "destructive",
}

const STATUS_LABELS: Record<OrderStatusCode, string> = {
  NEW: "orders.statusNew",
  CONTACTED: "orders.statusContacted",
  SHIPPED: "orders.statusShipped",
  DONE: "orders.statusDone",
  CANCELLED: "orders.statusCancelled",
}

export function OrderStatusBadge({ status }: { status: OrderStatusCode }) {
  const { t } = useI18n()
  const variant = STATUS_VARIANTS[status] || "default"
  const labelKey = STATUS_LABELS[status] || status

  return (
    <Badge variant={variant} size="sm">
      {t(labelKey)}
    </Badge>
  )
}
