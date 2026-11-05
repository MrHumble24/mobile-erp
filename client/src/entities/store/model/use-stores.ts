import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { storeKeys } from "../api/store.keys"
import { storeRepository } from "../api/store.repository"
import type { CreateStoreDto, UpdateStoreDto } from "./store.types"

export function useStores(includeDeactivated = false) {
  return useQuery({
    queryKey: storeKeys.list(includeDeactivated),
    queryFn: () => storeRepository.list(includeDeactivated),
  })
}

export function useStore(id: string) {
  return useQuery({
    queryKey: storeKeys.detail(id),
    queryFn: () => storeRepository.get(id),
    enabled: Boolean(id),
  })
}

export function useCreateStore() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateStoreDto) => storeRepository.create(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: storeKeys.all })
    },
  })
}

export function useUpdateStore() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateStoreDto }) =>
      storeRepository.update(id, dto),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: storeKeys.all })
      qc.invalidateQueries({ queryKey: storeKeys.detail(id) })
    },
  })
}

export function useDeactivateStore() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => storeRepository.deactivate(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: storeKeys.all })
      qc.invalidateQueries({ queryKey: storeKeys.detail(id) })
    },
  })
}
