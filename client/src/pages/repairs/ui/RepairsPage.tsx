import { useSearchParams } from "react-router"
import { Plus } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { useAuthStore } from "@/features/auth"
import { useSettings } from "@/entities/settings"
import { useRepairs, RepairLoadError } from "@/entities/repair"
import { NewRepairDialog } from "@/features/repair-ticket"
import { PageHeader } from "@/shared/ui/page-header"
import { Button } from "@/shared/ui/button"
import { Skeleton } from "@/shared/ui/skeleton"
import { Pagination } from "@/shared/ui/pagination"
import { useRepairsFilters, type RepairsFiltersState } from "../model/use-repairs-filters"
import { useNewTicketParams } from "../model/use-new-ticket-params"
import { RepairsFilters } from "./RepairsFilters"
import { RepairsTable } from "./RepairsTable"
import { RepairDetailSheet } from "./RepairDetailSheet"
import { RepairsDisabled } from "./RepairsDisabled"

type ListQuery = ReturnType<typeof useRepairs>

function RepairsResults({
  list,
  filters,
  onOpen,
}: {
  list: ListQuery
  filters: RepairsFiltersState
  onOpen: (id: string) => void
}) {
  const { t } = useI18n()
  if (list.isLoading) return <Skeleton className="h-96 rounded-[16px]" />
  if (list.isError) return <RepairLoadError onRetry={() => void list.refetch()} />
  return (
    <>
      <RepairsTable
        repairs={list.data?.items ?? []}
        onOpen={onOpen}
        hasFilters={filters.hasFilters}
        onClear={filters.clearAll}
      />
      <Pagination
        page={filters.page}
        pageSize={filters.pageSize}
        total={list.data?.total ?? 0}
        rangeLabel={(from, to, total) => t("inventory.pageRange", { from, to, total })}
        onPageChange={filters.setPage}
        onPageSizeChange={filters.setPageSize}
      />
    </>
  )
}

export function RepairsPage() {
  const { t } = useI18n()
  const settings = useSettings()
  const canManage = useAuthStore((s) => s.hasPermission("repair.manage"))
  const filters = useRepairsFilters()
  const list = useRepairs(filters.queryFilters)
  const [params, setParams] = useSearchParams()
  const newTicket = useNewTicketParams()
  const detailId = params.get("ticket")

  const setDetailId = (id: string | null) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      if (id) next.set("ticket", id)
      else next.delete("ticket")
      return next
    }, { replace: true })
  }

  if (settings.isLoading) return <Skeleton className="h-96 rounded-[16px]" />
  if (settings.isError) return <RepairLoadError onRetry={() => void settings.refetch()} />
  if (!settings.data?.repairsEnabled) return <RepairsDisabled />

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader title={t("repairs.title")} description={t("repairs.pageDescription")} />
        {canManage && (
          <Button size="sm" className="gap-1.5" onClick={newTicket.launch}>
            <Plus className="size-4" />
            {t("repairs.newTicket")}
          </Button>
        )}
      </div>
      <RepairsFilters filters={filters} />
      <RepairsResults list={list} filters={filters} onOpen={setDetailId} />
      <RepairDetailSheet
        repairId={detailId}
        open={Boolean(detailId)}
        onOpenChange={(o) => !o && setDetailId(null)}
      />
      <NewRepairDialog
        open={newTicket.open}
        onOpenChange={(o) => !o && newTicket.clear()}
        initialImei={newTicket.imei}
      />
    </div>
  )
}

export default RepairsPage
