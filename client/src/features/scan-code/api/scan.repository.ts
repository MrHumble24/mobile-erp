import { http, HttpError, isNetworkError } from "@/shared/api/http"
import { getCachedDeviceByCode } from "@/entities/device"
import { getCachedProductByBarcode } from "@/entities/stock"
import type { ScanLookup } from "../model/scan.types"

/**
 * One till lookup for any scanned/typed code (ADR 0030). Online: GET /scan/:code
 * (a unit, else a quantity product's barcode, else 404). Offline: the synced
 * device cache, then the product cache; a miss reads as not found.
 */
export async function scanCode(code: string): Promise<ScanLookup> {
  try {
    return await http<ScanLookup>(`/scan/${encodeURIComponent(code)}`)
  } catch (err) {
    if (err instanceof HttpError && err.statusCode === 404) return { kind: "notFound" }
    if (isNetworkError(err)) {
      const unit = await getCachedDeviceByCode(code)
      if (unit) return { kind: "unit", unit }
      const product = await getCachedProductByBarcode(code)
      if (product) return { kind: "product", product }
      return { kind: "notFound" }
    }
    throw err
  }
}
