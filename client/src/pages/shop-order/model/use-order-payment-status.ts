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
      const code = httpErrorCode(err)
      if (code === "ORDER_ALREADY_PAID") {
        setPaymentState("PAID")
      } else if (code === "NOT_AN_ONLINE_ORDER") {
        setPaymentState("ON_RECEIPT")
      } else if (code === "ORDER_TERMINAL") {
        setPaymentState("TERMINAL")
      } else {
        setPaymentState("UNPAID")
      }
    }
  }, [orderId, payMutation])

  // Initial check
  React.useEffect(() => {
    checkPayment()
  }, [checkPayment])

  // Polling every 3s while UNPAID up to 20 attempts (60 seconds)
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
