import { useLedgerStats, type LedgerStatsFilters } from "@/entities/ledger"
import { CashFlowTimelineChart } from "./charts/CashFlowTimelineChart"
import { CashFlowBreakdownChart } from "./charts/CashFlowBreakdownChart"

interface Props {
  filters: LedgerStatsFilters
}

export function BalanceAnalyticsSection({ filters }: Props) {
  const { data: stats, isLoading } = useLedgerStats(filters)

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <CashFlowTimelineChart
          data={stats?.timeline ?? []}
          isLoading={isLoading}
        />
      </div>
      <div className="lg:col-span-1">
        <CashFlowBreakdownChart
          items={stats?.byType ?? []}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}

