import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { backupRepository } from "../api/backup.repository"
import { backupKeys } from "../api/backup.keys"
import type { PlaceSecretKind, PlaceView } from "./backup.types"

export function useBackupPlaces() {
  return useQuery({
    queryKey: backupKeys.places(),
    queryFn: () => backupRepository.listPlaces(),
  })
}

/** Writes return the updated place; drop it straight into the list cache. */
function usePlaceMutation<V>(fn: (vars: V) => Promise<PlaceView>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: (place) => {
      qc.setQueryData<PlaceView[]>(backupKeys.places(), (prev) =>
        prev?.map((p) => (p.code === place.code ? place : p)),
      )
    },
  })
}

export function useSetPlaceEnabled() {
  return usePlaceMutation(({ code, enabled }: { code: string; enabled: boolean }) =>
    backupRepository.setPlaceEnabled(code, enabled),
  )
}

export function useSetPlaceSettings() {
  return usePlaceMutation(({ code, chatId }: { code: string; chatId: string }) =>
    backupRepository.setPlaceSettings(code, chatId),
  )
}

export function useTestPlace() {
  return usePlaceMutation((code: string) => backupRepository.testPlace(code))
}

export function useDisconnectPlace() {
  return usePlaceMutation((code: string) => backupRepository.disconnectPlace(code))
}

export function useSetPlaceSecret() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      code,
      kind,
      value,
    }: {
      code: string
      kind: PlaceSecretKind
      value: string
    }) => backupRepository.setPlaceSecret(code, kind, value),
    onSuccess: () => qc.invalidateQueries({ queryKey: backupKeys.places() }),
  })
}
