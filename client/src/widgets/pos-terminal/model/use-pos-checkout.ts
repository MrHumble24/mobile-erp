import * as React from "react"
import { useI18n } from "@/shared/i18n"
import { toast } from "@/shared/ui/sonner"
import { useCheckout, CheckoutLineError } from "@/features/checkout"
import { focusScanner } from "./use-pos-scanner"

function failureMessage(
  err: CheckoutLineError,
  t: (k: string, p?: Record<string, string | number>) => string
) {
  const reason =
    err.statusCode === 404
      ? t("common.notFound")
      : err.statusCode === 409
        ? t("pos.deviceConflict")
        : err.message
  return t("pos.lineFailed", { imei: err.imei, reason })
}

/** Owns the receipt dialog state and the sequential checkout submit. `onReset` clears the cart/scanner. */
export function usePosCheckout(blocked: boolean, onReset: () => void) {
  const { t } = useI18n()
  const checkout = useCheckout()
  const [saleIds, setSaleIds] = React.useState<string[]>([])
  const [receiptOpen, setReceiptOpen] = React.useState(false)

  const openReceipt = (ids: string[]) => {
    setSaleIds(ids)
    setReceiptOpen(true)
  }

  const handleCheckout = () => {
    if (checkout.isPending || blocked) return
    checkout.mutate(undefined, {
      onSuccess: ({ saleIds: ids, queuedCount }) => {
        if (ids.length > 0) openReceipt(ids)
        if (queuedCount > 0) {
          toast.success(t("sync.queuedSale", { count: queuedCount }))
          if (ids.length === 0) onReset()
        }
      },
      onError: (err) => {
        toast.error(failureMessage(err, t))
        if (err.saleIds.length > 0) openReceipt(err.saleIds)
      },
    })
  }

  const handleNewSale = () => {
    setReceiptOpen(false)
    setSaleIds([])
    onReset()
    focusScanner()
  }

  return {
    saleIds,
    receiptOpen,
    setReceiptOpen,
    openReceipt,
    handleCheckout,
    handleNewSale,
    isPending: checkout.isPending,
  }
}
