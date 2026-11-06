import { CheckCircle2, Clock, MapPin, Store, AlertCircle } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { Badge } from "@/shared/ui/badge"
import type { PublicStorefrontOrderView } from "@/entities/storefront"
import type { PaymentState } from "../model/use-order-payment-status"

export function OrderStatusCard({
  order,
  paymentState,
}: {
  order: PublicStorefrontOrderView
  paymentState: PaymentState
}) {
  const { t } = useI18n()

  const isDelivery = order.fulfillmentMethod === "DELIVERY"
  const isPaid = paymentState === "PAID"
  const isOnReceipt = paymentState === "ON_RECEIPT"
  const isChecking = paymentState === "CHECKING" || paymentState === "UNPAID"
  const isTimeout = paymentState === "TIMEOUT"

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
            {t("storefront.orderId")}
          </span>
          <h2 className="font-mono font-bold text-base">#{order.id.slice(0, 8)}</h2>
        </div>
        <Badge variant={order.statusCode === "CANCELLED" ? "destructive" : "default"} className="text-xs px-2.5 py-1">
          {order.statusLabel || order.statusCode}
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border text-xs">
        <div className="flex items-center gap-2">
          {isDelivery ? <MapPin className="size-4 text-primary" /> : <Store className="size-4 text-primary" />}
          <div>
            <div className="text-muted-foreground">{t("storefront.fulfillmentMethod")}</div>
            <div className="font-semibold">
              {isDelivery ? t("storefront.delivery") : t("storefront.pickup")}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isPaid ? (
            <CheckCircle2 className="size-4 text-emerald-600" />
          ) : isTimeout ? (
            <AlertCircle className="size-4 text-amber-500" />
          ) : (
            <Clock className="size-4 text-muted-foreground" />
          )}
          <div>
            <div className="text-muted-foreground">{t("storefront.paymentStatus")}</div>
            <div className="font-semibold">
              {isPaid
                ? t("storefront.paymentStatusPaid")
                : isOnReceipt
                  ? t("storefront.paymentStatusOnReceipt")
                  : isTimeout
                    ? t("storefront.paymentStatusNotReceived")
                    : isChecking
                      ? t("storefront.paymentStatusChecking")
                      : t("storefront.paymentStatusPending")}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
