import { Phone, Calendar, User, ShoppingBag, MapPin, FileText, CheckCircle2 } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatDateTime } from "@/shared/lib/format"
import { useAuthStore } from "@/features/auth"
import { useStorefrontOrder, OrderStatusBadge } from "@/entities/order"
import { OrderStatusActions } from "@/features/manage-storefront-order"
import { Sheet, SheetPopup, SheetHeader, SheetTitle, SheetDescription } from "@/shared/ui/sheet"
import { Skeleton } from "@/shared/ui/skeleton"

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
  const hasPermission = useAuthStore((s) => s.hasPermission)
  const canManage = hasPermission("order.manage")

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
          <div className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-140px)]">
            {/* Customer Section */}
            <div className="p-4 rounded-2xl bg-[#f8f9fa] border border-[#e8e8e8] space-y-2">
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

            {/* Product Section */}
            <div className="p-4 rounded-2xl bg-white border border-[#e8e8e8] space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <ShoppingBag className="size-3.5" />
                {t("orders.product")}
              </div>
              <div>
                <span className="text-xs text-muted-foreground uppercase font-semibold">
                  {order.brand}
                </span>
                <div className="font-display font-bold text-lg text-foreground">
                  {order.modelName}
                </div>
              </div>
              {order.specs && Object.keys(order.specs).length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {Object.entries(order.specs).map(([key, val]) => (
                    <span
                      key={key}
                      className="text-xs px-2.5 py-1 rounded-md bg-[#f4f4f5] text-[#3f3f46] font-medium"
                    >
                      {key}: {val}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Store & Timestamps */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#f8f9fa] border border-[#e8e8e8] space-y-1">
                <span className="text-muted-foreground flex items-center gap-1 font-medium">
                  <MapPin className="size-3" />
                  {t("orders.branch")}
                </span>
                <div className="font-semibold text-foreground">{order.storeName}</div>
              </div>

              <div className="p-3 rounded-xl bg-[#f8f9fa] border border-[#e8e8e8] space-y-1">
                <span className="text-muted-foreground flex items-center gap-1 font-medium">
                  <Calendar className="size-3" />
                  {t("orders.createdAt")}
                </span>
                <div className="font-semibold text-foreground">
                  {formatDateTime(order.createdAt)}
                </div>
              </div>
            </div>

            {/* Note if any */}
            {order.note && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
                <span className="font-semibold text-amber-800 flex items-center gap-1">
                  <FileText className="size-3.5" />
                  {t("orders.note")}
                </span>
                <p className="text-amber-900">{order.note}</p>
              </div>
            )}

            {/* Linked Sale */}
            {order.saleId && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs flex items-center justify-between">
                <span className="text-emerald-800 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  {t("orders.saleLink")}
                </span>
                <span className="font-mono font-semibold text-emerald-900">
                  {order.saleId}
                </span>
              </div>
            )}

            {/* Actions for order.manage */}
            {canManage && (
              <div className="space-y-2 pt-2 border-t border-[#f0f0f0]">
                <div className="text-xs font-semibold text-muted-foreground">
                  {t("orders.actions")}
                </div>
                <OrderStatusActions
                  orderId={order.id}
                  currentStatus={order.statusCode}
                />
              </div>
            )}

            {/* Status History Timeline */}
            {order.history && order.history.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-[#f0f0f0]">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("orders.history")}
                </div>
                <div className="space-y-2">
                  {order.history.map((h) => (
                    <div
                      key={h.id}
                      className="text-xs p-2.5 rounded-xl bg-[#f8f9fa] border border-[#f0f0f0] space-y-1"
                    >
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="font-medium text-foreground">
                          {h.fromStatusCode ? `${h.fromStatusCode} → ` : ""}
                          <span className="font-bold">{h.toStatusCode}</span>
                        </span>
                        <span className="text-[11px]">{formatDateTime(h.changedAt)}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {t("orders.handledBy")}: {h.changedByName || h.changedById}
                        {h.note && ` (${h.note})`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </SheetPopup>
    </Sheet>
  )
}
