import type { ProductKind } from "../model/device-model.types"

/**
 * One used unit's identity, as entered when buying a phone from a customer or
 * taking one in trade-in (ADR 0039). Shared by both flows so the model picker,
 * specs and IMEI/serial fields are defined once.
 */
export interface UsedUnitValues {
  modelId: string
  /** Mirrors the chosen model's kind; drives which identifier is shown. */
  kindCode: ProductKind
  imei: string
  imei2: string
  dualSim: boolean
  serialNumber: string
  specs: Record<string, unknown>
}

/** The unit part of a `POST /customer-purchases` / trade-in payload. */
export interface UsedUnitPayload {
  modelId: string
  imei?: string
  imei2?: string
  serialNumber?: string
  specs?: Record<string, unknown>
}

export function emptyUsedUnit(): UsedUnitValues {
  return { modelId: "", kindCode: "IMEI", imei: "", imei2: "", dualSim: false, serialNumber: "", specs: {} }
}

/** Maps the form values to the unit fields the server takes (IMEI xor serial). */
export function usedUnitToPayload(v: UsedUnitValues): UsedUnitPayload {
  const specs = Object.keys(v.specs ?? {}).length > 0 ? v.specs : undefined
  if (v.kindCode === "SERIAL") {
    return { modelId: v.modelId, serialNumber: v.serialNumber.trim() || undefined, specs }
  }
  return {
    modelId: v.modelId,
    imei: v.imei.trim() || undefined,
    imei2: v.dualSim && v.imei2.trim() ? v.imei2.trim() : undefined,
    specs,
  }
}

/** True once the unit has a model and its required identifier typed in. */
export function usedUnitReady(v: UsedUnitValues): boolean {
  if (!v.modelId) return false
  return v.kindCode === "SERIAL" ? v.serialNumber.trim().length >= 3 : /^\d{15}$/.test(v.imei.trim())
}
