export const storeKeys = {
  all: ["stores"] as const,
  list: (includeDeactivated = false) =>
    [...storeKeys.all, "list", { includeDeactivated }] as const,
  detail: (id: string) => [...storeKeys.all, "detail", id] as const,
}
