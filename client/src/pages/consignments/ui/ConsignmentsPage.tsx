import * as React from "react"
import { Download, Plus } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { useAuthStore } from "@/features/auth"
import { useConsignments, type ConsignmentView } from "@/entities/consignment"
import { ConsignDeviceDialog } from "@/features/consign-device"
import { ReturnConsignmentDialog, SettleConsignmentDialog } from "@/features/settle-consignment"
import { PageHeader } from "@/shared/ui/page-header"
import { Button } from "@/shared/ui/button"
import { Pagination } from "@/shared/ui/pagination"
import { Skeleton } from "@/shared/ui/skeleton"
import { useConsignmentFilters } from "../model/use-consignment-filters"
import { exportConsignmentsCsv } from "../lib/consignments-csv"
import { ConsignmentsFilters } from "./ConsignmentsFilters"
import { ConsignmentsSummary } from "./ConsignmentsSummary"
import { ConsignmentsTable } from "./ConsignmentsTable"
import { ConsignmentDetailSheet } from "./ConsignmentDetailSheet"

function useConsignmentDialogs() {
  const [createOpen, setCreateOpen] = React.useState(false)
  const [detailId, setDetailId] = React.useState<string | null>(null)
  const [settleItem, setSettleItem] = React.useState<ConsignmentView | null>(null)
  const [returnItem, setReturnItem] = React.useState<ConsignmentView | null>(null)
  return { createOpen, setCreateOpen, detailId, setDetailId, settleItem, setSettleItem, returnItem, setReturnItem }
}

export function ConsignmentsPage() {
  const { t } = useI18n()
  const canCreate = useAuthStore((s) => s.hasPermission("consignment.create"))
  const filters = useConsignmentFilters()
  const { data, isLoading } = useConsignments(filters.queryFilters)
  const d = useConsignmentDialogs()

  const actions = React.useMemo(
    () => ({
      onOpenDetail: (item: ConsignmentView) => d.setDetailId(item.id),
      onSettle: (item: ConsignmentView) => d.setSettleItem(item),
      onReturn: (item: ConsignmentView) => d.setReturnItem(item),
    }),
    [d]
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("consignments.title")}
        description={t("consignments.description")}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={!data || data.items.length === 0}
              onClick={() => data && exportConsignmentsCsv(data.items, t)}
            >
              <Download className="size-4" />
              {t("consignments.exportCsv")}
            </Button>
            {canCreate && (
              <Button onClick={() => d.setCreateOpen(true)} className="h-9 px-4 rounded-full text-xs font-semibold gap-1.5 shadow-xs">
                <Plus className="size-4" />
                {t("consignments.newConsignment")}
              </Button>
            )}
          </div>
        }
      />

      <ConsignmentsFilters filters={filters} />
      <ConsignmentsSummary filters={filters.queryFilters} />

      {isLoading ? (
        <Skeleton className="h-96 rounded-[16px]" />
      ) : (
        <ConsignmentsTable items={data?.items ?? []} actions={actions} />
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

      <ConsignDeviceDialog open={d.createOpen} onOpenChange={d.setCreateOpen} />
      <ConsignmentDetailSheet
        consignmentId={d.detailId}
        open={Boolean(d.detailId)}
        onClose={() => d.setDetailId(null)}
        onSettle={(c) => d.setSettleItem(c)}
        onReturn={(c) => d.setReturnItem(c)}
      />
      <SettleConsignmentDialog
        consignment={d.settleItem}
        open={Boolean(d.settleItem)}
        onOpenChange={(open) => !open && d.setSettleItem(null)}
      />
      <ReturnConsignmentDialog
        consignment={d.returnItem}
        open={Boolean(d.returnItem)}
        onOpenChange={(open) => !open && d.setReturnItem(null)}
      />
    </div>
  )
}
