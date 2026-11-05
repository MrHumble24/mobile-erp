import * as React from "react"
import { Navigate } from "react-router"
import { Plus } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { useAuthStore } from "@/features/auth"
import { useSettings } from "@/entities/settings"
import { useRepairs } from "@/entities/repair"
import { NewRepairDialog } from "@/features/repair-ticket"
import { PageHeader } from "@/shared/ui/page-header"
import { Button } from "@/shared/ui/button"
import { Skeleton } from "@/shared/ui/skeleton"
import { useRepairsFilters } from "../model/use-repairs-filters"
import { RepairsFilters } from "./RepairsFilters"
import { RepairsTable } from "./RepairsTable"
import { RepairDetailSheet } from "./RepairDetailSheet"

export function RepairsPage() {
  const { t } = useI18n()
  const { data: settings, isLoading: settingsLoading } = useSettings()
  const canManage = useAuthStore((s) => s.hasPermission("repair.manage"))
  const filters = useRepairsFilters()
  const { data, isLoading } = useRepairs(filters.queryFilters)
  const [detailId, setDetailId] = React.useState<string | null>(null)
  const [newOpen, setNewOpen] = React.useState(false)

  // Repairs is an optional feature; stay out entirely when it is off.
  if (settingsLoading) return <Skeleton className="h-96 rounded-[16px]" />
  if (settings && !settings.repairsEnabled) return <Navigate to="/" replace />

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader title={t("repairs.title")} description={t("repairs.pageDescription")} />
        {canManage && (
          <Button size="sm" className="gap-1.5" onClick={() => setNewOpen(true)}>
            <Plus className="size-4" />
            {t("repairs.newTicket")}
          </Button>
        )}
      </div>
      <RepairsFilters filters={filters} />
      {isLoading ? (
        <Skeleton className="h-96 rounded-[16px]" />
      ) : (
        <RepairsTable repairs={data?.items ?? []} onOpen={setDetailId} />
      )}
      <RepairDetailSheet
        repairId={detailId}
        open={Boolean(detailId)}
        onOpenChange={(o) => !o && setDetailId(null)}
      />
      <NewRepairDialog open={newOpen} onOpenChange={setNewOpen} />
    </div>
  )
}

export default RepairsPage
