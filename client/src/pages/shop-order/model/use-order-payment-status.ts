import * as React from "react"
import { usePayStorefrontOrder, type PublicStorefrontOrderView } from "@/entities/storefront"

export type PaymentState =
  | "CHECKING"
  | "PAID"
  | "ON_RECEIPT"
  | "UNPAID"
  | "TIMEOUT"
  | "TERMINAL"

const POLL_MS = 3000
const POLL_LIMIT = 20

/**
 * What the order page says about payment. "Paid" comes only from the server's
 * public order view (`paid`), never from the address bar. While an online order
 * is unpaid the page asks the server again every few seconds, for about a minute.
 */
export function useOrderPaymentStatus(
  order: PublicStorefrontOrderView | undefined,
  refetch: () => Promise<unknown>
) {
  const payMutation = usePayStorefrontOrder()
  const [attempts, setAttempts] = React.useState(0)

  const paymentState: PaymentState = !order
    ? "CHECKING"
    : order.paid
      ? "PAID"
      : order.paymentMethod !== "ONLINE"
        ? "ON_RECEIPT"
        : order.statusCode === "CANCELLED" || order.statusCode === "DONE"
          ? "TERMINAL"
          : attempts >= POLL_LIMIT
            ? "TIMEOUT"
            : "UNPAID"

  React.useEffect(() => {
    if (paymentState !== "UNPAID") return
    const timer = setTimeout(async () => {
      await refetch()
      setAttempts((n) => n + 1)
    }, POLL_MS)
    return () => clearTimeout(timer)
  }, [paymentState, attempts, refetch])

  const handlePayAgain = () => {
    if (!order) return
    payMutation.mutate(
      { id: order.id },
      { onSuccess: (res) => { window.location.href = res.checkoutUrl } }
    )
  }

  return { paymentState, isPending: payMutation.isPending, handlePayAgain }
}
