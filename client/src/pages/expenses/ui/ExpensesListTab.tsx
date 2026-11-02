import { useI18n } from "@/shared/i18n"
import type { ExpensePage } from "@/entities/expense"
import { Pagination } from "@/shared/ui/pagination"
import { Skeleton } from "@/shared/ui/skeleton"
import type { ExpenseFiltersState } from "../model/use-expense-filters"
import { ExpenseFilters } from "./ExpenseFilters"
import { ExpensesSummary } from "./ExpensesSummary"
import { ExpenseBreakdown } from "./ExpenseBreakdown"
import { ExpensesTable, type ExpenseRowActions } from "./ExpensesTable"

export function ExpensesListTab({
  filters,
  data,
  isLoading,
  canManage,
  canReadUsers,
  actions,
}: {
  filters: ExpenseFiltersState
  data?: ExpensePage
  isLoading: boolean
  canManage: boolean
  canReadUsers: boolean
  actions: ExpenseRowActions
}) {
  const { t } = useI18n()

  return (
    <div className="space-y-5">
      <ExpensesSummary from={filters.summaryParams.from} to={filters.summaryParams.to} />
      <ExpenseFilters filters={filters} canReadUsers={canReadUsers} />
      <ExpenseBreakdown from={filters.summaryParams.from} to={filters.summaryParams.to} />
      {isLoading ? (
        <Skeleton className="h-96 rounded-[16px]" />
      ) : (
        <ExpensesTable
          expenses={data?.items ?? []}
          canManage={canManage}
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
