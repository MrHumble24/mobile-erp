import * as React from "react"
import { httpErrorCode } from "@/shared/api/http"
import { usePayStorefrontOrder } from "@/entities/storefront"

export type PaymentState =
  | "CHECKING"
  | "PAID"
  | "ON_RECEIPT"
  | "UNPAID"
  | "TIMEOUT"
  | "TERMINAL"

function classifyPaymentError(err: unknown): PaymentState {
  const code = httpErrorCode(err)
  if (code === "ORDER_ALREADY_PAID") return "PAID"
  if (code === "NOT_AN_ONLINE_ORDER") return "ON_RECEIPT"
  if (code === "ORDER_TERMINAL") return "TERMINAL"
  return "UNPAID"
}

export function useOrderPaymentStatus(orderId?: string) {
  const payMutation = usePayStorefrontOrder()
  const [paymentState, setPaymentState] = React.useState<PaymentState>("CHECKING")
  const [checkoutUrl, setCheckoutUrl] = React.useState<string | null>(null)
  const [attempts, setAttempts] = React.useState(0)

  const checkPayment = React.useCallback(async () => {
    if (!orderId) return
    try {
      const res = await payMutation.mutateAsync({ id: orderId })
      setCheckoutUrl(res.checkoutUrl)
      setPaymentState("UNPAID")
    } catch (err: unknown) {
      setPaymentState(classifyPaymentError(err))
    }
  }, [orderId, payMutation])

  React.useEffect(() => {
    checkPayment()
  }, [checkPayment])

  React.useEffect(() => {
    if (paymentState !== "UNPAID") return
    if (attempts >= 20) {
      setPaymentState("TIMEOUT")
      return
    }
    const timer = setTimeout(() => {
      setAttempts((prev) => prev + 1)
      checkPayment()
    }, 3000)
    return () => clearTimeout(timer)
  }, [paymentState, attempts, checkPayment])

  const handlePayAgain = () => {
    if (checkoutUrl) {
      window.location.href = checkoutUrl
    } else if (orderId) {
      payMutation.mutate({ id: orderId }, {
        onSuccess: (res) => {
          window.location.href = res.checkoutUrl
        },
      })
    }
  }

  return { paymentState, checkoutUrl, isPending: payMutation.isPending, handlePayAgain }
}
