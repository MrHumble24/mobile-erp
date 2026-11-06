export const wipeKeys = {
  all: ["data-wipe"] as const,
  preview: () => [...wipeKeys.all, "preview"] as const,
  runs: () => [...wipeKeys.all, "runs"] as const,
  status: () => [...wipeKeys.all, "status"] as const,
}
