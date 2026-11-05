import { ShoppingCart } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import { Button } from "@/shared/ui/button"
import { useCartStore } from "../model/cart.store"
import { cartTotals } from "../lib/line-pricing"
import { PaymentPanel } from "./PaymentPanel"

export interface TotalsPanelProps {
  isPending: boolean
  disabled: boolean
  onCheckout: () => void
}

function SummaryRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={strong ? "font-semibold" : "text-muted-foreground"}>{label}</span>
      <span className={strong ? "text-lg font-bold" : "font-medium"}>{value}</span>
    </div>
  )
}

export function TotalsPanel({ isPending, disabled, onCheckout }: TotalsPanelProps) {
  const { t } = useI18n()
  const lines = useCartStore((s) => s.lines)
  const level = useCartStore((s) => s.priceLevelCode)
  const totals = cartTotals(lines, level)
  const withWarranty = lines.filter((line) => line.kind === "unit" && line.warrantyDays > 0).length

  return (
    <div className="rounded-[16px] border border-[#e8e8e8] bg-white p-4 shadow-[var(--shadow-xs)] space-y-3 sticky top-4">
      <div className="space-y-2 text-sm">
        <SummaryRow label={t("pos.lineCount")} value={String(lines.length)} />
        <SummaryRow label={t("pricing.listPrice")} value={formatMoney(totals.listTotal)} />
        {totals.discountTotal > 0 && (
          <SummaryRow
            label={t("pricing.discount")}
            value={`− ${formatMoney(totals.discountTotal)}`}
          />
        )}
        <SummaryRow
          label={t("pos.warrantySummary")}
          value={t("pos.warrantyCount", { count: withWarranty })}
        />
        <div className="border-t border-[#e8e8e8] pt-2">
          <SummaryRow label={t("pos.totalDue")} value={formatMoney(totals.dueTotal)} strong />
        </div>
      </div>
      {lines.length > 0 && <PaymentPanel />}
      <Button
        type="button"
        size="lg"
        className="w-full h-12 text-base font-bold gap-2"
        disabled={disabled || isPending}
        onClick={onCheckout}
      >
        <ShoppingCart className="size-5" />
        {isPending ? t("pos.completingSale") : t("pos.checkoutButton")}
        <kbd className="ml-1 rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-mono">F9</kbd>
      </Button>
    </div>
  )
}
