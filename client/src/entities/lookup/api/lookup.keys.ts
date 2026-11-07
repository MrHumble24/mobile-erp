export const lookupKeys = {
  all: ["lookup"] as const,
  find: (code: string) => [...lookupKeys.all, "find", code] as const,
  search: (q: string) => [...lookupKeys.all, "search", q] as const,
}
