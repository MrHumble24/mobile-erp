import { Phone, User } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import type { StorefrontOrderDetailView } from "@/entities/order"

export function OrderCustomerSection({ order }: { order: StorefrontOrderDetailView }) {
  const { t } = useI18n()

  return (
    <div className="p-4 rounded-2xl bg-muted border border-border space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <User className="size-3.5" />
          {t("orders.customer")}
        </span>
        <a
          href={`tel:${order.customerPhone}`}
          className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-emerald-600 hover:underline"
        >
          <Phone className="size-3.5" />
          {order.customerPhone}
        </a>
      </div>
      <div className="font-display font-bold text-base text-foreground">
        {order.customerName}
      </div>
    </div>
  )
}
