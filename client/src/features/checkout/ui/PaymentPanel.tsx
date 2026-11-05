import * as React from "react"
import { PaymentMethodField } from "@/entities/ledger"
import { useCartStore } from "../model/cart.store"
import { cartTotal, splitAllowed } from "../lib/payment"

/** POS "Paid with" control, bound to the cart store. Split is offered only for
 *  a single-line cart; a stale split on a multi-line cart is reset to cash. */
export function PaymentPanel() {
  const lines = useCartStore((s) => s.lines)
  const method = useCartStore((s) => s.paymentMethod)
  const parts = useCartStore((s) => s.splitParts)
  const setMethod = useCartStore((s) => s.setPaymentMethod)
  const setParts = useCartStore((s) => s.setSplitParts)

  const total = cartTotal(lines)
  const allowSplit = splitAllowed(lines)

  React.useEffect(() => {
    if (!allowSplit && method === "split") setMethod("cash")
  }, [allowSplit, method, setMethod])

  const handleMethod = (next: typeof method) => {
    setMethod(next)
    if (next === "split") setParts([{ accountCode: "CASH", amount: total }])
  }

  return (
    <PaymentMethodField
      total={total}
      method={method}
      parts={parts}
      onMethodChange={handleMethod}
      onPartsChange={setParts}
      allowSplit={allowSplit}
    />
  )
}
