import * as React from "react"
import { ArrowLeft, Maximize2, Minimize2, UserRound, ArrowRightLeft } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { Button } from "@/shared/ui/button"
import { Dialog, DialogPopup, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { CustomerPicker, type CustomerSelection } from "@/entities/customer"
import { fromCents, toCents, type CreditLineDto, type CreditView } from "@/entities/credit"
import type { CartCustomer, CartLine } from "@/features/checkout"
import { CreditStepBody } from "./CreditStepBody"
import { CreditResultView } from "./CreditResultView"

export interface CreditStepProps {
  lines: CreditLineDto[]
  cartLines?: CartLine[]
  customerId?: string
  customerName?: string
  customerPhone?: string
  offline: boolean
  /** Clears the cart once the credit is sold. */
  onSold: () => void
  /** Returns to the till; the cart is left untouched. */
  onClose: () => void
  /** Called when a customer is selected or changed directly on this page. */
  onCustomerSelect?: (customer: CartCustomer) => void
  fullscreen?: { isFullscreen: boolean; supported: boolean; toggle: () => void }
}

function StepHeader({
  onClose,
  fullscreen,
}: {
  onClose: () => void
  fullscreen?: CreditStepProps["fullscreen"]
}) {
  const { t } = useI18n()
  return (
    <header className="flex shrink-0 items-center gap-4 border-b border-border bg-card px-4 py-3 sm:px-6 xl:px-8">
      <Button
        type="button"
        variant="outline"
        onClick={onClose}
        className="h-10 shrink-0 gap-2 font-semibold"
      >
        <ArrowLeft className="size-4" />
        {t("common.back")}
      </Button>
      <div className="min-w-0">
        <h1 className="font-display text-lg font-bold tracking-tight text-foreground sm:text-xl">
          {t("credit.title")}
        </h1>
        <p className="truncate text-xs text-muted-foreground">
          {t("credit.pageDescription")}
        </p>
      </div>
      {fullscreen?.supported && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="ml-auto shrink-0 text-muted-foreground hover:text-foreground"
          onClick={fullscreen.toggle}
          aria-pressed={fullscreen.isFullscreen}
          aria-label={fullscreen.isFullscreen ? t("pos.fullscreenExit") : t("pos.fullscreen")}
          title={fullscreen.isFullscreen ? t("pos.fullscreenExit") : t("pos.fullscreen")}
        >
          {fullscreen.isFullscreen ? <Minimize2 className="size-5" /> : <Maximize2 className="size-5" />}
        </Button>
      )}
    </header>
  )
}

/**
 * The focused, full-screen installment step. It replaces the whole till canvas
 * so the down payment, the plan and the review total have room and stay legible
 * at a glance — the cart behind is never touched.
 */
export function CreditStep({
  lines,
  cartLines,
  customerId,
  customerName,
  customerPhone,
  offline,
  onSold,
  onClose,
  onCustomerSelect,
  fullscreen,
}: CreditStepProps) {
  const { t } = useI18n()
  const [created, setCreated] = React.useState<CreditView | null>(null)
  const [changeCustomerOpen, setChangeCustomerOpen] = React.useState(false)

  const ready = Boolean(customerId && customerPhone)
  const cashTotal = fromCents(lines.reduce((s, l) => s + toCents(l.salePrice), 0))

  const close = () => {
    setCreated(null)
    onClose()
  }

  const handlePickerChange = (sel: CustomerSelection | null) => {
    if (sel && "customerId" in sel && sel.phone) {
      onCustomerSelect?.({
        id: sel.customerId,
        name: sel.name,
        phone: sel.phone,
      })
      setChangeCustomerOpen(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-muted">
      <StepHeader onClose={close} fullscreen={fullscreen} />

      <div className="min-h-0 flex-1 overflow-y-auto">
        {created ? (
          <div className="mx-auto w-full max-w-md p-6 sm:p-10">
            <div className="rounded-[18px] border border-border bg-card p-6 shadow-[var(--shadow-xs)]">
              <CreditResultView credit={created} onDone={close} />
            </div>
          </div>
        ) : !ready ? (
          <div className="mx-auto w-full max-w-lg p-6 sm:p-10">
            <div className="space-y-6 rounded-[18px] border border-border bg-card p-6 sm:p-8 shadow-[var(--shadow-xs)]">
              <div className="flex items-center gap-3">
                <div className="grid size-12 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                  <UserRound className="size-6" />
                </div>
                <div>
                  <h2 className="font-display text-base font-bold sm:text-lg">
                    {t("credit.needsCustomer")}
                  </h2>
                  <p className="text-xs text-muted-foreground sm:text-sm">
                    {t("credit.selectCustomerPrompt")}
                  </p>
                </div>
              </div>

              {onCustomerSelect && (
                <div className="space-y-4 pt-2 border-t border-border/80">
                  <CustomerPicker
                    value={null}
                    onChange={handlePickerChange}
                  />
                </div>
              )}

              <Button type="button" variant="outline" className="h-11 w-full gap-2 font-semibold" onClick={close}>
                <ArrowLeft className="size-4" />
                {t("common.back")}
              </Button>
            </div>
          </div>
        ) : (
          <CreditStepBody
            lines={lines}
            cartLines={cartLines}
            cashTotal={cashTotal}
            customerId={customerId as string}
            customerName={customerName ?? ""}
            customerPhone={customerPhone ?? ""}
            offline={offline}
            onSold={onSold}
            onCreated={setCreated}
            onChangeCustomer={() => setChangeCustomerOpen(true)}
          />
        )}
      </div>

      {/* Customer Switch Modal */}
      <Dialog open={changeCustomerOpen} onOpenChange={setChangeCustomerOpen}>
        <DialogPopup className="max-w-md p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <ArrowRightLeft className="size-4 text-primary" />
              {t("credit.changeCustomer")}
            </DialogTitle>
          </DialogHeader>
          <CustomerPicker
            value={null}
            onChange={handlePickerChange}
          />
        </DialogPopup>
      </Dialog>
    </div>
  )
}
