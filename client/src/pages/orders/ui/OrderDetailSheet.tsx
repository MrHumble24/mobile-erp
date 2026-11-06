import { Calendar, CheckCircle2, FileText } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatDateTime } from "@/shared/lib/format"
import { useStorefrontOrder, OrderStatusBadge } from "@/entities/order"
import { OrderStatusActions } from "@/features/manage-storefront-order"
import { Sheet, SheetPopup, SheetHeader, SheetTitle, SheetDescription } from "@/shared/ui/sheet"
import { Skeleton } from "@/shared/ui/skeleton"
import { OrderCustomerSection } from "./detail/OrderCustomerSection"
import { OrderProductSection } from "./detail/OrderProductSection"
import { OrderFulfillmentSection } from "./detail/OrderFulfillmentSection"
import { OrderPaymentSection } from "./detail/OrderPaymentSection"
import { OrderHistorySection } from "./detail/OrderHistorySection"

export function OrderDetailSheet({
  orderId,
  open,
  onOpenChange,
}: {
  orderId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useI18n()
  const { data: order, isLoading } = useStorefrontOrder(orderId)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetPopup className="max-w-lg w-full">
        <SheetHeader>
          <div className="flex items-center justify-between gap-3">
            <SheetTitle>{t("orders.details")}</SheetTitle>
            {order && <OrderStatusBadge status={order.statusCode} />}
          </div>
          {order && (
            <SheetDescription className="font-mono text-xs">
              ID: {order.id}
            </SheetDescription>
          )}
        </SheetHeader>

        {isLoading || !order ? (
          <div className="p-4 space-y-4">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-140px)]">
            <OrderCustomerSection order={order} />
            <OrderProductSection order={order} />
            <OrderFulfillmentSection order={order} />
            <OrderPaymentSection order={order} />

            <div className="p-3 rounded-xl bg-muted border border-border text-xs flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-1 font-medium">
                <Calendar className="size-3" />
                {t("orders.createdAt")}
              </span>
              <span className="font-semibold text-foreground">
                {formatDateTime(order.createdAt)}
              </span>
            </div>

            {order.note && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
                <span className="font-semibold text-amber-800 flex items-center gap-1">
                  <FileText className="size-3.5" />
                  {t("orders.note")}
                </span>
                <p className="text-amber-900">{order.note}</p>
              </div>
            )}

            {order.saleId && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs flex items-center justify-between">
                <span className="text-emerald-800 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  {t("orders.saleLink")}
                </span>
                <span className="font-mono font-semibold text-emerald-900">
                  {order.saleId}
                </span>
              </div>
            )}

            <div className="space-y-2 pt-2 border-t border-border">
              <div className="text-xs font-semibold text-muted-foreground">
                {t("orders.actions")}
              </div>
              <OrderStatusActions order={order} />
            </div>

            <OrderHistorySection history={order.history} />
          </div>
        )}
      </SheetPopup>
    </Sheet>
  )
}
