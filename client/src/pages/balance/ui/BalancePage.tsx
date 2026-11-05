import { useI18n } from "@/shared/i18n"
import { useAuthStore } from "@/features/auth"
import { useLedgerBalances, useLedgerTransactions } from "@/entities/ledger"
import { PageHeader } from "@/shared/ui/page-header"
import { Pagination } from "@/shared/ui/pagination"
import { Skeleton } from "@/shared/ui/skeleton"
import { useBalanceFilters } from "../model/use-balance-filters"
import { BalanceAccounts } from "./BalanceAccounts"
import { BalanceActions } from "./BalanceActions"
import { BalanceFilters } from "./BalanceFilters"
import { BalanceHistoryTable } from "./BalanceHistoryTable"

export function BalancePage() {
  const { t } = useI18n()
  const canManage = useAuthStore((s) => s.hasPermission("balance.manage"))
  const filters = useBalanceFilters()

  const { data: balances, isLoading: balancesLoading } = useLedgerBalances()
  const { data: history, isLoading: historyLoading } = useLedgerTransactions(filters.queryFilters)
  const accounts = balances?.accounts ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("balance.title")}
        description={t("balance.pageDescription")}
        actions={canManage ? <BalanceActions accounts={accounts} /> : undefined}
      />

      <BalanceAccounts data={balances} isLoading={balancesLoading} />

      <div className="space-y-5">
        <h2 className="text-lg font-semibold tracking-tight">{t("balance.history")}</h2>
        <BalanceFilters filters={filters} accounts={accounts} />
        {historyLoading ? (
          <Skeleton className="h-96 rounded-[16px]" />
        ) : (
          <BalanceHistoryTable items={history?.items ?? []} />
        )}
        {history && history.total > 0 && (
          <Pagination
            page={filters.page}
            pageSize={filters.pageSize}
            total={history.total}
            rangeLabel={(from, to, total) => t("inventory.pageRange", { from, to, total })}
            perPageLabel={t("inventory.perPage")}
            onPageChange={filters.setPage}
            onPageSizeChange={filters.setPageSize}
          />
        )}
      </div>
    </div>
  )
}
