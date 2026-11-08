import { HandCoins } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { Button } from "@/shared/ui/button"
import {
  CartDiscountControl,
  CompactCartLines,
  CustomerPanel,
  PriceLevelControl,
  TotalsPanel,
  TradeInSection,
  useCartStore,
} from "@/features/checkout"
import type { usePosTerminal } from "../model/use-pos-terminal"

type Pos = ReturnType<typeof usePosTerminal>

/** The single entry point to the full-screen installment step. */
function CreditButton({ pos }: { pos: Pos }) {
  const { t } = useI18n()
  const lines = useCartStore((s) => s.lines)
  const disabled = lines.length === 0 || pos.noOpenShift || pos.hasTradeIn

  return (
    <div className="space-y-1.5">
      <Button
        type="button"
        variant="outline"
        className="h-12 w-full gap-2 border-foreground/25 bg-card text-sm font-bold"
        disabled={disabled}
        onClick={pos.navigateToCredit}
      >
        <HandCoins className="size-4" />
        {t("credit.payOnCredit")}
      </Button>
      {pos.hasTradeIn && (
        <p className="text-center text-xs text-muted-foreground">{t("purchases.tradeInNoCredit")}</p>
      )}
    </div>
  )
}

/**
 * The checkout side of the till. Adjustments, totals, payment method and the
 * two sale actions form one tight group at the top of the column, so the amount
 * to pay and the confirm button are always on screen — no page scroll is ever
 * needed to finish a sale. Only a very short viewport scrolls this column.
 */
export function PosTillPane({ pos }: { pos: Pos }) {
  const catalog = pos.inputMode === "catalog"
  const linePerms = {
    canViewCost: pos.canViewCost,
    minMarginPercent: pos.minMargin,
    canOverridePrice: pos.canOverridePrice,
    canDiscountUnlimited: pos.canDiscountUnlimited,
  }

  return (
    <aside
      id="pos-cart"
      className="flex w-full shrink-0 flex-col gap-3 lg:w-[380px] lg:max-h-full lg:overflow-y-auto xl:w-[420px]"
    >
      <div className="space-y-3">
        {catalog && <CompactCartLines {...linePerms} />}
        <div className="space-y-3 rounded-[16px] border border-border bg-card p-4 shadow-[var(--shadow-xs)]">
          <PriceLevelControl />
          <CustomerPanel searchOpen={pos.customerOpen} onSearchOpenChange={pos.setCustomerOpen} />
        </div>
        <CartDiscountControl canDiscountUnlimited={pos.canDiscountUnlimited} />
        {pos.canTradeIn && <TradeInSection offline={!pos.online} />}
      </div>

      <div className="shrink-0 space-y-2">
        <TotalsPanel isPending={pos.isPending} disabled={pos.blocked} onCheckout={pos.handleCheckout} />
        {pos.creditEnabled && <CreditButton pos={pos} />}
      </div>
    </aside>
  )
}
