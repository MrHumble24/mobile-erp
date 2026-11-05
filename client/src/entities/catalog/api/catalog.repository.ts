import { http, isNetworkError } from "@/shared/api/http"
import { getCachedCatalog, getCachedCatalogUnits } from "../lib/cached-catalog"
import type { CatalogEntry, CatalogFilters, CatalogUnit } from "../model/catalog.types"

/**
 * The till product grid (ADR 0031). Online: GET /catalog. Offline (network
 * error): the synced device + product caches, so the seller can still tap to
 * sell. A real server error (4xx/5xx) is never masked by the cache.
 */
export const catalogRepository = {
  list: async (filters?: CatalogFilters): Promise<CatalogEntry[]> => {
    try {
      return await http<CatalogEntry[]>("/catalog", {
        params: { categoryId: filters?.categoryId, search: filters?.search },
      })
    } catch (err) {
      if (isNetworkError(err)) return getCachedCatalog(filters)
      throw err
    }
  },

  units: async (modelId: string): Promise<CatalogUnit[]> => {
    try {
      return await http<CatalogUnit[]>(`/catalog/${modelId}/units`)
    } catch (err) {
      if (isNetworkError(err)) return getCachedCatalogUnits(modelId)
      throw err
    }
  },
}
