import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { pricingRepository } from "../api/pricing.repository"
import { pricingKeys } from "../api/pricing.keys"
import type { PutUnitPricesDto } from "./pricing.types"

export function useUnitPrices(deviceId: string, enabled = true) {
  return useQuery({
    queryKey: pricingKeys.unit(deviceId),
    queryFn: () => pricingRepository.unitPrices(deviceId),
    enabled: enabled && !!deviceId,
  })
}

export function useSetUnitPrices(deviceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: PutUnitPricesDto) => pricingRepository.setUnitPrices(deviceId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pricingKeys.unit(deviceId) })
    },
  })
}
