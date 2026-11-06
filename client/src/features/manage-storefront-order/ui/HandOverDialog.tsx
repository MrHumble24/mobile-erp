import * as React from "react"
import { CheckCircle2 } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import { httpErrorCode } from "@/shared/api/http"
import {
  useHandOverOrder,
  type StorefrontOrderDetailView,
  type HandOverPaymentItem,
} from "@/entities/order"
import {
  PaymentMethodField,
  splitRemaining,
  AccountSelect,
  type PaymentMethod,
  type PaymentPart,
} from "@/entities/ledger"
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Label } from "@/shared/ui/label"
import { toast } from "@/shared/ui/sonner"

function buildHandOverPayments(
  method: PaymentMethod,
  parts: PaymentPart[],
  price: number,
): HandOverPaymentItem[] {
  if (method === "cash") return [{ accountCode: "CASH", amount: price }]
  if (method === "card") return [{ accountCode: "CARD", amount: price }]
  return parts.map((p) => ({ accountCode: p.accountCode, amount: p.amount }))
}

export function HandOverDialog({
  order,
  open,
  onOpenChange,
  onSuccess,
}: {
  order: StorefrontOrderDetailView
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}) {
  const { t } = useI18n()
  const handOver = useHandOverOrder()

  const priceNum = order.priceSnapshot ? Number(order.priceSnapshot) : 0
  const feeNum = Number(order.deliveryFeeSnapshot ?? 0)
  const isPaidOnline = order.payment?.statusCode === "PAID"

  const [method, setMethod] = React.useState<PaymentMethod>("cash")
  const [parts, setParts] = React.useState<PaymentPart[]>([])
  const [feeAccount, setFeeAccount] = React.useState("CASH")

  const isSplitBlocked = method === "split" && splitRemaining(priceNum, parts) !== 0

  const handleComplete = () => {
    let payments: HandOverPaymentItem[]
    let deliveryFeeAccountCode: string | undefined

    if (isPaidOnline && order.payment) {
      payments = [{ accountCode: order.payment.providerCode, amount: priceNum }]
      deliveryFeeAccountCode = feeNum > 0 ? order.payment.providerCode : undefined
    } else {
      payments = buildHandOverPayments(method, parts, priceNum)
      deliveryFeeAccountCode = feeNum > 0 ? feeAccount : undefined
    }

    handOver.mutate(
      { id: order.id, dto: { payments, deliveryFeeAccountCode } },
      {
        onSuccess: () => {
          toast.success(t("orders.handOverSuccess"))
          onOpenChange(false)
          onSuccess?.()
        },
        onError: (err: unknown) => {
          const code = httpErrorCode(err)
          if (code === "NO_OPEN_SHIFT") {
            toast.error(t("orders.errorNoOpenShift"))
          } else if (code === "NO_HELD_DEVICE") {
            toast.error(t("orders.errorNoHeldDevice"))
          } else {
            toast.error((err as { message?: string })?.message || t("common.error"))
          }
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("orders.handOverTitle")}</DialogTitle>
          <DialogDescription>
            {order.productName || order.modelName} ({formatMoney(priceNum)} so&apos;m)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {isPaidOnline && order.payment ? (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                <CheckCircle2 className="size-4 text-emerald-600" />
                <span>{t("orders.paidOnlineBadge")}</span>
              </div>
              <p className="text-muted-foreground">
                {t("orders.paidOnlineDetails", {
                  provider: order.payment.providerLabel || order.payment.providerCode,
                  amount: formatMoney(Number(order.payment.amount)),
                })}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <PaymentMethodField
                total={priceNum}
                method={method}
                parts={parts}
                onMethodChange={setMethod}
                onPartsChange={setParts}
                allowSplit={true}
              />

              {feeNum > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-border">
                  <Label className="text-xs font-semibold">
                    {t("orders.deliveryFeeAccount")} ({formatMoney(feeNum)} so&apos;m)
                  </Label>
                  <AccountSelect value={feeAccount} onValueChange={setFeeAccount} />
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleComplete}
            disabled={handOver.isPending || (!isPaidOnline && isSplitBlocked)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {handOver.isPending ? t("common.loading") : t("orders.confirmHandOver")}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  )
}
