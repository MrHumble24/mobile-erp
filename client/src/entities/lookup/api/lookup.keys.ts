export const lookupKeys = {
  all: ["lookup"] as const,
  find: (code: string) => [...lookupKeys.all, "find", code] as const,
}
