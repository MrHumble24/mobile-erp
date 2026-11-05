import { useQuery } from "@tanstack/react-query"
import { pricingRepository } from "../api/pricing.repository"
import { pricingKeys } from "../api/pricing.keys"

/** The active price levels for the till's level picker (ADR 0034). */
export function usePriceLevels() {
  return useQuery({
    queryKey: pricingKeys.levels(),
    queryFn: () => pricingRepository.levels(),
    staleTime: 60 * 60 * 1000,
  })
}
