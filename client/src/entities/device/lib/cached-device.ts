import { idbGet, STORES } from "@/shared/lib/offline"
import type { DeviceDetailView, DeviceSpecs } from "../model/device.types"

/**
 * A device row as written into the offline cache by the sync feed. Structurally
 * the server's DeviceChange; declared here (not imported from entities/sync) so
 * the two entities stay independent. Never carries cost fields.
 */
interface CachedDevice {
  id: string
  imei: string
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

/** Reads a device from the offline cache by IMEI, or null if not cached. */
export async function getCachedDeviceByImei(imei: string): Promise<DeviceDetailView | null> {
  const cached = await idbGet<CachedDevice>(STORES.devices, imei)
  return cached ? toDetail(cached) : null
}
