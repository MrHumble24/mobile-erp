import type { CustomerPurchaseFilters } from "../model/customer-purchase.types"

export const customerPurchaseKeys = {
  all: ["customer-purchases"] as const,
  lists: () => [...customerPurchaseKeys.all, "list"] as const,
  list: (filters: CustomerPurchaseFilters) => [...customerPurchaseKeys.lists(), filters] as const,
  details: () => [...customerPurchaseKeys.all, "detail"] as const,
  detail: (id: string) => [...customerPurchaseKeys.details(), id] as const,
}
