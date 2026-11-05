import { useAuthStore } from "@/features/auth"
import { useSettings } from "@/entities/settings"

export const BASE_TABS = [
  "overview",
  "sales",
  "expenses",
  "nasiya",
  "credit",
  "inventory",
  "pricing",
  "closing",
] as const
export type ReportTab = (typeof BASE_TABS)[number] | "customs" | "repairs"

/** The visible report tabs plus the permission/feature flags that gate them. */
export function useReportTabs() {
  const canViewCost = useAuthStore((s) => s.user?.permissions?.includes("device.cost.view") ?? false)
  const canReadCustoms = useAuthStore((s) => s.user?.permissions?.includes("customs.read") ?? false)
  const canReadRepairs = useAuthStore((s) => s.user?.permissions?.includes("repair.read") ?? false)
  const { data: settings } = useSettings()
  const repairsOn = Boolean(settings?.repairsEnabled) && canReadRepairs
  const tabs: ReportTab[] = [
    ...BASE_TABS,
    ...(canReadCustoms ? (["customs"] as const) : []),
    ...(repairsOn ? (["repairs"] as const) : []),
  ]
  return { tabs, canViewCost, canReadCustoms, repairsOn }
}
