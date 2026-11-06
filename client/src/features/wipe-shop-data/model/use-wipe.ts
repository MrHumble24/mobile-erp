import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useMaintenanceStore } from "@/shared/lib/maintenance.store"
import { wipeRepository } from "../api/wipe.repository"
import { wipeKeys } from "../api/wipe.keys"
import type { WipeRequestDto } from "./wipe.types"

/** Current row counts per group, fetched when the dialog opens. */
export function useWipePreview(enabled: boolean) {
  return useQuery({
    queryKey: wipeKeys.preview(),
    queryFn: () => wipeRepository.preview(),
    enabled,
    staleTime: 0,
  })
}

/** The record of past erases, shown under the danger-zone card. */
export function useWipeRuns(enabled: boolean) {
  return useQuery({
    queryKey: wipeKeys.runs(),
    queryFn: () => wipeRepository.runs(),
    enabled,
  })
}

export function useWipeStatus(options?: {
  enabled?: boolean
  refetchInterval?: number
}) {
  return useQuery({
    queryKey: wipeKeys.status(),
    queryFn: () => wipeRepository.status(),
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval,
    retry: false,
    staleTime: 0,
  })
}

/** A started erase (202) puts the whole app into the "please wait" screen. */
export function useWipeShopData() {
  const setActive = useMaintenanceStore((s) => s.setActive)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: WipeRequestDto) => wipeRepository.erase(dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: wipeKeys.runs() })
      setActive(true, "wipe")
    },
  })
}
