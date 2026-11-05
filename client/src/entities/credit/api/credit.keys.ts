import type { CreditListFilters } from "../model/credit.types"

export const creditKeys = {
  all: ["credits"] as const,
  lists: () => [...creditKeys.all, "list"] as const,
  list: (filters: CreditListFilters) => [...creditKeys.lists(), filters] as const,
  details: () => [...creditKeys.all, "detail"] as const,
  detail: (id: string) => [...creditKeys.details(), id] as const,
  contract: (id: string) => [...creditKeys.all, "contract", id] as const,
  report: () => [...creditKeys.all, "report"] as const,
}
