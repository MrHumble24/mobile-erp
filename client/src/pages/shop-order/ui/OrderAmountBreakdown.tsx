import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import type { PublicStorefrontOrderView } from "@/entities/storefront"

export function OrderAmountBreakdown({
  order,
}: {
  order: PublicStorefrontOrderView
}) {
  const { t } = useI18n()

  const priceNum = order.priceSnapshot ? Number(order.priceSnapshot) : 0
  const feeNum = Number(order.deliveryFeeSnapshot ?? 0)
  const isDelivery = order.fulfillmentMethod === "DELIVERY"
  const total = priceNum + (isDelivery ? feeNum : 0)

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-sm">
      <h3 className="font-semibold text-sm">{t("storefront.orderDetails")}</h3>

      <div className="space-y-2 text-xs">
        <div className="flex justify-between items-center py-1">
          <span className="text-foreground font-medium">{order.productName}</span>
          <span className="font-mono">
            {order.priceSnapshot ? `${formatMoney(priceNum)} so'm` : t("storefront.ask")}
          </span>
        </div>

        {isDelivery && (
          <div className="flex justify-between items-center py-1 text-muted-foreground">
            <span>{t("storefront.deliveryFee")}</span>
            <span className="font-mono">
              {feeNum === 0 ? t("storefront.deliveryFree") : `${formatMoney(feeNum)} so'm`}
            </span>
          </div>
        )}

        {order.priceSnapshot && (
          <div className="flex justify-between items-center pt-3 border-t border-border font-bold text-sm">
            <span>{t("storefront.total")}</span>
            <span className="font-mono text-primary">{formatMoney(total)} so&apos;m</span>
          </div>
        )}
      </div>
    </div>
  )
}
