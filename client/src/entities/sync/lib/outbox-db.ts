import { idbDelete, idbGet, idbGetAll, idbPut, STORES } from "@/shared/lib/offline"
import type { OutboxEntry } from "../model/sync.types"
import type { DrainPlan } from "./drain"

const CURSOR_KEY = "changes-cursor"

export function readOutbox(): Promise<OutboxEntry[]> {
  return idbGetAll<OutboxEntry>(STORES.outbox)
}

export function putEntry(entry: OutboxEntry): Promise<void> {
  return idbPut(STORES.outbox, entry)
}

export function deleteEntry(id: string): Promise<void> {
  return idbDelete(STORES.outbox, id)
}

/** Applies a drain plan to IndexedDB: delete done/conflicted, flag rejected. */
export async function applyPlan(entries: OutboxEntry[], plan: DrainPlan): Promise<void> {
  await Promise.all(plan.remove.map(deleteEntry))
  const rejectedById = new Map(plan.reject.map((r) => [r.id, r.error]))
  await Promise.all(
    entries
      .filter((e) => rejectedById.has(e.id))
      .map((e) => putEntry({ ...e, status: "rejected", error: rejectedById.get(e.id), attempts: e.attempts + 1 })),
  )
}

export async function getCursor(): Promise<string | null> {
  return (await idbGet<string>(STORES.meta, CURSOR_KEY)) ?? null
}

export function setCursor(cursor: string): Promise<void> {
  return idbPut(STORES.meta, cursor, CURSOR_KEY)
}

export function clearCursor(): Promise<void> {
  return idbDelete(STORES.meta, CURSOR_KEY)
}
