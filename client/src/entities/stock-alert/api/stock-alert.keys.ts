export const stockAlertKeys = {
  all: ["stock-alerts"] as const,
  lists: () => [...stockAlertKeys.all, "list"] as const,
  list: () => [...stockAlertKeys.lists()] as const,
  lowStock: () => [...stockAlertKeys.all, "low-stock"] as const,
  details: () => [...stockAlertKeys.all, "detail"] as const,
  detail: (id: string) => [...stockAlertKeys.details(), id] as const,
}
