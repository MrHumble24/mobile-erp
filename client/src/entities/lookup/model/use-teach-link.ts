import { useMutation, useQueryClient } from "@tanstack/react-query"
import { lookupRepository } from "../api/lookup.repository"
import { lookupKeys } from "../api/lookup.keys"
import type { TeachLinkDto } from "./lookup.types"

/** Remembers which product a reference model is; refreshes future lookups. */
export function useTeachLink() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: TeachLinkDto) => lookupRepository.teachLink(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lookupKeys.all })
    },
  })
}
