import * as React from "react"
import { useI18n } from "@/shared/i18n"
import { useAuthStore } from "@/features/auth"
import { useShifts, type ShiftListItem } from "@/entities/shift"
import { PageHeader } from "@/shared/ui/page-header"
import { Pagination } from "@/shared/ui/pagination"
import { Skeleton } from "@/shared/ui/skeleton"
import { useShiftsFilters } from "../model/use-shifts-filters"
import { useCashierOptions } from "../model/use-cashier-options"
import { ShiftsFilters } from "./ShiftsFilters"
import { ShiftsTable } from "./ShiftsTable"
import { ShiftsDialogs } from "./ShiftsDialogs"

export function ShiftsPage() {
  const { t } = useI18n()
  const canManage = useAuthStore((s) => s.hasPermission("shift.manage"))
  const meId = useAuthStore((s) => s.user?.id)
  const filters = useShiftsFilters()
  const { data, isLoading } = useShifts(filters.queryFilters)
  const cashiers = useCashierOptions(canManage)

  const [detailId, setDetailId] = React.useState<string | null>(null)
  const [forceTarget, setForceTarget] = React.useState<ShiftListItem | null>(null)

  return (
    <div className="space-y-6">
      <PageHeader title={t("shifts.title")} description={t("shifts.settingsHint")} />
      <ShiftsFilters filters={filters} cashiers={canManage ? cashiers : undefined} />
      {isLoading ? (
        <Skeleton className="h-96 rounded-[16px]" />
      ) : (
        <ShiftsTable
          items={data?.items ?? []}
          onOpen={setDetailId}
          canManage={canManage}
          meId={meId}
          onForceClose={setForceTarget}
        />
      )}
      {data && data.total > 0 && (
        <Pagination
          page={filters.page}
          pageSize={filters.pageSize}
          total={data.total}
          rangeLabel={(from, to, total) => t("inventory.pageRange", { from, to, total })}
          perPageLabel={t("inventory.perPage")}
          onPageChange={filters.setPage}
          onPageSizeChange={filters.setPageSize}
        />
      )}
      <ShiftsDialogs
        detailId={detailId}
        onCloseDetail={() => setDetailId(null)}
        forceTarget={forceTarget}
        onCloseForce={() => setForceTarget(null)}
      />
    </div>
  )
}

export default ShiftsPage
