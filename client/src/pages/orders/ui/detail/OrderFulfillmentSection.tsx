import { MapPin, Store } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import type { StorefrontOrderDetailView } from "@/entities/order"

export function OrderFulfillmentSection({ order }: { order: StorefrontOrderDetailView }) {
  const { t } = useI18n()
  const isDelivery = order.fulfillmentMethodCode === "DELIVERY"
  const feeNum = Number(order.deliveryFeeSnapshot ?? 0)

  return (
    <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
        {isDelivery ? <MapPin className="size-3.5" /> : <Store className="size-3.5" />}
        {t("storefront.fulfillmentMethod")}
      </div>

      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">{t("storefront.method")}</span>
          <span className="font-semibold">
            {isDelivery ? t("storefront.delivery") : t("storefront.pickup")}
          </span>
        </div>

        {isDelivery ? (
          <>
            <div className="flex justify-between items-start">
              <span className="text-muted-foreground">{t("storefront.deliveryAddress")}</span>
              <span className="font-medium text-right max-w-[200px]">{order.address || "—"}</span>
            </div>
            {order.deliveryZoneName && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">{t("storefront.deliveryZone")}</span>
                <span className="font-medium">{order.deliveryZoneName}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{t("storefront.deliveryFee")}</span>
              <span className="font-mono font-medium">
                {feeNum === 0 ? t("storefront.deliveryFree") : `${formatMoney(feeNum)} so'm`}
              </span>
            </div>
          </>
        ) : (
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">{t("orders.branch")}</span>
            <span className="font-semibold">{order.storeName}</span>
          </div>
        )}
      </div>
    </div>
  )
}
