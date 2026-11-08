import * as React from "react"
import { useNavigate } from "react-router"
import { ArrowLeft, ShoppingBag } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { Button } from "@/shared/ui/button"
import { CreditStep } from "@/features/pay-on-credit"
import { toCreditLines, useCartStore } from "@/features/checkout"
import { usePosTerminal } from "@/widgets/pos-terminal/model/use-pos-terminal"
import { useFullscreen } from "@/widgets/pos-terminal/model/use-fullscreen"

/**
 * The dedicated, full-screen installment ("Muddatli to'lov") page. It owns the
 * whole viewport: no sidebar, no header, no page scroll — just the down
 * payment, the auto-calculated plan and the agreed total. The cart lives in the
 * persisted zustand store so nothing is lost coming here from /pos.
 */
export function PosCreditPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const pos = usePosTerminal()
  const setCustomer = useCartStore((s) => s.setCustomer)
  const fullscreen = useFullscreen()

  // Leaving the page must release browser fullscreen.
  const { exit: exitFullscreen } = fullscreen
  React.useEffect(() => {
    return () => {
      void exitFullscreen()
    }
  }, [exitFullscreen])

  // If no items in cart, show a clean, helpful empty state rather than abrupt redirect
  if (pos.lines.length === 0) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-muted p-6 text-center">
        <div className="max-w-md w-full space-y-4 rounded-[18px] border border-border bg-card p-8 shadow-[var(--shadow-xs)]">
          <div className="mx-auto grid size-14 place-items-center rounded-full bg-primary/10 text-primary">
            <ShoppingBag className="size-7" />
          </div>
          <h2 className="font-display text-lg font-bold text-foreground">
            {t("credit.emptyCart")}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t("credit.emptyCartHint")}
          </p>
          <Button
            type="button"
            className="h-11 w-full gap-2 font-semibold shadow-sm"
            onClick={() => navigate("/pos")}
          >
            <ArrowLeft className="size-4" />
            {t("credit.goToPos")}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full overflow-hidden bg-muted">
      <CreditStep
        lines={toCreditLines(pos.lines, pos.priceLevelCode)}
        cartLines={pos.lines}
        customerId={pos.customer?.id}
        customerName={pos.customer?.name}
        customerPhone={pos.customer?.phone}
        offline={!pos.online}
        onSold={() => {
          pos.resetCart()
          navigate("/pos")
        }}
        onClose={() => navigate("/pos")}
        onCustomerSelect={setCustomer}
        fullscreen={fullscreen}
      />
    </div>
  )
}
