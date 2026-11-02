import type { PartnerFilters } from "../model/partner.types"

export const partnerKeys = {
  all: ["partners"] as const,
  lists: () => [...partnerKeys.all, "list"] as const,
  list: (filters?: PartnerFilters) => [...partnerKeys.lists(), filters] as const,
  details: () => [...partnerKeys.all, "detail"] as const,
  detail: (id: string) => [...partnerKeys.details(), id] as const,
  ledgers: () => [...partnerKeys.all, "ledger"] as const,
  ledger: (id: string) => [...partnerKeys.ledgers(), id] as const,
  agings: () => [...partnerKeys.all, "aging"] as const,
  aging: (id: string) => [...partnerKeys.agings(), id] as const,
}
