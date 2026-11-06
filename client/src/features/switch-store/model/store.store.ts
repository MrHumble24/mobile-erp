import type { QueryClient } from "@tanstack/react-query"
import { create } from "zustand"
import { persist } from "zustand/middleware"
import { clearCursor } from "@/entities/sync/lib/outbox-db"
import { pullChanges } from "@/entities/sync/model/sync-engine"
import { configureHttp } from "@/shared/api/http"
import { idbClear, STORES } from "@/shared/lib/offline"

interface StoreSelectionState {
  currentStoreId: string | null
  setStoreId: (id: string | null) => void
  clearStoreId: () => void
}

export const useStoreSelectionStore = create<StoreSelectionState>()(
  persist(
    (set) => ({
      currentStoreId: null,
      setStoreId: (id) => set({ currentStoreId: id }),
      clearStoreId: () => set({ currentStoreId: null }),
    }),
    {
      name: "mobile-erp-active-store",
    },
  ),
)

// Configure HTTP to send active store ID on outgoing requests
configureHttp({
  getStoreId: () => useStoreSelectionStore.getState().currentStoreId,
})

export async function switchActiveStore(
  newStoreId: string,
  qc: QueryClient,
): Promise<void> {
  useStoreSelectionStore.getState().setStoreId(newStoreId)
  // resetQueries, not clear(): clear() drops the cache without telling mounted
  // queries, so the open page kept the previous store's rows.
  await qc.resetQueries()
  await idbClear(STORES.devices)
  await clearCursor()
  await pullChanges()
}
