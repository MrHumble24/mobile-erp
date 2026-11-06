import { Receipt } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import { saleModelName, saleUnitCode } from "@/shared/lib/sale-subject"
import { Button } from "@/shared/ui/button"
import { MetricCard } from "@/shared/ui/metric-card"
import { useSales, type SaleView } from "@/entities/sale"

export interface SessionPanelProps {
  soldById?: string
  onOpenReceipt: (saleId: string) => void
}

function startOfTodayIso(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

function SaleRow({ sale, onOpenReceipt }: { sale: SaleView; onOpenReceipt: (id: string) => void }) {
  const { t } = useI18n()
  const time = new Date(sale.soldAt).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })
  const code = saleUnitCode(sale)
  const detail = code ?? t("catalog.pieces", { count: sale.quantity ?? 0 })
  return (
    <div className="flex items-center justify-between gap-2 py-2 border-b border-border last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{saleModelName(sale)}</p>
        <p className="text-xs text-muted-foreground font-mono">{time} · {detail}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-sm font-semibold">{formatMoney(sale.salePrice)}</span>
        <Button type="button" variant="ghost" size="icon" onClick={() => onOpenReceipt(sale.id)} aria-label={t("pos.receiptTitle")}>
          <Receipt className="size-4" />
        </Button>
      </div>
    </div>
  )
}

export function SessionPanel({ soldById, onOpenReceipt }: SessionPanelProps) {
  const { t } = useI18n()
  const { data } = useSales({ from: startOfTodayIso(), soldById, pageSize: 100 })
  const items = data?.items ?? []
  // ponytail: revenue sums the first page only; a cashier past 100 sales/day would under-count.
  const revenue = items.reduce((sum, s) => sum + Number(s.salePrice), 0)

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <MetricCard label={t("pos.todaySales")} value={data?.total ?? 0} />
        <MetricCard label={t("pos.todayRevenue")} value={formatMoney(revenue)} />
      </div>
      <div className="rounded-[16px] border border-border bg-card p-3 shadow-[var(--shadow-xs)]">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          {t("pos.recentSales")}
        </p>
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{t("pos.noSalesYet")}</p>
        ) : (
          items.slice(0, 5).map((sale) => (
            <SaleRow key={sale.id} sale={sale} onOpenReceipt={onOpenReceipt} />
          ))
        )}
      </div>
    </div>
  )
}
