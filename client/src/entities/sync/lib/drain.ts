import type { MutationResult, OutboxEntry } from "../model/sync.types"

/** Server reject reason for a mutation queued before the last erase/restore.
 * It belongs to the old data, so we drop it instead of keeping it for retry.
 * Contract shared with the server's `sync/types/sync.types.ts`. */
const MUTATION_BEFORE_RESET = "MUTATION_BEFORE_RESET"

export interface DrainPlan {
  /** Entry ids to delete from the outbox (applied, duplicate, or moved to a conflict row). */
  remove: string[]
  /** Entries to keep but flag as rejected, with the server's reason. */
  reject: { id: string; error: string }[]
  /** Server conflict ids created by this drain (for the conflicts view/counter). */
  conflictIds: string[]
}

/**
 * Pure outcome of one push: maps the server's per-mutation results back onto the
 * entries that were sent. Order is preserved by `entries`; a result with no match
 * is ignored. No IndexedDB, no React — so it is trivially testable.
 */
export function planDrain(entries: OutboxEntry[], results: MutationResult[]): DrainPlan {
  const byId = new Map(results.map((r) => [r.id, r]))
  const plan: DrainPlan = { remove: [], reject: [], conflictIds: [] }

  for (const entry of entries) {
    const result = byId.get(entry.id)
    if (!result) continue
    switch (result.status) {
      case "applied":
      case "duplicate":
        plan.remove.push(entry.id)
        break
      case "conflict":
        plan.remove.push(entry.id)
        if (result.conflictId) plan.conflictIds.push(result.conflictId)
        break
      case "rejected":
        // A mutation from before an erase/restore is dropped, not kept for the
        // user to retry — the data it targeted is gone.
        if (result.error === MUTATION_BEFORE_RESET) {
          plan.remove.push(entry.id)
        } else {
          plan.reject.push({ id: entry.id, error: result.error ?? "rejected" })
        }
        break
    }
  }

  return plan
}

/** Only pending entries are ever pushed; rejected ones wait for the user. */
export function pendingFirst(entries: OutboxEntry[]): OutboxEntry[] {
  return entries
    .filter((e) => e.status === "pending")
    .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt))
}
