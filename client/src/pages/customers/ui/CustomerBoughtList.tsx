import { useI18n } from "@/shared/i18n"
import { formatMoney, formatDate } from "@/shared/lib/format"
import { useCustomerPurchases } from "@/entities/customer-purchase"

/** Phones the shop bought from this customer (Change 14, ADR 0039). */
export function CustomerBoughtList({ customerId }: { customerId: string }) {
  const { t } = useI18n()
  const { data } = useCustomerPurchases({ customerId, pageSize: 50 })
  const items = data?.items ?? []

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("purchases.empty")}</p>
  }

  return (
    <div className="space-y-2">
      {items.map((p) => (
        <div
          key={p.id}
          className="flex items-center justify-between gap-2 min-w-0 rounded-[12px] border border-border bg-muted p-2.5"
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{p.unit.model.brand} {p.unit.model.name}</p>
            <p className="font-mono text-xs text-muted-foreground truncate">
              {p.unit.imei ?? p.unit.serialNumber ?? "—"} · {formatDate(p.occurredAt)}
            </p>
          </div>
          {p.pricePaid != null && (
            <span className="shrink-0 font-mono text-sm font-semibold whitespace-nowrap tabular-nums">{formatMoney(p.pricePaid)}</span>
          )}
        </div>
      ))}
    </div>
  )
}
