import { useI18n } from "@/shared/i18n"
import { formatMoney, formatDateTime } from "@/shared/lib/format"
import { accountLabel } from "@/entities/ledger"
import type { RepairView } from "@/entities/repair"

/** Customer payments and refunds on the ticket (read-only). */
export function RepairPaymentsList({ repair }: { repair: RepairView }) {
  const { t } = useI18n()
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold tracking-tight">{t("repairs.paymentsTitle")}</h3>
      {repair.payments.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t("repairs.noPayments")}</p>
      ) : (
        <div className="space-y-1.5">
          {repair.payments.map((p) => {
            const amount = Number(p.amount)
            return (
              <div key={p.id} className="flex items-center justify-between gap-3 rounded-[10px] border border-border bg-card p-2.5 text-sm min-w-0">
                <div className="min-w-0">
                  <div className={`font-mono font-semibold whitespace-nowrap tabular-nums ${amount < 0 ? "text-destructive" : ""}`}>
                    {formatMoney(amount)}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {accountLabel(p.accountCode, undefined, t)} · {formatDateTime(p.occurredAt)}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{p.receivedBy.name}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
