export const syncKeys = {
  all: ["sync"] as const,
  conflicts: () => [...syncKeys.all, "conflicts"] as const,
}
