/**
 * Client-side mirror of the server's customs key matching
 * (server/src/customs/lib/customs-match.ts) used to connect imported price-list
 * rows to our device models before saving. The server remains the source of
 * truth at intake; this only drives the linking suggestions.
 */
import type { DeviceModelView } from "@/entities/device-model"

export function normalizeCustomsKey(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ")
    .replace(/\s+(GB|TB)\b/g, "$1")
}

/** The normalized key with a trailing storage token stripped ("IPHONE 15 PRO 256GB" -> "IPHONE 15 PRO"). */
export function baseCustomsKey(raw: string): string {
  return normalizeCustomsKey(raw).replace(/\s+\d+(GB|TB)$/, "")
}

/** The code a model should carry for this row: normalized, storage stripped — per-storage fees still match via the device's storage at intake. */
export function linkCodeForRow(code: string): string {
  return baseCustomsKey(code)
}

function modelFullName(m: Pick<DeviceModelView, "brand" | "name">): string {
  return `${m.brand} ${m.name}`.trim()
}

export function isModelLinkedToRow(model: DeviceModelView, code: string): boolean {
  if (!model.customsCode) return false
  const linked = normalizeCustomsKey(model.customsCode)
  return linked === normalizeCustomsKey(code) || linked === baseCustomsKey(code)
}

/**
 * A model matches a row by name when the normalized bare name or brand name
 * equals the row's key (full or storage-stripped). Custom lists rarely carry
 * the maker, so both spellings compete. Exact equality keeps the
 * auto-suggestion high precision; near misses stay manual.
 */
function matchesByName(model: DeviceModelView, code: string): boolean {
  const candidates = [normalizeCustomsKey(model.name), normalizeCustomsKey(modelFullName(model))]
  const keys = [baseCustomsKey(code), normalizeCustomsKey(code)]
  return candidates.some((name) => keys.includes(name))
}

export interface RowModelMatch {
  model: DeviceModelView
  /** linked: customsCode already matches; suggest: no code and the name matches; conflict: carries a different code. */
  status: "linked" | "suggest" | "conflict"
}

/**
 * Models relevant to one price-list row: already-linked models (green), one-tap
 * suggestions when the model has no code yet, and conflicts — the model's name
 * matches this row but it already carries a different code, so linking would
 * overwrite it. A model is reported at most once per row.
 */
export function matchModelsForRow(code: string, models: DeviceModelView[]): RowModelMatch[] {
  const out: RowModelMatch[] = []
  for (const model of models) {
    if (!model.isActive) continue
    if (isModelLinkedToRow(model, code)) {
      out.push({ model, status: "linked" })
    } else if (matchesByName(model, code)) {
      out.push({ model, status: model.customsCode ? "conflict" : "suggest" })
    }
  }
  return out
}

/**
 * Auto-commit name-match suggestions for models that carry no customs code
 * yet. Conflicting models (already holding a different code) stay manual. A
 * model is taken by the first code it name-matches.
 */
export function autoLinkFromCodes(
  codes: string[],
  models: DeviceModelView[],
  exclude: Set<string> = new Set()
): Record<string, string[]> {
  const pending: Record<string, string[]> = {}
  const taken = new Set(exclude)
  for (const raw of codes) {
    const code = raw.trim()
    if (!code) continue
    const ids: string[] = []
    for (const model of models) {
      if (!model.isActive || model.customsCode || taken.has(model.id)) continue
      if (matchesByName(model, code)) {
        ids.push(model.id)
        taken.add(model.id)
      }
    }
    if (ids.length > 0) pending[normalizeCustomsKey(code)] = ids
  }
  return pending
}

/** Merge auto-suggested links into user-made ones without dropping or duplicating any. */
export function mergePendingLinks(
  prev: Record<string, string[]>,
  next: Record<string, string[]>
): Record<string, string[]> {
  const merged: Record<string, string[]> = { ...prev }
  for (const [key, ids] of Object.entries(next)) {
    merged[key] = Array.from(new Set([...(prev[key] ?? []), ...ids]))
  }
  return merged
}

/** A model should never be assigned two different codes; the first row at save time wins. */
export interface ModelLinkAssignment {
  modelId: string
  /** The code the model will carry (normalized, storage stripped). */
  customsCode: string
}

/** What one row shows in its connection strip. */
export interface RowMatchView {
  /** Models already carrying this row's code. */
  linked: DeviceModelView[]
  /** Models the user has linked here; applied on save. */
  pendingModels: DeviceModelView[]
  /** Name-matched models without a code — one tap to link. */
  suggestions: DeviceModelView[]
  /** Name-matched models holding another code — linking rewrites it. */
  conflicts: DeviceModelView[]
  /** Ids already visible; the picker excludes them. */
  excludeIds: Set<string>
  hasAny: boolean
}

/** Everything the row's connection strip needs, computed from the raw pieces. */
export function rowMatchView(
  code: string,
  models: DeviceModelView[],
  pendingIds: string[]
): RowMatchView {
  const matches = code ? matchModelsForRow(code, models) : []
  const linked = matches.filter((m) => m.status === "linked").map((m) => m.model)
  const pendingSet = new Set(pendingIds)
  const pendingModels = pendingIds
    .map((id) => models.find((m) => m.id === id))
    .filter((m): m is DeviceModelView => !!m && !linked.some((l) => l.id === m.id))
  const linkedIds = new Set(linked.map((m) => m.id))
  const suggestions = matches
    .filter((m) => m.status === "suggest" && !pendingSet.has(m.model.id))
    .map((m) => m.model)
  const conflicts = matches
    .filter((m) => m.status === "conflict" && !pendingSet.has(m.model.id))
    .map((m) => m.model)
  const excludeIds = new Set([...linkedIds, ...suggestions.map((m) => m.id), ...conflicts.map((m) => m.id), ...pendingIds])
  return {
    linked,
    pendingModels,
    suggestions,
    conflicts,
    excludeIds,
    hasAny: linked.length > 0 || suggestions.length > 0 || conflicts.length > 0 || pendingModels.length > 0,
  }
}

/**
 * Turn per-row pending links into model updates. Keys without a matching row
 * (the code was edited or the row deleted) are dropped, so a link never
 * outlives the row the user made it from.
 */
export function assignmentsFromLinks(
  pending: Record<string, string[]>,
  items: { customsCode: string }[]
): ModelLinkAssignment[] {
  const byKey = new Map(items.map((i) => [normalizeCustomsKey(i.customsCode), i]))
  const out: ModelLinkAssignment[] = []
  const seen = new Set<string>()
  for (const [key, modelIds] of Object.entries(pending)) {
    const row = byKey.get(key)
    if (!row) continue
    for (const modelId of modelIds) {
      if (seen.has(modelId)) continue
      seen.add(modelId)
      out.push({ modelId, customsCode: baseCustomsKey(row.customsCode) })
    }
  }
  return out
}
