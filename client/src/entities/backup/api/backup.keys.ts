export const backupKeys = {
  all: ["backups"] as const,
  runs: () => [...backupKeys.all, "runs"] as const,
  settings: () => [...backupKeys.all, "settings"] as const,
  places: () => [...backupKeys.all, "places"] as const,
  restoreStatus: () => [...backupKeys.all, "restore-status"] as const,
  redirectUri: (code: string) =>
    [...backupKeys.all, "redirect-uri", code] as const,
}
