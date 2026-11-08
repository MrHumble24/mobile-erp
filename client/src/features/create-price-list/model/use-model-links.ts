import { useCallback, useEffect, useRef, useState } from "react"
import type { DeviceModelView } from "@/entities/device-model"
import {
  assignmentsFromLinks,
  autoLinkFromCodes,
  matchModelsForRow,
  mergePendingLinks,
  normalizeCustomsKey,
  type ModelLinkAssignment,
} from "./model-match"
import type { PriceListRow } from "./create-price-list.schema"

type Pending = Record<string, string[]>

function usePendingLinks(models: DeviceModelView[]) {
  const [pending, setPending] = useState<Pending>({})
  const commit = useCallback(
    (codes: string[]) => {
      setPending((prev) => {
        const taken = new Set(Object.values(prev).flat())
        return mergePendingLinks(prev, autoLinkFromCodes(codes, models, taken))
      })
    },
    [models]
  )
  const linkRow = (code: string, modelId: string) => {
    const key = normalizeCustomsKey(code)
    setPending((prev) => {
      // One model can only be pending for one code; linking here cancels it elsewhere.
      const next: Pending = {}
      for (const [k, ids] of Object.entries(prev)) {
        if (k === key) continue
        const rest = ids.filter((id) => id !== modelId)
        if (rest.length > 0) next[k] = rest
      }
      next[key] = Array.from(new Set([...(prev[key] ?? []), modelId]))
      return next
    })
  }
  const unlinkRow = (code: string, modelId: string) => {
    const key = normalizeCustomsKey(code)
    setPending((prev) => ({ ...prev, [key]: (prev[key] ?? []).filter((id) => id !== modelId) }))
  }
  return { pending, commit, linkRow, unlinkRow }
}

/**
 * Review-and-apply state for linking imported customs codes to our device
 * models. Links live per normalized row code, so editing or deleting a row
 * silently drops its pending links; saving the list is what sends them to the
 * server (see PriceListForm).
 */
export function useModelLinks(
  items: { customsCode: string }[],
  models: DeviceModelView[],
  canLink: boolean
) {
  const { pending, commit, linkRow, unlinkRow } = usePendingLinks(models)
  const [fileRows, setFileRows] = useState<PriceListRow[] | null>(null)
  const autoApplied = useRef(false)
  const assignments: ModelLinkAssignment[] = assignmentsFromLinks(pending, items)
  const stats = summarizeRows(items, models, pending)

  // A file may be picked before the models query answers; link once they arrive.
  useEffect(() => {
    if (!canLink || !fileRows || models.length === 0 || autoApplied.current) return
    autoApplied.current = true
    commit(fileRows.map((r) => r.customsCode))
  }, [canLink, fileRows, models, commit])

  /** Auto-commit name matches for code-less models right after a file import; conflicts stay manual. */
  const applyFileLinks = (rows: PriceListRow[]) => {
    setFileRows(rows)
    if (!canLink || models.length === 0) return
    autoApplied.current = true
    commit(rows.map((r) => r.customsCode))
  }

  /** One-tap bulk action: link every remaining name match, conflicts still excluded. */
  const linkAll = () => {
    if (canLink) commit(items.map((i) => i.customsCode))
  }

  return {
    pending,
    assignments,
    ready: assignments.length,
    connected: stats.connected,
    suggestions: stats.suggestions,
    linkRow,
    unlinkRow,
    applyFileLinks,
    linkAll,
  }
}

/** Rows already covered by a model, and name matches the user has not acted on. */
function summarizeRows(items: { customsCode: string }[], models: DeviceModelView[], pending: Pending) {
  let connected = 0
  let suggestions = 0
  for (const row of items) {
    const code = row.customsCode.trim()
    if (!code) continue
    const ids = pending[normalizeCustomsKey(code)] ?? []
    const matches = matchModelsForRow(code, models)
    if (ids.length > 0 || matches.some((m) => m.status === "linked")) connected++
    suggestions += matches.filter((m) => m.status === "suggest" && !ids.includes(m.model.id)).length
  }
  return { connected, suggestions }
}
