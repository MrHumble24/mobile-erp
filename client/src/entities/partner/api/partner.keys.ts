export const partnerKeys = {
  all: ["partners"] as const,
  lists: () => [...partnerKeys.all, "list"] as const,
  list: () => [...partnerKeys.lists()] as const,
  details: () => [...partnerKeys.all, "detail"] as const,
  detail: (id: string) => [...partnerKeys.details(), id] as const,
  ledgers: () => [...partnerKeys.all, "ledger"] as const,
  ledger: (id: string) => [...partnerKeys.ledgers(), id] as const,
}
