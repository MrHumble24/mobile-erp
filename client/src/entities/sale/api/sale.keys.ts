import type { SaleFilters } from "../model/sale.types"

export const saleKeys = {
  all: ["sales"] as const,
  lists: () => [...saleKeys.all, "list"] as const,
  list: (filters?: SaleFilters) => [...saleKeys.lists(), filters] as const,
  details: () => [...saleKeys.all, "detail"] as const,
  detail: (id: string) => [...saleKeys.details(), id] as const,
  receipt: (id: string) => [...saleKeys.all, "receipt", id] as const,
  warranty: (imei: string) => [...saleKeys.all, "warranty", imei] as const,
}
