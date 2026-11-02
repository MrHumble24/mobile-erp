import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { drainOnce, pullChanges } from "./sync-engine"
import { selectPending, useOutboxStore } from "./outbox.store"

const DRAIN_INTERVAL_MS = 30_000
const PULL_INTERVAL_MS = 5 * 60_000

/**
 * Mount once (app shell). Drains the outbox on start, on `online`, and every 30s
 * while anything is pending; refreshes the offline cache every 5 min while online.
 */
export function useSyncEngine(): void {
  const qc = useQueryClient()

  React.useEffect(() => {
    void useOutboxStore.getState().reload().then(() => drainOnce(qc))

    const onOnline = () => void drainOnce(qc)
    window.addEventListener("online", onOnline)

    const drainTimer = setInterval(() => {
      if (selectPending(useOutboxStore.getState()).length > 0) void drainOnce(qc)
    }, DRAIN_INTERVAL_MS)
    const pullTimer = setInterval(() => void pullChanges(), PULL_INTERVAL_MS)

    return () => {
      window.removeEventListener("online", onOnline)
      clearInterval(drainTimer)
      clearInterval(pullTimer)
    }
  }, [qc])
}

/** Returns a function that forces a drain now (e.g. a "Retry" button). */
export function useDrainNow(): () => void {
  const qc = useQueryClient()
  return React.useCallback(() => void drainOnce(qc), [qc])
}
