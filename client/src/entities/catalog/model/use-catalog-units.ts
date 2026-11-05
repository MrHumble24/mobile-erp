import { useQuery } from "@tanstack/react-query"
import { catalogRepository } from "../api/catalog.repository"
import { catalogKeys } from "../api/catalog.keys"

/** The in-stock units of a product; enabled only while a card is being resolved. */
export function useCatalogUnits(modelId: string | null) {
  return useQuery({
    queryKey: catalogKeys.units(modelId ?? ""),
    queryFn: () => catalogRepository.units(modelId as string),
    enabled: !!modelId,
    // A unit's status changes under us; never pick a stale one.
    staleTime: 0,
    gcTime: 0,
    // Run offline too, so the cache fallback can serve the unit picker.
    networkMode: "always",
  })
}
