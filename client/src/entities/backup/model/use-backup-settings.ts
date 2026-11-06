import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { backupRepository, type UpdateSettingsDto } from "../api/backup.repository"
import { backupKeys } from "../api/backup.keys"

export function useBackupSettings() {
  return useQuery({
    queryKey: backupKeys.settings(),
    queryFn: () => backupRepository.getSettings(),
  })
}

export function useUpdateBackupSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: UpdateSettingsDto) => backupRepository.updateSettings(dto),
    onSuccess: (data) => qc.setQueryData(backupKeys.settings(), data),
  })
}

export function useSetPassphrase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (passphrase: string) => backupRepository.setPassphrase(passphrase),
    onSuccess: () => qc.invalidateQueries({ queryKey: backupKeys.settings() }),
  })
}
