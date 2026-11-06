import type { ListOrdersQuery } from "./order.types"

export const orderKeys = {
  all: ["storefront-orders"] as const,
  list: (params?: ListOrdersQuery) => [...orderKeys.all, "list", params] as const,
  stats: () => [...orderKeys.all, "stats"] as const,
  detail: (id: string) => [...orderKeys.all, "detail", id] as const,
}
