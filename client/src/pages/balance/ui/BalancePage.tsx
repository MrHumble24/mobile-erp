import * as React from "react"
import { useI18n } from "@/shared/i18n"
import { useAuthStore } from "@/features/auth"
import { useLedgerBalances, useLedgerTransactions } from "@/entities/ledger"
import { PageHeader } from "@/shared/ui/page-header"
import { Pagination } from "@/shared/ui/pagination"
import { Skeleton } from "@/shared/ui/skeleton"
import { Switch } from "@/shared/ui/switch"
import { Label } from "@/shared/ui/label"
import { useBalanceFilters } from "../model/use-balance-filters"
import { BalanceAccounts } from "./BalanceAccounts"
import { BalanceActions } from "./BalanceActions"
import { BalanceFilters } from "./BalanceFilters"
import { BalanceHistoryTable } from "./BalanceHistoryTable"
import { StoreBreakdownTable } from "./StoreBreakdownTable"

export function BalancePage() {
  const { t } = useI18n()
  const canManage = useAuthStore((s) => s.hasPermission("balance.manage"))
  const canSeeAll = useAuthStore((s) => s.hasPermission("store.all"))
  const [allStores, setAllStores] = React.useState(false)
  const filters = useBalanceFilters()

  const { data: balances, isLoading: balancesLoading } = useLedgerBalances(allStores)
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

      <BalanceAccounts data={balances} isLoading={balancesLoading} />

      {allStores ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">
            {t("balance.storeBreakdown")}
          </h2>
          <StoreBreakdownTable stores={balances?.stores ?? []} />
        </div>
      ) : (
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
      )}
    </div>
  )
}
