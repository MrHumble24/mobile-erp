import { ShoppingBag, Smartphone } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import { Badge } from "@/shared/ui/badge"
import type { StorefrontOrderDetailView } from "@/entities/order"

export function OrderProductSection({ order }: { order: StorefrontOrderDetailView }) {
  const { t } = useI18n()

  return (
    <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <ShoppingBag className="size-3.5" />
          {t("orders.product")}
        </div>
        {order.priceSnapshot ? (
          <span className="font-mono font-bold text-sm text-primary">
            {formatMoney(Number(order.priceSnapshot))} so&apos;m
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">{t("storefront.ask")}</span>
        )}
      </div>

      <div>
        <span className="text-xs text-muted-foreground uppercase font-semibold">
          {order.brand}
        </span>
        <div className="font-display font-bold text-lg text-foreground">
          {order.modelName || order.productName}
        </div>
      </div>

      {order.specs && Object.keys(order.specs).length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {Object.entries(order.specs).map(([key, val]) => (
            <span
              key={key}
              className="text-xs px-2.5 py-1 rounded-md bg-muted text-foreground font-medium"
            >
              {key}: {String(val)}
            </span>
          ))}
        </div>
      )}

      {order.deviceId && (
        <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
          <span className="text-muted-foreground flex items-center gap-1">
            <Smartphone className="size-3.5 text-primary" />
            {t("orders.heldDevice")}
          </span>
          <Badge variant="outline" className="font-mono text-[11px]">
            #{order.deviceId.slice(0, 8)}
          </Badge>
        </div>
      )}
    </div>
  )
}
