import { useMutation, useQuery } from "@tanstack/react-query"
import { useMaintenanceStore } from "@/shared/lib/maintenance.store"
import { backupRepository } from "../api/backup.repository"
import { backupKeys } from "../api/backup.keys"
import type { ConfirmRestoreDto } from "./backup.types"

export function useRestoreStatus(options?: {
  enabled?: boolean
  refetchInterval?: number
}) {
  return useQuery({
    queryKey: backupKeys.restoreStatus(),
    queryFn: () => backupRepository.restoreStatus(),
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval,
    retry: false,
    staleTime: 0,
  })
}

/** A started restore (202) puts the whole app into the "please wait" screen. */
export function useRestoreFromRun() {
  const setActive = useMaintenanceStore((s) => s.setActive)
  return useMutation({
    mutationFn: (vars: { id: string; dto: ConfirmRestoreDto }) =>
      backupRepository.restoreFromRun(vars.id, vars.dto),
    onSuccess: () => setActive(true),
  })
}

export function useStageUpload() {
  return useMutation({
    mutationFn: (file: Blob) => backupRepository.stageUpload(file),
  })
}

export function useRestoreFromUpload() {
  const setActive = useMaintenanceStore((s) => s.setActive)
  return useMutation({
    mutationFn: (vars: { uploadId: string; dto: ConfirmRestoreDto }) =>
      backupRepository.restoreFromUpload(vars.uploadId, vars.dto),
    onSuccess: () => setActive(true),
  })
}
