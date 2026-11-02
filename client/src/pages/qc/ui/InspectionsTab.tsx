import * as React from "react"
import { useI18n } from "@/shared/i18n"
import { useAuthStore } from "@/features/auth"
import { useDefectTypes, useGrades, type QcInspectionListItem } from "@/entities/qc"
import { Pagination } from "@/shared/ui/pagination"
import { InspectionsFilters } from "./InspectionsFilters"
import { InspectionsTable } from "./InspectionsTable"
import { InspectionDetailSheet } from "./InspectionDetailSheet"
import { useInspectionBrowser } from "../model/use-inspection-browser"

export function InspectionsTab() {
  const { t } = useI18n()
  const hasPermission = useAuthStore((s) => s.hasPermission)
  const canViewCost = hasPermission("device.cost.view")
  const canReadUsers = hasPermission("user.read")
  const { filters, pagination, query } = useInspectionBrowser()
  const { data: grades } = useGrades()
  const { data: defectTypes } = useDefectTypes()
  const [selected, setSelected] = React.useState<QcInspectionListItem | null>(null)

  const data = query.data

  return (
    <div className="space-y-5">
      <InspectionsFilters
        filters={filters}
        grades={grades || []}
        defectTypes={defectTypes || []}
        canReadUsers={canReadUsers}
      />
      {query.isLoading ? (
        <div className="py-12 text-center text-muted-foreground">{t("common.loading")}</div>
      ) : (
        <InspectionsTable items={data?.items || []} canViewCost={canViewCost} onSelect={setSelected} />
      )}
      {data && data.total > 0 && (
        <Pagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          total={data.total}
          rangeLabel={(from, to, total) => t("inventory.pageRange", { from, to, total })}
          perPageLabel={t("inventory.perPage")}
          onPageChange={pagination.setPage}
          onPageSizeChange={pagination.setPageSize}
        />
      )}
      <InspectionDetailSheet
        item={selected}
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        defectTypes={defectTypes || []}
      />
    </div>
  )
}
