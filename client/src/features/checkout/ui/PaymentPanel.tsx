import { PaymentMethodField } from "@/entities/ledger"
import { useCartStore } from "../model/cart.store"
import { useCartTenderPlan } from "../model/use-tender-plan"

/** POS "Paid with" control, bound to the cart store. Split divides the amount to
 *  pay (cart total − trade-ins − points) across accounts; the per-phone
 *  allocation happens at checkout against each line's payable price (ADR
 *  0034/0039/0043). */
export function PaymentPanel() {
  const method = useCartStore((s) => s.paymentMethod)
  const parts = useCartStore((s) => s.splitParts)
  const setMethod = useCartStore((s) => s.setPaymentMethod)
  const setParts = useCartStore((s) => s.setSplitParts)
  const total = useCartTenderPlan().amountToPay

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
