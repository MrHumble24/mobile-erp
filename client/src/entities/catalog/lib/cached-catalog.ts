import { idbGetAll, STORES } from "@/shared/lib/offline"
import type { CatalogEntry, CatalogFilters, CatalogUnit } from "../model/catalog.types"
import {
  buildCatalogEntries,
  buildCatalogUnits,
  type CachedDeviceRow,
  type CachedProductRow,
} from "./build-catalog"

/**
 * Offline catalog (ADR 0031): built from the rows the sync feed already cached,
 * so the seller can still tap to sell with no network. Pure shaping lives in
 * `build-catalog.ts`; this file only reads IndexedDB.
 */
export async function getCachedCatalog(filters?: CatalogFilters): Promise<CatalogEntry[]> {
  const [devices, products] = await Promise.all([
    idbGetAll<CachedDeviceRow>(STORES.devices),
    idbGetAll<CachedProductRow>(STORES.products),
  ])
  return buildCatalogEntries(devices, products, filters)
}

export async function getCachedCatalogUnits(modelId: string): Promise<CatalogUnit[]> {
  const devices = await idbGetAll<CachedDeviceRow>(STORES.devices)
  return buildCatalogUnits(devices, modelId)
}
