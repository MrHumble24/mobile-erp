import type { OrderStatusCode } from "../api/order.types"

export function isOrderTerminal(status: OrderStatusCode): boolean {
  return status === "DONE" || status === "CANCELLED"
}

export function allowedOrderTransitions(
  status: OrderStatusCode,
  fulfillmentMethod?: string,
): OrderStatusCode[] {
  switch (status) {
    case "NEW":
      return ["CONTACTED", "CANCELLED"]
    case "CONTACTED":
      return fulfillmentMethod === "DELIVERY"
        ? ["SHIPPED", "DONE", "CANCELLED"]
        : ["DONE", "CANCELLED"]
    case "SHIPPED":
      return ["DONE", "CANCELLED"]
    case "DONE":
    case "CANCELLED":
      return []
    default:
      return []
  }
}

export function canTransitionOrder(
  from: OrderStatusCode,
  to: OrderStatusCode,
  fulfillmentMethod?: string,
): boolean {
  return allowedOrderTransitions(from, fulfillmentMethod).includes(to)
}
