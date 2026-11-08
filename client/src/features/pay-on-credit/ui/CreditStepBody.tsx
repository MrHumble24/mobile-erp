import * as React from "react"
import { UserRound } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { toast } from "@/shared/ui/sonner"
import { Button } from "@/shared/ui/button"
import { useCustomer } from "@/entities/customer"
import {
  fromCents,
  toCents,
  wouldExceedLimit,
  type CreditLineDto,
  type CreditView,
} from "@/entities/credit"
import { useShiftGate } from "@/entities/shift"
import type { CartLine } from "@/features/checkout"
import { useCreateCredit } from "../model/use-create-credit"
import { useCreditDraft } from "../model/use-credit-draft"
import { useCreditMarkup } from "../model/use-credit-markup"
import { creditErrorKey } from "../lib/credit-error"
import { CreditCustomerSummary } from "./CreditCustomerSummary"
import { CreditCartItems } from "./CreditCartItems"
import { CreditMarkupField } from "./CreditMarkupField"
import { DownPaymentField } from "./DownPaymentField"
import { CreditPlanSection } from "./CreditPlanSection"
import { CreditReviewPanel } from "./CreditReviewPanel"

export interface CreditStepBodyProps {
  lines: CreditLineDto[]
  cartLines?: CartLine[]
  /** Σ of the lines' cash prices — exactly what the server sums. */
  cashTotal: number
  customerId: string
  customerName: string
  customerPhone: string
  offline: boolean
  onSold: () => void
  onCreated: (credit: CreditView) => void
  onChangeCustomer?: () => void
}

/**
 * High-craft installment step: transparent Murabaha financing,
 * quick presets for bazaar speed, instant auto-split, and complete alignment.
 */
export function CreditStepBody({
  lines,
  cartLines,
  cashTotal,
  customerId,
  customerName,
  customerPhone,
  offline,
  onSold,
  onCreated,
  onChangeCustomer,
}: CreditStepBodyProps) {
  const { t } = useI18n()
  const { data: customer } = useCustomer(customerId)
  const markup = useCreditMarkup(cashTotal)
  const draft = useCreditDraft(markup.agreedTotal)
  const create = useCreateCredit()
  const shiftGate = useShiftGate()
  const clientKey = React.useRef(crypto.randomUUID())

  const newUnpaid = fromCents(toCents(markup.agreedTotal) - toCents(draft.downPayment))
  const overLimit = wouldExceedLimit(
    customer?.creditOutstanding ?? "0",
    newUnpaid,
    customer?.effectiveCreditLimit ?? null
  )
  const canSell = !offline && lines.length > 0 && draft.planValid && !overLimit && !create.isPending
  const balanced = draft.remainingCents === 0

  const handleSell = () => {
    if (!canSell) return
    create.mutate(
      {
        customerId,
        lines,
        payments: draft.tenderParts,
        instalments: draft.instalmentsDto,
        markupAmount: markup.markup,
        clientKey: clientKey.current,
      },
      {
        onSuccess: (credit) => {
          onSold()
          onCreated(credit)
        },
        onError: (err) => {
          if (shiftGate(err)) return
          const key = creditErrorKey(err)
          toast.error(key ? t(key) : (err as Error).message || t("common.error"))
        },
      }
    )
  }

  return (
    <div className="mx-auto grid w-full max-w-[1280px] gap-6 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_420px] xl:gap-8 xl:p-8">
      {/* Left Column: Clear financial journey */}
      <div className="min-w-0 space-y-5">
        {/* 1. Customer Identification & Limit Check */}
        <section className="min-w-0 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-bold tracking-tight flex items-center gap-2">
              <UserRound className="size-4 text-primary" />
              {t("pos.customer")}
            </h2>
          </div>
          {customer ? (
            <CreditCustomerSummary
              name={customer.name}
              phone={customer.phone ?? ""}
              outstanding={customer.creditOutstanding}
              effectiveLimit={customer.effectiveCreditLimit}
              overLimit={overLimit}
              onChangeCustomer={onChangeCustomer}
            />
          ) : (
            <div className="flex items-center justify-between gap-3 rounded-[16px] border border-border bg-card p-4 shadow-[var(--shadow-xs)]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                  <UserRound className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-base font-bold text-foreground">{customerName}</p>
                  <p className="font-mono text-xs text-muted-foreground">{customerPhone}</p>
                </div>
              </div>
              {onChangeCustomer && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onChangeCustomer}
                  className="h-8 text-xs font-semibold"
                >
                  {t("credit.changeCustomer")}
                </Button>
              )}
            </div>
          )}
        </section>

        {/* 2. Purchased Items Preview */}
        <CreditCartItems cartLines={cartLines} creditLines={lines} />

        {/* 3. Murabaha Pricing & Disclosed Margin */}
        <CreditMarkupField markup={markup} />

        {/* 4. Down Payment & Tender Method */}
        <DownPaymentField
          agreedTotal={markup.agreedTotal}
          downPayment={draft.downPayment}
          onDownPaymentChange={draft.setDownPayment}
          newUnpaid={newUnpaid}
          method={draft.method}
          onMethodChange={draft.setMethod}
          splitParts={draft.splitParts}
          onSplitPartsChange={draft.setSplitParts}
        />

        {/* 5. Payment Plan Schedule: fully visible without internal scrolling */}
        <CreditPlanSection draft={draft} balanced={balanced} />
      </div>

      {/* Right Column: Sticky Summary & Checkout */}
      <CreditReviewPanel
        lines={lines}
        cashPrice={markup.cashTotal}
        markupAmount={markup.markup}
        agreedTotal={markup.agreedTotal}
        downPayment={draft.downPayment}
        newUnpaid={newUnpaid}
        remainingCents={draft.remainingCents}
        balanced={balanced}
        offline={offline}
        isPending={create.isPending}
        canSell={canSell}
        partsCount={draft.parts}
        frequency={draft.frequency}
        onSell={handleSell}
      />
    </div>
  )
}
