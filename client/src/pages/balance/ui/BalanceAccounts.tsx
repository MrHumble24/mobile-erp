import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import { accountI18nKey, type LedgerBalances } from "@/entities/ledger"
import { MetricCard } from "@/shared/ui/metric-card"
import { Skeleton } from "@/shared/ui/skeleton"

function AmountCard({
  label,
  amount,
  belowZeroLabel,
  variant,
}: {
  label: string
  amount: number
  belowZeroLabel: string
  variant?: "dark"
}) {
  const negative = amount < 0
  return (
    <MetricCard
      label={label}
      variant={variant ?? "white"}
      subtext={negative ? belowZeroLabel : undefined}
      value={<span className={negative ? "text-destructive" : undefined}>{formatMoney(amount)}</span>}
    />
  )
}

export function BalanceAccounts({ data, isLoading }: { data?: LedgerBalances; isLoading: boolean }) {
  const { t } = useI18n()

  if (isLoading || !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-[140px] rounded-[16px]" />
        ))}
      </div>
    )
  }

  const belowZero = t("balance.belowZero")
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {data.accounts.map((a) => {
        const key = accountI18nKey(a.accountCode)
        return (
          <AmountCard
            key={a.accountCode}
            label={key ? t(key) : a.label}
            amount={a.balance}
            belowZeroLabel={belowZero}
          />
        )
      })}
      <AmountCard label={t("balance.total")} amount={data.total} belowZeroLabel={belowZero} variant="dark" />
    </div>
  )
}
