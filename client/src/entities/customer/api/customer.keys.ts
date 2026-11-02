import type { CustomerListFilters } from "../model/customer.types"

export const customerKeys = {
  all: ["customers"] as const,
  lists: () => [...customerKeys.all, "list"] as const,
  list: (filters: CustomerListFilters) => [...customerKeys.lists(), filters] as const,
  lookup: (q?: string) => [...customerKeys.all, "lookup", q] as const,
  stats: () => [...customerKeys.all, "stats"] as const,
  details: () => [...customerKeys.all, "detail"] as const,
  detail: (id: string) => [...customerKeys.details(), id] as const,
  sales: (id: string) => [...customerKeys.detail(id), "sales"] as const,
}
