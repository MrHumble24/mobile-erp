import * as React from "react"
import { Check, PhoneCall, XCircle } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { useUpdateOrderStatus, type OrderStatusCode } from "@/entities/order"
import { Button } from "@/shared/ui/button"
import { Dialog, DialogPopup, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/shared/ui/dialog"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { toast } from "@/shared/ui/sonner"

export interface OrderStatusActionsProps {
  orderId: string
  currentStatus: OrderStatusCode
  onStatusChanged?: () => void
}

export function OrderStatusActions({
  orderId,
  currentStatus,
  onStatusChanged,
}: OrderStatusActionsProps) {
  const { t } = useI18n()
  const updateStatus = useUpdateOrderStatus()
  const [doneDialogOpen, setDoneDialogOpen] = React.useState(false)
  const [saleId, setSaleId] = React.useState("")

  if (currentStatus === "DONE" || currentStatus === "CANCELLED") {
    return null
  }

  const handleSetContacted = () => {
    updateStatus.mutate(
      { id: orderId, dto: { statusCode: "CONTACTED" } },
      {
        onSuccess: () => {
          toast.success(t("orders.statusUpdated"))
          onStatusChanged?.()
        },
        onError: (err: unknown) => {
          toast.error((err as { message?: string })?.message || t("common.error"))
        },
      }
    )
  }

  const handleSetDone = () => {
    updateStatus.mutate(
      { id: orderId, dto: { statusCode: "DONE", saleId: saleId.trim() || undefined } },
      {
        onSuccess: () => {
          toast.success(t("orders.statusUpdated"))
          setDoneDialogOpen(false)
          setSaleId("")
          onStatusChanged?.()
        },
        onError: (err: unknown) => {
          toast.error((err as { message?: string })?.message || t("common.error"))
        },
      }
    )
  }

  const handleCancel = () => {
    if (!window.confirm(t("orders.confirmCancel"))) return
    updateStatus.mutate(
      { id: orderId, dto: { statusCode: "CANCELLED" } },
      {
        onSuccess: () => {
          toast.success(t("orders.statusUpdated"))
          onStatusChanged?.()
        },
        onError: (err: unknown) => {
          toast.error((err as { message?: string })?.message || t("common.error"))
        },
      }
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {currentStatus === "NEW" && (
        <Button
          size="sm"
          variant="outline"
          disabled={updateStatus.isPending}
          onClick={handleSetContacted}
          className="gap-1.5"
        >
          <PhoneCall className="size-3.5 text-violet-600" />
          <span>{t("orders.markContacted")}</span>
        </Button>
      )}

      {currentStatus === "CONTACTED" && (
        <>
          <Button
            size="sm"
            variant="default"
            disabled={updateStatus.isPending}
            onClick={() => setDoneDialogOpen(true)}
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Check className="size-3.5" />
            <span>{t("orders.markDone")}</span>
          </Button>

          <Dialog open={doneDialogOpen} onOpenChange={setDoneDialogOpen}>
            <DialogPopup className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{t("orders.markDone")}</DialogTitle>
                <DialogDescription>{t("orders.saleLink")}</DialogDescription>
              </DialogHeader>
              <div className="space-y-2 py-2">
                <Label htmlFor="sale-id-input">{t("orders.saleId")}</Label>
                <Input
                  id="sale-id-input"
                  value={saleId}
                  onChange={(e) => setSaleId(e.target.value)}
                  placeholder={t("orders.saleIdPlaceholder")}
                />
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDoneDialogOpen(false)}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  onClick={handleSetDone}
                  disabled={updateStatus.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {updateStatus.isPending ? t("common.loading") : t("orders.markDone")}
                </Button>
              </DialogFooter>
            </DialogPopup>
          </Dialog>
        </>
      )}

      <Button
        size="sm"
        variant="destructive"
        disabled={updateStatus.isPending}
        onClick={handleCancel}
        className="gap-1.5"
      >
        <XCircle className="size-3.5" />
        <span>{t("orders.cancelOrder")}</span>
      </Button>
    </div>
  )
}
