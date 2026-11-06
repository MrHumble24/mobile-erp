import * as React from "react"
import { Check, PhoneCall, Truck, XCircle, RotateCcw } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { httpErrorCode } from "@/shared/api/http"
import { useAuthStore } from "@/features/auth"
import {
  useUpdateOrderStatus,
  type StorefrontOrderDetailView,
} from "@/entities/order"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import { toast } from "@/shared/ui/sonner"
import { HandOverDialog } from "./HandOverDialog"
import { RefundPaymentDialog } from "./RefundPaymentDialog"

export interface OrderStatusActionsProps {
  order: StorefrontOrderDetailView
  onStatusChanged?: () => void
}

function useOrderStatusMutations(order: StorefrontOrderDetailView, onStatusChanged?: () => void) {
  const { t } = useI18n()
  const updateStatus = useUpdateOrderStatus()

  const handleConfirm = () => {
    updateStatus.mutate(
      { id: order.id, dto: { statusCode: "CONTACTED" } },
      {
        onSuccess: () => {
          toast.success(t("orders.statusUpdated"))
          onStatusChanged?.()
        },
        onError: (err: unknown) => {
          const code = httpErrorCode(err)
          if (code === "NO_STOCK_AVAILABLE" || code === "OUT_OF_STOCK") {
            toast.error(t("orders.noStockAvailable"))
          } else {
            toast.error((err as { message?: string })?.message || t("common.error"))
          }
        },
      },
    )
  }

  const handleShip = () => {
    updateStatus.mutate(
      { id: order.id, dto: { statusCode: "SHIPPED" } },
      {
        onSuccess: () => {
          toast.success(t("orders.statusUpdated"))
          onStatusChanged?.()
        },
        onError: (err: unknown) => {
          toast.error((err as { message?: string })?.message || t("common.error"))
        },
      },
    )
  }

  const handleCancel = () => {
    if (!window.confirm(t("orders.confirmCancel"))) return
    updateStatus.mutate(
      { id: order.id, dto: { statusCode: "CANCELLED" } },
      {
        onSuccess: () => {
          toast.success(t("orders.statusUpdated"))
          onStatusChanged?.()
        },
        onError: (err: unknown) => {
          toast.error((err as { message?: string })?.message || t("common.error"))
        },
      },
    )
  }

  return { updateStatus, handleConfirm, handleShip, handleCancel }
}

export function OrderStatusActions({ order, onStatusChanged }: OrderStatusActionsProps) {
  const { t } = useI18n()
  const hasPermission = useAuthStore((s) => s.hasPermission)
  const canManage = hasPermission("order.manage")
  const canRefund = hasPermission("payment.refund")

  const [handOverOpen, setHandOverOpen] = React.useState(false)
  const [refundOpen, setRefundOpen] = React.useState(false)

  const { updateStatus, handleConfirm, handleShip, handleCancel } =
    useOrderStatusMutations(order, onStatusChanged)

  const isRefundDue = order.payment?.statusCode === "REFUND_DUE"

  return (
    <div className="flex flex-wrap items-center gap-2">
      {canManage && order.statusCode === "NEW" && (
        <Button size="sm" variant="outline" disabled={updateStatus.isPending} onClick={handleConfirm} className="gap-1.5">
          <PhoneCall className="size-3.5 text-violet-600" />
          <span>{t("orders.confirmOrder")}</span>
        </Button>
      )}

      {canManage && order.statusCode === "CONTACTED" && order.fulfillmentMethodCode === "DELIVERY" && (
        <Button size="sm" variant="outline" disabled={updateStatus.isPending} onClick={handleShip} className="gap-1.5">
          <Truck className="size-3.5 text-amber-600" />
          <span>{t("orders.sentWithCourier")}</span>
        </Button>
      )}

      {canManage && (order.statusCode === "CONTACTED" || order.statusCode === "SHIPPED") && (
        <Button size="sm" variant="default" disabled={updateStatus.isPending} onClick={() => setHandOverOpen(true)} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
          <Check className="size-3.5" />
          <span>{t("orders.handOver")}</span>
        </Button>
      )}

      {canManage && (order.statusCode === "NEW" || order.statusCode === "CONTACTED" || order.statusCode === "SHIPPED") && (
        <Button size="sm" variant="destructive" disabled={updateStatus.isPending} onClick={handleCancel} className="gap-1.5">
          <XCircle className="size-3.5" />
          <span>{t("orders.cancelOrder")}</span>
        </Button>
      )}

      {order.statusCode === "CANCELLED" && isRefundDue && (
        <div className="flex items-center gap-2">
          <Badge variant="destructive" className="text-xs">
            {t("orders.refundOwed")}
          </Badge>
          {canRefund && order.payment && (
            <Button size="sm" variant="outline" onClick={() => setRefundOpen(true)} className="gap-1.5 text-xs">
              <RotateCcw className="size-3.5 text-destructive" />
              <span>{t("orders.markRefunded")}</span>
            </Button>
          )}
        </div>
      )}

      <HandOverDialog order={order} open={handOverOpen} onOpenChange={setHandOverOpen} onSuccess={onStatusChanged} />
      {order.payment && (
        <RefundPaymentDialog paymentId={order.payment.id} open={refundOpen} onOpenChange={setRefundOpen} onSuccess={onStatusChanged} />
      )}
    </div>
  )
}
