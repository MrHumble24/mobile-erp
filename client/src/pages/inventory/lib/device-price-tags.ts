import type { DeviceView } from "@/entities/device"
import type { PriceTagItem } from "@/features/print-price-tags"

function specText(value: unknown): string | null {
  return value ? String(value) : null
}

/** The storage / color line the device row shows, or null when neither is set. */
function subtitleOf(device: DeviceView): string | null {
  const storage = specText(device.specs?.storage)
  const color = specText(device.specs?.color)
  if (!storage && !color) return null
  return `${storage ?? "-"} · ${color ?? "-"}`
}

/** Map the device rows now on screen into shelf labels. */
export function devicesToPriceTags(
  devices: DeviceView[],
  modelsMap: Record<string, string>
): PriceTagItem[] {
  return devices.map((device) => ({
    id: device.id,
    title: modelsMap[device.modelId] || device.modelId,
    subtitle: subtitleOf(device),
    price: device.targetPrice,
    code: device.imei ?? device.serialNumber ?? null,
  }))
}
