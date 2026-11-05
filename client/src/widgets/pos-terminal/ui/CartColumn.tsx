import { HandCoins } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { Button } from "@/shared/ui/button"
import {
  CartLines,
  CompactCartLines,
  CustomerPanel,
  PriceLevelControl,
  CartDiscountControl,
  TotalsPanel,
  TradeInSection,
  useCartStore,
  cartTotals,
  toCreditLines,
} from "@/features/checkout"
import { CreditDialog } from "@/features/pay-on-credit"
import type { usePosTerminal } from "../model/use-pos-terminal"

type Pos = ReturnType<typeof usePosTerminal>

/** The "sell on credit" entry point + its dialog, wired to the live cart. */
function CreditSell({ pos }: { pos: Pos }) {
  const { t } = useI18n()
  const lines = useCartStore((s) => s.lines)
  const level = useCartStore((s) => s.priceLevelCode)
  const customer = useCartStore((s) => s.customer)
  const dueTotal = cartTotals(lines, level).dueTotal

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="h-11 w-full gap-2 font-semibold"
        disabled={lines.length === 0 || pos.noOpenShift || pos.hasTradeIn}
        onClick={() => pos.setCreditOpen(true)}
      >
        <HandCoins className="size-4" />
        {t("credit.payOnCredit")}
      </Button>
      {pos.hasTradeIn && (
        <p className="text-xs text-muted-foreground">{t("purchases.tradeInNoCredit")}</p>
      )}
      <CreditDialog
        open={pos.creditOpen}
        onOpenChange={pos.setCreditOpen}
        lines={toCreditLines(lines, level)}
        dueTotal={dueTotal}
        customerId={customer?.id}
        customerName={customer?.name}
        customerPhone={customer?.phone}
        offline={!pos.online}
        onSold={pos.resetCart}
      />
    </>
  )
}

/**
 * The cart column. In the catalog till it is `pinned`: the lines, then the
 * level/customer/discount, scroll inside a bounded top while the totals +
 * checkout stay in view at the bottom, also on a short screen (ADR 0034 cart-column fix). Elsewhere it stacks.
 */
export function CartColumn({ pos, pinned = false }: { pos: Pos; pinned?: boolean }) {
  const linePerms = {
    canViewCost: pos.canViewCost,
    minMarginPercent: pos.minMargin,
    canOverridePrice: pos.canOverridePrice,
    canDiscountUnlimited: pos.canDiscountUnlimited,
  }

  if (!pinned) {
    return (
      <div id="pos-cart" className="space-y-4">
        <CartLines {...linePerms} />
        <div className="space-y-3 rounded-[16px] border border-[#e8e8e8] bg-white p-4 shadow-[var(--shadow-xs)]">
          <PriceLevelControl />
          <CustomerPanel searchOpen={pos.customerOpen} onSearchOpenChange={pos.setCustomerOpen} />
        </div>
        <CartDiscountControl canDiscountUnlimited={pos.canDiscountUnlimited} />
        <TradeInSection offline={!pos.online} />
        <TotalsPanel isPending={pos.isPending} disabled={pos.blocked} onCheckout={pos.handleCheckout} />
        {pos.creditEnabled && <CreditSell pos={pos} />}
      </div>
    )
  }

  return (
    <div id="pos-cart" className="flex min-h-0 flex-col gap-3 lg:h-full">
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-0.5">
        <CompactCartLines {...linePerms} />
        <div className="space-y-3 rounded-[16px] border border-[#e8e8e8] bg-white p-3 shadow-[var(--shadow-xs)]">
          <PriceLevelControl />
          <CustomerPanel searchOpen={pos.customerOpen} onSearchOpenChange={pos.setCustomerOpen} />
          <CartDiscountControl canDiscountUnlimited={pos.canDiscountUnlimited} />
          <TradeInSection offline={!pos.online} />
        </div>
      </div>
      <div className="shrink-0 space-y-2">
        <TotalsPanel isPending={pos.isPending} disabled={pos.blocked} onCheckout={pos.handleCheckout} />
        {pos.creditEnabled && <CreditSell pos={pos} />}
      </div>
    </div>
  )
}
