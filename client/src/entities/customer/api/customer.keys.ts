export const customerKeys = {
  all: ["customers"] as const,
  lists: () => [...customerKeys.all, "list"] as const,
  list: (q?: string) => [...customerKeys.lists(), q] as const,
  details: () => [...customerKeys.all, "detail"] as const,
  detail: (id: string) => [...customerKeys.details(), id] as const,
  sales: (id: string) => [...customerKeys.detail(id), "sales"] as const,
}
