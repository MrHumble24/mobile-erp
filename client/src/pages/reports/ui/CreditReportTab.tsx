import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import { useCreditReport } from "@/entities/credit"
import { MetricCard } from "@/shared/ui/metric-card"
import { Skeleton } from "@/shared/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"

/** Customer credit report (ADR 0035): totals and the customers behind them. */
export function CreditReportTab() {
  const { t } = useI18n()
  const { data, isLoading } = useCreditReport()

  if (isLoading) return <Skeleton className="h-64 rounded-[16px]" />
  if (!data) return null

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <MetricCard label={t("credit.totalOutstanding")} value={formatMoney(data.totalOutstanding)} variant="dark" />
        <MetricCard label={t("credit.totalOverdue")} value={formatMoney(data.totalOverdue)} variant="white" />
      </div>

      {data.customers.length === 0 ? (
        <div className="rounded-[16px] border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          {t("credit.noCredits")}
        </div>
      ) : (
        <div className="overflow-hidden rounded-[16px] border border-border bg-card shadow-[var(--shadow-xs)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("pos.customer")}</TableHead>
                <TableHead>{t("credit.outstanding")}</TableHead>
                <TableHead>{t("credit.overdueAmount")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.customers.map((c) => (
                <TableRow key={c.customerId}>
                  <TableCell>
                    <div className="font-semibold">{c.name}</div>
                    <div className="font-mono text-xs text-muted-foreground">{c.phone || "—"}</div>
                  </TableCell>
                  <TableCell className="font-mono font-semibold">{formatMoney(c.outstanding)}</TableCell>
                  <TableCell className="font-mono">
                    {Number(c.overdueAmount) > 0 ? (
                      <span className="text-destructive">{formatMoney(c.overdueAmount)}</span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
