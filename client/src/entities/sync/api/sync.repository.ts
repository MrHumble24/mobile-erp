import { http } from "@/shared/api/http"
import { idbPutMany, STORES } from "@/shared/lib/offline"
import type {
  ChangesResponse,
  ConflictView,
  OutboxEntry,
  PushResponse,
  ResolveConflictDto,
} from "../model/sync.types"

/** The device feed caps at 2000 rows; this guards a runaway paging loop. */
const MAX_CHANGE_PAGES = 50

function toMutation(entry: OutboxEntry) {
  return {
    id: entry.id,
    type: entry.type,
    payload: entry.payload,
    baseVersion: entry.baseVersion,
    occurredAt: entry.occurredAt,
  }
}

export const syncRepository = {
  push: async (terminalId: string, entries: OutboxEntry[]): Promise<PushResponse> => {
    return http<PushResponse>("/sync/push", {
      method: "POST",
      body: { terminalId, mutations: entries.map(toMutation) },
    })
  },

  listConflicts: async (): Promise<ConflictView[]> => {
    return http<ConflictView[]>("/sync/conflicts")
  },

  resolveConflict: async (id: string, dto: ResolveConflictDto): Promise<ConflictView> => {
    return http<ConflictView>(`/sync/conflicts/${id}/resolve`, { method: "POST", body: dto })
  },

  /**
   * Pulls GET /sync/changes from `since`, paging until nextSince is null, and
   * writes devices + partners into the offline cache. Returns the new cursor
   * (the server time of the last page) to persist for the next pull.
   */
  pullChanges: async (since: string | null): Promise<string> => {
    let cursor = since
    let serverTime = since ?? new Date(0).toISOString()
    for (let page = 0; page < MAX_CHANGE_PAGES; page += 1) {
      const res = await http<ChangesResponse>("/sync/changes", {
        params: { since: cursor ?? undefined },
      })
      await idbPutMany(STORES.devices, res.devices)
      await idbPutMany(STORES.partners, res.partners)
      // products is the full list each sync (not since-filtered); write it as-is.
      await idbPutMany(STORES.products, res.products)
      serverTime = res.serverTime
      if (!res.nextSince) break
      cursor = res.nextSince
    }
    return serverTime
  },
}
