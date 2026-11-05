import * as React from "react"
import { useI18n } from "@/shared/i18n"
import { toast } from "@/shared/ui/sonner"
import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/ui/dialog"
import { formatMoney } from "@/shared/lib/format"
import { useCustomer } from "@/entities/customer"
import {
  fromCents,
  toCents,
  wouldExceedLimit,
  type CreditLineDto,
  type CreditView,
} from "@/entities/credit"
import { useShiftGate } from "@/entities/shift"
import { useCreateCredit } from "../model/use-create-credit"
import { useCreditDraft } from "../model/use-credit-draft"
import { creditErrorKey } from "../lib/credit-error"
import { DownPaymentField } from "./DownPaymentField"
import { PlanBuilder } from "./PlanBuilder"
import { CreditCustomerSummary } from "./CreditCustomerSummary"
import { CreditResultView } from "./CreditResultView"

export interface CreditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lines: CreditLineDto[]
  dueTotal: number
  customerId?: string
  customerName?: string
  customerPhone?: string
  offline: boolean
  /** Called once the credit is sold so the caller can clear the cart. */
  onSold: () => void
}

function CreditForm({
  lines,
  dueTotal,
  customerId,
  offline,
  onSold,
  onCreated,
}: {
  lines: CreditLineDto[]
  dueTotal: number
  customerId: string
  offline: boolean
  onSold: () => void
  onCreated: (credit: CreditView) => void
}) {
  const { t } = useI18n()
  const { data: customer } = useCustomer(customerId)
  const draft = useCreditDraft(dueTotal)
  const create = useCreateCredit()
  const shiftGate = useShiftGate()
  const clientKey = React.useRef(crypto.randomUUID())

  const newUnpaid = fromCents(toCents(dueTotal) - toCents(draft.downPayment))
  const overLimit = wouldExceedLimit(
    customer?.creditOutstanding ?? "0",
    newUnpaid,
    customer?.effectiveCreditLimit ?? null
  )

  const canSell = !offline && lines.length > 0 && draft.planValid && !overLimit && !create.isPending

  const handleSell = () => {
    if (!canSell) return
    create.mutate(
      {
        customerId,
        lines,
        payments: draft.tenderParts,
        instalments: draft.instalmentsDto,
        clientKey: clientKey.current,
      },
      {
        onSuccess: (credit) => {
          onSold()
          onCreated(credit)
        },
        onError: (err) => {
          // Shift closed elsewhere: prompt to open one (the till bar updates); keep the cart.
          if (shiftGate(err)) return
          const key = creditErrorKey(err)
          toast.error(key ? t(key) : (err as Error).message || t("common.error"))
        },
      }
    )
  }

  return (
    <div className="space-y-4">
      {customer && (
        <CreditCustomerSummary
          name={customer.name}
          phone={customer.phone ?? ""}
          outstanding={customer.creditOutstanding}
          effectiveLimit={customer.effectiveCreditLimit}
          overLimit={overLimit}
        />
      )}
      <div className="flex items-center justify-between rounded-[10px] bg-[#f8f9fa] border border-[#e8e8e8] p-2.5 text-sm">
        <span className="font-semibold">{t("pos.totalDue")}</span>
        <span className="font-mono text-base font-bold">{formatMoney(dueTotal)}</span>
      </div>
      <DownPaymentField
        downPayment={draft.downPayment}
        onDownPaymentChange={draft.setDownPayment}
        method={draft.method}
        onMethodChange={draft.setMethod}
        splitParts={draft.splitParts}
        onSplitPartsChange={draft.setSplitParts}
      />
      <PlanBuilder draft={draft} />
      {offline && <p className="text-xs text-destructive">{t("credit.errorOffline")}</p>}
      <Button type="button" className="w-full h-11 font-bold" disabled={!canSell} onClick={handleSell}>
        {create.isPending ? t("common.loading") : t("credit.sellButton")}
      </Button>
    </div>
  )
}

/** The "sell on credit" dialog (ADR 0035): down payment, plan, limit guard. */
export function CreditDialog({
  open,
  onOpenChange,
  lines,
  dueTotal,
  customerId,
  customerName,
  customerPhone,
  offline,
  onSold,
}: CreditDialogProps) {
  const { t } = useI18n()
  const [created, setCreated] = React.useState<CreditView | null>(null)
  const ready = Boolean(customerId && customerPhone)

  const close = () => {
    setCreated(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(v) : close())}>
      <DialogPopup className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("credit.payOnCredit")}</DialogTitle>
          <DialogDescription>{created ? t("credit.created") : t("credit.pageDescription")}</DialogDescription>
        </DialogHeader>
        {created ? (
          <CreditResultView credit={created} onDone={close} />
        ) : !ready ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {customerName ? `${customerName} — ` : ""}
            {t("credit.needsCustomer")}
          </p>
        ) : (
          <CreditForm
            lines={lines}
            dueTotal={dueTotal}
            customerId={customerId as string}
            offline={offline}
            onSold={onSold}
            onCreated={setCreated}
          />
        )}
      </DialogPopup>
    </Dialog>
  )
}
