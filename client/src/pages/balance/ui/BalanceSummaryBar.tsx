import { ArrowDownLeft, ArrowUpRight, TrendingUp, Wallet } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import {
  accountI18nKey,
  type LedgerBalances,
  type LedgerStatsSummary,
} from "@/entities/ledger"
import { Skeleton } from "@/shared/ui/skeleton"

interface Props {
  balances?: LedgerBalances
  stats?: LedgerStatsSummary
  isLoading: boolean
}

export function BalanceSummaryBar({ balances, stats, isLoading }: Props) {
  const { t } = useI18n()

  if (isLoading || !balances) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 rounded-[16px]" />
        ))}
      </div>
    )
  }

  const netFlowNum = stats ? Number(stats.netFlow) : 0
  const isNetPositive = netFlowNum >= 0

  // Build account breakdown subtext, e.g. "Naqd: $94,250 • Karta: $0"
  const accountsSubtext = balances.accounts
    .map((a) => {
      const key = accountI18nKey(a.accountCode)
      const label = key ? t(key) : a.label
      return `${label}: ${formatMoney(a.balance)}`
    })
    .join(" • ")

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Total Treasury Balance */}
      <div className="relative overflow-hidden rounded-[16px] border border-border bg-card p-4 shadow-[var(--shadow-xs)]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            {t("balance.total")}
          </span>
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Wallet className="size-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="font-mono text-2xl font-bold tracking-tight text-foreground">
            {formatMoney(balances.total)}
          </div>
          <p className="mt-1 truncate text-xs text-muted-foreground" title={accountsSubtext}>
            {accountsSubtext}
          </p>
        </div>
      </div>

      {/* 2. Total Inflow */}
      <div className="relative overflow-hidden rounded-[16px] border border-border bg-card p-4 shadow-[var(--shadow-xs)]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            {t("balance.totalIn")}
          </span>
          <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 dark:text-emerald-400">
            <ArrowDownLeft className="size-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="font-mono text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            {stats ? `+${formatMoney(Number(stats.totalIn))}` : "—"}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {stats ? t("balance.entriesCount", { count: stats.inCount }) : ""}
          </p>
        </div>
      </div>

      {/* 3. Total Outflow */}
      <div className="relative overflow-hidden rounded-[16px] border border-border bg-card p-4 shadow-[var(--shadow-xs)]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            {t("balance.totalOut")}
          </span>
          <div className="flex size-7 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
            <ArrowUpRight className="size-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="font-mono text-2xl font-bold tracking-tight text-destructive">
            {stats ? `-${formatMoney(Number(stats.totalOut))}` : "—"}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {stats ? t("balance.entriesCount", { count: stats.outCount }) : ""}
          </p>
        </div>
      </div>

      {/* 4. Net Cash Flow */}
      <div className="relative overflow-hidden rounded-[16px] border border-border bg-card p-4 shadow-[var(--shadow-xs)]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            {t("balance.netFlow")}
          </span>
          <div
            className={`flex size-7 items-center justify-center rounded-lg ${
              isNetPositive
                ? "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400"
                : "bg-destructive/10 text-destructive"
            }`}
          >
            <TrendingUp className="size-4" />
          </div>
        </div>
        <div className="mt-2">
          <div
            className={`font-mono text-2xl font-bold tracking-tight ${
              isNetPositive
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-destructive"
            }`}
          >
            {stats
              ? `${isNetPositive && netFlowNum > 0 ? "+" : ""}${formatMoney(netFlowNum)}`
              : "—"}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {stats ? t("balance.operationsCount") + `: ${stats.transactionCount}` : ""}
          </p>
        </div>
      </div>
    </div>
  )
}

