import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { saveBlob } from "@/shared/lib/save-blob"
import { backupRepository } from "../api/backup.repository"
import { backupKeys } from "../api/backup.keys"
import type { BackupRunView } from "./backup.types"

export function useBackupRuns() {
  return useQuery({
    queryKey: backupKeys.runs(),
    queryFn: () => backupRepository.listRuns(),
  })
}

/** POST blocks until the run finishes and returns the refreshed list. */
export function useRunBackup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => backupRepository.runBackup(),
    onSuccess: (runs) => {
      qc.setQueryData(backupKeys.runs(), runs)
      qc.invalidateQueries({ queryKey: backupKeys.places() })
    },
  })
}

export function useDeleteRun() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => backupRepository.deleteRun(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: backupKeys.runs() }),
  })
}

export function useDownloadRun() {
  return useMutation({
    mutationFn: async (run: BackupRunView) => {
      const blob = await backupRepository.downloadRun(run.id)
      saveBlob(blob, run.fileName ?? `${run.id}.mbk`)
    },
  })
}
