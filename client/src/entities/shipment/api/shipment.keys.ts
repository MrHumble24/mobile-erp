export const shipmentKeys = {
  all: ["shipments"] as const,
  lists: () => [...shipmentKeys.all, "list"] as const,
  detail: (id: string) => [...shipmentKeys.all, "detail", id] as const,
}
