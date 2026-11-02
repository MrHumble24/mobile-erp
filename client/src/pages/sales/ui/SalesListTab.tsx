import { useI18n } from "@/shared/i18n"
import type { SalePage } from "@/entities/sale"
import { Pagination } from "@/shared/ui/pagination"
import { Skeleton } from "@/shared/ui/skeleton"
import type { SalesFiltersState } from "../model/use-sales-filters"
import type { SaleRowActions } from "./SalesTableRow"
import { SalesFilters } from "./SalesFilters"
import { SalesSummary } from "./SalesSummary"
import { SalesTable } from "./SalesTable"

export function SalesListTab({
  filters,
  data,
  isLoading,
  hasProfitView,
  canReturn,
  canReadUsers,
  actions,
}: {
  filters: SalesFiltersState
  data?: SalePage
  isLoading: boolean
  hasProfitView: boolean
  canReturn: boolean
  canReadUsers: boolean
  actions: SaleRowActions
}) {
  const { t } = useI18n()

  return (
    <div className="space-y-5">
      <SalesFilters filters={filters} canReadUsers={canReadUsers} />
      <SalesSummary filters={filters.queryFilters} canViewProfit={hasProfitView} />
      {isLoading ? (
        <Skeleton className="h-96 rounded-[16px]" />
      ) : (
        <SalesTable
          sales={data?.items ?? []}
          hasProfitView={hasProfitView}
          canReturn={canReturn}
          actions={actions}
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
    </div>
  )
}
