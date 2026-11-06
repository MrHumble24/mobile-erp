import * as React from "react"
import { AlertTriangle } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import { HttpError } from "@/shared/api/http"
import {
  useAddRepairPayment,
  useRefundRepair,
  useOutsideRepairPayment,
  repairErrorKey,
} from "@/entities/repair"
import { AccountSelect } from "@/entities/ledger"
import { Dialog, DialogPopup, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { toast } from "@/shared/ui/sonner"

export type RepairMoneyMode = "payment" | "refund" | "outside"

const CONFIG: Record<
  RepairMoneyMode,
  { title: string; capLabel?: string; submit: string; success: string }
> = {
  payment: { title: "repairs.takePayment", capLabel: "repairs.leftToPay", submit: "repairs.takePayment", success: "repairs.paymentSaved" },
  refund: { title: "repairs.refund", capLabel: "repairs.paid", submit: "repairs.refund", success: "repairs.refundSaved" },
  outside: { title: "repairs.outsidePayment", submit: "repairs.outsidePayment", success: "repairs.outsidePaymentSaved" },
}

function toCents(n: number): number {
  return Math.round(n * 100)
}

function useMoneyMutation(mode: RepairMoneyMode, repairId: string) {
  const payment = useAddRepairPayment(repairId)
  const refund = useRefundRepair(repairId)
  const outside = useOutsideRepairPayment(repairId)
  if (mode === "refund") return refund
  if (mode === "outside") return outside
  return payment
}

export interface RepairMoneyDialogProps {
  repairId: string
  mode: RepairMoneyMode
  /** Client-side ceiling (payment = owed, refund = paid); omit for no cap. */
  cap?: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

function AmountField({
  amount,
  cap,
  exceeds,
  onChange,
}: {
  amount: number
  cap?: number
  exceeds: boolean
  onChange: (n: number) => void
}) {
  const { t } = useI18n()
  return (
    <div className="space-y-1">
      <Label>{t("repairs.amount")}</Label>
      <Input
        type="number"
        min={0}
        max={cap}
        value={amount || ""}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
        className="h-10 text-base font-bold"
      />
      {exceeds && (
        <p className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertTriangle className="size-3.5" />
          {t("repairs.errorAboveOutstanding")}
        </p>
      )}
    </div>
  )
}

function MoneyBody({ repairId, mode, cap, onOpenChange }: RepairMoneyDialogProps) {
  const { t } = useI18n()
  const cfg = CONFIG[mode]
  const mutation = useMoneyMutation(mode, repairId)
  const [amount, setAmount] = React.useState(cap ?? 0)
  const [accountCode, setAccountCode] = React.useState("CASH")
  const exceeds = cap != null && toCents(amount) > toCents(cap)
  const invalid = amount <= 0 || exceeds

  const submit = () =>
    mutation.mutate(
      { amount, accountCode },
      {
        onSuccess: () => {
          toast.success(t(cfg.success))
          onOpenChange(false)
        },
        onError: (err: Error) => {
          const key = repairErrorKey(err)
          if (key) return toast.error(t(key))
          if (err instanceof HttpError && err.statusCode === 400) {
            return toast.error(t("repairs.errorAboveOutstanding"))
          }
          toast.error(err.message || t("common.error"))
        },
      }
    )

  return (
    <div className="space-y-4 my-2">
      {cap != null && cfg.capLabel && (
        <div className="flex items-center justify-between rounded-[10px] border border-border bg-muted p-2.5 text-sm">
          <span className="text-muted-foreground">{t(cfg.capLabel)}</span>
          <span className="font-mono font-semibold">{formatMoney(cap)}</span>
        </div>
      )}
      <AmountField amount={amount} cap={cap} exceeds={exceeds} onChange={setAmount} />
      <div className="space-y-1">
        <Label>{t("balance.paidWith")}</Label>
        <AccountSelect value={accountCode} onValueChange={setAccountCode} />
      </div>
      <Button className="w-full" disabled={invalid || mutation.isPending} onClick={submit}>
        {mutation.isPending ? t("common.loading") : t(cfg.submit)}
      </Button>
    </div>
  )
}

/** Take a customer payment, refund, or pay the outside master (`repair.payment`).
 *  The body mounts fresh on open so the amount resets to the cap each time. */
export function RepairMoneyDialog(props: RepairMoneyDialogProps) {
  const { t } = useI18n()
  const { repairId, mode, open, onOpenChange } = props
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t(CONFIG[mode].title)}</DialogTitle>
          <DialogDescription>#{repairId.slice(0, 8).toUpperCase()}</DialogDescription>
        </DialogHeader>
        {open && <MoneyBody {...props} />}
      </DialogPopup>
    </Dialog>
  )
}
