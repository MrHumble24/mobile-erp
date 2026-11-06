import { CreditCard, Banknote } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import { Badge } from "@/shared/ui/badge"
import type { StorefrontOrderDetailView } from "@/entities/order"

export function OrderPaymentSection({ order }: { order: StorefrontOrderDetailView }) {
  const { t } = useI18n()
  const payment = order.payment
  const isOnline = order.paymentMethodCode === "ONLINE"

  return (
    <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          {isOnline ? <CreditCard className="size-3.5" /> : <Banknote className="size-3.5" />}
          {t("storefront.paymentMethod")}
        </div>
        {payment && (
          <Badge
            variant={
              payment.statusCode === "PAID"
                ? "emerald"
                : payment.statusCode === "REFUND_DUE"
                  ? "destructive"
                  : "outline"
            }
            className="text-[10px]"
          >
            {payment.statusLabel || payment.statusCode}
          </Badge>
        )}
      </div>

      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">{t("storefront.method")}</span>
          <span className="font-semibold">
            {isOnline
              ? t("storefront.payWithProvider", { provider: payment?.providerLabel || payment?.providerCode || "Online" })
              : t("storefront.payOnReceipt")}
          </span>
        </div>

        {payment && (
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">{t("storefront.amount")}</span>
            <span className="font-mono font-medium">{formatMoney(Number(payment.amount))} so&apos;m</span>
          </div>
        )}
      </div>
    </div>
  )
}
