import { create } from "zustand"
import { configureHttp } from "@/shared/api/http"

/**
 * Transport-level signal that the server is in restore maintenance (503
 * `MAINTENANCE`). Not business data — like the 401 handling, it lets the shell
 * react to a server-wide state. The global overlay reads `active`; the restore
 * action can set it the moment it gets its 202, without waiting for a 503.
 */
interface MaintenanceState {
  active: boolean
  setActive: (active: boolean) => void
}

export const useMaintenanceStore = create<MaintenanceState>((set) => ({
  active: false,
  setActive: (active) => set({ active }),
}))

configureHttp({
  onMaintenance: () => {
    if (!useMaintenanceStore.getState().active) {
      useMaintenanceStore.getState().setActive(true)
    }
  },
})
