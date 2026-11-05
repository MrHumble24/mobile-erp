import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { pricingRepository } from "../api/pricing.repository"
import { pricingKeys } from "../api/pricing.keys"
import type { PutProductPricesDto } from "./pricing.types"

export function useProductPrices(modelId: string, enabled = true) {
  return useQuery({
    queryKey: pricingKeys.product(modelId),
    queryFn: () => pricingRepository.productPrices(modelId),
    enabled: enabled && !!modelId,
  })
}

export function useSetProductPrices(modelId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: PutProductPricesDto) => pricingRepository.setProductPrices(modelId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pricingKeys.product(modelId) })
    },
  })
}
