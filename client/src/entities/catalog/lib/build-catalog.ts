import type { CatalogEntry, CatalogFilters, CatalogUnit, ProductKind } from "../model/catalog.types"

/**
 * Pure offline-catalog transformation (ADR 0031). Kept free of IndexedDB and
 * runtime `@/` imports so it is unit-testable; `cached-catalog.ts` feeds it the
 * cached rows. Structural shapes (not the device/sync entity types) keep
 * catalog independent of its siblings.
 */
export interface CachedDeviceRow {
  id: string
  imei: string | null
  serialNumber: string | null
  statusCode: string
  specs: Record<string, unknown> | null
  targetPrice: string | null
  model: {
    id: string
    brand: string
    name: string
    kindCode?: ProductKind
    categoryId?: string | null
    imageUrl?: string | null
  }
  latestInspection: { gradeCode: string | null } | null
}

export interface CachedProductRow {
  modelId: string
  brand: string
  name: string
  salePrice: string | null
  quantity: number
  categoryId?: string | null
  imageUrl?: string | null
}

export const IN_STOCK = "IN_STOCK"

/** The cache has no model code; offline search matches name + the storage spec. */
function matchesSearch(entry: CatalogEntry, storage: string, q: string): boolean {
  if (!q) return true
  return `${entry.brand} ${entry.name} ${storage}`.toLowerCase().includes(q)
}

function minMax(prices: (string | null)[]): [string | null, string | null] {
  const nums = prices.filter((p): p is string => p != null).map(Number).filter((n) => !Number.isNaN(n))
  if (nums.length === 0) return [null, null]
  return [String(Math.min(...nums)), String(Math.max(...nums))]
}

function unitEntries(devices: CachedDeviceRow[]): { entry: CatalogEntry; storage: string }[] {
  const byModel = new Map<string, CachedDeviceRow[]>()
  for (const d of devices) {
    if (d.statusCode !== IN_STOCK) continue
    const list = byModel.get(d.model.id) ?? []
    list.push(d)
    byModel.set(d.model.id, list)
  }
  const out: { entry: CatalogEntry; storage: string }[] = []
  for (const [modelId, units] of byModel) {
    const m = units[0].model
    const [min, max] = minMax(units.map((u) => u.targetPrice))
    out.push({
      storage: units.map((u) => String(u.specs?.storage ?? "")).join(" "),
      entry: {
        modelId,
        brand: m.brand,
        name: m.name,
        kindCode: m.kindCode ?? "IMEI",
        categoryId: m.categoryId ?? null,
        categoryName: null,
        imageUrl: m.imageUrl ?? null,
        inStock: units.length,
        minTargetPrice: min,
        maxTargetPrice: max,
        salePrice: null,
      },
    })
  }
  return out
}

/** Builds the catalog grid from cached rows, applying the same filters. */
export function buildCatalogEntries(
  devices: CachedDeviceRow[],
  products: CachedProductRow[],
  filters?: CatalogFilters
): CatalogEntry[] {
  const q = filters?.search?.trim().toLowerCase() ?? ""
  const cat = filters?.categoryId

  const rows: { entry: CatalogEntry; storage: string }[] = [
    ...unitEntries(devices),
    ...products.map((p) => ({
      storage: "",
      entry: {
        modelId: p.modelId,
        brand: p.brand,
        name: p.name,
        kindCode: "QUANTITY" as ProductKind,
        categoryId: p.categoryId ?? null,
        categoryName: null,
        imageUrl: p.imageUrl ?? null,
        inStock: p.quantity,
        minTargetPrice: null,
        maxTargetPrice: null,
        salePrice: p.salePrice,
      },
    })),
  ]

  return rows
    .filter(({ entry, storage }) => {
      if (cat && entry.categoryId !== cat) return false
      return matchesSearch(entry, storage, q)
    })
    .map(({ entry }) => entry)
    .sort((a, b) => `${a.brand} ${a.name}`.localeCompare(`${b.brand} ${b.name}`))
}

/** The in-stock units of one product, for the picker offline. */
export function buildCatalogUnits(devices: CachedDeviceRow[], modelId: string): CatalogUnit[] {
  return devices
    .filter((d) => d.model.id === modelId && d.statusCode === IN_STOCK)
    .map((d) => ({
      id: d.id,
      code: d.imei ?? d.serialNumber ?? "",
      specs: d.specs ?? {},
      gradeCode: d.latestInspection?.gradeCode ?? null,
      targetPrice: d.targetPrice,
    }))
}
