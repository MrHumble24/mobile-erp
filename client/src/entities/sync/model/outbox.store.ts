import { create } from "zustand"
import { deleteEntry, putEntry, readOutbox } from "../lib/outbox-db"
import type { MutationType, OutboxEntry } from "./sync.types"

export interface EnqueueInput {
  id: string
  type: MutationType
  payload: Record<string, unknown>
  baseVersion?: number
  occurredAt?: string
}

interface OutboxState {
  entries: OutboxEntry[]
  loaded: boolean
  syncing: boolean
  lastSyncAt: number | null
  conflictCount: number
  reload: () => Promise<void>
  enqueue: (input: EnqueueInput) => Promise<void>
  retry: (id: string) => Promise<void>
  discard: (id: string) => Promise<void>
  setSyncing: (v: boolean) => void
  markSynced: (conflictsAdded: number) => void
}

/**
 * Client-only mirror of the IndexedDB outbox plus live sync status. IndexedDB is
 * the source of truth that survives reloads; this store is what the UI subscribes
 * to. Every write goes to IDB first, then refreshes `entries`.
 */
export const useOutboxStore = create<OutboxState>((set, get) => ({
  entries: [],
  loaded: false,
  syncing: false,
  lastSyncAt: null,
  conflictCount: 0,

  reload: async () => {
    set({ entries: await readOutbox(), loaded: true })
  },

  enqueue: async (input) => {
    const entry: OutboxEntry = {
      id: input.id,
      type: input.type,
      payload: input.payload,
      baseVersion: input.baseVersion,
      occurredAt: input.occurredAt ?? new Date().toISOString(),
      status: "pending",
      attempts: 0,
    }
    await putEntry(entry)
    await get().reload()
  },

  retry: async (id) => {
    const entry = get().entries.find((e) => e.id === id)
    if (!entry) return
    await putEntry({ ...entry, status: "pending", error: undefined })
    await get().reload()
  },

  discard: async (id) => {
    await deleteEntry(id)
    await get().reload()
  },

  setSyncing: (syncing) => set({ syncing }),

  markSynced: (conflictsAdded) =>
    set((s) => ({ lastSyncAt: Date.now(), conflictCount: s.conflictCount + conflictsAdded })),
}))

export const selectPending = (s: OutboxState) => s.entries.filter((e) => e.status === "pending")
export const selectRejected = (s: OutboxState) => s.entries.filter((e) => e.status === "rejected")

// Count selectors return a number (stable by Object.is) so they are safe to use
// directly as Zustand hook selectors; the array selectors above are for the
// engine/plain reads, not component subscriptions.
export const selectPendingCount = (s: OutboxState) =>
  s.entries.reduce((n, e) => (e.status === "pending" ? n + 1 : n), 0)
export const selectRejectedCount = (s: OutboxState) =>
  s.entries.reduce((n, e) => (e.status === "rejected" ? n + 1 : n), 0)

/** Non-hook enqueue for use inside mutationFns and mutation callbacks. */
export function enqueueMutation(input: EnqueueInput): Promise<void> {
  return useOutboxStore.getState().enqueue(input)
}
