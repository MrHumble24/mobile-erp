import { useQuery } from "@tanstack/react-query"
import { catalogRepository } from "../api/catalog.repository"
import { catalogKeys } from "../api/catalog.keys"
import type { CatalogFilters } from "./catalog.types"

/** The till product grid; refetched on reconnect so stock counts stay current. */
export function useCatalog(filters?: CatalogFilters) {
  return useQuery({
    queryKey: catalogKeys.list(filters),
    queryFn: () => catalogRepository.list(filters),
    staleTime: 30_000,
    // Always run the queryFn so its offline cache fallback fires when the
    // network is down (default "online" would pause the query instead).
    networkMode: "always",
  })
}
