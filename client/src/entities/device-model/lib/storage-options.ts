import type { DeviceModelView } from "../model/device-model.types"

/**
 * Union of every active model's `storage` attribute options; `fallback` when
 * no model defines any. Caller passes the fallback (e.g. STORAGE_OPTIONS) to
 * keep this slice free of a same-layer import.
 */
export function storageOptionsFromModels(
  models: DeviceModelView[],
  fallback: readonly string[]
): readonly string[] {
  const union = new Set<string>()
  for (const model of models) {
    if (!model.isActive) continue
    model.attributes.find((a) => a.key === "storage")?.options.forEach((o) => union.add(o))
  }
  return union.size > 0 ? [...union] : fallback
}
