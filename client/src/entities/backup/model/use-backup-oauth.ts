import { useMutation, useQuery } from "@tanstack/react-query"
import { backupRepository } from "../api/backup.repository"
import { backupKeys } from "../api/backup.keys"

/** The callback address the owner must register with Google / Microsoft. */
export function useBackupRedirectUri(code: string, enabled: boolean) {
  return useQuery({
    queryKey: backupKeys.redirectUri(code),
    queryFn: () => backupRepository.redirectUri(code),
    enabled,
    staleTime: Infinity,
  })
}

/** Returns the provider consent URL to send the browser to. */
export function useOauthStart() {
  return useMutation({
    mutationFn: (vars: { code: string; returnTo: string }) =>
      backupRepository.oauthStart(vars.code, vars.returnTo),
  })
}
