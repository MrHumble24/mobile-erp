import { create } from "zustand"
import { configureHttp } from "@/shared/api/http"

/**
 * Transport-level signal that the server is in restore maintenance (503
 * `MAINTENANCE`). Not business data — like the 401 handling, it lets the shell
 * react to a server-wide state. The global overlay reads `active`; the restore
 * action can set it the moment it gets its 202, without waiting for a 503.
 */
/** Which destructive operation holds maintenance, so the overlay shows the
 * right wording and polls the matching status. A bystander who only sees a 503
 * keeps the default (restore) — sessions end within seconds either way. */
export type MaintenanceMode = "restore" | "wipe" | "reset"

interface MaintenanceState {
  active: boolean
  mode: MaintenanceMode
  setActive: (active: boolean, mode?: MaintenanceMode) => void
}

export const useMaintenanceStore = create<MaintenanceState>((set, get) => ({
  active: false,
  mode: "restore",
  setActive: (active, mode) =>
    set({ active, mode: active ? (mode ?? get().mode) : "restore" }),
}))

configureHttp({
  onMaintenance: () => {
    if (!useMaintenanceStore.getState().active) {
      useMaintenanceStore.getState().setActive(true)
    }
  },
})
