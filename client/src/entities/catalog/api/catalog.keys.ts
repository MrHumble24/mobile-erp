import type { CatalogFilters } from "../model/catalog.types"

export const catalogKeys = {
  all: ["catalog"] as const,
  list: (filters?: CatalogFilters) =>
    [...catalogKeys.all, "list", filters ?? {}] as const,
  units: (modelId: string) => [...catalogKeys.all, "units", modelId] as const,
}
