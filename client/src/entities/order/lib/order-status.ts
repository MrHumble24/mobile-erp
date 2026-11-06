import type { OrderStatusCode } from "../api/order.types"

export function isOrderTerminal(status: OrderStatusCode): boolean {
  return status === "DONE" || status === "CANCELLED"
}

export function allowedOrderTransitions(status: OrderStatusCode): OrderStatusCode[] {
  switch (status) {
    case "NEW":
      return ["CONTACTED", "CANCELLED"]
    case "CONTACTED":
      return ["DONE", "CANCELLED"]
    case "DONE":
    case "CANCELLED":
      return []
    default:
      return []
  }
}

export function canTransitionOrder(from: OrderStatusCode, to: OrderStatusCode): boolean {
  return allowedOrderTransitions(from).includes(to)
}
