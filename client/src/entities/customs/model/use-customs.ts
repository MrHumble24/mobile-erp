import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { customsRepository } from "../api/customs.repository"
import { customsKeys } from "../api/customs.keys"
import type { CreatePriceListDto } from "./customs.types"

export function useCurrentPriceList() {
  return useQuery({
    queryKey: customsKeys.current(),
    queryFn: () => customsRepository.current(),
  })
}

export function usePriceListVersions() {
  return useQuery({
    queryKey: customsKeys.priceLists(),
    queryFn: () => customsRepository.versions(),
  })
}

export function useUnmatchedModels() {
  return useQuery({
    queryKey: customsKeys.unmatched(),
    queryFn: () => customsRepository.unmatchedModels(),
  })
}

export function useFeeHistory(customsCode: string | null) {
  return useQuery({
    queryKey: customsKeys.feeHistory(customsCode ?? ""),
    queryFn: () => customsRepository.feeHistory(customsCode as string),
    enabled: Boolean(customsCode),
  })
}

export function useCreatePriceList() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreatePriceListDto) => customsRepository.createPriceList(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customsKeys.all })
    },
  })
}
