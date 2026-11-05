export const bonusKeys = {
  all: ["bonus"] as const,
  details: () => [...bonusKeys.all, "detail"] as const,
  detail: (customerId: string) => [...bonusKeys.details(), customerId] as const,
}
