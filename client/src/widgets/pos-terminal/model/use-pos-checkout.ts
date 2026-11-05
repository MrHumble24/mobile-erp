import * as React from "react"
import { useI18n } from "@/shared/i18n"
import { toast } from "@/shared/ui/sonner"
import { useCheckout, CheckoutLineError } from "@/features/checkout"
import { useShiftGate } from "@/entities/shift"
import { focusScanner } from "./use-pos-scanner"

/** Map a server 400 about pricing to a friendly `pricing.*` key (ADR 0034). */
function pricingReason(message: string, t: (k: string) => string): string | null {
  const m = message.toLowerCase()
  if (m.includes("does not match")) return t("pricing.errorPriceMismatch")
  if (m.includes("turned off") || m.includes("not allowed")) return t("pricing.errorDiscountDisabled")
  if (m.includes("exceeds the list price")) return t("pricing.errorDiscountAboveList")
  // "exceeds the limit" carries the figure already; let the server text through.
  return null
}

function failureMessage(
  err: CheckoutLineError,
  t: (k: string, p?: Record<string, string | number>) => string
) {
  const reason =
    err.statusCode === 404
      ? t("common.notFound")
      : err.statusCode === 409
        ? t("pos.deviceConflict")
        : (err.statusCode === 400 && pricingReason(err.message, t)) || err.message
  return t("pos.lineFailed", { imei: err.imei, reason })
}

/** Owns the receipt dialog state and the sequential checkout submit. `onReset` clears the cart/scanner. */
export function usePosCheckout(blocked: boolean, onReset: () => void) {
  const { t } = useI18n()
  const checkout = useCheckout()
  const shiftGate = useShiftGate()
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
        // Shift closed elsewhere: flip the till to the "open a shift" prompt and
        // keep the cart; skip the generic line-failed toast.
        if (!shiftGate(err)) toast.error(failureMessage(err, t))
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
