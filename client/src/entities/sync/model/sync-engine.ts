import type { QueryClient } from "@tanstack/react-query"
import { getTerminalId, isOnline } from "@/shared/lib/offline"
import { saleKeys } from "@/entities/sale"
import { deviceKeys } from "@/entities/device"
import { consignmentKeys } from "@/entities/consignment"
import { partnerKeys } from "@/entities/partner"
import { customerKeys } from "@/entities/customer"
import { syncRepository } from "../api/sync.repository"
import { syncKeys } from "../api/sync.keys"
import { applyPlan, getCursor, setCursor } from "../lib/outbox-db"
import { pendingFirst, planDrain } from "../lib/drain"
import { useOutboxStore } from "./outbox.store"

// ponytail: single module-level lock; one terminal never pushes concurrently.
let draining = false

function invalidateApplied(qc: QueryClient, hadConflicts: boolean): void {
  qc.invalidateQueries({ queryKey: saleKeys.all })
  qc.invalidateQueries({ queryKey: deviceKeys.all })
  qc.invalidateQueries({ queryKey: consignmentKeys.all })
  qc.invalidateQueries({ queryKey: partnerKeys.all })
  qc.invalidateQueries({ queryKey: customerKeys.all })
  if (hadConflicts) qc.invalidateQueries({ queryKey: syncKeys.conflicts() })
}

/** Refreshes the offline device/partner cache from the server feed. */
export async function pullChanges(): Promise<void> {
  if (!isOnline()) return
  try {
    const next = await syncRepository.pullChanges(await getCursor())
    await setCursor(next)
  } catch {
    // Offline or transient: the cache simply stays as it was.
  }
}

/** Pushes all pending mutations once, in order, then refreshes the cache. */
export async function drainOnce(qc: QueryClient): Promise<void> {
  if (draining || !isOnline()) return
  const store = useOutboxStore.getState()
  const pending = pendingFirst(store.entries)
  if (pending.length === 0) return pullChanges()

  draining = true
  store.setSyncing(true)
  try {
    const { results } = await syncRepository.push(getTerminalId(), pending)
    const plan = planDrain(pending, results)
    await applyPlan(pending, plan)
    await store.reload()
    store.markSynced(plan.conflictIds.length)
    invalidateApplied(qc, plan.conflictIds.length > 0)
    await pullChanges()
  } catch {
    // Network dropped mid-push: keep the queue untouched and retry next tick.
  } finally {
    draining = false
    store.setSyncing(false)
  }
}
