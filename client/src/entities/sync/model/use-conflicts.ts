import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { deviceKeys } from "@/entities/device"
import { syncRepository } from "../api/sync.repository"
import { syncKeys } from "../api/sync.keys"
import type { ResolveConflictDto } from "./sync.types"

/** Pending server conflicts (requires `sync.resolve`). */
export function useConflicts(enabled = true) {
  return useQuery({
    queryKey: syncKeys.conflicts(),
    queryFn: () => syncRepository.listConflicts(),
    enabled,
  })
}

export function useResolveConflict() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: ResolveConflictDto }) =>
      syncRepository.resolveConflict(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: syncKeys.conflicts() })
      qc.invalidateQueries({ queryKey: deviceKeys.all })
    },
  })
}
