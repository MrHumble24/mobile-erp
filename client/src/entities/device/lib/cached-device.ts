import { idbGet, idbGetAll, STORES } from "@/shared/lib/offline"
import type { DeviceDetailView, DeviceSpecs } from "../model/device.types"

/**
 * A device row as written into the offline cache by the sync feed. Structurally
 * the server's DeviceChange; declared here (not imported from entities/sync) so
 * the two entities stay independent. Never carries cost fields.
 */
interface CachedDevice {
  id: string
  imei: string | null
  imei2: string | null
  serialNumber: string | null
  statusCode: string
  version: number
  targetPrice: string | null
  specs: unknown
  model: { id: string; brand: string; name: string }
  updatedAt: string
}

/** Best-effort view from the cache: enough for a POS cart line and its version. */
function toDetail(c: CachedDevice): DeviceDetailView {
  return {
    id: c.id,
    imei: c.imei,
    imei2: c.imei2 ?? null,
    serialNumber: c.serialNumber ?? null,
    shipmentId: "",
    modelId: c.model.id,
    specs: (c.specs ?? {}) as DeviceSpecs,
    targetPrice: c.targetPrice,
    statusCode: c.statusCode,
    intakeDate: c.updatedAt,
    version: c.version,
    createdAt: c.updatedAt,
    updatedAt: c.updatedAt,
    model: c.model,
    status: { code: c.statusCode, label: c.statusCode },
    latestInspection: null,
  }
}

/** Reads a device from the offline cache by any unit code (imei, imei2 or serial), or null. */
export async function getCachedDeviceByCode(code: string): Promise<DeviceDetailView | null> {
  const byId = await idbGet<CachedDevice>(STORES.devices, code)
  if (byId) return toDetail(byId)
  // Store is keyed by device id; scan for the scanned code across its identifiers.
  // ponytail: linear scan over the shop's cached stock (bounded); add an index if it grows.
  const all = await idbGetAll<CachedDevice>(STORES.devices)
  const hit = all.find(
    (d) => d.imei === code || d.imei2 === code || d.serialNumber === code,
  )
  return hit ? toDetail(hit) : null
}
