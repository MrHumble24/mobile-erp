import { idbGetAll, STORES } from "@/shared/lib/offline"
import type { ProductChange, StockScanProduct } from "../model/stock.types"

/**
 * Reads a quantity product from the offline cache by its barcode (ADR 0030).
 * The products store is written by the sync changes feed; keyed by modelId, so
 * a barcode lookup scans it (bounded by the shop's accessory catalogue).
 */
export async function getCachedProductByBarcode(
  barcode: string
): Promise<StockScanProduct | null> {
  const all = await idbGetAll<ProductChange>(STORES.products)
  const hit = all.find((p) => p.barcode === barcode)
  return hit
    ? {
        modelId: hit.modelId,
        brand: hit.brand,
        name: hit.name,
        barcode: hit.barcode,
        salePrice: hit.salePrice,
        quantity: hit.quantity,
      }
    : null
}
