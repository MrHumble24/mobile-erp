import { ShoppingCart } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import { Button } from "@/shared/ui/button"
import { useCartStore, useCartTenderPlan } from "@/features/checkout"
import type { usePosTerminal } from "../model/use-pos-terminal"

/**
 * A narrow-screen cart bar (fix, ADR 0034): fixed at the bottom while the seller
 * scrolls the catalog grid, showing the amount to pay and jumping to the cart.
 * Hidden on wide screens where the cart column is already in view.
 */
export function CartBar({ pos }: { pos: ReturnType<typeof usePosTerminal> }) {
  const { t } = useI18n()
  const lines = useCartStore((s) => s.lines)
  const plan = useCartTenderPlan()
  if (lines.length === 0) return null

  const jump = () =>
    document.getElementById("pos-cart")?.scrollIntoView({ behavior: "smooth", block: "start" })

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card p-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] lg:hidden">
      <div className="mx-auto flex max-w-3xl items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={jump}
          className="flex h-auto min-w-0 flex-1 items-center justify-start gap-2 px-1 text-left"
          aria-label={t("pos.cart")}
        >
          <ShoppingCart className="size-5 shrink-0 text-primary" />
          <span className="truncate">
            <span className="text-xs text-muted-foreground">
              {t("pos.lineCount", { count: lines.length })}
            </span>
            <span className="block text-base font-bold">{formatMoney(plan.amountToPay)}</span>
          </span>
        </Button>
        <Button
          type="button"
          size="lg"
          className="h-12 gap-2 font-bold"
          disabled={pos.blocked || pos.isPending}
          onClick={pos.handleCheckout}
        >
          {t("pos.checkoutButton")}
        </Button>
      </div>
    </div>
  )
}
