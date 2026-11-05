import { PaymentMethodField } from "@/entities/ledger"
import { useCartStore } from "../model/cart.store"
import { cartTotal } from "../lib/payment"

/** POS "Paid with" control, bound to the cart store. Split divides the whole
 *  cart total across accounts; the allocation per phone happens at checkout. */
export function PaymentPanel() {
  const lines = useCartStore((s) => s.lines)
  const method = useCartStore((s) => s.paymentMethod)
  const parts = useCartStore((s) => s.splitParts)
  const setMethod = useCartStore((s) => s.setPaymentMethod)
  const setParts = useCartStore((s) => s.setSplitParts)

  const total = cartTotal(lines)

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
    />
  )
}
