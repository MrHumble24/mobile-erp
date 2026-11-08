import { useI18n } from "@/shared/i18n"
import { formatMoney, formatDate, formatDateTime } from "@/shared/lib/format"
import { accountLabel } from "@/entities/ledger"
import { Badge } from "@/shared/ui/badge"
import type { CreditView } from "@/entities/credit"

function SectionTitle({ children }: { children: string }) {
  return <h3 className="text-sm font-semibold tracking-tight">{children}</h3>
}

export function CreditTotals({ credit }: { credit: CreditView }) {
  const { t } = useI18n()
  const rows: [string, string][] = [
    [t("credit.agreedTotal"), formatMoney(credit.agreedTotal)],
    [t("credit.paid"), formatMoney(credit.paid)],
    [t("credit.outstanding"), formatMoney(credit.outstanding)],
    [t("credit.overdueAmount"), formatMoney(credit.overdueAmount)],
  ]
  if (Number(credit.markupAmount) > 0) {
    rows.unshift(
      [t("credit.cashPrice"), formatMoney(credit.cashPrice)],
      [t("credit.markup"), `+ ${formatMoney(credit.markupAmount)}`]
    )
  }
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {rows.map(([label, value]) => (
        <div key={label} className="rounded-[12px] border border-border bg-muted p-3 min-w-0">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground truncate">{label}</div>
          <div className="mt-0.5 text-sm font-semibold whitespace-nowrap tabular-nums">{value}</div>
        </div>
      ))}
    </div>
  )
}

export function CreditGoods({ credit }: { credit: CreditView }) {
  const { t } = useI18n()
  return (
    <div className="space-y-2">
      <SectionTitle>{t("credit.goods")}</SectionTitle>
      {credit.sales.map((sale) => {
        const code = sale.imei || sale.serialNumber
        return (
          <div
            key={sale.saleId}
            className="flex items-center justify-between gap-3 rounded-[10px] border border-border bg-card p-2.5 text-sm min-w-0"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">
                {sale.model}
                {sale.quantity != null ? ` ×${sale.quantity}` : ""}
              </p>
              {code && <p className="truncate font-mono text-xs text-muted-foreground">{code}</p>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {sale.returnedAt && <Badge variant="outline">{t("sales.returned")}</Badge>}
              <span className="font-mono whitespace-nowrap tabular-nums">{formatMoney(sale.salePrice)}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function CreditPlan({ credit }: { credit: CreditView }) {
  const { t } = useI18n()
  return (
    <div className="space-y-2">
      <SectionTitle>{t("credit.plan")}</SectionTitle>
      {credit.instalments.map((inst, i) => (
        <div
          key={inst.id}
          className="flex items-center justify-between gap-3 rounded-[10px] border border-border bg-card p-2.5 text-sm min-w-0"
        >
          <div className="min-w-0">
            <p className="font-medium truncate">{t("credit.instalment", { n: i + 1 })}</p>
            <p className="text-xs text-muted-foreground">{formatDate(inst.dueDate)}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {inst.overdue && <Badge variant="destructive">{t("credit.overdue")}</Badge>}
            <div className="text-right">
              <span className="font-mono font-semibold whitespace-nowrap tabular-nums">{formatMoney(inst.amount)}</span>
              <p className="text-xs text-muted-foreground whitespace-nowrap tabular-nums">
                {t("credit.paid")}: {formatMoney(inst.paid)}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function CreditPayments({ credit }: { credit: CreditView }) {
  const { t } = useI18n()
  if (credit.payments.length === 0) return null
  return (
    <div className="space-y-2">
      <SectionTitle>{t("credit.payments")}</SectionTitle>
      {credit.payments.map((p) => (
        <div
          key={p.id}
          className="flex items-center justify-between gap-3 rounded-[10px] border border-border bg-card p-2.5 text-sm min-w-0"
        >
          <div className="min-w-0">
            <p className="font-medium truncate">{accountLabel(p.accountCode, undefined, t)}</p>
            <p className="text-xs text-muted-foreground">{formatDateTime(p.occurredAt)}</p>
          </div>
          <span className={`font-mono shrink-0 whitespace-nowrap tabular-nums ${Number(p.amount) < 0 ? "text-destructive" : ""}`}>
            {formatMoney(p.amount)}
          </span>
        </div>
      ))}
    </div>
  )
}
