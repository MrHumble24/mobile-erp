import * as React from "react"
import { useI18n } from "@/shared/i18n"
import { useAuthStore } from "@/features/auth"
import {
  useLedgerBalances,
  useLedgerStats,
  useLedgerTransactions,
} from "@/entities/ledger"
import { PageHeader } from "@/shared/ui/page-header"
import { Pagination } from "@/shared/ui/pagination"
import { Skeleton } from "@/shared/ui/skeleton"
import { Switch } from "@/shared/ui/switch"
import { Label } from "@/shared/ui/label"
import { useBalanceFilters } from "../model/use-balance-filters"
import { BalanceActions } from "./BalanceActions"
import { BalanceAnalyticsSection } from "./BalanceAnalyticsSection"
import { BalanceFilters } from "./BalanceFilters"
import { BalanceHistoryTable } from "./BalanceHistoryTable"
import { BalanceSummaryBar } from "./BalanceSummaryBar"
import { StoreBreakdownTable } from "./StoreBreakdownTable"

export function BalancePage() {
  const { t } = useI18n()
  const canManage = useAuthStore((s) => s.hasPermission("balance.manage"))
  const canSeeAll = useAuthStore((s) => s.hasPermission("store.all"))
  const [allStores, setAllStores] = React.useState(false)
  const filters = useBalanceFilters()

  const { data: balances, isLoading: balancesLoading } = useLedgerBalances(allStores)
  const { data: stats, isLoading: statsLoading } = useLedgerStats(
    allStores ? undefined : filters.statsFilters,
  )
  const { data: history, isLoading: historyLoading } = useLedgerTransactions(
    allStores ? undefined : filters.queryFilters,
  )
  const accounts = balances?.accounts ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("balance.title")}
        description={t("balance.pageDescription")}
        actions={
          <div className="flex items-center gap-4">
            {canSeeAll && (
              <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs">
                <Switch
                  id="all-stores-balance"
                  checked={allStores}
                  onCheckedChange={setAllStores}
                />
                <Label htmlFor="all-stores-balance" className="cursor-pointer text-xs font-medium">
                  {t("balance.allStores")}
                </Label>
              </div>
            )}
            {canManage && !allStores && <BalanceActions accounts={accounts} />}
          </div>
        }
      />

      <BalanceSummaryBar
        balances={balances}
        stats={stats?.summary}
        isLoading={balancesLoading || statsLoading}
      />

      {allStores ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">
            {t("balance.storeBreakdown")}
          </h2>
          <StoreBreakdownTable stores={balances?.stores ?? []} />
        </div>
      ) : (
        <div className="space-y-6">
          {/* ECharts Analytics Section */}
          <BalanceAnalyticsSection filters={filters.statsFilters} />

          {/* Explicit Ledger Table & Filters */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight">{t("balance.history")}</h2>
            </div>
            <BalanceFilters filters={filters} accounts={accounts} />
            {historyLoading ? (
              <Skeleton className="h-96 rounded-[16px]" />
            ) : (
              <BalanceHistoryTable items={history?.items ?? []} total={history?.total ?? 0} />
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
      )}
    </div>
  )
}
